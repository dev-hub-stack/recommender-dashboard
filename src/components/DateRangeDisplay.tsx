// Date Range Display Component
import { CalendarIcon } from 'lucide-react';
import { TimeFilter } from '../services/api';

interface DateRangeDisplayProps {
  timeFilter: TimeFilter;
  totalRecords?: number;
}

export const DateRangeDisplay = ({ timeFilter, totalRecords }: DateRangeDisplayProps) => {
  const getDateRange = (filter: TimeFilter): { start: string; end: string; description: string } => {
    const end = new Date();
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    switch (filter) {
      case 'today':
        return {
          start: endStr,
          end: endStr,
          description: 'Today\'s data'
        };
      case '7days':
        const week = new Date(end);
        week.setDate(week.getDate() - 7);
        return {
          start: week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          end: endStr,
          description: 'Last 7 days'
        };
      case '30days':
        const month = new Date(end);
        month.setDate(month.getDate() - 30);
        return {
          start: month.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          end: endStr,
          description: 'Last 30 days'
        };
      case 'all':
        return {
          start: 'Aug 17, 2021',
          end: endStr,
          description: 'All historical data (4+ years)'
        };
      default:
        return {
          start: 'Unknown',
          end: endStr,
          description: 'Data range'
        };
    }
  };

  const { start, end, description } = getDateRange(timeFilter);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
      <CalendarIcon className="w-4 h-4 text-gray-600" />
      <span className="font-medium text-gray-700">{description}:</span>
      <span className="text-gray-900">{start} - {end}</span>
      {totalRecords && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600">{totalRecords.toLocaleString()} records</span>
        </>
      )}
    </div>
  );
};
