/**
 * Universal Screen Export Button Component
 * Provides CSV export functionality for any dashboard screen
 */
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { downloadCSV } from '../utils/csvExport';

interface ScreenExportButtonProps {
  screenName: string;
  data: any[];
  filename: string;
  headers?: string[];
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  formatCurrency?: boolean;
  formatNumbers?: boolean;
  customFormatters?: Record<string, (value: any) => string>;
}

export const ScreenExportButton: React.FC<ScreenExportButtonProps> = ({
  screenName,
  data,
  filename,
  headers,
  disabled = false,
  variant = 'default',
  size = 'sm',
  className = '',
  formatCurrency = true,
  formatNumbers = true,
  customFormatters = {}
}) => {
  const handleExport = () => {
    if (!data || data.length === 0) {
      alert(`No ${screenName.toLowerCase()} data available to export`);
      return;
    }
    
    try {
      // Add timestamp to filename
      const timestamp = new Date().toISOString().split('T')[0];
      const finalFilename = filename.includes('.csv') 
        ? filename.replace('.csv', `-${timestamp}.csv`)
        : `${filename}-${timestamp}.csv`;
      
      downloadCSV(data, {
        filename: finalFilename,
        headers: headers,
        includeTimestamp: false, // Already added above
        formatCurrency,
        formatNumbers,
        customFormatters
      });
      
      console.log(`✅ Exported ${data.length} ${screenName} records to ${finalFilename}`);
    } catch (error) {
      console.error(`❌ Error exporting ${screenName}:`, error);
      alert(`Failed to export ${screenName} data. Please try again.`);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={disabled || !data || data.length === 0}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 ${className}`}
      title={disabled || !data || data.length === 0 ? 'No data to export' : `Export ${screenName} as CSV`}
    >
      <Download className="h-4 w-4" />
      <span>Export {screenName}</span>
    </Button>
  );
};

/**
 * Compact version for toolbar usage
 */
export const CompactExportButton: React.FC<Omit<ScreenExportButtonProps, 'screenName'>> = (props) => {
  return (
    <Button
      onClick={() => {
        if (!props.data || props.data.length === 0) {
          alert('No data available to export');
          return;
        }
        
        try {
          const timestamp = new Date().toISOString().split('T')[0];
          const finalFilename = props.filename.includes('.csv')
            ? props.filename.replace('.csv', `-${timestamp}.csv`)
            : `${props.filename}-${timestamp}.csv`;
          
          downloadCSV(props.data, {
            filename: finalFilename,
            headers: props.headers,
            formatCurrency: props.formatCurrency ?? true,
            formatNumbers: props.formatNumbers ?? true,
            customFormatters: props.customFormatters
          });
        } catch (error) {
          console.error('Export error:', error);
          alert('Failed to export data. Please try again.');
        }
      }}
      disabled={props.disabled || !props.data || props.data.length === 0}
      variant={props.variant || 'outline'}
      size={props.size || 'sm'}
      className={`flex items-center gap-2 ${props.className || ''}`}
    >
      <Download className="h-4 w-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
};
