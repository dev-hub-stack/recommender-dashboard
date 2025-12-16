import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectFilterProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  maxDisplay?: number;
  className?: string;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = 'Select...',
  label,
  maxDisplay = 2,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectAll = () => {
    onChange(options.map(o => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === options.length) return 'All Categories';
    if (selectedValues.length <= maxDisplay) {
      return selectedValues.join(', ');
    }
    return `${selectedValues.slice(0, maxDisplay).join(', ')} +${selectedValues.length - maxDisplay} more`;
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <label className="text-sm font-medium text-gray-700 mr-2">{label}</label>
      )}
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 min-w-[200px]"
      >
        <span className={`truncate ${selectedValues.length === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
          {getDisplayText()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Selected Tags */}
      {selectedValues.length > 0 && selectedValues.length <= 3 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selectedValues.map(value => (
            <span
              key={value}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded"
            >
              {value}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOption(value);
                }}
                className="hover:text-purple-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 p-2 border-b bg-gray-50">
            <button
              onClick={selectAll}
              className="px-2 py-1 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
            >
              Select All
            </button>
            <button
              onClick={clearAll}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              Clear All
            </button>
            <span className="ml-auto text-xs text-gray-400">
              {selectedValues.length} of {options.length}
            </span>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                No categories found
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    selectedValues.includes(option.value) ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    selectedValues.includes(option.value)
                      ? 'bg-purple-600 border-purple-600'
                      : 'border-gray-300'
                  }`}>
                    {selectedValues.includes(option.value) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="flex-1 text-sm text-gray-700">{option.label}</span>
                  {option.count !== undefined && (
                    <span className="text-xs text-gray-400">({option.count})</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
