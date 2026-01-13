import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { formatCurrency, formatLargeNumber, formatPercentage } from '../../../../utils/formatters';
import { InfoTooltip } from '../../../../components/Tooltip';
import { RFMMLCorrelationSection } from './RFMMLCorrelationSection';

interface CustomerDetailedMetrics {
  totalCustomers: number;
  totalRevenue: number;
  avgLifetimeValue: number;
  avgOrderValue: number;
  newCustomers: number;
  returningCustomers: number;
  customersByCity: Array<{
    city: string;
    customer_count: number;
    revenue: number;
  }>;
  monthlyGrowth: {
    customers: number;
    revenue: number;
  };
}

interface CustomerDetailedProfilingProps {
  timeFilter?: string;
  category?: string;
}

export const CustomerDetailedProfiling: React.FC<CustomerDetailedProfilingProps> = ({
  timeFilter = 'all',
  category = ''
}) => {
  const [metrics, setMetrics] = useState<CustomerDetailedMetrics>({
    totalCustomers: 0,
    totalRevenue: 0,
    avgLifetimeValue: 0,
    avgOrderValue: 0,
    newCustomers: 0,
    returningCustomers: 0,
    customersByCity: [],
    monthlyGrowth: { customers: 0, revenue: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetailedMetrics();
  }, [timeFilter, category]);

  const fetchDetailedMetrics = async () => {
    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

      const categoryParam = category ? `&category=${encodeURIComponent(category)}` : '';
      // Use unified endpoint with category support
      const response = await fetch(`${API_BASE_URL}/analytics/customer-profiling?time_filter=${timeFilter}${categoryParam}`);
      const data = await response.json();

      if (data.success) {
        const newMetrics: CustomerDetailedMetrics = {
          totalCustomers: data.total_customers || 0,
          // Fallback: Use new backend total_revenue if available, otherwise sum from geographic distribution (prevent 0 while waiting for deployment)
          totalRevenue: data.total_revenue !== undefined
            ? data.total_revenue
            : (data.geographic_distribution?.reduce((acc: number, curr: any) => acc + (Number(curr.revenue) || 0), 0) || 0),
          avgLifetimeValue: 0,
          avgOrderValue: data.avg_order_value || 0,
          newCustomers: data.new_customers,
          returningCustomers: data.returning_customers,
          customersByCity: data.geographic_distribution.map((geo: any) => ({
            city: geo.region,
            customer_count: geo.customer_count,
            revenue: geo.revenue
          })),
          monthlyGrowth: { customers: 12.5, revenue: 15.3 } // Mock data
        };

        // Calculate Average Lifetime Value (Revenue / Customers)
        newMetrics.avgLifetimeValue = newMetrics.totalCustomers ? newMetrics.totalRevenue / newMetrics.totalCustomers : 0;

        setMetrics(newMetrics);
      }
    } catch (error) {
      console.error('Failed to fetch detailed customer metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Active Filters Info */}
      {category && (
        <div className="flex justify-center -mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Filtering by: {category}
          </span>
        </div>
      )}

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-green-600">{formatLargeNumber(metrics.totalCustomers)}</p>
                <p className="text-xs text-green-500">+{formatPercentage(metrics.monthlyGrowth.customers)} growth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalRevenue)}</p>
                <p className="text-xs text-blue-500">+{formatPercentage(metrics.monthlyGrowth.revenue)} growth</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Lifetime Value</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.avgLifetimeValue)}</p>
                <p className="text-xs text-gray-500">Per customer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(metrics.avgOrderValue)}</p>
                <p className="text-xs text-gray-500">Per transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RFM + ML Correlation Analysis */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              🎯 RFM Segments & Personalized Recommendations
              <InfoTooltip text="Shows correlation between customer segments and their ML-recommended products. Understand what each segment is most likely to buy next." />
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Discover how different customer segments respond to personalized product recommendations
            </p>
          </div>
          <RFMMLCorrelationSection timeFilter={timeFilter} />
        </CardContent>
      </Card>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Composition */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Customer Composition</h3>

            {/* Circular Progress Visualization */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#f3f4f6"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* New Customers Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${metrics.totalCustomers > 0 ? (metrics.newCustomers / metrics.totalCustomers) * 251 : 0} 251`}
                    strokeLinecap="round"
                  />
                  {/* Returning Customers Arc */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${metrics.totalCustomers > 0 ? (metrics.returningCustomers / metrics.totalCustomers) * 251 : 0} 251`}
                    strokeDashoffset={`-${metrics.totalCustomers > 0 ? (metrics.newCustomers / metrics.totalCustomers) * 251 : 0}`}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-800">
                    {formatLargeNumber(metrics.totalCustomers)}
                  </span>
                  <span className="text-sm text-gray-500">Total Customers</span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">New Customers</span>
                </div>
                <span className="font-semibold text-gray-800">
                  {formatLargeNumber(metrics.newCustomers)} ({metrics.totalCustomers > 0 ? formatPercentage((metrics.newCustomers / metrics.totalCustomers) * 100) : '0%'})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Returning Customers</span>
                </div>
                <span className="font-semibold text-gray-800">
                  {formatLargeNumber(metrics.returningCustomers)} ({metrics.totalCustomers > 0 ? formatPercentage((metrics.returningCustomers / metrics.totalCustomers) * 100) : '0%'})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Geographic Distribution</h3>

            <div className="space-y-4">
              {metrics.customersByCity.map((city, index) => {
                const percentage = metrics.totalCustomers > 0 ? (city.customer_count / metrics.totalCustomers) * 100 : 0;
                return (
                  <div key={city.city}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">{city.city}</span>
                      <span className="text-sm font-semibold text-gray-800">
                        {formatLargeNumber(city.customer_count)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className={`h-2 rounded-full ${index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                            index === 2 ? 'bg-orange-500' :
                              index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                          }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatPercentage(percentage)} of customers</span>
                      <span>{formatCurrency(city.revenue)} revenue</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
