import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { DashboardHeaderSection } from "./sections/DashboardHeaderSection";
import { PerformanceMetricsSection } from "./sections/PerformanceMetricsSection";
import { RecentActivitySection } from "./sections/RecentActivitySection";
import { RevenueTrendSection } from "./sections/RevenueTrendSection";
import { TopProductsSection } from "./sections/TopProductsSection";
import { CustomerDetailedProfiling } from "./sections/CustomerProfilingSection/CustomerDetailedProfiling";
import { POSvsOESection } from "./sections/POSvsOESection";
import { CrossSellingSection } from "./sections/CrossSellingSection";
import CollaborativeRecommendationDashboard from "./sections/CollaborativeRecommendationSection";
import { GeographicIntelligenceSection } from "./sections/GeographicIntelligenceSection";
import { RFMSegmentationSection } from "./sections/RFMSegmentationSection";
import { AWSPersonalizeSection } from "./sections/AWSPersonalizeSection";
import { getProductCategories, ProductCategory } from "../../services/api";

export const Wireframe = (): JSX.Element => {
  const [timeFilter, setTimeFilter] = useState<string>('7days'); // Changed default to 7 days
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getProductCategories(timeFilter as any);
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, [timeFilter]);

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    if (value === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  return (
    <div className="bg-foundation-whitewhite-100 w-full min-w-[1440px] h-screen relative flex overflow-hidden">
      <aside className="w-auto relative">
        <RevenueTrendSection 
          activeView={activeView}
          onNavigate={setActiveView}
        />
      </aside>

      <main className="flex-1 flex flex-col relative space-y-6 p-4 overflow-y-auto h-full">
        <DashboardHeaderSection />
        
        {/* Global Time Filter */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {activeView === 'Dashboard' ? 'Analytics Dashboard' : 
               activeView === 'Collaborative Filtering' ? 'Product Insights' : 
               activeView === 'Cross-Selling' ? 'Revenue Optimization' : 
               activeView}
            </h3>
          </div>
          
          {/* Hide Time Period filter for ML Recommendations since ML uses all historical data */}
          {activeView !== 'ML Recommendations' && (
            <div className="flex items-center gap-4">
              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">All Categories</option>
                  {categories.slice(0, 10).map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Period Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Time Period:</label>
                <select 
                  value={timeFilter} 
                  onChange={(e) => handleTimeFilterChange(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="mtd">Month to Date</option>
                  <option value="90days">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last 1 Year</option>
                  <option value="custom">Custom Date Range</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            
            {/* Custom Date Range Picker */}
            {showCustomDatePicker && (
              <div className="flex items-center gap-2 ml-4 p-3 bg-gray-50 rounded-lg border">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    if (customStartDate && customEndDate) {
                      setTimeFilter(`${customStartDate}:${customEndDate}`);
                      setShowCustomDatePicker(false);
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Selected Category Badge */}
        {selectedCategory && (
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
            <span className="text-sm text-purple-700">
              Filtering by: <strong>{selectedCategory}</strong>
            </span>
            <button 
              onClick={() => setSelectedCategory('')}
              className="text-purple-500 hover:text-purple-700 text-lg"
            >
              ×
            </button>
          </div>
        )}

        {/* Render different views based on activeView */}
        {activeView === 'Dashboard' && (
          <>
            <PerformanceMetricsSection timeFilter={timeFilter} />
            <TopProductsSection timeFilter={timeFilter} category={selectedCategory} />
            <POSvsOESection timeFilter={timeFilter} />
            <RecentActivitySection timeFilter={timeFilter} />
          </>
        )}
        
        {activeView === 'Customer Profiling' && (
          <CustomerDetailedProfiling timeFilter={timeFilter} />
        )}
        
        {activeView === 'Cross-Selling' && (
          <CrossSellingSection timeFilter={timeFilter} />
        )}
        
        {activeView === 'Collaborative Filtering' && (
          <CollaborativeRecommendationDashboard timeFilter={timeFilter} />
        )}
        
        {activeView === 'Geographic Intelligence' && (
          <GeographicIntelligenceSection timeFilter={timeFilter} />
        )}
        
        {activeView === 'RFM Segmentation' && (
          <RFMSegmentationSection timeFilter={timeFilter} />
        )}
        
        {activeView === 'ML Recommendations' && (
          <AWSPersonalizeSection />
        )}
      </main>

      <Button
        className="fixed right-[42px] bottom-[37px] w-16 h-16 rounded-[40px] p-3 shadow-[0px_4px_20px_#0000001f] bg-[linear-gradient(to_bottom_right,rgba(234,244,255,1)_0%,rgba(159,204,253,1)_50%)_bottom_right_/_50%_50%_no-repeat,linear-gradient(to_bottom_left,rgba(234,244,255,1)_0%,rgba(159,204,253,1)_50%)_bottom_left_/_50%_50%_no-repeat,linear-gradient(to_top_left,rgba(234,244,255,1)_0%,rgba(159,204,253,1)_50%)_top_left_/_50%_50%_no-repeat,linear-gradient(to_top_right,rgba(234,244,255,1)_0%,rgba(159,204,253,1)_50%)_top_right_/_50%_50%_no-repeat] hover:opacity-90"
        size="icon"
      >
        <img
          className="w-6 h-6"
          alt="Vuesax linear"
          src="/vuesax-linear-messenger.svg"
        />
      </Button>
    </div>
  );
};
