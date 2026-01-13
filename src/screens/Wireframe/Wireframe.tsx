import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { DashboardHeaderSection } from "./sections/DashboardHeaderSection";
import { PerformanceMetricsSection } from "./sections/PerformanceMetricsSection";
import { RecentActivitySection } from "./sections/RecentActivitySection";
import { RevenueTrendSection } from "./sections/RevenueTrendSection";
import { TopProductsSection } from "./sections/TopProductsSection";
import { CustomerDetailedProfiling } from "./sections/CustomerProfilingSection/CustomerDetailedProfiling";
import { POSvsOESection } from "./sections/POSvsOESection/POSvsOESection";
import { CrossSellingSection } from "./sections/CrossSellingSection";
import CollaborativeRecommendationDashboard from "./sections/CollaborativeRecommendationSection";
import { GeographicIntelligenceSection } from "./sections/GeographicIntelligenceSection";
import { RFMSegmentationSection } from "./sections/RFMSegmentationSection";
import { AWSPersonalizeSection } from "./sections/AWSPersonalizeSection";
import { getProductCategories, ProductCategory } from "../../services/api";
import { MultiSelectFilter } from "../../components/MultiSelectFilter";
import { DashboardExportButton } from "../../components/DashboardExportButton";
// Filter configuration available at: ../../config/screenFilters.ts

export const Wireframe = (): JSX.Element => {
  const [timeFilter, setTimeFilter] = useState<string>('7days'); // Changed default to 7 days
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  // Global OE/POS filter - 'all', 'oe', or 'pos'
  const [orderSource, setOrderSource] = useState<string>('all');
  // Delivered only filter - only include delivered/completed orders
  const [deliveredOnly, setDeliveredOnly] = useState<boolean>(false);
  // Keep single category for backward compatibility
  const selectedCategory = selectedCategories.length === 1 ? selectedCategories[0] : 
                          selectedCategories.length > 1 ? selectedCategories.join(',') : '';

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

  // Smart filter visibility based on active screen
  // Only show filters that actually affect the screen's data/API calls
  
  // Time filter: Hidden for ML Recommendations (uses all historical data for training)
  const shouldShowTimeFilter = activeView !== 'ML Recommendations';
  
  // Category filter: Hidden for RFM Segmentation (customer-centric, not product-centric)
  // and ML Recommendations (uses pre-computed models with all products)
  const shouldShowCategoryFilter = !['RFM Segmentation', 'ML Recommendations'].includes(activeView);
  
  // Order Source filter (OE/POS): Only show on Dashboard
  // Other screens query tables that don't have order_source filtering in their backend endpoints
  const shouldShowOrderSourceFilter = activeView === 'Dashboard';
  
  // Delivered Only filter: Only show on Dashboard
  // Only Dashboard components pass this to their API calls
  const shouldShowDeliveredFilter = activeView === 'Dashboard';

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
          {shouldShowTimeFilter && (
            <div className="flex items-center gap-4">
              {/* Multi-Select Category Filter */}
              {shouldShowCategoryFilter && (
                <MultiSelectFilter
                  options={categories.slice(0, 20).map(cat => ({
                    value: cat.category,
                    label: cat.category,
                    count: (cat as any).product_count || (cat as any).count
                  }))}
                  selectedValues={selectedCategories}
                  onChange={setSelectedCategories}
                  label="Categories:"
                  placeholder="All Categories"
                />
              )}

              {/* OE/POS Order Source Filter */}
              {shouldShowOrderSourceFilter && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Source:</label>
                  <select 
                    value={orderSource} 
                    onChange={(e) => setOrderSource(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Orders</option>
                    <option value="oe">OE (Online Express)</option>
                    <option value="pos">POS (Point of Sale)</option>
                  </select>
                </div>
              )}

              {/* Delivered Only Toggle - Only for revenue-focused screens */}
              {shouldShowDeliveredFilter && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={deliveredOnly}
                      onChange={(e) => setDeliveredOnly(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    Delivered Only
                  </label>
                </div>
              )}

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
                  <option value="2years">Last 2 Years</option>
                  <option value="3years">Last 3 Years</option>
                  <option value="custom">Custom Date Range</option>
                  <option value="all">All Time (Slower)</option>
                </select>
              </div>

              {/* CSV Export Button - Context-Aware */}
              <DashboardExportButton
                timeFilter={timeFilter}
                categories={selectedCategories}
                orderSource={orderSource}
                deliveredOnly={deliveredOnly}
                sections={[activeView.toLowerCase().replace(/\s+/g, '_')]}
              />
            
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

        {/* Active Filters Badges */}
        {(selectedCategories.length > 0 || orderSource !== 'all' || deliveredOnly) && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            {/* Order Source Badge */}
            {orderSource !== 'all' && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-full">
                <span className="text-sm text-blue-700">
                  <strong>{orderSource === 'oe' ? '🌐 Online Express' : '🏪 Point of Sale'}</strong>
                </span>
                <button 
                  onClick={() => setOrderSource('all')}
                  className="text-blue-500 hover:text-blue-700 text-sm ml-1"
                >
                  ×
                </button>
              </div>
            )}
            
            {/* Delivered Only Badge */}
            {deliveredOnly && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                <span className="text-sm text-green-700">
                  <strong>✅ Delivered Only</strong>
                </span>
                <button 
                  onClick={() => setDeliveredOnly(false)}
                  className="text-green-500 hover:text-green-700 text-sm ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {/* Categories Badge */}
            {selectedCategories.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 rounded-full">
                <span className="text-sm text-purple-700">
                  <strong>{selectedCategories.length === 1 ? selectedCategories[0] : `${selectedCategories.length} categories`}</strong>
                </span>
                <button 
                  onClick={() => setSelectedCategories([])}
                  className="text-purple-500 hover:text-purple-700 text-sm ml-1"
                >
                  ×
                </button>
              </div>
            )}

            {/* Clear All Filters */}
            <button 
              onClick={() => {
                setOrderSource('all');
                setDeliveredOnly(false);
                setSelectedCategories([]);
              }}
              className="ml-auto text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Render different views based on activeView */}
        {activeView === 'Dashboard' && (
          <>
            <PerformanceMetricsSection timeFilter={timeFilter} category={selectedCategory} orderSource={orderSource} deliveredOnly={deliveredOnly} />
            <TopProductsSection timeFilter={timeFilter} category={selectedCategory} orderSource={orderSource} deliveredOnly={deliveredOnly} />
            <POSvsOESection timeFilter={timeFilter} category={selectedCategory} />
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
