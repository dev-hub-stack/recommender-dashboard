import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { formatLargeNumber } from '../../../../utils/formatters';
import { useMLRecommendations, formatPKR, getAlgorithmColor } from '../../../../hooks/useMLRecommendations';
import { InfoTooltip } from '../../../../components/Tooltip';
import { Bot, TrendingUp, Users, Target, Sparkles } from 'lucide-react';

interface CollaborativeProduct {
  product_id: string;
  product_name: string;
  customer_count: number;
  order_count: number;
  total_revenue: number;
  avg_price: number;
  algorithm: string;
}

interface CrossSellingSectionProps {
  timeFilter?: string;
}

export const CrossSellingSection: React.FC<CrossSellingSectionProps> = ({ 
  timeFilter = '30days'
}) => {
  const [products, setProducts] = useState<CollaborativeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ML recommendations with A/B testing
  const { 
    variant, 
    mlStatus, 
    useML, 
    getCollaborativeProducts,
    loading: mlLoading 
  } = useMLRecommendations('analytics');

  useEffect(() => {
    if (!mlLoading && variant) {
      fetchCollaborativeProducts();
    }
  }, [timeFilter, variant, mlLoading]);

  const fetchCollaborativeProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCollaborativeProducts(timeFilter, 12);
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching collaborative products:', err);
      setError('Failed to load cross-selling insights');
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate metrics
  const totalRevenue = products.reduce((sum, p) => sum + p.total_revenue, 0);
  const totalCustomers = products.reduce((sum, p) => sum + p.customer_count, 0);
  const avgOrdersPerProduct = products.length > 0 
    ? products.reduce((sum, p) => sum + p.order_count, 0) / products.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header with A/B Test Indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cross-Selling & Collaborative Filtering
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Products frequently purchased together
          </p>
        </div>
        
        {/* Algorithm Badge */}
        <div className="flex items-center gap-2">
          {useML && mlStatus?.is_trained && (
            <Badge className="flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <Sparkles className="h-3 w-3" />
              ML-Powered
            </Badge>
          )}
          {variant && (
            <Badge variant="outline" className="text-xs">
              {variant.algorithm === 'ml' ? 'Treatment' : 'Control'} ({variant.rollout_percentage}%)
            </Badge>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Cross-Sell Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatPKR(totalRevenue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Unique Customers
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {formatLargeNumber(totalCustomers)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Avg Orders/Product
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {avgOrdersPerProduct.toFixed(1)}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-900">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Products Analyzed
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {products.length}
                </p>
              </div>
              <Bot className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Top Collaborative Products
            </h3>
            {products.length > 0 && products[0].algorithm && (
              <Badge 
                className={`bg-${getAlgorithmColor(products[0].algorithm)}-100 text-${getAlgorithmColor(products[0].algorithm)}-700`}
              >
                {products[0].algorithm.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button 
                onClick={fetchCollaborativeProducts}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Retry
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No collaborative products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Product
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Customers
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Orders
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Avg Price
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Revenue
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Cross-Sell Score
                      <InfoTooltip text="Score = (Product customer count ÷ Highest customer count) × 100. Shows relative cross-sell potential compared to other products. Higher score = more customers likely to buy this with other products." />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, index) => {
                    const collaborationScore = (product.customer_count / Math.max(...products.map(p => p.customer_count))) * 100;
                    
                    return (
                      <tr 
                        key={product.product_id} 
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-300 font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {product.product_name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {product.product_id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-sm font-medium">
                            <Users className="h-3 w-3" />
                            {formatLargeNumber(product.customer_count)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 dark:text-white font-medium">
                          {product.order_count}
                        </td>
                        <td className="py-4 px-4 text-right text-gray-900 dark:text-white">
                          {formatPKR(product.avg_price)}
                        </td>
                        <td className="py-4 px-4 text-right font-semibold text-gray-900 dark:text-white">
                          {formatPKR(product.total_revenue)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                                style={{ width: `${collaborationScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                              {collaborationScore.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ML Status Footer (if using ML) */}
      {useML && mlStatus && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ML Models Active
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>Collaborative Filtering: {mlStatus.algorithms.collaborative_filtering ? '✓' : '✗'}</span>
                <span>Matrix Factorization: {mlStatus.algorithms.matrix_factorization ? '✓' : '✗'}</span>
                {mlStatus.training_timestamp && (
                  <span>
                    Last trained: {new Date(mlStatus.training_timestamp).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
