// React Hook for Real-Time Product Analytics
// 100% LIVE DATA - NO MOCK FALLBACK
// Auto-refreshes every 60 seconds

import { useEffect, useState } from 'react';
import { 
  getProductAnalytics,
  getHealthStatus,
  formatPKR,
  TimeFilter,
  ProductAnalytics
} from '../services/api';

export interface ProductWithStats extends ProductAnalytics {
  sales: string;
  revenue: string;
  image: string;
}

export interface UseProductsOptions {
  limit?: number;
  timeFilter?: TimeFilter;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useProducts(options: UseProductsOptions = {}) {
  const {
    limit = 10,
    timeFilter = 'all',
    autoRefresh = true,
    refreshInterval = 60000 // 60 seconds default
  } = options;

  const [products, setProducts] = useState<ProductWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEngineOnline, setIsEngineOnline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if engine is online
      const health = await getHealthStatus();
      setIsEngineOnline(health.status === 'healthy');

      if (health.status !== 'healthy') {
        throw new Error('Recommendation engine is offline. Please start it on port 8001.');
      }

      // Fetch REAL product analytics (NO MOCK DATA)
      const analyticsData = await getProductAnalytics(timeFilter, limit);

      if (!analyticsData || analyticsData.length === 0) {
        throw new Error('No product data available. Check Master Group API sync.');
      }

      // Enrich with formatted data
      const enrichedProducts: ProductWithStats[] = analyticsData.map((product, index) => ({
        ...product,
        sales: `${product.total_quantity_sold.toLocaleString()} Sales`,
        revenue: formatPKR(product.total_revenue),
        // Use placeholder images (replace with actual product images if available)
        image: `/rectangle-85-${(index % 4) + 1}.svg`
      }));

      // Sort by revenue (highest first)
      enrichedProducts.sort((a, b) => b.total_revenue - a.total_revenue);

      setProducts(enrichedProducts);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product analytics';
      setError(errorMessage);
      console.error('Error fetching products:', err);
      
      // NO MOCK FALLBACK - Show error to user
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchProducts();

    // Auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchProducts, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [limit, timeFilter, autoRefresh, refreshInterval]);

  return {
    products,
    loading,
    error,
    isEngineOnline,
    lastUpdated,
    refresh: fetchProducts // Manual refresh function
  };
}


