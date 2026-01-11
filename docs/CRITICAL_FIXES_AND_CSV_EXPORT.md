# Critical Frontend Issues & CSV Export Implementation

## 🔴 **Critical Issues Identified from Screenshots**

### **Issue #1: Empty "Top Shared Products" in Customer Similarity**
**Problem**: The `top_shared_products` field is showing "No shared products" for all customers.

**Root Cause**: 
1. The cache pre-warming script is using a simplified query that doesn't populate `top_shared_products`
2. The API endpoint returns this field, but it's often `null` or empty

**Location**: 
- Backend: `/recommendation-engine-service/src/main.py` - `get_analytics_customer_similarity()` endpoint
- Cache: `/recommendation-engine-service/scripts/prewarm_cache.py` - Step 9

**Current Cached Data**:
```python
# Step 9 in prewarm_cache.py (SIMPLIFIED - NO SHARED PRODUCTS)
similarity_list.append({
    "customer_id": row['customer_id'],
    "customer_name": row['customer_name'],
    "similar_customers_count": row['similar_customers_count'] or 0,
    "actual_recommendations": row['similar_customers_count'] or 0,
    "recommendations_generated": row['similar_customers_count'] or 0,
    "top_shared_products": []  # ❌ ALWAYS EMPTY!
})
```

**Fix Required**:
```python
# ENHANCED Step 9 - WITH TOP SHARED PRODUCTS
cursor.execute("""
    WITH customer_products AS (
        SELECT 
            o.unified_customer_id,
            MAX(o.customer_name) as customer_name,
            oi.product_id,
            MAX(oi.product_name) as product_name
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.unified_customer_id, oi.product_id
        LIMIT 10000  -- Limit for performance
    ),
    product_sharing AS (
        SELECT 
            cp1.unified_customer_id,
            cp1.product_name,
            COUNT(DISTINCT cp2.unified_customer_id) as shared_count
        FROM customer_products cp1
        JOIN customer_products cp2 
            ON cp1.product_id = cp2.product_id 
            AND cp1.unified_customer_id != cp2.unified_customer_id
        GROUP BY cp1.unified_customer_id, cp1.product_name
    ),
    ranked_products AS (
        SELECT 
            unified_customer_id,
            product_name,
            shared_count,
            ROW_NUMBER() OVER (PARTITION BY unified_customer_id ORDER BY shared_count DESC) as rn
        FROM product_sharing
    )
    SELECT 
        o.unified_customer_id as customer_id,
        MAX(o.customer_name) as customer_name,
        COUNT(DISTINCT oi.product_id) as unique_products,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT CASE WHEN rp.shared_count > 0 THEN rp.unified_customer_id END) * 15 as similar_customers_count,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'product_name', rp.product_name,
                'shared_count', rp.shared_count
            ) ORDER BY rp.shared_count DESC
        ) FILTER (WHERE rp.rn <= 3) as top_shared_products
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN ranked_products rp ON o.unified_customer_id = rp.unified_customer_id AND rp.rn <= 3
    GROUP BY o.unified_customer_id
    HAVING COUNT(DISTINCT oi.product_id) >= 2
    ORDER BY similar_customers_count DESC
    LIMIT 20
""")
```

---

### **Issue #2: "Unknown" Provinces in Geographic Distribution**
**Problem**: Some provinces show as "Unknown" even though they likely have valid data.

**Root Cause**: 
1. Database has NULL or empty province values
2. Province names have inconsistent casing/spelling
3. City API doesn't filter out "Unknown" properly

**Location**: 
- Backend: `/recommendation-engine-service/src/main.py` - Line 1819 `get_city_performance()`

**Current Code Issue**:
```python
# In get_city_performance() - Line 1835
cursor.execute(f"""
    SELECT 
        COALESCE(o.customer_city, 'Unknown') as city,
        COALESCE(o.province, 'Unknown') as province,  # ❌ Returns 'Unknown'
        ...
    FROM orders o
    {where_clause}
    GROUP BY o.customer_city, o.province  # No filtering of Unknown
""")
```

**Fix Required**:
```python
# ENHANCED get_city_performance() with proper filtering
cursor.execute(f"""
    SELECT 
        o.customer_city as city,
        CASE 
            WHEN UPPER(o.province) IN ('ISLAMABAD', 'ISLAMABAD CAPITAL TERRITORY', 'ICT') THEN 'Islamabad'
            WHEN UPPER(REPLACE(o.province, '.', '')) IN ('KPK', 'NWFP', 'KHYBER PAKHTUNKHWA') THEN 'Khyber Pakhtunkhwa'
            WHEN UPPER(o.province) = 'PUNJAB' THEN 'Punjab'
            WHEN UPPER(o.province) = 'SINDH' THEN 'Sindh'
            WHEN UPPER(o.province) IN ('BALOCHISTAN', 'BALUCHISTAN') THEN 'Balochistan'
            WHEN UPPER(o.province) IN ('GILGIT-BALTISTAN', 'GB') THEN 'Gilgit-Baltistan'
            WHEN UPPER(o.province) IN ('AZAD KASHMIR', 'AJK') THEN 'Azad Kashmir'
            ELSE o.province
        END as province,
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT o.unified_customer_id) as total_customers,
        SUM(o.total_price) as total_revenue
    FROM orders o
    {where_clause}
        AND o.customer_city IS NOT NULL 
        AND TRIM(o.customer_city) != ''
        AND o.province IS NOT NULL
        AND TRIM(o.province) != ''
        AND UPPER(TRIM(o.province)) NOT IN ('UNKNOWN', 'N/A', 'NA', 'NULL', 'NONE')
    GROUP BY o.customer_city, province
    ORDER BY total_revenue DESC
    LIMIT %s
""", params + (limit,))
```

---

### **Issue #3: Missing CSV Export for Each Screen**
**Problem**: Client wants to download CSV data for whatever they're viewing on each screen.

**Required CSV Export Buttons**:
1. ✅ **Dashboard** - Already has export (needs enhancement)
2. ❌ **Customer Profiling** - Missing CSV export
3. ❌ **Product Insights** - Missing CSV export  
4. ❌ **Revenue Optimization** - Missing CSV export
5. ❌ **Geographic Intelligence** - Missing CSV export
6. ❌ **RFM Segmentation** - Missing CSV export
7. ❌ **ML Recommendations** - Missing CSV export

**Implementation Plan**:

#### **A. Create Unified CSV Export Component**
```tsx
// src/components/ScreenExportButton.tsx
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { exportToCSV } from '../utils/csvExport';

interface ScreenExportButtonProps {
  screenName: string;
  data: any[];
  filename: string;
  headers: string[];
  disabled?: boolean;
}

export const ScreenExportButton: React.FC<ScreenExportButtonProps> = ({
  screenName,
  data,
  filename,
  headers,
  disabled = false
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    
    exportToCSV(data, filename, headers);
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      size="sm"
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Export {screenName} CSV
    </Button>
  );
};
```

#### **B. Screen-Specific Export Implementations**

##### **1. Customer Profiling Export**
```tsx
// In CustomerDetailedProfiling.tsx
<ScreenExportButton
  screenName="Customer Profiling"
  data={customerData}
  filename={`customer-profiling-${timeFilter}-${new Date().toISOString()}.csv`}
  headers={[
    'Customer ID',
    'Customer Name',
    'Total Revenue',
    'Total Orders',
    'Avg Order Value',
    'Lifetime Value',
    'Segment',
    'City',
    'Province',
    'Last Order Date',
    'Days Since Last Order'
  ]}
/>
```

##### **2. Product Insights Export**
```tsx
// In CollaborativeRecommendationDashboard.tsx
<ScreenExportButton
  screenName="Collaborative Products"
  data={collaborativeProducts}
  filename={`collaborative-products-${timeFilter}-${new Date().toISOString()}.csv`}
  headers={[
    'Rank',
    'Product ID',
    'Product Name',
    'Category',
    'Recommendations Count',
    'Total Revenue',
    'Avg Price',
    'Similarity Score',
    'Algorithm'
  ]}
/>
```

##### **3. Revenue Optimization Export**
```tsx
// In CrossSellingSection.tsx
<ScreenExportButton
  screenName="Cross-Selling Pairs"
  data={crossSellingPairs}
  filename={`cross-selling-pairs-${timeFilter}-${new Date().toISOString()}.csv`}
  headers={[
    'Product A ID',
    'Product A Name',
    'Product B ID',
    'Product B Name',
    'Co-Purchase Count',
    'Confidence Score',
    'Combined Revenue',
    'Potential Revenue'
  ]}
/>
```

##### **4. Geographic Intelligence Export**
```tsx
// In GeographicIntelligenceSection.tsx
<div className="flex gap-2">
  <ScreenExportButton
    screenName="Province Performance"
    data={provinces}
    filename={`province-performance-${timeFilter}-${new Date().toISOString()}.csv`}
    headers={[
      'Province',
      'Region',
      'Total Orders',
      'Unique Customers',
      'Total Revenue',
      'Avg Order Value',
      'Market Share %'
    ]}
  />
  
  <ScreenExportButton
    screenName="City Performance"
    data={cities}
    filename={`city-performance-${timeFilter}-${new Date().toISOString()}.csv`}
    headers={[
      'Rank',
      'City',
      'Province',
      'Total Orders',
      'Unique Customers',
      'Total Revenue',
      'Avg Order Value',
      'Growth Rate %'
    ]}
  />
</div>
```

##### **5. RFM Segmentation Export**
```tsx
// In RFMSegmentationSection.tsx
<div className="flex gap-2">
  <ScreenExportButton
    screenName="RFM Segments Summary"
    data={segments}
    filename={`rfm-segments-summary-${timeFilter}-${new Date().toISOString()}.csv`}
    headers={[
      'Segment',
      'Customer Count',
      'Total Revenue',
      'Avg Customer Value',
      'Avg Orders',
      'Avg Recency (days)',
      'Avg Frequency',
      'Avg Monetary'
    ]}
  />
  
  {selectedSegment && (
    <ScreenExportButton
      screenName={`${selectedSegment} Customers`}
      data={segmentCustomers}
      filename={`rfm-${selectedSegment.toLowerCase()}-customers-${timeFilter}-${new Date().toISOString()}.csv`}
      headers={[
        'Customer ID',
        'Customer Name',
        'City',
        'Total Orders',
        'Total Spent',
        'Last Order Date',
        'Days Since Last Order',
        'RFM Recency Score',
        'RFM Frequency Score',
        'RFM Monetary Score'
      ]}
    />
  )}
</div>
```

##### **6. ML Recommendations Export**
```tsx
// In AWSPersonalizeSection.tsx
<ScreenExportButton
  screenName="ML Recommendations"
  data={mlRecommendations}
  filename={`ml-recommendations-${selectedProvince || 'all'}-${new Date().toISOString()}.csv`}
  headers={[
    'Rank',
    'Product ID',
    'Product Name',
    'Category',
    'Province',
    'City',
    'Recommendation Score',
    'Predicted Revenue',
    'Customer Segment',
    'Confidence Level'
  ]}
/>
```

---

## 🚀 **Enhanced CSV Export Utility**

```typescript
// src/utils/csvExport.ts - ENHANCED VERSION

/**
 * Advanced CSV export with formatting and data transformation
 */
export const exportToCSV = (
  data: any[],
  filename: string,
  headers: string[],
  options: {
    includeTimestamp?: boolean;
    formatCurrency?: boolean;
    formatNumbers?: boolean;
    customFormatters?: Record<string, (value: any) => string>;
  } = {}
) => {
  const {
    includeTimestamp = true,
    formatCurrency = true,
    formatNumbers = true,
    customFormatters = {}
  } = options;

  // Add timestamp to filename
  const timestamp = includeTimestamp 
    ? `-${new Date().toISOString().split('T')[0]}`
    : '';
  const finalFilename = filename.replace('.csv', `${timestamp}.csv`);

  // Format data
  const formattedData = data.map(row => {
    const formattedRow: any = {};
    
    Object.keys(row).forEach(key => {
      let value = row[key];
      
      // Apply custom formatter if exists
      if (customFormatters[key]) {
        value = customFormatters[key](value);
      }
      // Format currency fields
      else if (formatCurrency && (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('price') || key.toLowerCase().includes('value'))) {
        value = typeof value === 'number' ? `Rs ${value.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : value;
      }
      // Format number fields
      else if (formatNumbers && typeof value === 'number' && !key.toLowerCase().includes('id')) {
        value = value.toLocaleString('en-PK');
      }
      // Format dates
      else if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
        value = new Date(value).toLocaleDateString('en-PK');
      }
      
      formattedRow[key] = value;
    });
    
    return formattedRow;
  });

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...formattedData.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export with backend API call for large datasets
 */
export const exportLargeDatasetCSV = async (
  endpoint: string,
  filename: string,
  filters: Record<string, any>
) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`${endpoint}?${queryParams}&format=csv`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error('CSV export error:', error);
    alert('Failed to export CSV. Please try again.');
  }
};
```

---

## 📋 **Implementation Checklist**

### **Phase 1: Critical Bug Fixes**
- [ ] Fix customer similarity `top_shared_products` in cache prewarm script
- [ ] Fix "Unknown" provinces in geographic endpoints
- [ ] Update cache prewarm script with enhanced queries
- [ ] Run cache prewarm to populate new data
- [ ] Test API endpoints return correct data

### **Phase 2: CSV Export Implementation**
- [ ] Create `ScreenExportButton` component
- [ ] Enhance `csvExport.ts` utility with advanced formatting
- [ ] Add export buttons to Customer Profiling screen
- [ ] Add export buttons to Product Insights screen
- [ ] Add export buttons to Revenue Optimization screen
- [ ] Add export buttons to Geographic Intelligence screen
- [ ] Add export buttons to RFM Segmentation screen
- [ ] Add export buttons to ML Recommendations screen
- [ ] Test all CSV exports with actual data

### **Phase 3: Enhanced Data Display**
- [ ] Add granular details to each component (tooltips, hover states)
- [ ] Add drill-down capabilities where applicable
- [ ] Add data validation and error messages
- [ ] Add loading states for all data-heavy components
- [ ] Add "No data available" states with helpful messages

---

## 🎯 **Expected Outcomes**

### **After Bug Fixes**:
1. ✅ Customer Similarity shows actual shared products with counts
2. ✅ Geographic Intelligence has no "Unknown" provinces (unless truly unknown)
3. ✅ All data is accurate and properly cached

### **After CSV Export Implementation**:
1. ✅ Every screen has a prominent "Export CSV" button
2. ✅ CSV files include all visible data with proper formatting
3. ✅ CSV files have timestamps and readable filenames
4. ✅ Currency values formatted as "Rs 1,234,567.89"
5. ✅ Numbers formatted with thousand separators
6. ✅ Dates formatted in readable format

### **User Experience**:
- **Before**: "Where are the shared products?" "Why Unknown provinces?" "How do I export this?"
- **After**: "Perfect! I can see what products customers share!" "All provinces are labeled correctly!" "I can download any view as CSV instantly!"

---

**Priority**: 🔴 **CRITICAL - Implement Immediately**  
**Estimated Effort**: 6-8 hours  
**Last Updated**: January 12, 2025
