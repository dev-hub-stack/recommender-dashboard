/**
 * ML Recommendations Section
 * Comprehensive component for ML-powered product recommendations
 * Integrates all ML endpoints: /ml/recommendations, /ml/top-products, /ml/product-pairs, /ml/customer-similarity
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { formatLargeNumber } from '../../../../utils/formatters';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '''';

// Types
interface MLProduct {
  product_id: string;
  product_name: string;
  score: number;
  confidence?: number;
  price?: number;
  revenue?: number;
  algorithm?: string;
  purchase_count?: number;
  unique_customers?: number;
}

interface ProductPair {
  product_a_id: string;
  product_a_name: string;
  product_b_id: string;
  product_b_name: string;
  co_purchase_count: number;
  confidence_score: number;
  combined_revenue?: number;
}

interface CustomerSimilarity {
  customer_id: string;
  customer_name: string;
  similar_customers_count: number;
  actual_recommendations: number;
  top_shared_products?: Array<{ product_name: string; shared_count: number }>;
}

interface MLStatus {
  is_trained: boolean;
  training_timestamp: string | null;
  algorithms: {
    collaborative_filtering: boolean;
    content_based: boolean;
    matrix_factorization: boolean;
    popularity_based: boolean;
  };
}

interface MLRecommendationsSectionProps {
  timeFilter?: string;
  customerId?: string;
}

export const MLRecommendationsSection: React.FC<MLRecommendationsSectionProps> = ({
  timeFilter = '30days',
  customerId
}) => {
  // State
  const [mlStatus, setMLStatus] = useState<MLStatus | null>(null);
  const [topProducts, setTopProducts] = useState<MLProduct[]>([]);
  const [productPairs, setProductPairs] = useState<ProductPair[]>([]);
  const [customerSimilarity, setCustomerSimilarity] = useState<CustomerSimilarity[]>([]);
  const [userRecommendations, setUserRecommendations] = useState<MLProduct[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'pairs' | 'customers' | 'personal'>('products');
  const [training, setTraining] = useState(false);

  // Fetch ML Status
  const fetchMLStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ml/status`);
      if (response.ok) {
        const data = await response.json();
        setMLStatus(data);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch ML status:', err);
    }
    return null;
  }, []);

  // Fetch Top Products (ML-powered)
  const fetchTopProducts = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/top-products?time_filter=${timeFilter}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setTopProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch top products:', err);
    }
  }, [timeFilter]);

  // Fetch Product Pairs (Frequently Bought Together)
  const fetchProductPairs = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/product-pairs?time_filter=${timeFilter}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setProductPairs(data.pairs || []);
      }
    } catch (err) {
      console.error('Failed to fetch product pairs:', err);
    }
  }, [timeFilter]);

  // Fetch Customer Similarity
  const fetchCustomerSimilarity = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/customer-similarity?time_filter=${timeFilter}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setCustomerSimilarity(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to fetch customer similarity:', err);
    }
  }, [timeFilter]);

  // Fetch Personalized Recommendations
  const fetchUserRecommendations = useCallback(async (userId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/recommendations/${encodeURIComponent(userId)}?n_recommendations=10`
      );
      if (response.ok) {
        const data = await response.json();
        setUserRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch user recommendations:', err);
    }
  }, []);

  // Train ML Models
  const handleTrainModels = async () => {
    setTraining(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/train?time_filter=${timeFilter}&force_retrain=false`,
        { method: 'POST' }
      );
      if (response.ok) {
        await fetchMLStatus();
        await fetchAllData();
      }
    } catch (err) {
      setError('Failed to train models');
    } finally {
      setTraining(false);
    }
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchTopProducts(),
        fetchProductPairs(),
        fetchCustomerSimilarity(),
        customerId ? fetchUserRecommendations(customerId) : Promise.resolve()
      ]);
    } catch (err) {
      setError('Failed to load ML recommendations');
    } finally {
      setLoading(false);
    }
  }, [fetchTopProducts, fetchProductPairs, fetchCustomerSimilarity, fetchUserRecommendations, customerId]);

  // Initial load
  useEffect(() => {
    fetchMLStatus();
    fetchAllData();
  }, [fetchMLStatus, fetchAllData]);

  // Render loading state
  if (loading) {
    return (
      <section className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">ML Recommendations</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 bg-gray-100" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">🤖 ML Recommendations Engine</h2>
          {mlStatus?.is_trained ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              ✓ Models Trained
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
              ⚠ Training Required
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <select
            className="px-3 py-2 border rounded-lg text-sm"
            value={timeFilter}
            disabled
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          
          <button
            onClick={handleTrainModels}
            disabled={training}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              training
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {training ? 'Training...' : 'Train Models'}
          </button>
        </div>
      </div>

      {/* Algorithm Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Collaborative Filtering', key: 'collaborative_filtering', icon: '👥', color: 'blue' },
          { name: 'Content-Based', key: 'content_based', icon: '📦', color: 'purple' },
          { name: 'Matrix Factorization', key: 'matrix_factorization', icon: '🔢', color: 'green' },
          { name: 'Popularity-Based', key: 'popularity_based', icon: '🔥', color: 'orange' }
        ].map(algo => {
          const isActive = mlStatus?.algorithms?.[algo.key as keyof typeof mlStatus.algorithms];
          return (
            <Card key={algo.key} className={`border-l-4 ${isActive ? `border-l-${algo.color}-500` : 'border-l-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{algo.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{algo.name}</p>
                    <p className={`text-xs ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                      {isActive ? '● Active' : '○ Inactive'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b">
        {[
          { id: 'products', label: '🏆 Top Products', count: topProducts.length },
          { id: 'pairs', label: '🔗 Product Pairs', count: productPairs.length },
          { id: 'customers', label: '👥 Similar Customers', count: customerSimilarity.length },
          { id: 'personal', label: '🎯 Personalized', count: userRecommendations.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Top Products Tab */}
        {activeTab === 'products' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆</span> ML-Powered Top Products
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 text-xs">
                  ML
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.product_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.product_name || `Product ${product.product_id}`}</p>
                        <p className="text-sm text-gray-500">ID: {product.product_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">Score: {product.score?.toFixed(2) || 'N/A'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {product.purchase_count && <span>{formatLargeNumber(product.purchase_count)} purchases</span>}
                        {product.confidence && <Badge variant="outline">{(product.confidence * 100).toFixed(0)}% confidence</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
                {topProducts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No products found. Train models to generate recommendations.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Product Pairs Tab */}
        {activeTab === 'pairs' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔗</span> Frequently Bought Together
                <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white border-0 text-xs">
                  ML
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productPairs.map((pair, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <span className="text-xl">📦</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{pair.product_a_name}</p>
                          <p className="text-xs text-gray-500">ID: {pair.product_a_id}</p>
                        </div>
                      </div>
                      
                      <div className="px-4 text-2xl text-gray-400">↔</div>
                      
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <span className="text-xl">📦</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{pair.product_b_name}</p>
                          <p className="text-xs text-gray-500">ID: {pair.product_b_id}</p>
                        </div>
                      </div>
                      
                      <div className="text-right ml-4">
                        <Badge className="bg-purple-100 text-purple-700">
                          {pair.co_purchase_count} co-purchases
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {pair.confidence_score?.toFixed(1)}% confidence
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {productPairs.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No product pairs found. Train models to discover associations.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Similarity Tab */}
        {activeTab === 'customers' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👥</span> Customer Similarity Analysis
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs">
                  ML
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customerSimilarity.map((customer, index) => (
                  <div key={customer.customer_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {customer.customer_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.customer_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{customer.customer_id?.slice(0, 20)}...</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{customer.similar_customers_count}</p>
                        <p className="text-xs text-gray-500">Similar Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{customer.actual_recommendations}</p>
                        <p className="text-xs text-gray-500">Recommendations</p>
                      </div>
                    </div>
                  </div>
                ))}
                {customerSimilarity.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    No customer similarity data. Train collaborative filtering models.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personalized Recommendations Tab */}
        {activeTab === 'personal' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> Personalized Recommendations
                <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 text-xs">
                  Hybrid ML
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerId ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg mb-4">
                    <p className="text-sm text-blue-700">
                      Showing recommendations for: <strong>{customerId}</strong>
                    </p>
                  </div>
                  {userRecommendations.map((rec, index) => (
                    <div key={rec.product_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{rec.product_name}</p>
                          <p className="text-sm text-gray-500">
                            Algorithm: {rec.algorithm || 'hybrid'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Score: {rec.score?.toFixed(3)}</p>
                        {rec.confidence && (
                          <Badge variant="outline" className="mt-1">
                            {(rec.confidence * 100).toFixed(0)}% confident
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {userRecommendations.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      No personalized recommendations available for this customer.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">Select a customer to see personalized recommendations</p>
                  <input
                    type="text"
                    placeholder="Enter Customer ID..."
                    className="px-4 py-2 border rounded-lg w-64"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        if (input.value) {
                          fetchUserRecommendations(input.value);
                        }
                      }
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </section>
  );
};

export default MLRecommendationsSection;
