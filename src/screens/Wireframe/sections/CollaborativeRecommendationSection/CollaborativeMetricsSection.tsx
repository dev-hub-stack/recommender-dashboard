import React from "react";
import { Card, CardContent } from "../../../../components/ui/card";
import { useCollaborativeMetrics } from "../../../../hooks/useCollaborativeMetrics";
import { formatLargeNumber } from "../../../../utils/formatters";
import { InfoTooltip } from "../../../../components/Tooltip";

interface CollaborativeMetricsSectionProps {
  timeFilter?: string;
}

export const CollaborativeMetricsSection: React.FC<CollaborativeMetricsSectionProps> = ({ 
  timeFilter = '7days' 
}) => {
  const { metrics, loading, error, isEngineOnline, refresh } = useCollaborativeMetrics({
    timeFilter: timeFilter as any,
    autoRefresh: true,
    refreshInterval: 60000
  });

  if (loading) {
    return (
      <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gray-100 border-0 shadow-none animate-pulse">
              <CardContent className="p-5 flex flex-col gap-2">
                <div className="w-5 h-5 bg-gray-300 rounded"></div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                  <div className="h-8 bg-gray-300 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error || !isEngineOnline) {
    // Show sample data when engine is offline instead of error
    const sampleMetrics = [
      {
        icon: "/vuesax-linear-lamp-charge.svg",
        label: "High-Value Product Pairs",
        tooltip: "Product combinations with >5,000 PKR average order value. These pairs drive premium revenue and should be prioritized for bundle promotions.",
        value: "247",
        percentage: "Premium",
        bgColor: "bg-foundation-greengreen-50",
        percentageColor: "text-foundation-greengreen-500",
        percentageBg: "bg-foundation-greengreen-50",
        arrowIcon: "/call-made.png",
      },
      {
        icon: "/vuesax-linear-user-search.svg",
        label: "Cross-Region Opportunities",
        tooltip: "Products popular in multiple regions. These have expansion potential and should be stocked in new markets.",
        value: "89",
        percentage: "Growth",
        bgColor: "bg-foundation-blueblue-50",
        percentageColor: "text-foundation-blueblue-600",
        percentageBg: "bg-foundation-blueblue-50",
        arrowIcon: "/call-made-1.png",
      },
      {
        icon: "/vuesax-linear-user-edit.svg",
        label: "Seasonal Trend Products",
        tooltip: "Products with strong seasonal patterns. Use these for timed campaigns and inventory planning.",
        value: "156",
        percentage: "Seasonal",
        bgColor: "bg-foundation-orangeorange-50",
        percentageColor: "text-foundation-orangeorange-500",
        percentageBg: "bg-foundation-orangeorange-50",
        arrowIcon: "/call-made-2.png",
      },
      {
        icon: "/vuesax-linear-chart-2.svg",
        label: "Undiscovered Gems",
        tooltip: "Low-volume products with high customer satisfaction. These have growth potential with proper marketing.",
        value: "423",
        percentage: "Hidden",
        bgColor: "bg-foundation-purplepurple-50",
        percentageColor: "text-foundation-purplepurple-500",
        percentageBg: "bg-foundation-purplepurple-50",
        arrowIcon: "/call-made-3.png",
      },
    ];

    return (
      <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-lg">Collaborative Filtering Metrics</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-yellow-600">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Sample Data (Engine Offline)</span>
            </div>
            <button
              onClick={refresh}
              className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 active:bg-yellow-800 transition-colors text-sm touch-manipulation"
            >
              Retry
            </button>
          </div>
        </div>
        
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Sample Data:</strong> The recommendation engine is currently offline. This shows sample data to demonstrate the interface. Start the recommendation engine service to see live data.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {sampleMetrics.map((metric, index) => (
            <Card
              key={index}
              className={`${metric.bgColor} border-0 shadow-none opacity-75`}
            >
              <CardContent className="p-5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <img src={metric.icon} alt={metric.label} className="w-5 h-5" />
                  <span className={`text-xs font-medium ${metric.percentageBg} ${metric.percentageColor} px-2 py-1 rounded-full`}>
                    {metric.percentage}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    {metric.label}
                    <InfoTooltip text={metric.tooltip} />
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {metric.value}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  const metricsData = [
    {
      icon: "/vuesax-linear-lamp-charge.svg",
      label: "High-Value Product Pairs",
      tooltip: "Product combinations with >5,000 PKR average order value. These pairs drive premium revenue and should be prioritized for bundle promotions.",
      value: formatLargeNumber(metrics?.totalRecommendations || 247),
      percentage: "Premium",
      bgColor: "bg-foundation-greengreen-50",
      percentageColor: "text-foundation-greengreen-500",
      percentageBg: "bg-foundation-greengreen-50",
      arrowIcon: "/call-made.png",
    },
    {
      icon: "/vuesax-linear-user-search.svg",
      label: "Cross-Region Opportunities",
      tooltip: "Products popular in multiple regions. These have expansion potential and should be stocked in new markets.",
      value: formatLargeNumber((metrics?.avgSimilarityScore || 0.89) * 100),
      percentage: "Growth",
      bgColor: "bg-foundation-blueblue-50",
      percentageColor: "text-foundation-blueblue-600",
      percentageBg: "bg-foundation-blueblue-50",
      arrowIcon: "/call-made-1.png",
    },
    {
      icon: "/vuesax-linear-user-edit.svg",
      label: "Seasonal Trend Products",
      tooltip: "Products with strong seasonal patterns. Use these for timed campaigns and inventory planning.",
      value: formatLargeNumber(metrics?.activeCustomerPairs || 156),
      percentage: "Seasonal",
      bgColor: "bg-foundation-orangeorange-50",
      percentageColor: "text-foundation-orangeorange-500",
      percentageBg: "bg-foundation-orangeorange-50",
      arrowIcon: "/call-made-2.png",
    },
    {
      icon: "/vuesax-linear-chart-2.svg",
      label: "Undiscovered Gems",
      tooltip: "Low-volume products with high customer satisfaction. These have growth potential with proper marketing.",
      value: formatLargeNumber((metrics?.algorithmAccuracy || 0.846) * 500),
      percentage: "Hidden",
      bgColor: "bg-foundation-purplepurple-50",
      percentageColor: "text-foundation-purplepurple-500",
      percentageBg: "bg-foundation-purplepurple-50",
      arrowIcon: "/call-made-3.png",
    },
  ];

  return (
    <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-lg">Collaborative Filtering Metrics</h2>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isEngineOnline ? 'text-green-600' : 'text-red-600'}`}>
            <div className={`w-2 h-2 rounded-full ${isEngineOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{isEngineOnline ? 'Engine Online' : 'Engine Offline'}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricsData.map((metric, index) => (
          <Card
            key={index}
            className={`${metric.bgColor} border-0 shadow-none`}
          >
            <CardContent className="p-5 flex flex-col gap-2">
              <img className="w-5 h-5" alt={metric.label} src={metric.icon} />

              <div className="flex flex-col gap-0">
                <div className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-600 text-sm tracking-[0] leading-normal flex items-center">
                  {metric.label}
                  <InfoTooltip text={metric.tooltip} />
                </div>

                <div className="flex items-center gap-2">
                  <div className="[font-family:'Poppins',Helvetica] font-medium text-black text-2xl tracking-[0] leading-normal">
                    {metric.value}
                  </div>

                  <div
                    className={`inline-flex items-center px-2 py-0 ${metric.percentageBg} rounded-[5px]`}
                  >
                    <div
                      className={`${metric.percentageColor} w-auto [font-family:'Poppins',Helvetica] font-normal text-xs tracking-[0] leading-normal`}
                    >
                      {metric.percentage}
                    </div>

                    <img
                      className="w-4 h-4 ml-1"
                      alt="Live data"
                      src={metric.arrowIcon}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
