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
  // COMING SOON - Cross-selling analytics will be available in Phase 2
  const [metrics, setMetrics] = useState<CrossSellingMetrics>({
    totalRevenue: 0,
    conversionRate: 0,
    totalOpportunities: 0,
    avgConfidence: 0,
    topPairs: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Disabled for Phase 1 - Coming Soon
    // fetchCrossSellingData();
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

  // COMING SOON UI for Phase 2
  return (
    <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full bg-gradient-to-br from-foundation-blueblue-50 to-foundation-purplepurple-50 rounded-2xl p-8 text-center shadow-sm">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-foundation-blueblue-100 rounded-full p-4">
              <svg className="w-16 h-16 text-foundation-blueblue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>

          {/* Badge */}
          <Badge className="bg-foundation-blueblue-500 text-white mb-4 px-4 py-1 text-sm font-medium border-0">
            Phase 2 Feature
          </Badge>

          {/* Title */}
          <h2 className="text-3xl font-bold text-foundation-greygrey-900 mb-3 [font-family:'Poppins',Helvetica]">
            Cross-Selling Intelligence
          </h2>
          
          {/* Subtitle */}
          <p className="text-lg text-foundation-greygrey-700 mb-6 [font-family:'Poppins',Helvetica]">
            Coming Soon
          </p>

          {/* Description */}
          <p className="text-foundation-greygrey-600 mb-8 leading-relaxed [font-family:'Poppins',Helvetica]">
            Advanced cross-selling analytics powered by AI will help you identify the best product combinations, 
            optimize bundling strategies, and maximize revenue opportunities through intelligent product recommendations.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-foundation-blueblue-600 font-semibold mb-2 [font-family:'Poppins',Helvetica]">
                Smart Pairing
              </div>
              <p className="text-sm text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">
                AI-powered product pair recommendations
              </p>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-foundation-purplepurple-600 font-semibold mb-2 [font-family:'Poppins',Helvetica]">
                Bundle Optimization
              </div>
              <p className="text-sm text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">
                Optimize product bundles for maximum conversion
              </p>
            </div>
            <div className="bg-white/80 rounded-lg p-4">
              <div className="text-foundation-greengreen-600 font-semibold mb-2 [font-family:'Poppins',Helvetica]">
                Revenue Impact
              </div>
              <p className="text-sm text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">
                Track cross-sell revenue and performance metrics
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white/60 rounded-lg p-4 inline-block">
            <p className="text-sm text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">
              <span className="font-semibold text-foundation-blueblue-600">Expected Launch:</span> Q1 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
