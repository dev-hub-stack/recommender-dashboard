import { ArrowUpIcon, Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { getRevenueTrend, getPopularProducts, Product } from "../../../../services/api";
import { formatCurrency, formatLargeNumber } from "../../../../utils/formatters";
import { exportTopProducts, exportRevenueTrend } from "../../../../utils/csvExport";

// Live data from recommendation engine - no static data needed

const chartBars = [
  { day: "Mon", height: "h-[87px]" },
  { day: "Tue", height: "h-[50px]" },
  { day: "Wed", height: "h-[107px]" },
  { day: "Thu", height: "h-[137px]" },
  { day: "Fri", height: "h-[50px]" },
  { day: "Sat", height: "h-full" },
  { day: "Sun", height: "h-[181px]" },
];

interface TopProductsSectionProps {
  timeFilter?: string;
  category?: string;
}

export const TopProductsSection: React.FC<TopProductsSectionProps> = ({ timeFilter = '7days', category = '' }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueTrend, setRevenueTrend] = useState<any>(null);
  const [trendPeriod, setTrendPeriod] = useState<string>('daily');
  const selectedCategory = category; // Use prop from parent

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use API endpoint with category filter - backend handles filtering
        const popularProducts = await getPopularProducts(10, timeFilter, category || undefined);
        
        // No client-side filtering needed - backend handles it
        const filteredProducts = popularProducts;
        
        // Fetch revenue trend data
        const trendData = await getRevenueTrend(timeFilter, trendPeriod);
        
        setProducts(filteredProducts.slice(0, 5));
        setRevenueTrend(trendData);
        setError(null);
      } catch (err) {
        setError('Failed to load data.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter, trendPeriod, category]);

  if (loading) {
    return (
      <section className="flex items-start gap-6 w-full">
        <Card className="flex flex-col items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl flex-1">
          <CardContent className="p-0 w-full space-y-4">
            <div className="flex items-center gap-2.5 w-full">
              <h2 className="flex-1 font-semibold text-black text-base">
                Top Performing Products
              </h2>
              <Badge className="h-auto px-2 py-1 bg-foundation-whitewhite-200 rounded-[5px]">
                <span className="font-normal text-foundation-greygrey-800 text-xs">
                  Live Data
                </span>
              </Badge>
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="w-80 h-64 bg-gray-100 rounded-xl animate-pulse"></div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex items-start gap-6 w-full">
        <Card className="flex flex-col items-start gap-4 p-5 bg-red-50 rounded-xl flex-1">
          <CardContent className="p-0 w-full">
            <div className="text-red-600 text-center py-8">
              {error}
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex items-start gap-6 w-full">
      <Card className="flex flex-col items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl flex-1">
        <CardContent className="p-0 w-full space-y-4">
          <div className="flex items-center gap-2.5 w-full">
            <h2 className="flex-1 font-semibold text-black text-base">
              Top Performing Products (Live)
            </h2>
            {/* Category badge - shows selected category from global filter */}
            {selectedCategory && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                {selectedCategory}
              </span>
            )}
            {/* Export Button */}
            <button
              onClick={() => exportTopProducts(products, selectedCategory)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
              title="Export to CSV"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
            <Badge className="h-auto px-2 py-1 bg-green-100 rounded-[5px]">
              <span className="font-normal text-green-800 text-xs">
                🔴 Live Data
              </span>
            </Badge>
          </div>

          <div className="flex w-full">
            <div className="flex flex-col flex-1">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
<span className="font-normal text-foundation-greygrey-400 text-sm cursor-help" title="Product name and unique identifier">
                  Product ℹ️
                </span>
              </div>

              {products.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`h-[83px] flex items-center gap-2 px-2.5 py-5 w-full bg-foundation-whitewhite-50 ${
                    index < products.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <div className="w-[43px] h-[43px] bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-xs">#{index + 1}</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-foundation-greygrey-800 text-sm">
                      {product.product_name || `Product ${product.product_id}`}
                    </span>
                    <span className="text-xs text-gray-500">
                      SKU: {(() => {
                        const dimensions = product.product_name?.match(/\d{2}-\d{2}(-\d{1,2})?/);
                        return dimensions ? dimensions[0] : product.product_id;
                      })()} • Score: {product.score?.toFixed(0) || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[142px]">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
<span className="font-normal text-foundation-greygrey-400 text-sm cursor-help" title="How often this product is purchased - higher score means more popular">
                  Popularity ℹ️
                </span>
              </div>

              {products.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`flex w-[142px] h-[83px] items-center gap-2 px-2.5 py-5 bg-foundation-whitewhite-50 ${
                    index < products.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <div className="inline-flex items-center gap-1 rounded-[5px] overflow-hidden">
                    <span className="font-normal text-foundation-greengreen-500 text-sm">
                      {formatLargeNumber(product.score || 0)}
                    </span>
                    <ArrowUpIcon className="w-[18px] h-[18px] text-foundation-greengreen-500" />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[142px]">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
<span className="font-normal text-foundation-greygrey-400 text-sm cursor-help" title="Product brand/category and average selling price">
                  Brand & Price ℹ️
                </span>
              </div>

              {products.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`flex w-[142px] h-[83px] items-center gap-2 px-2.5 py-5 bg-foundation-whitewhite-50 ${
                    index < products.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <div className="inline-flex flex-col items-start justify-center">
                    <span className="font-medium text-black text-sm">
                      {product.category || 'General'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Rs {formatLargeNumber(product.avg_price || product.price || product.total_revenue || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col w-[422px] h-[453px] items-start gap-2.5 p-5 bg-foundation-whitewhite-50 rounded-xl">
        <CardContent className="p-0 w-full h-full flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5 w-full">
            <h2 className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]">
              Revenue Trend
            </h2>
            {/* Export Button */}
            {revenueTrend?.trend_data && (
              <button
                onClick={() => exportRevenueTrend(revenueTrend.trend_data)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                title="Export to CSV"
              >
                <Download className="w-3 h-3" />
              </button>
            )}
            <select 
              value={trendPeriod} 
              onChange={(e) => setTrendPeriod(e.target.value)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-[5px] border border-solid border-[#cacbce] h-auto text-xs bg-white"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="inline-flex items-end gap-[26px] flex-1">
            <div className="w-4 flex flex-col items-start gap-[11px]">
              {(() => {
                // Generate dynamic Y-axis labels based on max revenue
                const maxRevenue = revenueTrend?.summary?.max_revenue || 100;
                const labels = [];
                for (let i = 10; i >= 0; i--) {
                  const value = (i / 10) * maxRevenue;
                  labels.push(formatLargeNumber(value));
                }
                return labels;
              })().map((label, index) => (
                <span
                  key={index}
                  className={`${
                    index === 0 ? "mr-[-6.00px]" : ""
                  } [font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-6 ${
                    index === 0 ? "whitespace-nowrap" : ""
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="flex flex-col w-[334px] h-[260px] items-center gap-[5px]">
              <div className="flex items-end gap-4 flex-1 w-full">
                {revenueTrend?.trend_data ? 
                  revenueTrend.trend_data.slice(0, 7).map((dataPoint: any, index: number) => {
                    // Calculate height based on percentage (260px max height - 20px padding = 240px usable)
                    const heightPx = Math.max(20, (dataPoint.percentage / 100) * 240);
                    return (
                      <div
                        key={index}
                        className="w-[34px] bg-foundation-blueblue-300 rounded-xl"
                        style={{ height: `${heightPx}px` }}
                        title={`${dataPoint.label}: ${formatCurrency(dataPoint.total_revenue)}`}
                      />
                    );
                  }) :
                  // Fallback to static bars if no data
                  chartBars.map((bar, index) => (
                    <div
                      key={index}
                      className={`w-[34px] ${bar.height} bg-foundation-blueblue-300 rounded-xl`}
                    />
                  ))
                }
              </div>

              <div className="inline-flex items-center gap-7">
                {revenueTrend?.trend_data ? 
                  revenueTrend.trend_data.slice(0, 7).map((dataPoint: any, index: number) => (
                    <span
                      key={index}
                      className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-6 whitespace-nowrap"
                    >
                      {dataPoint.label}
                    </span>
                  )) :
                  // Fallback to static labels if no data
                  chartBars.map((bar, index) => (
                    <span
                      key={index}
                      className="[font-family:'Inter',Helvetica] font-medium text-black text-xs tracking-[0] leading-6 whitespace-nowrap"
                    >
                      {bar.day}
                    </span>
                  ))
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
