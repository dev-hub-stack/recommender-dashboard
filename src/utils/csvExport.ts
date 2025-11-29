// CSV Export Utility
// Handles client-side CSV generation and download

export interface CSVExportOptions {
  filename: string;
  data: any[];
  headers: string[];
  metadata?: Record<string, string>;
  timeFilter?: string;
  reportType?: string;
}

/**
 * Converts data to CSV format and triggers download
 * @param options Export configuration options
 */
export function exportToCSV(options: CSVExportOptions): void {
  const { filename, data, headers, metadata, timeFilter, reportType } = options;

  // Build CSV content
  let csvContent = '';

  // Add metadata rows if provided
  if (metadata || timeFilter || reportType) {
    const now = new Date();
    csvContent += `Export Date,${now.toLocaleString()}\n`;
    
    if (timeFilter) {
      csvContent += `Time Filter,${formatTimeFilter(timeFilter)}\n`;
    }
    
    csvContent += `Total Records,${data.length}\n`;
    
    if (reportType) {
      csvContent += `Report Type,${reportType}\n`;
    }
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        csvContent += `${key},${value}\n`;
      });
    }
    
    csvContent += '\n'; // Empty line separator
  }

  // Add headers
  csvContent += headers.join(',') + '\n';

  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      }
      
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    });
    
    csvContent += values.join(',') + '\n';
  });

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    // Create download link
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format time filter for display
 */
function formatTimeFilter(filter: string): string {
  const filters: Record<string, string> = {
    'today': 'Today',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    'mtd': 'Month to Date',
    '90days': 'Last 3 Months',
    '6months': 'Last 6 Months',
    '1year': 'Last 1 Year',
    'all': 'All Time'
  };
  
  return filters[filter] || filter;
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, timeFilter?: string): string {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '')
    .replace('T', '_')
    .substring(0, 15);
  
  const filterPart = timeFilter ? `_${timeFilter}` : '';
  return `${prefix}${filterPart}_${timestamp}.csv`;
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForCSV(value: number): string {
  return value.toFixed(2);
}

/**
 * Format percentage for CSV export
 */
export function formatPercentageForCSV(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Format large numbers for CSV export
 */
export function formatNumberForCSV(value: number): string {
  return value.toString();
}
