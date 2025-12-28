# CSV Export Implementation Guide
**MasterGroup Analytics Dashboard**  
*Complete CSV download functionality with filters*

---

## 📋 Overview

This guide implements a comprehensive CSV export feature that allows users to download all dashboard insights with:
- ✅ Time period filtering
- ✅ Category filtering  
- ✅ **Combined filters** (time period + category together)
- ✅ All data sections exportable

---

## 🎯 Requirements

**From Client Requirements:**
1. Download ALL insights from dashboard
2. Apply time period filter to export
3. Apply category filter to export
4. **Both filters working TOGETHER** (not independently)
5. CSV format with proper formatting

---

## 📊 Exportable Data Sections

1. **Dashboard Overview**
   - Total Revenue, Orders, Customers, AOV
   
2. **Top Performing Products**
   - Product name, category, quantity, revenue
   
3. **POS vs OE Orders**
   - Comparison data
   
4. **Recent Activity**
   - Order history
   
5. **Geographic Intelligence**
   - Province/city performance
   
6. **Customer Profiling**
   - RFM segments
   
7. **Product Recommendations**
   - Cross-sell / up-sell suggestions

---

## 🔧 Implementation

### Step 1: Backend API Endpoint

Create a new endpoint in `src/main.py`:

```python
@app.get("/api/v1/export/dashboard-csv")
async def export_dashboard_csv(
    time_filter: str = Query("30days"),
    categories: str = Query(None),  # Comma-separated categories
    sections: str = Query("all"),   # Which sections to export
):
    """
    Export dashboard data as CSV with filters
    
    Parameters:
    - time_filter: Time period (7days, 30days, 90days, all, etc.)
    - categories: Comma-separated category names (e.g., "Pillows & Accessories,Mattresses")
    - sections: Comma-separated sections (e.g., "metrics,products,pos_vs_oe") or "all"
    
    Returns: CSV file download
    """
    import io
    import csv
    from fastapi.responses import StreamingResponse
    
    try:
        conn = pg_pool.getconn()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Parse filters
        category_list = [c.strip() for c in categories.split(',')] if categories else []
        section_list = sections.split(',') if sections != "all" else ["metrics", "products", "pos_vs_oe", "geo", "customers"]
        
        # Build WHERE clause
        where_clause, params = get_time_filter_clause(time_filter)
        
        # Add category filter if provided
        if category_list:
            category_placeholders = ','.join(['%s'] * len(category_list))
            where_clause += f" AND oi.product_category IN ({category_placeholders})"
            params.extend(category_list)
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # =========================================
        # SECTION 1: Dashboard Metrics
        # =========================================
        if "metrics" in section_list:
            writer.writerow([])
            writer.writerow(["DASHBOARD OVERVIEW"])
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Time Period", time_filter])
            if category_list:
                writer.writerow(["Categories", ", ".join(category_list)])
            writer.writerow([])
            
            cursor.execute(f"""
                SELECT 
                    COUNT(DISTINCT o.id) as total_orders,
                    COUNT(DISTINCT o.unified_customer_id) as total_customers,
                    COALESCE(SUM(o.total_price), 0) as total_revenue,
                    COALESCE(AVG(o.total_price), 0) as avg_order_value
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                {where_clause}
            """, params)
            
            metrics = cursor.fetchone()
            writer.writerow(["Total Orders", f"{metrics['total_orders']:,}"])
            writer.writerow(["Total Customers", f"{metrics['total_customers']:,}"])
            writer.writerow(["Total Revenue", f"PKR {metrics['total_revenue']:,.2f}"])
            writer.writerow(["Average Order Value", f"PKR {metrics['avg_order_value']:,.2f}"])
        
        # =========================================
        # SECTION 2: Top Products
        # =========================================
        if "products" in section_list:
            writer.writerow([])
            writer.writerow(["TOP PERFORMING PRODUCTS"])
            writer.writerow(["Rank", "Product Name", "Category", "Brand", "Orders", "Quantity", "Revenue", "Avg Price"])
            
            cursor.execute(f"""
                SELECT 
                    oi.product_name,
                    oi.product_category,
                    oi.brand,
                    COUNT(DISTINCT oi.order_id) as order_count,
                    SUM(oi.quantity) as total_quantity,
                    SUM(oi.unit_price * oi.quantity) as total_revenue,
                    AVG(oi.unit_price) as avg_price
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                {where_clause}
                GROUP BY oi.product_id, oi.product_name, oi.product_category, oi.brand
                ORDER BY total_revenue DESC
                LIMIT 100
            """, params)
            
            products = cursor.fetchall()
            for idx, prod in enumerate(products, 1):
                writer.writerow([
                    idx,
                    prod['product_name'],
                    prod['product_category'] or 'N/A',
                    prod['brand'] or 'N/A',
                    prod['order_count'],
                    prod['total_quantity'],
                    f"PKR {prod['total_revenue']:,.2f}",
                    f"PKR {prod['avg_price']:,.2f}"
                ])
        
        # =========================================
        # SECTION 3: POS vs OE Analytics
        # =========================================
        if "pos_vs_oe" in section_list:
            writer.writerow([])
            writer.writerow(["POS VS OE COMPARISON"])
            writer.writerow(["Order Type", "Orders", "Revenue", "Customers", "Avg Order Value"])
            
            cursor.execute(f"""
                SELECT 
                    o.order_type,
                    COUNT(DISTINCT o.id) as order_count,
                    SUM(o.total_price) as total_revenue,
                    COUNT(DISTINCT o.unified_customer_id) as customer_count,
                    AVG(o.total_price) as avg_order_value
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                {where_clause}
                GROUP BY o.order_type
                ORDER BY total_revenue DESC
            """, params)
            
            order_types = cursor.fetchall()
            for ot in order_types:
                writer.writerow([
                    ot['order_type'] or 'Unknown',
                    ot['order_count'],
                    f"PKR {ot['total_revenue']:,.2f}",
                    ot['customer_count'],
                    f"PKR {ot['avg_order_value']:,.2f}"
                ])
        
        # =========================================
        # SECTION 4: Geographic Distribution
        # =========================================
        if "geo" in section_list:
            writer.writerow([])
            writer.writerow(["GEOGRAPHIC INTELLIGENCE"])
            writer.writerow(["Province", "City", "Orders", "Revenue", "Customers"])
            
            cursor.execute(f"""
                SELECT 
                    COALESCE(o.province, 'Unknown') as province,
                    COALESCE(o.customer_city, 'Unknown') as city,
                    COUNT(DISTINCT o.id) as order_count,
                    SUM(o.total_price) as total_revenue,
                    COUNT(DISTINCT o.unified_customer_id) as customer_count
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                {where_clause}
                GROUP BY o.province, o.customer_city
                ORDER BY total_revenue DESC
                LIMIT 200
            """, params)
            
            locations = cursor.fetchall()
            for loc in locations:
                writer.writerow([
                    loc['province'],
                    loc['city'],
                    loc['order_count'],
                    f"PKR {loc['total_revenue']:,.2f}",
                    loc['customer_count']
                ])
        
        # =========================================
        # SECTION 5: Customer RFM Segments
        # =========================================
        if "customers" in section_list:
            writer.writerow([])
            writer.writerow(["CUSTOMER RFM SEGMENTS"])
            writer.writerow(["Segment", "Customers", "Avg Recency (days)", "Avg Frequency", "Avg Monetary (PKR)"])
            
            cursor.execute(f"""
                SELECT 
                    c.rfm_segment,
                    COUNT(*) as customer_count,
                    AVG(c.recency) as avg_recency,
                    AVG(c.frequency) as avg_frequency,
                    AVG(c.monetary) as avg_monetary
                FROM customers c
                WHERE c.rfm_segment IS NOT NULL
                GROUP BY c.rfm_segment
                ORDER BY customer_count DESC
            """)
            
            segments = cursor.fetchall()
            for seg in segments:
                writer.writerow([
                    seg['rfm_segment'],
                    seg['customer_count'],
                    f"{seg['avg_recency']:.1f}",
                    f"{seg['avg_frequency']:.1f}",
                    f"{seg['avg_monetary']:,.2f}"
                ])
        
        # Close cursor and connection
        cursor.close()
        pg_pool.putconn(conn)
        
        # Prepare CSV for download
        output.seek(0)
        filename = f"mastergroup_analytics_{time_filter}"
        if category_list:
            filename += f"_{'_'.join(category_list[:2])}"  # Add first 2 categories to filename
        filename += f"_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Export CSV error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
```

### Step 2: Frontend Component

Create `src/components/ExportButton.tsx`:

```tsx
import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface ExportButtonProps {
  timeFilter: string;
  categories: string[];
  sections?: string[];
}

export const ExportButton = ({ timeFilter, categories, sections = ['all'] }: ExportButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        time_filter: timeFilter,
        sections: sections.join(',')
      });
      
      // Add categories if selected
      if (categories.length > 0) {
        params.append('categories', categories.join(','));
      }
      
      // Call export API
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/export/dashboard-csv?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mastergroup_analytics_${timeFilter}_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message
      alert('✅ Export completed successfully!');
      
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export to CSV
        </>
      )}
    </Button>
  );
};
```

### Step 3: Integrate into Wireframe

Update `Wireframe.tsx` to include the export button:

```tsx
// Add import
import { ExportButton } from "../../components/ExportButton";

// In the header section, after the filters:
<div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
  <div className="flex items-center gap-4">
    <h3 className="text-lg font-semibold text-gray-800">
      {activeView === 'Dashboard' ? 'Analytics Dashboard' : activeView}
    </h3>
  </div>
  
  {activeView !== 'ML Recommendations' && (
    <div className="flex items-center gap-4">
      {/* Existing filters... */}
      <MultiSelectFilter ... />
      <select ... />
      
      {/* ADD THIS: Export Button */}
      <ExportButton 
        timeFilter={timeFilter}
        categories={selectedCategories}
        sections={
          activeView === 'Dashboard' ? ['metrics', 'products', 'pos_vs_oe'] :
          activeView === 'Geographic Intelligence' ? ['geo'] :
          activeView === 'Customer Profiling' ? ['customers'] :
          ['all']
        }
      />
    </div>
  )}
</div>
```

---

## 🎨 Enhanced UI Version

For a more professional export dialog with section selection:

```tsx
import { useState } from 'react';
import { Download, Loader2, X, CheckSquare, Square } from 'lucide-react';
import { Button } from './ui/button';

interface ExportDialogProps {
  timeFilter: string;
  categories: string[];
  onClose: () => void;
}

export const ExportDialog = ({ timeFilter, categories, onClose }: ExportDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    metrics: true,
    products: true,
    pos_vs_oe: true,
    geo: true,
    customers: true
  });

  const sections = [
    { id: 'metrics', label: 'Dashboard Metrics', description: 'Revenue, Orders, Customers, AOV' },
    { id: 'products', label: 'Top Products', description: 'Best performing products by revenue' },
    { id: 'pos_vs_oe', label: 'POS vs OE Analysis', description: 'Order type comparison' },
    { id: 'geo', label: 'Geographic Data', description: 'Province and city performance' },
    { id: 'customers', label: 'Customer Segments', description: 'RFM segmentation data' }
  ];

  const toggleSection = (id: string) => {
    setSelectedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = async () => {
    const activeSections = Object.keys(selectedSections).filter(k => selectedSections[k]);
    
    if (activeSections.length === 0) {
      alert('Please select at least one section to export');
      return;
    }

    setIsExporting(true);
    
    try {
      const params = new URLSearchParams({
        time_filter: timeFilter,
        sections: activeSections.join(',')
      });
      
      if (categories.length > 0) {
        params.append('categories', categories.join(','));
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/export/dashboard-csv?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mastergroup_analytics_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      onClose();
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Export Dashboard Data</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filter Summary */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Export Filters</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Time Period:</strong> {timeFilter}</p>
            {categories.length > 0 && (
              <p><strong>Categories:</strong> {categories.join(', ')}</p>
            )}
          </div>
        </div>

        {/* Section Selection */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Select Data to Export</h3>
          <div className="space-y-2">
            {sections.map(section => (
              <div 
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {selectedSections[section.id] ? (
                  <CheckSquare className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium text-gray-800">{section.label}</p>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Button to open dialog
export const ExportButton = ({ timeFilter, categories }: { timeFilter: string; categories: string[] }) => {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
      >
        <Download className="w-4 h-4" />
        Export to CSV
      </Button>

      {showDialog && (
        <ExportDialog
          timeFilter={timeFilter}
          categories={categories}
          onClose={() => setShowDialog(false)}
        />
      )}
    </>
  );
};
```

---

## ✅ Implementation Checklist

**Backend:**
- [ ] Add `/api/v1/export/dashboard-csv` endpoint to `main.py`
- [ ] Test endpoint with different filters
- [ ] Test with combined time period + category filters
- [ ] Verify CSV format and encoding

**Frontend:**
- [ ] Create `ExportButton.tsx` component
- [ ] Create `ExportDialog.tsx` (enhanced version)
- [ ] Add export button to `Wireframe.tsx`
- [ ] Test download functionality
- [ ] Test with different filter combinations

**Testing:**
- [ ] Test with "all" time period
- [ ] Test with single category
- [ ] Test with multiple categories
- [ ] Test with time period + categories together
- [ ] Test with all sections
- [ ] Test with selective sections
- [ ] Verify CSV opens correctly in Excel/Google Sheets

---

## 📝 Usage Examples

**Export all data for last 7 days:**
```
Time Period: 7days
Categories: (none)
Sections: All
```

**Export products for specific categories:**
```
Time Period: 30days
Categories: Pillows & Accessories, Mattresses
Sections: Products, Metrics
```

**Export geographic data for all time:**
```
Time Period: all
Categories: (none)
Sections: Geographic
```

**Export everything with filters:**
```
Time Period: 90days
Categories: Mattresses
Sections: All
Result: Only mattress data from last 90 days
```

---

## 🎯 Key Features

✅ **Combined Filters:** Time period AND categories work together  
✅ **Selective Export:** Choose which sections to export  
✅ **Proper Formatting:** CSV with headers, formatted numbers  
✅ **File Naming:** Includes filters and timestamp  
✅ **Large Datasets:** Streaming response for memory efficiency  
✅ **Error Handling:** Graceful failures with user feedback  

---

*End of CSV Export Implementation Guide*
