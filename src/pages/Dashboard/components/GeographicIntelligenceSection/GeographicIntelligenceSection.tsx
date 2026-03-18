// Geographic Intelligence Section Component
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { useEffect, useState } from 'react';
import { getProvincePerformance, getCityPerformance, GeographicMetrics, CityPerformance, TimeFilter, formatPKR } from '../../../../services/api';
import { Badge } from '../../../../components/ui/badge';
import { ExplanationCard } from '../../../../components/ExplanationCard';
import { DateRangeDisplay } from '../../../../components/DateRangeDisplay';
import { GeographicScoreTooltip } from '../../../../components/Tooltip';

interface GeographicIntelligenceSectionProps {
  timeFilter?: string;
  orderSource?: string;
  category?: string;
}

export const GeographicIntelligenceSection = ({
  timeFilter: propTimeFilter,
  orderSource = 'all',
  category = ''
}: GeographicIntelligenceSectionProps) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(propTimeFilter as TimeFilter || '30days');
  const [provinces, setProvinces] = useState<GeographicMetrics[]>([]);
  const [cities, setCities] = useState<CityPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  // Update internal timeFilter when prop changes
  useEffect(() => {
    if (propTimeFilter) {
      setTimeFilter(propTimeFilter as TimeFilter);
    }
  }, [propTimeFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [provinceData, cityData] = await Promise.all([
          getProvincePerformance(timeFilter, orderSource, category),
          getCityPerformance(timeFilter, 10, orderSource, category)
        ]);
        setProvinces(provinceData);
        setCities(cityData);
      } catch (error) {
        console.error('Error fetching geographic data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter, orderSource, category]);

  const getRegionColor = (region: string) => {
    const colors: Record<string, string> = {
      'North': 'bg-blue-100 text-blue-800',
      'South': 'bg-orange-100 text-orange-800',
      'Central': 'bg-green-100 text-green-800',
      'East': 'bg-purple-100 text-purple-800',
      'West': 'bg-pink-100 text-pink-800',
    };
    return colors[region] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate total revenue for market share
  const totalRevenue = provinces.reduce((sum, p) => sum + (p.total_revenue || 0), 0);
  const maxProvinceRevenue = Math.max(...provinces.map(p => p.total_revenue || 0));

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Geographic Intelligence
            <GeographicScoreTooltip />
          </h2>
          <p className="text-gray-600 mt-1">Sales performance across Pakistan</p>
        </div>
        <DateRangeDisplay
          timeFilter={timeFilter}
          totalRecords={provinces.reduce((sum, p) => sum + (p.total_orders || 0), 0)}
        />
      </div>

      {/* Explanation Card */}
      <ExplanationCard
        icon="🗺️"
        title="What is Geographic Intelligence?"
        description="Geographic Intelligence tracks sales performance across Pakistan's provinces and cities to identify regional growth opportunities and optimize distribution strategies."
        methodology={[
          "Maps customer cities to provinces using a comprehensive 61-city database",
          "Aggregates revenue, orders, and customer counts by region",
          "Calculates average order values and growth trends per location",
          "Identifies top-performing cities and emerging markets"
        ]}
        insights={[
          "Punjab leads with 86K+ orders and PKR 4.8B revenue (93% of total)",
          "Focus on Lahore, Faisalabad, and Rawalpindi as primary markets",
          "Potential expansion opportunities in Sindh and KPK regions",
          "Regional analysis helps optimize inventory and delivery networks"
        ]}
      />

      {/* Province Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Province Performance</CardTitle>
          <CardDescription>Revenue and orders by province</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {provinces.map((province) => {
              const marketShare = totalRevenue > 0 ? ((province.total_revenue || 0) / totalRevenue * 100) : 0;
              const revenueBarWidth = maxProvinceRevenue > 0 ? ((province.total_revenue || 0) / maxProvinceRevenue * 100) : 0;

              return (
                <div key={province.province} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge className={getRegionColor(province.region)}>
                      {province.region}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-semibold">{province.province}</p>
                      <p className="text-sm text-gray-500">
                        {(province.total_orders || 0).toLocaleString()} orders · {(province.unique_customers || 0).toLocaleString()} customers
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatPKR(province.total_revenue || 0)}</p>
                      <p className="text-sm text-gray-500">
                        Avg: {formatPKR(province.avg_order_value || 0)}
                      </p>
                    </div>
                    {/* Market Share Progress Bar */}
                    <div className="w-36 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${revenueBarWidth}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-blue-600 w-12 text-right">
                        {marketShare.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Cities */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Cities</CardTitle>
          <CardDescription>Cities with highest revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Rank</th>
                  <th className="text-left p-3 font-semibold">City</th>
                  <th className="text-left p-3 font-semibold">Province</th>
                  <th className="text-right p-3 font-semibold">Orders</th>
                  <th className="text-right p-3 font-semibold">Revenue</th>
                  <th className="text-right p-3 font-semibold">Customers</th>
                </tr>
              </thead>
              <tbody>
                {cities.map((city, index) => (
                  <tr key={city.city} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Badge variant={index < 3 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">{city.city}</td>
                    <td className="p-3">
                      <Badge className={getRegionColor(city.region)}>
                        {city.province}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">{(city.total_orders || 0).toLocaleString()}</td>
                    <td className="p-3 text-right font-semibold">{formatPKR(city.total_revenue || 0)}</td>
                    <td className="p-3 text-right">{(city.unique_customers || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeographicIntelligenceSection;
