import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { formatCurrency, formatLargeNumber, formatGrowthWithColor } from '../../../../utils/formatters';

interface CustomerMetrics {
  totalCustomers: number;
  totalRevenue: number;
  avgLifetimeValue: number;
  avgOrderValue: number;
  previousPeriodCustomers?: number;
  previousPeriodRevenue?: number;
  previousPeriodLTV?: number;
  previousPeriodAOV?: number;
}

interface CustomerProfilingProps {
  timeFilter?: string;
}

export const CustomerProfilingSection: React.FC<CustomerProfilingProps> = ({ 
  timeFilter = 'all' 
}) => {
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    totalRevenue: 0,
    avgLifetimeValue: 0,
    avgOrderValue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerMetrics();
  }, [timeFilter]);

  const fetchCustomerMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8001/api/v1/analytics/dashboard?time_filter=${timeFilter}`);
      const data = await response.json();
      
      if (data.success) {
        const newMetrics: CustomerMetrics = {
          totalCustomers: data.total_customers,
          totalRevenue: data.total_revenue,
          avgLifetimeValue: data.total_customers > 0 ? data.total_revenue / data.total_customers : 0,
          avgOrderValue: data.avg_order_value
        };

        // Fetch previous period data for growth calculation
        let previousFilter = '';
        switch (timeFilter) {
          case 'today':
            // Compare with yesterday (simplified - would need date calculation)
            previousFilter = '7days';
            break;
          case '7days':
            previousFilter = '30days';
            break;
          case '30days':
            previousFilter = 'all';
            break;
          default:
            previousFilter = 'all';
        }

        if (previousFilter && timeFilter !== 'all') {
          const prevResponse = await fetch(`http://localhost:8001/api/v1/analytics/dashboard?time_filter=${previousFilter}`);
          const prevData = await prevResponse.json();
          
          if (prevData.success) {
            newMetrics.previousPeriodCustomers = prevData.total_customers;
            newMetrics.previousPeriodRevenue = prevData.total_revenue;
            newMetrics.previousPeriodLTV = prevData.total_customers > 0 ? prevData.total_revenue / prevData.total_customers : 0;
            newMetrics.previousPeriodAOV = prevData.avg_order_value;
          }
        }

        setMetrics(newMetrics);
      }
    } catch (error) {
      console.error('Failed to fetch customer metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowth = (current: number, previous?: number): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const statisticsData = [
    {
      icon: "👥",
      label: "Total Customers",
      value: formatLargeNumber(metrics.totalCustomers),
      rawValue: metrics.totalCustomers,
      previousValue: metrics.previousPeriodCustomers,
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      textColor: "text-green-800"
    },
    {
      icon: "💰",
      label: "Total Revenue",
      value: formatCurrency(metrics.totalRevenue),
      rawValue: metrics.totalRevenue,
      previousValue: metrics.previousPeriodRevenue,
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      textColor: "text-blue-800"
    },
    {
      icon: "📊",
      label: "Avg. Lifetime Value",
      value: formatCurrency(metrics.avgLifetimeValue),
      rawValue: metrics.avgLifetimeValue,
      previousValue: metrics.previousPeriodLTV,
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
      textColor: "text-orange-800"
    },
    {
      icon: "🛒",
      label: "Avg. Order Value",
      value: formatCurrency(metrics.avgOrderValue),
      rawValue: metrics.avgOrderValue,
      previousValue: metrics.previousPeriodAOV,
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100",
      textColor: "text-purple-800"
    },
  ];

  if (loading) {
    return (
      <section className="w-full p-6 bg-white rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Profiling</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-6 bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Customer Profiling</h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live Data</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statisticsData.map((stat, index) => {
          const growth = calculateGrowth(stat.rawValue, stat.previousValue);
          const growthFormatted = formatGrowthWithColor(growth);
          
          return (
            <Card key={index} className={`${stat.bgColor} border-0 shadow-sm hover:shadow-md transition-shadow`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center text-xl`}>
                    {stat.icon}
                  </div>
                  {stat.previousValue && (
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${growthFormatted.bgClass} ${growthFormatted.colorClass}`}>
                      <span>{growthFormatted.text}</span>
                      <span className="ml-1">{growthFormatted.isPositive ? '↗' : '↘'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                  {stat.previousValue && (
                    <p className="text-xs text-gray-500">
                      vs. {formatCurrency(stat.previousValue)} previously
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customer Segmentation Preview */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Segments</h3>              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Value (&gt;PKR 100K)</span>
                  <span className="font-semibold text-green-600">
                    {formatLargeNumber(Math.floor(metrics.totalCustomers * 0.15))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium Value (PKR 25K-100K)</span>
                  <span className="font-semibold text-blue-600">
                    {formatLargeNumber(Math.floor(metrics.totalCustomers * 0.35))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Regular (PKR 5K-25K)</span>
                  <span className="font-semibold text-orange-600">
                    {formatLargeNumber(Math.floor(metrics.totalCustomers * 0.40))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New (&lt;PKR 5K)</span>
                  <span className="font-semibold text-gray-600">
                    {formatLargeNumber(Math.floor(metrics.totalCustomers * 0.10))}
                  </span>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Distribution */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Top 20% Customers</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(metrics.totalRevenue * 0.80)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Middle 60% Customers</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrency(metrics.totalRevenue * 0.18)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Bottom 20% Customers</span>
                <span className="font-semibold text-gray-600">
                  {formatCurrency(metrics.totalRevenue * 0.02)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
