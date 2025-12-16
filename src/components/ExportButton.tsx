import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => void;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'small' | 'icon';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  label = 'Export CSV',
  disabled = false,
  loading = false,
  variant = 'default',
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;
    
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      // Add slight delay for visual feedback
      setTimeout(() => setIsExporting(false), 500);
    }
  };

  const isLoading = loading || isExporting;

  if (variant === 'icon') {
    return (
      <button
        onClick={handleExport}
        disabled={disabled || isLoading}
        className={`p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={label}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        ) : (
          <Download className="w-4 h-4 text-gray-600" />
        )}
      </button>
    );
  }

  if (variant === 'small') {
    return (
      <button
        onClick={handleExport}
        disabled={disabled || isLoading}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3 h-3" />
        )}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{label}</span>
    </button>
  );
};

export default ExportButton;
