// React Hook for Collaborative Filtering Metrics
// 100% LIVE DATA - NO MOCK DATA
// Includes time-based filtering (Today, 7 Days, 30 Days, All Time)

import { useEffect, useState } from 'react';
import { 
  getCollaborativeMetrics,
  getHealthStatus,
  TimeFilter,
  CollaborativeMetrics,
  getTimePeriodLabel
} from '../services/api';

export interface CollaborativeStats {
  totalRecommendations: number;
  avgSimilarityScore: number;
  activeCustomerPairs: number;
  algorithmAccuracy: number;
  timePeriod: string;
}

export interface UseCollaborativeMetricsOptions {
  timeFilter?: TimeFilter;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useCollaborativeMetrics(options: UseCollaborativeMetricsOptions = {}) {
  const {
    timeFilter = '7days', // Changed default to 7 days for faster loading
    autoRefresh = true,
    refreshInterval = 60000 // 60 seconds default
  } = options;

  const [metrics, setMetrics] = useState<CollaborativeStats | null>(null);
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

      // Fetch REAL collaborative metrics
      const data: CollaborativeMetrics = await getCollaborativeMetrics(timeFilter);

      const collaborativeStats: CollaborativeStats = {
        totalRecommendations: data.total_recommendations,
        avgSimilarityScore: data.avg_similarity_score,
        activeCustomerPairs: data.active_customer_pairs,
        algorithmAccuracy: data.algorithm_accuracy,
        timePeriod: getTimePeriodLabel(timeFilter)
      };

      setMetrics(collaborativeStats);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch collaborative metrics';
      setError(errorMessage);
      console.error('Error fetching collaborative metrics:', err);
      
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
