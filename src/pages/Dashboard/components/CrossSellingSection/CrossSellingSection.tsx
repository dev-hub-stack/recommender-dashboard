import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { formatLargeNumber } from '../../../../utils/formatters';
import { useMLRecommendations } from '../../../../hooks/useMLRecommendations';
import { InfoTooltip } from '../../../../components/Tooltip';

interface CrossSellingMetrics {
  totalRevenue: number;
  conversionRate: number;
  totalOpportunities: number;
  avgConfidence: number;
  avgPairValue?: number;
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
  orderSource?: string;
  category?: string;
  enableABTest?: boolean; // Enable A/B testing between ML and SQL
}

export const CrossSellingSection: React.FC<CrossSellingSectionProps> = ({
  timeFilter = '30days',
  orderSource = 'all',
  category = '',
  enableABTest = true
}) => {
  // Use ML Recommendations Hook with A/B Testing
  const {
    variant,
    mlStatus
  } = useMLRecommendations('cross_selling');

  const [metrics, setMetrics] = useState<CrossSellingMetrics>({
    totalRevenue: 0,
    conversionRate: 0,
    totalOpportunities: 0,
    avgConfidence: 0,
    avgPairValue: 0,
    topPairs: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingML, setUsingML] = useState(false);

  useEffect(() => {
    fetchCrossSellingData();
  }, [timeFilter, variant, orderSource]);

  const fetchCrossSellingData = async () => {
    setLoading(true);
    setError(null);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') ||
      '';

    try {
      // Always use ML product pairs endpoint
      setUsingML(true);

      // Get auth token
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Build URL with filters
      let url = `${API_BASE_URL}/api/v1/ml/product-pairs?time_filter=${timeFilter}&limit=10`;
      if (orderSource && orderSource !== 'all') {
        url += `&order_source=${encodeURIComponent(orderSource)}`;
      }

      // Fetch ML product pairs directly
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error('Failed to fetch product pairs');
      }

      const data = await response.json();
      const pairs = data.pairs || [];
      const summary = data.summary || {};
      const actualTotalCount = data.actual_total_count || pairs.length;

      // Use summary metrics from API if available, otherwise calculate from pairs
      const totalRevenue = summary.total_revenue || pairs.reduce((sum: number, p: any) =>
        sum + (p.combined_revenue || 0), 0
      );

      const avgConfidence = summary.avg_confidence || (pairs.length > 0
        ? pairs.reduce((sum: number, p: any) => sum + (p.confidence_score || 0), 0) / pairs.length * 100
        : 0);

      const avgPairValue = summary.avg_pair_value || (pairs.length > 0
        ? totalRevenue / pairs.length
        : 0);

      const topPairs = pairs.slice(0, 6).map((pair: any) => ({
        product_id: pair.product_a_id || pair.product_a?.id || '',
        product_name: pair.product_a_name || pair.product_a?.name || 'Unknown Product',
        pair_product_id: pair.product_b_id || pair.product_b?.id || '',
        pair_product_name: pair.product_b_name || pair.product_b?.name || 'Unknown Product',
        co_purchase_count: pair.co_recommendation_count || 0,
        confidence_score: (pair.confidence_score || 0) * 100,
        potential_revenue: pair.combined_revenue || 0
      }));

      setMetrics({
        totalRevenue,
        conversionRate: avgConfidence,
        totalOpportunities: actualTotalCount,  // Use actual total from API
        avgConfidence,
        avgPairValue,
        topPairs
      });
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
      label: "Co-Purchase Opportunities",
      tooltip: "Number of product pairs frequently bought together based on historical order data. Higher count = more cross-sell opportunities.",
      value: formatLargeNumber(metrics.totalOpportunities),
      percentage: metrics.totalOpportunities > 0 ? null : null, // Remove hardcoded percentage
      bgColor: "bg-foundation-greengreen-50",
      badgeBgColor: "bg-foundation-greengreen-50",
      percentageColor: "text-foundation-greengreen-500",
      arrowIcon: "/call-made.png",
    },
    {
      icon: "/vuesax-linear-shopping-cart.svg",
      label: "Cross-Sell Potential",
      tooltip: "Percentage of orders containing products that have cross-sell potential. Based on product pairs analysis.",
      value: `${metrics.conversionRate.toFixed(0)}%`,
      percentage: null, // Remove hardcoded percentage
      bgColor: "bg-foundation-blueblue-50",
      badgeBgColor: "bg-foundation-blueblue-50",
      percentageColor: "text-foundation-blueblue-600",
      arrowIcon: "/call-made-1.png",
    },
    {
      icon: "/vuesax-linear-graph.svg",
      label: "Top Product Pairs",
      tooltip: "Number of high-frequency product pairs identified for cross-selling. These are the most promising combinations.",
      value: metrics.topPairs.length,
      percentage: null, // Remove hardcoded percentage
      bgColor: "bg-foundation-orangeorange-50",
      badgeBgColor: "bg-foundation-orangeorange-50",
      percentageColor: "text-foundation-orangeorange-500",
      arrowIcon: "/call-made-2.png",
    },
    {
      icon: "/vuesax-linear-dollar-circle.svg",
      label: "Avg Pair Value",
      tooltip: "Average revenue potential per product pair. Calculated from historical co-purchase data: (Combined revenue ÷ Number of pairs).",
      value: `Rs ${formatLargeNumber(Math.round(metrics.avgPairValue || metrics.totalRevenue / Math.max(metrics.topPairs.length, 1)))}`,
      percentage: null, // Remove hardcoded percentage
      bgColor: "bg-foundation-purplepurple-50",
      badgeBgColor: "bg-foundation-purplepurple-50",
      percentageColor: "text-foundation-purplepurple-500",
      arrowIcon: "/call-made-3.png",
    },
  ];

  if (loading) {
    return (
      <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
        {/* ML Status Badge */}
        {usingML && mlStatus?.is_trained && (
          <div className="mb-4">
            <Badge className="bg-gradient-to-r from-foundation-blueblue-500 to-foundation-purplepurple-500 text-white border-0">
              🤖 Powered by ML Algorithms
            </Badge>
          </div>
        )}
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
          {usingML && (
            <button
              onClick={() => fetchCrossSellingData()}
              className="mt-2 text-foundation-blueblue-600 underline"
            >
              Try again with SQL fallback
            </button>
          )}
        </div>
      </section>
    );
  }

  // Main UI with metrics
  return (
    <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
      {/* ML/SQL Indicator Badge */}
      <div className="mb-4 flex items-center justify-between">
        {usingML && mlStatus?.is_trained ? (
          <Badge className="bg-gradient-to-r from-foundation-blueblue-500 to-foundation-purplepurple-500 text-white border-0">
            🤖 ML-Powered Recommendations
          </Badge>
        ) : (
          <Badge className="bg-foundation-greygrey-500 text-white border-0">
            📊 SQL-Based Analytics
          </Badge>
        )}

        {/* A/B Test Info */}
        {enableABTest && variant && (
          <span className="text-xs text-foundation-greygrey-600">
            A/B Test: {variant.variant} ({variant.algorithm})
          </span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricsData.map((metric, index) => (
          <Card key={index} className="border-0 shadow-none">
            <CardContent className="flex flex-col items-start justify-center gap-2 p-5">
              <div className={`flex items-center justify-center w-10 h-10 ${metric.bgColor} rounded-lg`}>
                <img src={metric.icon} alt={metric.label} className="w-5 h-5" />
              </div>
              <div className="flex flex-col items-start justify-center gap-0 w-full">
                <span className="text-foundation-greygrey-600 text-sm [font-family:'Poppins',Helvetica] flex items-center">
                  {metric.label}
                  <InfoTooltip text={metric.tooltip} />
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-foundation-greygrey-900 text-2xl font-semibold [font-family:'Poppins',Helvetica]">
                    {metric.value}
                  </span>
                  {metric.percentage && (
                    <Badge className={`${metric.badgeBgColor} ${metric.percentageColor} border-0 text-xs`}>
                      <img src={metric.arrowIcon} alt="trend" className="w-3 h-3 mr-1" />
                      {metric.percentage}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Pairs Table */}
      {metrics.topPairs.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold text-foundation-greygrey-900 mb-4 [font-family:'Poppins',Helvetica]">
              Top Cross-Selling Pairs
            </h3>
            <div className="space-y-3">
              {metrics.topPairs.map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-foundation-greygrey-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-foundation-greygrey-900 [font-family:'Poppins',Helvetica]">
                      {pair.product_name}
                    </p>
                    <p className="text-sm text-foundation-greygrey-600 [font-family:'Poppins',Helvetica]">
                      Pairs with: {pair.pair_product_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foundation-greygrey-900 [font-family:'Poppins',Helvetica]">
                      Rs {formatLargeNumber(pair.potential_revenue)}
                    </p>
                    <p className="text-sm text-foundation-greygrey-600 [font-family:'Poppins',Helvetica] flex items-center gap-1">
                      {pair.confidence_score.toFixed(0)}% confidence
                      <InfoTooltip text="Confidence = (Co-purchase count ÷ Total orders with main product) × 100. Higher confidence means customers who buy the main product frequently also buy this paired product." />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
};
