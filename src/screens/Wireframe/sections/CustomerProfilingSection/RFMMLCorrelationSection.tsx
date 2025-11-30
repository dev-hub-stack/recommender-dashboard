import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { getCustomersBySegment, RFMSegment } from '../../../../services/api';
import { InfoTooltip } from '../../../../components/Tooltip';
import { formatCurrency } from '../../../../utils/formatters';

interface RFMMLCorrelationSectionProps {
  timeFilter?: string;
}

interface SegmentRecommendations {
  segment: string;
  segmentInfo: RFMSegment;
  customers: any[];
  recommendations: Array<{
    product_id: string;
    product_name: string;
    match_rate: number;
    affinity: string;
    avg_score: number;
  }>;
  topCustomers: any[];
}

export const RFMMLCorrelationSection: React.FC<RFMMLCorrelationSectionProps> = ({ 
  timeFilter = 'all' 
}) => {
  const [segments, setSegments] = useState<SegmentRecommendations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCorrelationData();
  }, [timeFilter]);

  const getSegmentInsight = (segment: string) => {
    switch (segment) {
      case 'Champions':
        return 'your most valuable customers who buy frequently and spend the most. Focus on retention and exclusive offers.';
      case 'Loyal Customers':
        return 'repeat customers with good spending habits. Consider loyalty programs and cross-selling opportunities.';
      case 'At Risk':
        return 'previously valuable customers who haven\'t purchased recently. Re-engagement campaigns recommended.';
      case 'New Customers':
        return 'recent first-time buyers. Focus on education and encouraging second purchases.';
      default:
        return 'customers with specific behavioral patterns. Tailor marketing strategies accordingly.';
    }
  };

  const fetchCorrelationData = async () => {
    setLoading(true);
    try {
      // Fetch RFM segments
      const ML_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';
      const segmentsResponse = await fetch(
        `${ML_API_BASE_URL}/api/v1/ml/rfm-segments?time_filter=${timeFilter}`
      );
      
      if (!segmentsResponse.ok) {
        throw new Error('Failed to fetch RFM segments');
      }
      
      const segmentsResult = await segmentsResponse.json();
      const rfmSegments = segmentsResult.segments || [];

      // For each segment, get customers and their recommendations
      const segmentData: SegmentRecommendations[] = [];
      
      for (const segment of rfmSegments.slice(0, 4)) { // Top 4 segments only
        try {
          // Get customers in this segment
          const customers = await getCustomersBySegment(segment.segment, 10);
          
          // Get ML recommendations for sample customers from this segment
          const sampleCustomers = customers.slice(0, 3); // Sample 3 customers
          const allRecommendations: any[] = [];
          
          for (const customer of sampleCustomers) {
            try {
              const recResponse = await fetch(
                `${ML_API_BASE_URL}/api/v1/personalize/recommendations/${customer.customer_id}?num_results=5`
              );
              if (recResponse.ok) {
                const recs = await recResponse.json();
                allRecommendations.push(...(recs.recommendations || []));
              }
            } catch (err) {
              console.log(`No recommendations for customer ${customer.customer_id}`);
            }
          }
          
          // Aggregate recommendations by product
          const productAggregation: { [key: string]: any } = {};
          allRecommendations.forEach(rec => {
            const key = rec.product_id;
            if (!productAggregation[key]) {
              productAggregation[key] = {
                product_id: rec.product_id,
                product_name: rec.product_name || `Product ${rec.product_id}`,
                total_score: 0,
                count: 0
              };
            }
            productAggregation[key].total_score += rec.score || 0;
            productAggregation[key].count += 1;
          });
          
          // Calculate match rates and format recommendations
          const recommendations = Object.values(productAggregation)
            .map((item: any) => ({
              product_id: item.product_id,
              product_name: item.product_name,
              match_rate: Math.round((item.count / sampleCustomers.length) * 100),
              affinity: item.count >= 2 ? 'High' : item.count >= 1 ? 'Medium' : 'Low',
              avg_score: item.total_score / item.count
            }))
            .sort((a, b) => b.match_rate - a.match_rate)
            .slice(0, 5);
          
          segmentData.push({
            segment: segment.segment,
            segmentInfo: segment,
            customers: customers,
            recommendations: recommendations,
            topCustomers: customers.slice(0, 3)
          });
          
        } catch (err) {
          console.error(`Error processing segment ${segment.segment}:`, err);
        }
      }
      
      setSegments(segmentData);
    } catch (error) {
      console.error('Error fetching correlation data:', error);
    } finally {
      setLoading(false);
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

  const getAffinityColor = (affinity: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-green-100 text-green-700',
      'Medium': 'bg-blue-100 text-blue-700',
      'Low': 'bg-gray-100 text-gray-700'
    };
    return colors[affinity] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No RFM segment data available</p>
        <p className="text-sm">Please ensure RFM analysis has been run for this time period</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {segments.map((segmentData) => (
        <Card key={segmentData.segment} className="border-0 shadow-sm bg-white">
          <CardContent className="p-6">
            {/* Segment Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold text-gray-800">{segmentData.segment}</h4>
                  <Badge className={getSegmentColor(segmentData.segment)}>
                    {segmentData.segmentInfo.customer_count} customers
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Avg Days Since Last Order: {segmentData.segmentInfo.avg_days_since_last_order?.toFixed(1) || 'N/A'}
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div>Avg Order Value: {formatCurrency(segmentData.segmentInfo.avg_order_value || 0)}</div>
                <div>Total Revenue: {formatCurrency(segmentData.segmentInfo.total_revenue || 0)}</div>
              </div>
            </div>

            {/* Segment Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Customers */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🏆 Top Customers
                  <InfoTooltip text="Highest value customers in this segment based on total spending" />
                </h5>
                <div className="space-y-2">
                  {segmentData.topCustomers.map((customer, idx) => (
                    <div key={customer.customer_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">#{idx + 1}</span>
                        <div>
                          <div className="text-sm font-medium">{customer.customer_name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{customer.customer_id?.slice(0, 8)}...</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(customer.total_spent)}</div>
                        <div className="text-xs text-gray-500">{customer.total_orders} orders</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ML Recommendations */}
              <div className="lg:col-span-2">
                <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  🤖 Personalized Recommendations
                  <InfoTooltip text="Products most frequently recommended to customers in this segment. Match rate shows % of sampled customers who received this recommendation." />
                </h5>
                <div className="space-y-2">
                  {segmentData.recommendations.length > 0 ? (
                    segmentData.recommendations.map((product, idx) => (
                      <div key={product.product_id} className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-purple-600">#{idx + 1}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                            <div className="text-xs text-gray-500">ID: {product.product_id}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-purple-600">{product.match_rate}% Match Rate</div>
                            <div className="text-xs text-gray-500">Score: {(product.avg_score * 100).toFixed(1)}%</div>
                          </div>
                          <Badge className={getAffinityColor(product.affinity)}>
                            {product.affinity} Affinity
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                      <p className="text-sm">No recommendations available for this segment</p>
                      <p className="text-xs text-gray-400 mt-1">ML models may need more data for this customer group</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Segment Insights */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Segment Insights:</strong> This {segmentData.segment.toLowerCase()} segment represents {getSegmentInsight(segmentData.segment)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
