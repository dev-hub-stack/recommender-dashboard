/**
 * CSV Export Utility - ENHANCED VERSION
 * Provides advanced functions to export data as CSV files from dashboard components
 */

interface ExportOptions {
  filename?: string;
  headers?: string[];
  delimiter?: string;
  includeTimestamp?: boolean;
  formatCurrency?: boolean;
  formatNumbers?: boolean;
  customFormatters?: Record<string, (value: any) => string>;
}

/**
 * Format currency value
 */
function formatCurrency(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return `Rs ${value.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format large numbers with thousand separators
 */
function formatNumber(value: number): string {
  if (typeof value !== 'number' || isNaN(value)) return '0';
  return value.toLocaleString('en-PK');
}

/**
 * Format date to readable string
 */
function formatDate(value: any): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-PK');
}

/**
 * Convert array of objects to CSV string with advanced formatting
 */
export function objectsToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): string {
  if (!data || data.length === 0) {
    return '';
  }

  const {
    headers,
    delimiter = ',',
    formatCurrency: shouldFormatCurrency = true,
    formatNumbers: shouldFormatNumbers = true,
    customFormatters = {}
  } = options;
  
  // Get all unique keys from the data
  const allKeys = headers || Array.from(
    new Set(data.flatMap(obj => Object.keys(obj)))
  );

  // Create header row
  const headerRow = allKeys.join(delimiter);

  // Format data with currency and number formatting
  const formattedData = data.map(obj => {
    const formattedObj: Record<string, any> = {};
    
    allKeys.forEach(key => {
      let value = obj[key];
      
      // Apply custom formatter if exists
      if (customFormatters[key]) {
        value = customFormatters[key](value);
      }
      // Format currency fields
      else if (shouldFormatCurrency && typeof value === 'number' && 
               (key.toLowerCase().includes('revenue') || 
                key.toLowerCase().includes('price') || 
                key.toLowerCase().includes('value') ||
                key.toLowerCase().includes('amount'))) {
        value = formatCurrency(value);
      }
      // Format number fields
      else if (shouldFormatNumbers && typeof value === 'number' && 
               !key.toLowerCase().includes('id') &&
               !key.toLowerCase().includes('score')) {
        value = formatNumber(value);
      }
      // Format dates
      else if (value instanceof Date || 
               (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/))) {
        value = formatDate(value);
      }
      // Handle objects and arrays
      else if (typeof value === 'object' && value !== null) {
        value = JSON.stringify(value);
      }
      
      formattedObj[key] = value;
    });
    
    return formattedObj;
  });

  // Create data rows
  const dataRows = formattedData.map(obj => {
    return allKeys.map(key => {
      const value = obj[key];
      
      // Handle different value types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape quotes and wrap in quotes if contains delimiter or newline
      const stringValue = String(value);
      if (stringValue.includes(delimiter) || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(delimiter);
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(
  data: Record<string, any>[],
  options: ExportOptions = {}
): void {
  const {
    filename = 'export',
    includeTimestamp = true
  } = options;

  const csvContent = objectsToCSV(data, options);
  
  if (!csvContent) {
    console.warn('No data to export');
    return;
  }

  // Create filename with optional timestamp
  const timestamp = includeTimestamp 
    ? `_${new Date().toISOString().slice(0, 10)}` 
    : '';
  const fullFilename = `${filename}${timestamp}.csv`;

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Modern browsers
  link.href = URL.createObjectURL(blob);
  link.download = fullFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * Export functions for specific dashboard components
 */

// Top Products Export
export function exportTopProducts(products: any[], category?: string) {
  const data = products.map((p, index) => ({
    'Rank': index + 1,
    'Product ID': p.product_id,
    'Product Name': p.product_name || `Product ${p.product_id}`,
    'Category': p.category || 'General',
    'Popularity Score': p.score || 0,
    'Average Price': p.avg_price || p.price || 0,
    'Total Revenue': p.total_revenue || 0
  }));

  downloadCSV(data, {
    filename: category ? `top_products_${category}` : 'top_products'
  });
}

// Customer Profiling Export
export function exportCustomerProfiling(customers: any[]) {
  const data = customers.map(c => ({
    'Customer ID': c.unified_customer_id || c.customer_id,
    'Customer Name': c.customer_name || 'N/A',
    'City': c.city || c.customer_city || 'N/A',
    'Province': c.province || 'N/A',
    'Total Orders': c.order_count || c.total_orders || 0,
    'Total Spent': c.total_spent || c.total_revenue || 0,
    'Average Order Value': c.avg_order_value || 0,
    'Last Order Date': c.last_order_date || 'N/A',
    'RFM Segment': c.rfm_segment || c.segment || 'N/A'
  }));

  downloadCSV(data, { filename: 'customer_profiling' });
}

// RFM Segmentation Export
export function exportRFMSegmentation(segments: any[]) {
  const data = segments.map(s => ({
    'Segment': s.segment,
    'Customer Count': s.customer_count || s.count,
    'Percentage': s.percentage || 0,
    'Avg Recency (Days)': s.avg_recency || 0,
    'Avg Frequency': s.avg_frequency || 0,
    'Avg Monetary': s.avg_monetary || 0,
    'Total Revenue': s.total_revenue || 0
  }));

  downloadCSV(data, { filename: 'rfm_segmentation' });
}

// Cross-Selling Pairs Export
export function exportCrossSellingPairs(pairs: any[]) {
  const data = pairs.map(p => ({
    'Product A ID': p.product_a_id || p.product_id_1,
    'Product A Name': p.product_a_name || p.product_name_1 || 'N/A',
    'Product B ID': p.product_b_id || p.product_id_2,
    'Product B Name': p.product_b_name || p.product_name_2 || 'N/A',
    'Co-Purchase Count': p.co_purchase_count || p.pair_count || 0,
    'Confidence': p.confidence || 0,
    'Lift': p.lift || 0
  }));

  downloadCSV(data, { filename: 'cross_selling_pairs' });
}

// Geographic Intelligence Export
export function exportGeographicData(locations: any[]) {
  const data = locations.map(l => ({
    'City': l.city || l.customer_city,
    'Province': l.province,
    'Order Count': l.order_count || 0,
    'Customer Count': l.customer_count || 0,
    'Total Revenue': l.total_revenue || 0,
    'Average Order Value': l.avg_order_value || 0
  }));

  downloadCSV(data, { filename: 'geographic_intelligence' });
}

// Collaborative Recommendations Export
export function exportRecommendations(recommendations: any[], userId?: string) {
  const data = recommendations.map((r, index) => ({
    'Rank': index + 1,
    'Product ID': r.item_id || r.product_id,
    'Product Name': r.item_name || r.product_name || 'N/A',
    'Score': r.score || 0,
    'Algorithm': r.algorithm || 'Hybrid',
    'Reason': r.reason || 'N/A'
  }));

  downloadCSV(data, {
    filename: userId ? `recommendations_${userId}` : 'recommendations'
  });
}

// Performance Metrics Export
export function exportPerformanceMetrics(metrics: any) {
  const data = [{
    'Total Orders': metrics.total_orders || 0,
    'Total Revenue': metrics.total_revenue || 0,
    'Average Order Value': metrics.avg_order_value || 0,
    'Unique Customers': metrics.unique_customers || 0,
    'POS Orders': metrics.pos_orders || 0,
    'OE Orders': metrics.oe_orders || 0,
    'Period': metrics.period || 'N/A'
  }];

  downloadCSV(data, { filename: 'performance_metrics' });
}

// Similar Items Export
export function exportSimilarItems(items: any[], productId: string) {
  const data = items.map((item, index) => ({
    'Rank': index + 1,
    'Similar Product ID': item.item_id || item.product_id,
    'Similar Product Name': item.item_name || item.product_name || 'N/A',
    'Similarity Score': item.score || item.similarity || 0
  }));

  downloadCSV(data, { filename: `similar_items_${productId}` });
}

// Revenue Trend Export
export function exportRevenueTrend(trendData: any[]) {
  const data = trendData.map(d => ({
    'Period': d.label || d.date,
    'Revenue': d.total_revenue || d.revenue || 0,
    'Order Count': d.order_count || 0,
    'Percentage': d.percentage || 0
  }));

  downloadCSV(data, { filename: 'revenue_trend' });
}

// Generic table export
export function exportTableData(
  data: any[],
  filename: string,
  columnMapping?: Record<string, string>
) {
  const mappedData = columnMapping
    ? data.map(row => {
        const newRow: Record<string, any> = {};
        Object.entries(columnMapping).forEach(([key, label]) => {
          newRow[label] = row[key];
        });
        return newRow;
      })
    : data;

  downloadCSV(mappedData, { filename });
}
