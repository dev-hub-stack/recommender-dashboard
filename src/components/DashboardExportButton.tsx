import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface DashboardExportButtonProps {
  timeFilter: string;
  categories: string[];
  sections?: string[];
  orderSource?: string;
  deliveredOnly?: boolean;
  className?: string;
}

export const DashboardExportButton = ({ 
  timeFilter, 
  categories, 
  sections = ['all'],
  orderSource = 'all',
  deliveredOnly = false,
  className = ''
}: DashboardExportButtonProps) => {
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
      
      // Add order source filter
      if (orderSource && orderSource !== 'all') {
        params.append('order_source', orderSource);
      }
      
      // Add delivered only filter
      if (deliveredOnly) {
        params.append('delivered_only', 'true');
      }
      
      // Get API base URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api/v1';
      
      // Call export API
      const response = await fetch(
        `${apiBaseUrl}/export/dashboard-csv?${params.toString()}`,
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
      
      // Build dynamic filename with filter information
      const sectionName = sections.includes('all') ? 'all_data' : sections[0];
      const filterSummary = [
        timeFilter,
        orderSource !== 'all' ? orderSource : null,
        deliveredOnly ? 'delivered' : null,
        categories.length > 0 ? `${categories.length}cats` : null
      ].filter(Boolean).join('_');
      
      // Extract filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `mastergroup_${sectionName}_${filterSummary}_${new Date().getTime()}.csv`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Export completed successfully!');
      
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic button label based on what's being exported
  const getExportLabel = () => {
    if (sections.includes('all')) {
      return 'Export All Data';
    }
    
    // Convert section name to readable format
    const sectionName = sections[0]
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return `Export ${sectionName}`;
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={isExporting ? 'Exporting...' : `Export current view with applied filters`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          {getExportLabel()}
        </>
      )}
    </button>
  );
};
