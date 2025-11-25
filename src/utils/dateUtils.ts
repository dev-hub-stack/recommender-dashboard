// Date utility functions for the dashboard
export const getDateRangeFromFilter = (timeFilter: string): { startDate: Date; endDate: Date; label: string } => {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);
  let label = '';

  // Handle custom date range (format: "YYYY-MM-DD:YYYY-MM-DD")
  if (timeFilter.includes(':')) {
    const [start, end] = timeFilter.split(':');
    startDate = new Date(start);
    endDate = new Date(end);
    label = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    return { startDate, endDate, label };
  }

  switch (timeFilter) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      label = 'Today';
      break;
    case '7days':
      startDate.setDate(now.getDate() - 7);
      label = 'Last 7 Days';
      break;
    case '30days':
      startDate.setDate(now.getDate() - 30);
      label = 'Last 30 Days';
      break;
    case 'mtd':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      label = 'Month to Date';
      break;
    case '90days':
      startDate.setDate(now.getDate() - 90);
      label = 'Last 3 Months';
      break;
    case '6months':
      startDate.setMonth(now.getMonth() - 6);
      label = 'Last 6 Months';
      break;
    case '1year':
      startDate.setFullYear(now.getFullYear() - 1);
      label = 'Last 1 Year';
      break;
    case 'all':
      // Set to a very old date for "all time"
      startDate = new Date('2020-01-01');
      label = 'All Time';
      break;
    default:
      startDate.setDate(now.getDate() - 7);
      label = 'Last 7 Days';
  }

  return { startDate, endDate, label };
};

export const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export const formatDateRange = (timeFilter: string): string => {
  const { startDate, endDate, label } = getDateRangeFromFilter(timeFilter);
  
  // For named filters, just return the label
  if (!timeFilter.includes(':') && timeFilter !== 'all') {
    return label;
  }
  
  // For custom ranges or "all time", show actual dates
  if (timeFilter === 'all') {
    return `All Time (since ${formatDate(startDate)})`;
  }
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
};

// Convert Date to API-compatible ISO string
export const toAPIDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
};
