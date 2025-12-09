import { Card, CardContent } from "../../../../components/ui/card";
import { useDashboardMetrics } from "../../../../hooks/useDashboardMetrics";
import { formatLargeNumber } from "../../../../utils/formatters";
import { DateRangeDisplay } from "../../../../components/DateRangeDisplay";

interface PerformanceMetricsSectionProps {
  timeFilter?: string;
  category?: string;
}

export const PerformanceMetricsSection = ({ timeFilter: propTimeFilter, category }: PerformanceMetricsSectionProps): JSX.Element => {
  // Use prop directly, do not duplicate into state
  const { metrics, loading, error, isEngineOnline } = useDashboardMetrics({
    timeFilter: (propTimeFilter || '7days') as any,
    category: category || '',
    autoRefresh: false,
    refreshInterval: 0
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
    return (
      <section className="w-full bg-red-50 rounded-xl p-5">
        <div className="text-red-600 text-center">
          {error || "Recommendation engine offline"}
        </div>
      </section>
    );
  }

  // Debug logging to see what we're getting
  console.log('Metrics data:', metrics);

  const metricsData = [
    {
      icon: "/vuesax-linear-chart.svg",
      label: "Total Revenue",
      value: `Rs ${formatLargeNumber(Number(metrics?.totalRevenueAmount) || 0)}`,
      percentage: "Live",
      bgColor: "bg-foundation-greengreen-50",
      percentageColor: "text-foundation-greengreen-500",
      percentageBg: "bg-foundation-greengreen-50",
      arrowIcon: "/call-made.png",
    },
    {
      icon: "/vuesax-linear-shopping-cart.svg",
      label: "Total Orders",
      value: formatLargeNumber(metrics?.totalOrders || 0),
      percentage: "Live",
      bgColor: "bg-foundation-blueblue-50",
      percentageColor: "text-foundation-blueblue-600",
      percentageBg: "bg-foundation-blueblue-50",
      arrowIcon: "/call-made-1.png",
    },
    {
      icon: "/vuesax-linear-graph.svg",
      label: "Total Customers",
      value: formatLargeNumber(metrics?.totalCustomers || 0),
      percentage: "Live",
      bgColor: "bg-foundation-orangeorange-50",
      percentageColor: "text-foundation-orangeorange-500",
      percentageBg: "bg-foundation-orangeorange-50",
      arrowIcon: "/call-made-2.png",
    },
    {
      icon: "/vuesax-linear-dollar-circle.svg",
      label: "Avg Order Value",
      value: `Rs ${formatLargeNumber(Number(metrics?.avgOrderValueAmount) || 0)}`,
      percentage: "Live",
      bgColor: "bg-foundation-purplepurple-50",
      percentageColor: "text-foundation-purplepurple-500",
      percentageBg: "bg-foundation-purplepurple-50",
      arrowIcon: "/call-made-3.png",
    },
  ];

  return (
    <section className="w-full bg-foundation-whitewhite-50 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <h2 className="font-semibold text-lg">Live Performance Metrics</h2>
        <div className="flex items-center gap-4">
          <DateRangeDisplay 
            timeFilter={(propTimeFilter || '7days') as any} 
            totalRecords={metrics?.totalOrders || 0}
          />
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
                <div className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-600 text-sm tracking-[0] leading-normal">
                  {metric.label}
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
