// React Hook for Real-Time Dashboard Metrics
// 100% LIVE DATA - NO MOCK DATA
// Includes time-based filtering (Today, 7 Days, 30 Days, All Time)

import { useEffect, useState } from 'react';
import { 
  getDashboardMetrics,
  getHealthStatus,
  formatPKR,
  TimeFilter,
  DashboardMetrics,
  getTimePeriodLabel
} from '../services/api';

export interface DashboardStats {
  totalRevenue: string;
  totalRevenueAmount: number;
  totalOrders: number;
  totalCustomers: number;
  avgOrderValue: string;
  avgOrderValueAmount: number;
  totalProducts: number;
  topSellingProduct: string;
  timePeriod: string;
}

export interface UseDashboardMetricsOptions {
  timeFilter?: TimeFilter;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useDashboardMetrics(options: UseDashboardMetricsOptions = {}) {
  const {
    timeFilter = '7days', // Changed default to 7 days for faster loading
    autoRefresh = true,
    refreshInterval = 60000 // 60 seconds default
  } = options;

  const [metrics, setMetrics] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEngineOnline, setIsEngineOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if engine is online
      const health = await getHealthStatus();
      setIsEngineOnline(health.status === 'healthy');

      if (health.status !== 'healthy') {
        throw new Error('Recommendation engine is offline');
      }

      // Fetch REAL dashboard metrics
      const data: DashboardMetrics = await getDashboardMetrics(timeFilter);

      const dashboardStats: DashboardStats = {
        totalRevenue: formatPKR(data.total_revenue),
        totalRevenueAmount: data.total_revenue,
        totalOrders: data.total_orders,
        totalCustomers: data.total_customers,
        avgOrderValue: formatPKR(data.avg_order_value),
        avgOrderValueAmount: data.avg_order_value,
        totalProducts: data.total_products,
        topSellingProduct: data.top_selling_product || 'N/A',
        timePeriod: getTimePeriodLabel(timeFilter)
      };

      setMetrics(dashboardStats);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard metrics';
      setError(errorMessage);
      console.error('Error fetching dashboard metrics:', err);
      
      // NO MOCK FALLBACK
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMetrics();

    // Auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [timeFilter, autoRefresh, refreshInterval]);

  return {
    metrics,
    loading,
    error,
    isEngineOnline,
    lastUpdated,
    refresh: fetchMetrics // Manual refresh function
  };
}
