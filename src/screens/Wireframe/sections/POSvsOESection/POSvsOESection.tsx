import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { formatCurrency, formatLargeNumber, formatPercentage } from '../../../../utils/formatters';

interface OrderTypeMetrics {
  order_type: string;
  total_orders: number;
  total_revenue: number;
  unique_customers: number;
  avg_order_value: number;
  unique_products: number;
  revenue_percentage: number;
  orders_percentage: number;
  earliest_order: string;
  latest_order: string;
}

interface POSvsOEData {
  success: boolean;
  time_filter: string;
  summary: {
    total_revenue: number;
    total_orders: number;
    order_types_count: number;
  };
  revenue_breakdown: OrderTypeMetrics[];
  top_products_per_type: Record<string, Array<{
    product_name: string;
    revenue: number;
    sales_count: number;
  }>>;
}

interface POSvsOESectionProps {
  timeFilter?: string;
}

export const POSvsOESection: React.FC<POSvsOESectionProps> = ({ 
  timeFilter = 'all' 
}) => {
  const [data, setData] = useState<POSvsOEData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPOSvsOEData();
  }, [timeFilter]);

  const fetchPOSvsOEData = async () => {
    setLoading(true);
    setError(null);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://master-group-recommender-9e2a306b76af.herokuapp.com/api/v1';
      const response = await fetch(`${API_BASE_URL}/analytics/pos-vs-oe-revenue?time_filter=${timeFilter}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError('Failed to fetch POS vs OE data');
      }
    } catch (err) {
      console.error('Failed to fetch POS vs OE data:', err);
      setError('Failed to connect to analytics service');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="w-full p-6 bg-white rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">POS vs OE Revenue Analytics</h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="w-full p-6 bg-white rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">POS vs OE Revenue Analytics</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error || 'No data available'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">POS vs OE Revenue Analytics</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.summary.total_revenue)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                💰
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatLargeNumber(data.summary.total_orders)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                📦
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-violet-50 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Order Types</p>
                <p className="text-2xl font-bold text-purple-600">
                  {data.summary.order_types_count}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                📊
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.revenue_breakdown.map((orderType, index) => (
          <Card key={orderType.order_type} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 uppercase">
                  {orderType.order_type} Orders
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    orderType.order_type === 'POS' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {formatPercentage(orderType.revenue_percentage)} of Revenue
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(orderType.total_revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Orders</p>
                  <p className="text-xl font-bold text-gray-800">
                    {formatLargeNumber(orderType.total_orders)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customers</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {formatLargeNumber(orderType.unique_customers)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Order Value</p>
                  <p className="text-lg font-semibold text-gray-700">
                    {formatCurrency(orderType.avg_order_value)}
                  </p>
                </div>
              </div>

              {/* Top Products for this order type */}
              {data.top_products_per_type[orderType.order_type] && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Top Products</h4>
                  <div className="space-y-2">
                    {data.top_products_per_type[orderType.order_type].slice(0, 3).map((product, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate flex-1 mr-2">
                          {product.product_name || `Product ${idx + 1}`}
                        </span>
                        <span className="font-medium text-gray-800">
                          {formatCurrency(product.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Comparison */}
      {data.revenue_breakdown.length === 2 && (
        <div className="mt-6">
          <Card className="border-0 shadow-sm bg-gradient-to-r from-gray-50 to-slate-50">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Revenue Leader</p>
                  <p className="text-lg font-bold text-blue-600">
                    {data.revenue_breakdown[0].order_type.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatPercentage(data.revenue_breakdown[0].revenue_percentage)} of total
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Order Volume Leader</p>
                  <p className="text-lg font-bold text-green-600">
                    {data.revenue_breakdown.reduce((prev, current) => 
                      prev.total_orders > current.total_orders ? prev : current
                    ).order_type.toUpperCase()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Higher AOV</p>
                  <p className="text-lg font-bold text-purple-600">
                    {data.revenue_breakdown.reduce((prev, current) => 
                      prev.avg_order_value > current.avg_order_value ? prev : current
                    ).order_type.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(Math.max(...data.revenue_breakdown.map(r => r.avg_order_value)))} AOV
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
};
