/**
 * ML Recommendation Service Hook
 * Provides A/B testing and ML-based recommendations for dashboards
 */

import { useState, useEffect, useCallback } from 'react';

// API Base URL - Using Vite environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';

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

  // Get popular products (ML-based fallback)
  const getPopularProducts = useCallback(async (
    timeFilter: string = '30days',
    limit: number = 10
  ): Promise<MLRecommendation[]> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/top-products?time_filter=${timeFilter}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch popular products');
      }

      const data = await response.json();
      return data.products || [];
    } catch (err) {
      console.error('Error fetching popular products:', err);
      return [];
    }
  }, []);

  // Get customer similarity data
  const getCustomerSimilarity = useCallback(async (
    timeFilter: string = '30days',
    limit: number = 10
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/customer-similarity?time_filter=${timeFilter}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch customer similarity');
      }

      const data = await response.json();
      return data.customers || [];
    } catch (err) {
      console.error('Error fetching customer similarity:', err);
      return [];
    }
  }, []);

  // Get product pairs (frequently bought together)
  const getProductPairs = useCallback(async (
    timeFilter: string = '30days',
    limit: number = 10
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/product-pairs?time_filter=${timeFilter}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch product pairs');
      }

      const data = await response.json();
      return data.pairs || [];
    } catch (err) {
      console.error('Error fetching product pairs:', err);
      return [];
    }
  }, []);

  // Get RFM segments
  const getRFMSegments = useCallback(async (
    timeFilter: string = 'all'
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/rfm-segments?time_filter=${timeFilter}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch RFM segments');
      }

      const data = await response.json();
      return data.segments || [];
    } catch (err) {
      console.error('Error fetching RFM segments:', err);
      return [];
    }
  }, []);

  // Get A/B test config with available algorithms
  const getABTestConfig = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ml/ab-test/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch A/B test config');
      }
      return response.json();
    } catch (err) {
      console.error('Error fetching A/B test config:', err);
      return null;
    }
  }, []);

  // Get recommendations for a specific algorithm (for A/B testing)
  const getABTestRecommendations = useCallback(async (
    userId: string,
    algorithm: 'hybrid' | 'collaborative' | 'content_based' | 'matrix_factorization' | 'popularity' = 'hybrid',
    nRecommendations: number = 10
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/ab-test/recommendations/${encodeURIComponent(userId)}?algorithm=${algorithm}&n_recommendations=${nRecommendations}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch A/B test recommendations');
      }
      return response.json();
    } catch (err) {
      console.error('Error fetching A/B test recommendations:', err);
      return { recommendations: [], algorithm, error: String(err) };
    }
  }, []);

  // Get pre-computed data for instant responses
  const getPrecomputedData = useCallback(async (
    cacheKey: 'top_products' | 'product_pairs' | 'customer_segments'
  ) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ml/precomputed/${cacheKey}`);
      if (!response.ok) {
        throw new Error('Pre-computed data not available');
      }
      return response.json();
    } catch (err) {
      console.error('Error fetching precomputed data:', err);
      return null;
    }
  }, []);

  // Trigger pre-computation
  const precomputeRecommendations = useCallback(async (timeFilter: string = '30days') => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/precompute?time_filter=${timeFilter}`,
        { method: 'POST' }
      );
      if (!response.ok) {
        throw new Error('Failed to precompute recommendations');
      }
      return response.json();
    } catch (err) {
      console.error('Error precomputing:', err);
      return { success: false, error: String(err) };
    }
  }, []);

  return {
    variant,
    mlStatus,
    loading,
    error,
    useML: variant?.algorithm === 'ml',
    // Core functions
    getMLRecommendations,
    getCollaborativeProducts,
    getPopularProducts,
    getCustomerSimilarity,
    getProductPairs,
    getRFMSegments,
    trainMLModels,
    fetchMLStatus,
    // A/B Testing
    getABTestConfig,
    getABTestRecommendations,
    // Pre-computed data
    getPrecomputedData,
    precomputeRecommendations
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
