// Geographic Intelligence Section Component
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { useEffect, useState } from 'react';
import { getProvincePerformance, getCityPerformance, GeographicMetrics, CityPerformance, TimeFilter, formatPKR } from '../../../../services/api';
import { Badge } from '../../../../components/ui/badge';

export const GeographicIntelligenceSection = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('30days');
  const [provinces, setProvinces] = useState<GeographicMetrics[]>([]);
  const [cities, setCities] = useState<CityPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [provinceData, cityData] = await Promise.all([
          getProvincePerformance(timeFilter),
          getCityPerformance(timeFilter, 10)
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
  }, [timeFilter]);

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

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">🗺️ Geographic Intelligence</h2>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Province Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Province Performance</CardTitle>
          <CardDescription>Revenue and orders by province</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {provinces.map((province) => (
              <div key={province.province} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Badge className={getRegionColor(province.region)}>
                    {province.region}
                  </Badge>
                  <div>
                    <p className="font-semibold">{province.province}</p>
                    <p className="text-sm text-gray-500">
                      {(province.total_orders || 0).toLocaleString()} orders · {(province.unique_customers || 0).toLocaleString()} customers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatPKR(province.total_revenue || 0)}</p>
                  <p className="text-sm text-gray-500">
                    Avg: {formatPKR(province.avg_order_value || 0)}
                  </p>
                </div>
              </div>
            ))}
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
