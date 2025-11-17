import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { formatCurrency, formatLargeNumber } from '../../../../utils/formatters';

interface CrossSellingMetrics {
  totalRevenue: number;
  conversionRate: number;
  totalOpportunities: number;
  avgConfidence: number;
  topPairs: Array<{
    product_id: string;
    product_name: string;
    pair_product_id: string;
    pair_product_name: string;
    co_purchase_count: number;
    confidence_score: number;
    potential_revenue: number;
  }>;
}

interface CrossSellingSectionProps {
  timeFilter?: string;
}

export const CrossSellingSection: React.FC<CrossSellingSectionProps> = ({ 
  timeFilter = '7days' // Changed default to 7 days for faster loading
}) => {
  const [metrics, setMetrics] = useState<CrossSellingMetrics>({
    totalRevenue: 0,
    conversionRate: 0,
    totalOpportunities: 0,
    avgConfidence: 0,
    topPairs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCrossSellingData();
  }, [timeFilter]);

  const fetchCrossSellingData = async () => {
    setLoading(true);
    setError(null);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://master-group-recommender-9e2a306b76af.herokuapp.com/api/v1';
    
    try {
      // Fetch dashboard metrics for overall revenue
      const dashboardResponse = await fetch(`${API_BASE_URL}/analytics/dashboard?time_filter=${timeFilter}`);
      const dashboardData = await dashboardResponse.json();

      // Fetch popular products to get top selling items for cross-selling analysis
      const popularResponse = await fetch(`${API_BASE_URL}/recommendations/popular?limit=5&time_filter=${timeFilter}`);
      const popularData = await popularResponse.json();

      // Fetch product pairs for the top products
      let allPairs: any[] = [];
      let totalPotentialRevenue = 0;
      let totalOpportunities = 0;

      for (const product of popularData.recommendations.slice(0, 3)) {
        try {
          const pairsResponse = await fetch(
            `${API_BASE_URL}/recommendations/product-pairs?product_id=${product.product_id}&limit=3&time_filter=${timeFilter}`
          );
          const pairsData = await pairsResponse.json();
          
          if (pairsData.recommendations) {
            const enrichedPairs = pairsData.recommendations.map((pair: any) => ({
              product_id: product.product_id,
              product_name: product.product_name,
              pair_product_id: pair.product_id,
              pair_product_name: pair.product_name,
              co_purchase_count: pair.co_purchase_count || 0,
              confidence_score: (pair.score / Math.max(...pairsData.recommendations.map((r: any) => r.score))) * 100,
              potential_revenue: (pair.co_purchase_count || 0) * (product.avg_price || 15000) * 0.15 // 15% uplift assumption
            }));
            
            allPairs = [...allPairs, ...enrichedPairs];
            totalPotentialRevenue += enrichedPairs.reduce((sum: number, p: any) => sum + p.potential_revenue, 0);
            totalOpportunities += enrichedPairs.reduce((sum: number, p: any) => sum + p.co_purchase_count, 0);
          }
        } catch (err) {
          console.log(`Could not fetch pairs for product ${product.product_id}`);
        }
      }

      // Sort by confidence score and take top pairs
      allPairs.sort((a, b) => b.confidence_score - a.confidence_score);
      const topPairs = allPairs.slice(0, 6);

      const newMetrics: CrossSellingMetrics = {
        totalRevenue: totalPotentialRevenue,
        conversionRate: totalOpportunities > 0 ? Math.min((totalPotentialRevenue / (dashboardData.total_revenue || 1)) * 100, 35) : 28,
        totalOpportunities: totalOpportunities,
        avgConfidence: topPairs.length > 0 ? topPairs.reduce((sum, p) => sum + p.confidence_score, 0) / topPairs.length : 91,
        topPairs: topPairs
      };

      setMetrics(newMetrics);
    } catch (err) {
      console.error('Failed to fetch cross-selling data:', err);
      setError('Failed to load cross-selling analytics');
    } finally {
      setLoading(false);
    }
  };

  const metricsData = [
    {
      icon: "/vuesax-linear-chart.svg",
      label: "Total Revenue",
      value: formatLargeNumber(metrics.totalRevenue),
      percentage: "12%",
      bgColor: "bg-foundation-greengreen-50",
      badgeBgColor: "bg-foundation-greengreen-50",
      percentageColor: "text-foundation-greengreen-500",
      arrowIcon: "/call-made.png",
    },
    {
      icon: "/vuesax-linear-shopping-cart.svg",
      label: "Avg. Conversion Rate",
      value: `${metrics.conversionRate.toFixed(0)}%`,
      percentage: "10%",
      bgColor: "bg-foundation-blueblue-50",
      badgeBgColor: "bg-foundation-blueblue-50",
      percentageColor: "text-foundation-blueblue-600",
      arrowIcon: "/call-made-1.png",
    },
    {
      icon: "/vuesax-linear-graph.svg",
      label: "Total Opportunities",
      value: formatLargeNumber(metrics.totalOpportunities),
      percentage: "21%",
      bgColor: "bg-foundation-orangeorange-50",
      badgeBgColor: "bg-foundation-orangeorange-50",
      percentageColor: "text-foundation-orangeorange-500",
      arrowIcon: "/call-made-2.png",
    },
    {
      icon: "/vuesax-linear-dollar-circle.svg",
      label: "Avg. Confidence",
      value: `${metrics.avgConfidence.toFixed(0)}%`,
      percentage: "4%",
      bgColor: "bg-foundation-purplepurple-50",
      badgeBgColor: "bg-foundation-purplepurple-50",
      percentageColor: "text-foundation-purplepurple-500",
      arrowIcon: "/call-made-3.png",
    },
  ];

  if (loading) {
    return (
      <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse bg-foundation-greygrey-100 border-0 shadow-none">
              <CardContent className="flex flex-col items-start justify-center gap-2 p-5">
                <div className="w-5 h-5 bg-foundation-greygrey-400 rounded"></div>
                <div className="flex flex-col items-start justify-center gap-0 w-full">
                  <div className="h-4 bg-foundation-greygrey-400 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-foundation-greygrey-400 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-64 bg-foundation-greygrey-100 rounded animate-pulse"></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
        <div className="bg-foundation-orangeorange-50 border border-foundation-orangeorange-500 rounded-lg p-4">
          <p className="text-foundation-orangeorange-700">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricsData.map((metric, index) => (
          <Card
            key={index}
            className={`${metric.bgColor} border-0 shadow-none`}
          >
            <CardContent className="flex flex-col items-start justify-center gap-2 p-5">
              <img className="w-5 h-5" alt={metric.label} src={metric.icon} />

              <div className="flex flex-col items-start justify-center gap-0">
                <div className="text-foundation-greygrey-600 [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[normal]">
                  {metric.label}
                </div>

                <div className="flex items-center gap-2">
                  <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
                    {metric.value}
                  </div>

                  <Badge
                    className={`${metric.badgeBgColor} flex items-center px-2 py-0 rounded-[5px] h-auto border-0`}
                  >
                    <span
                      className={`${metric.percentageColor} [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[normal]`}
                    >
                      {metric.percentage}
                    </span>
                    <img
                      className="w-5 h-5"
                      alt="Increase indicator"
                      src={metric.arrowIcon}
                    />
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Cross-Selling Opportunities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Pair Recommendations */}
        <Card className="bg-foundation-whitewhite-50 border-0 shadow-none">
          <CardContent className="p-5">
            <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-lg tracking-[0] leading-[normal] mb-4">Top Product Pairs</h3>
            <div className="space-y-3">
              {metrics.topPairs.slice(0, 5).map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-foundation-greygrey-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foundation-greygrey-800 [font-family:'Poppins',Helvetica]">
                        {pair.product_name}
                      </span>
                      <span className="text-foundation-greygrey-400">+</span>
                      <span className="text-sm font-medium text-foundation-blueblue-600 [font-family:'Poppins',Helvetica]">
                        {pair.pair_product_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-foundation-greygrey-600">
                      <span>Co-purchased: {formatLargeNumber(pair.co_purchase_count)} times</span>
                      <span>Confidence: {pair.confidence_score.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foundation-greengreen-500 [font-family:'Poppins',Helvetica]">
                      {formatCurrency(pair.potential_revenue)}
                    </p>
                    <p className="text-xs text-foundation-greygrey-600">potential</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cross-Selling Performance Chart */}
        <Card className="bg-foundation-whitewhite-50 border-0 shadow-none">
          <CardContent className="p-5">
            <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-lg tracking-[0] leading-[normal] mb-4">Cross-Selling Performance</h3>
            <div className="space-y-4">
              
              {/* Success Rate */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">Success Rate</span>
                  <span className="text-sm font-bold text-black [font-family:'Poppins',Helvetica]">{metrics.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-foundation-greygrey-100 rounded-full h-2">
                  <div 
                    className="bg-foundation-greengreen-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(metrics.conversionRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Average Confidence */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">Average Confidence</span>
                  <span className="text-sm font-bold text-black [font-family:'Poppins',Helvetica]">{metrics.avgConfidence.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-foundation-greygrey-100 rounded-full h-2">
                  <div 
                    className="bg-foundation-blueblue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(metrics.avgConfidence, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Revenue Impact */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">Revenue Impact</span>
                  <span className="text-sm font-bold text-black [font-family:'Poppins',Helvetica]">
                    {formatCurrency(metrics.totalRevenue)}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div className="text-center p-3 bg-foundation-greengreen-50 rounded-lg">
                    <p className="text-xs text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">This Month</p>
                    <p className="text-sm font-bold text-foundation-greengreen-500 [font-family:'Poppins',Helvetica]">
                      {formatCurrency(metrics.totalRevenue * 0.3)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-foundation-blueblue-50 rounded-lg">
                    <p className="text-xs text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">This Quarter</p>
                    <p className="text-sm font-bold text-foundation-blueblue-600 [font-family:'Poppins',Helvetica]">
                      {formatCurrency(metrics.totalRevenue * 0.8)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-foundation-purplepurple-50 rounded-lg">
                    <p className="text-xs text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">Projected</p>
                    <p className="text-sm font-bold text-foundation-purplepurple-500 [font-family:'Poppins',Helvetica]">
                      {formatCurrency(metrics.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
