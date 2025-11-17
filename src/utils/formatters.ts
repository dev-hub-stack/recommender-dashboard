/**
 * Utility functions for formatting numbers, currency, and other data
 */

/**
 * Format large numbers into readable format (K, M, B, T)
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with appropriate suffix
 */
export const formatLargeNumber = (num: number, decimals: number = 1): string => {
  if (num === 0) return '0';
  
  const k = 1000;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['', 'K', 'M', 'B', 'T'];

  const i = Math.floor(Math.log(num) / Math.log(k));

  return parseFloat((num / Math.pow(k, i)).toFixed(dm)) + sizes[i];
};

/**
 * Format currency with appropriate suffixes for large amounts
 * @param amount - The amount to format
 * @param currency - Currency symbol (default: 'PKR')
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'PKR', 
  decimals: number = 1
): string => {
  if (amount === 0) return `${currency} 0`;
  
  const formatted = formatLargeNumber(Math.abs(amount), decimals);
  const sign = amount < 0 ? '-' : '';
  
  return `${sign}${currency} ${formatted}`;
};

/**
 * Format percentage with proper rounding
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format date for display
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time period labels
 * @param filter - Time filter value
 * @returns Human readable time period
 */
export const formatTimePeriod = (filter: string): string => {
  const periods: Record<string, string> = {
    'today': 'Today',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    'all': 'All Time'
  };
  
  return periods[filter] || filter;
};

/**
 * Calculate growth percentage between two values
 * @param current - Current value
 * @param previous - Previous value
 * @returns Growth percentage
 */
export const calculateGrowth = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Format growth percentage with appropriate color class
 * @param growth - Growth percentage
 * @returns Object with formatted growth and color class
 */
export const formatGrowthWithColor = (growth: number) => {
  const isPositive = growth >= 0;
  const formatted = formatPercentage(Math.abs(growth));
  
  return {
    text: `${isPositive ? '+' : '-'}${formatted}`,
    colorClass: isPositive ? 'text-green-600' : 'text-red-600',
    bgClass: isPositive ? 'bg-green-50' : 'bg-red-50',
    isPositive
  };
};
