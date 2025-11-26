/**
 * ML Recommendation Service Hook
 * Provides A/B testing and ML-based recommendations for dashboards
 */

import { useState, useEffect, useCallback } from 'react';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mastergroup-recommendation-e2b3eba97f57.herokuapp.com';

// Types
export interface MLRecommendation {
  product_id: string;
  product_name: string;
  score: number;
  confidence: number;
  price: number;
  revenue: number;
  algorithm: string;
}

export interface ABTestVariant {
  dashboard: string;
  user_id?: string;
  variant: 'treatment' | 'control';
  algorithm: 'ml' | 'sql';
  rollout_percentage: number;
}

export interface MLStatus {
  is_trained: boolean;
  training_timestamp: string | null;
  model_metadata: any;
  algorithms: {
    collaborative_filtering: boolean;
    content_based: boolean;
    matrix_factorization: boolean;
    popularity_based: boolean;
  };
}

/**
 * Hook for ML Recommendations with A/B Testing
 */
export function useMLRecommendations(dashboardName: string, userId?: string) {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [mlStatus, setMLStatus] = useState<MLStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get A/B test variant
  useEffect(() => {
    const fetchVariant = async () => {
      try {
        const params = new URLSearchParams({
          dashboard: dashboardName,
          ...(userId && { user_id: userId })
        });

        const response = await fetch(
          `${API_BASE_URL}/api/v1/ab-test/variant?${params}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch A/B test variant');
        }

        const data = await response.json();
        setVariant(data);
      } catch (err) {
        console.error('Error fetching A/B test variant:', err);
        // Default to control on error
        setVariant({
          dashboard: dashboardName,
          variant: 'control',
          algorithm: 'sql',
          rollout_percentage: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVariant();
  }, [dashboardName, userId]);

  // Get ML status
  const fetchMLStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ml/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ML status');
      }

      const data = await response.json();
      setMLStatus(data);
      return data;
    } catch (err) {
      console.error('Error fetching ML status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  // Get ML recommendations for a user
  const getMLRecommendations = useCallback(async (
    targetUserId: string,
    nRecommendations: number = 10
  ): Promise<MLRecommendation[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/recommendations/${targetUserId}?n_recommendations=${nRecommendations}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch ML recommendations');
      }

      const data = await response.json();
      return data.recommendations;
    } catch (err) {
      console.error('Error fetching ML recommendations:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, []);

  // Get collaborative products (ML or SQL based on variant)
  const getCollaborativeProducts = useCallback(async (
    timeFilter: string = '30days',
    limit: number = 20
  ) => {
    try {
      const useML = variant?.algorithm === 'ml';
      
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/collaborative-products?time_filter=${timeFilter}&limit=${limit}&use_ml=${useML}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch collaborative products');
      }

      const data = await response.json();
      return data.products;
    } catch (err) {
      console.error('Error fetching collaborative products:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
  }, [variant]);

  // Train ML models (admin only)
  const trainMLModels = useCallback(async (
    timeFilter: string = '30days',
    forceRetrain: boolean = false
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/train?time_filter=${timeFilter}&force_retrain=${forceRetrain}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to train ML models');
      }

      const data = await response.json();
      
      // Refresh ML status after training
      await fetchMLStatus();
      
      return data;
    } catch (err) {
      console.error('Error training ML models:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, [fetchMLStatus]);

  return {
    variant,
    mlStatus,
    loading,
    error,
    useML: variant?.algorithm === 'ml',
    getMLRecommendations,
    getCollaborativeProducts,
    trainMLModels,
    fetchMLStatus
  };
}

/**
 * Utility to format currency in PKR
 */
export function formatPKR(amount: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Utility to format confidence percentage
 */
export function formatConfidence(confidence: number): string {
  return `${(confidence * 100).toFixed(1)}%`;
}

/**
 * Utility to get algorithm badge color
 */
export function getAlgorithmColor(algorithm: string): string {
  const colors: Record<string, string> = {
    'hybrid_ml': 'purple',
    'collaborative_filtering_ml': 'blue',
    'matrix_factorization': 'green',
    'content_based': 'orange',
    'sql_fallback': 'gray'
  };
  return colors[algorithm] || 'gray';
}

/**
 * Utility to check if ML is trained and ready
 */
export function isMLReady(mlStatus: MLStatus | null): boolean {
  if (!mlStatus) return false;
  return mlStatus.is_trained && (
    mlStatus.algorithms.collaborative_filtering ||
    mlStatus.algorithms.matrix_factorization
  );
}
