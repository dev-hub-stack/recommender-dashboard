import React from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  loading = false,
  disabled = false,
  label = 'Export CSV',
  className = '',
  variant = 'secondary',
  size = 'md'
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      onClick={onExport}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      type="button"
    >
      {loading ? (
        <>
          <Loader2 className={`${iconSizes[size]} mr-2 animate-spin`} />
          Exporting...
        </>
      ) : (
        <>
          <Download className={`${iconSizes[size]} mr-2`} />
          {label}
        </>
      )}
    </button>
  );
};

export default ExportButton;
