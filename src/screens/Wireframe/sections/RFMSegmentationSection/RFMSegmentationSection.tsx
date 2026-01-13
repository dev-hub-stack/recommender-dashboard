// RFM Customer Segmentation Section Component
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../../components/ui/card';
import { useEffect, useState } from 'react';
import { getCustomersBySegment, RFMSegment, CustomerSegmentDetail, TimeFilter, formatPKR } from '../../../../services/api';
import { Badge } from '../../../../components/ui/badge';
import { ExplanationCard } from '../../../../components/ExplanationCard';
import { DateRangeDisplay } from '../../../../components/DateRangeDisplay';
import { RFMScoreTooltip, RFMColumnTooltip } from '../../../../components/Tooltip';
import { useMLRecommendations } from '../../../../hooks/useMLRecommendations';

interface RFMSegmentationSectionProps {
  timeFilter?: string;
}

export const RFMSegmentationSection = ({ timeFilter: propTimeFilter }: RFMSegmentationSectionProps) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(propTimeFilter as TimeFilter || 'all');
  const [segments, setSegments] = useState<RFMSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segmentCustomers, setSegmentCustomers] = useState<CustomerSegmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // ML Only - no SQL fallback
  const { mlStatus } = useMLRecommendations('rfm');
  const [usingML, setUsingML] = useState(true);

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
        setUsingML(true); // Always use ML

        // Use ML endpoint directly - no SQL fallback
        const ML_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';
        const response = await fetch(
          `${ML_API_BASE_URL}/api/v1/ml/rfm-segments?time_filter=${timeFilter}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch ML RFM segments');
        }

        const result = await response.json();
        const data = result.segments || [];

        setSegments(data);
        console.log('✅ Using ML RFM Segments (/api/v1/ml/rfm-segments)');
      } catch (error) {
        console.error('Error fetching RFM segments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter]);

  const handleSegmentClick = async (segmentName: string) => {
    if (selectedSegment === segmentName) {
      setSelectedSegment(null);
      setSegmentCustomers([]);
      return;
    }

    try {
      setLoadingCustomers(true);
      setSelectedSegment(segmentName);
      const customers = await getCustomersBySegment(segmentName, 20);
      setSegmentCustomers(customers);
    } catch (error) {
      console.error('Error fetching segment customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const getSegmentColor = (segment: string) => {
    const colors: Record<string, string> = {
      'Champions': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Loyal Customers': 'bg-green-100 text-green-800 border-green-300',
      'Potential Loyalists': 'bg-blue-100 text-blue-800 border-blue-300',
      'New Customers': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      'At Risk': 'bg-orange-100 text-orange-800 border-orange-300',
      'Cannot Lose Them': 'bg-red-100 text-red-800 border-red-300',
      'Need Attention': 'bg-purple-100 text-purple-800 border-purple-300',
      'Hibernating': 'bg-gray-100 text-gray-800 border-gray-300',
      'Lost': 'bg-slate-100 text-slate-800 border-slate-300',
    };
    return colors[segment] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getSegmentIcon = (segment: string) => {
    const icons: Record<string, string> = {
      'Champions': '🏆',
      'Loyal Customers': '⭐',
      'Potential Loyalists': '🎯',
      'New Customers': '🌱',
      'At Risk': '⚠️',
      'Cannot Lose Them': '🚨',
      'Need Attention': '💬',
      'Hibernating': '💤',
      'Lost': '📉',
    };
    return icons[segment] || '👤';
  };

  const getSegmentPriority = (segment: string) => {
    const priorities: Record<string, string> = {
      'Champions': 'VIP Treatment',
      'Loyal Customers': 'Maintain',
      'Potential Loyalists': 'Convert',
      'New Customers': 'Onboard',
      'At Risk': 'Win Back',
      'Cannot Lose Them': 'URGENT',
      'Need Attention': 'Re-engage',
      'Hibernating': 'Reactivate',
      'Lost': 'Low Priority',
    };
    return priorities[segment] || 'Standard';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            RFM Customer Segmentation
            <RFMScoreTooltip />
            {usingML && mlStatus?.is_trained ? (
              <Badge className="bg-gradient-to-r from-foundation-blueblue-500 to-foundation-purplepurple-500 text-white border-0">
                🤖 ML-Powered
              </Badge>
            ) : (
              <Badge className="bg-foundation-greygrey-500 text-white border-0">
                📊 SQL-Based Analytics
              </Badge>
            )}
          </h2>
          <p className="text-gray-600 mt-1">Customer behavior analysis & targeting</p>
        </div>
        <DateRangeDisplay
          timeFilter={timeFilter}
          totalRecords={segments.reduce((sum, s) => sum + (s.customer_count || 0), 0)}
        />
      </div>

      {/* Explanation Card */}
      <ExplanationCard
        icon="📊"
        title="What is RFM Segmentation?"
        description="RFM (Recency, Frequency, Monetary) segmentation is a proven marketing analysis technique that groups customers based on their purchase behavior to enable targeted engagement strategies."
        methodology={[
          "Recency (R): Days since last purchase - scored 1-5 (lower days = higher score)",
          "Frequency (F): Total number of orders - scored 1-5 (more orders = higher score)",
          "Monetary (M): Total spend in PKR - scored 1-5 (higher spend = higher score)",
          "Combines R+F+M scores into 9 customer segments using business rules"
        ]}
        insights={[
          "Champions (R≥4, F≥4, M≥4): Your best customers - reward and retain them",
          "At Risk (R≤2, F≥3, M≥3): High-value customers going dormant - re-engage urgently",
          "Lost (R≤2, F≤2, M≤2): 99K customers to win back with special offers",
          "Hibernating (65K customers): Occasional buyers needing reactivation campaigns"
        ]}
      />

      {/* Segment Distribution Chart - Visual Overview */}
      {segments.length > 0 && (
        <Card className="mb-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              📊 Segment Distribution
              <span className="text-sm font-normal text-gray-500">
                (Click bars for details)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {(() => {
                const maxCount = Math.max(...segments.map(s => s.customer_count || 0));
                return segments.map((segment) => {
                  const heightPercent = maxCount > 0 ? ((segment.customer_count || 0) / maxCount * 100) : 0;
                  const isSelected = selectedSegment === segment.segment_name;

                  return (
                    <div
                      key={segment.segment_name}
                      className={`flex-1 flex flex-col items-center cursor-pointer transition-all ${isSelected ? 'scale-105' : 'hover:scale-102'}`}
                      onClick={() => handleSegmentClick(segment.segment_name)}
                    >
                      <div className="w-full flex flex-col items-center flex-1 justify-end">
                        <div
                          className={`w-full rounded-t transition-all duration-300 ${isSelected
                              ? 'bg-gradient-to-t from-blue-600 to-blue-400 shadow-lg'
                              : getSegmentColor(segment.segment_name).split(' ')[0]
                            }`}
                          style={{
                            height: `${Math.max(heightPercent, 5)}%`,
                            minHeight: '8px'
                          }}
                        />
                      </div>
                      <div className="mt-2 text-center w-full">
                        <span className="text-xs text-gray-600 truncate block" title={segment.segment_name}>
                          {segment.segment_name.split(' ')[0]}
                        </span>
                        <span className="text-xs font-bold text-gray-800">
                          {(segment.percentage || 0).toFixed(0)}%
                        </span>
                        <span className="text-xs text-gray-500 block">
                          {((segment.customer_count || 0) / 1000).toFixed(0)}K
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Segment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {segments.map((segment) => (
          <Card
            key={segment.segment_name}
            className={`cursor-pointer transition-all hover:shadow-lg ${selectedSegment === segment.segment_name ? 'ring-2 ring-blue-500' : ''
              }`}
            onClick={() => handleSegmentClick(segment.segment_name)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getSegmentIcon(segment.segment_name)}</span>
                  <div>
                    <CardTitle className="text-lg">{segment.segment_name}</CardTitle>
                    <Badge className={getSegmentColor(segment.segment_name)} variant="outline">
                      {getSegmentPriority(segment.segment_name)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Customers:</span>
                <span className="font-bold">{(segment.customer_count || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Percentage:</span>
                <span className="font-semibold">{(segment.percentage || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Revenue:</span>
                <span className="font-bold text-green-600">{formatPKR(segment.total_revenue || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Order Value:</span>
                <span className="font-semibold">{formatPKR(segment.avg_order_value || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg Orders:</span>
                <span className="font-semibold">{(segment.avg_orders_per_customer || 0).toFixed(1)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Order:</span>
                <span className="font-semibold">
                  {(() => {
                    const days = Math.round(segment.avg_days_since_last_order || 0);
                    if (days === 0) return 'Today';
                    if (days === 1) return '1 day ago';
                    return `${days} days ago`;
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{getSegmentIcon(selectedSegment)}</span>
              {selectedSegment} - Customer Details
            </CardTitle>
            <CardDescription>
              Top {segmentCustomers.length} customers in this segment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCustomers ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Customer</th>
                      <th className="text-left p-3 font-semibold">City</th>
                      <th className="text-right p-3 font-semibold">Orders</th>
                      <th className="text-right p-3 font-semibold">Total Spent</th>
                      <th className="text-right p-3 font-semibold">Last Order</th>
                      <th className="text-center p-3 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          RFM Score
                          <RFMColumnTooltip />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {segmentCustomers.map((customer) => (
                      <tr key={customer.customer_id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{customer.customer_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{customer.customer_id}</p>
                          </div>
                        </td>
                        <td className="p-3">{customer.customer_city || 'N/A'}</td>
                        <td className="p-3 text-right">{(customer.total_orders || 0).toLocaleString()}</td>
                        <td className="p-3 text-right font-semibold">{formatPKR(customer.total_spent || 0)}</td>
                        <td className="p-3 text-right">
                          <span className="text-sm">{customer.days_since_last_order || 0} days ago</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex gap-1 justify-center">
                            <Badge variant="outline" className="text-xs">
                              R:{customer.rfm_score?.recency || 0}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              F:{customer.rfm_score?.frequency || 0}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              M:{customer.rfm_score?.monetary || 0}
                            </Badge>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Recommended Actions</CardTitle>
          <CardDescription>Strategic priorities based on RFM analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-yellow-50">
              <p className="font-semibold mb-2">🏆 VIP Program</p>
              <p className="text-sm text-gray-600">
                Focus on {segments.find(s => s.segment_name === 'Champions')?.customer_count || 0} Champions
                with exclusive offers and personalized service
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-orange-50">
              <p className="font-semibold mb-2">⚠️ Win-Back Campaign</p>
              <p className="text-sm text-gray-600">
                Re-engage {segments.find(s => s.segment_name === 'At Risk')?.customer_count || 0} at-risk customers
                before they become lost
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-gray-50">
              <p className="font-semibold mb-2">💤 Reactivation Drive</p>
              <p className="text-sm text-gray-600">
                Wake up {segments.find(s => s.segment_name === 'Hibernating')?.customer_count || 0} hibernating customers
                with special incentives
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RFMSegmentationSection;
