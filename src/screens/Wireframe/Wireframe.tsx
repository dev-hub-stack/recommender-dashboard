import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { DashboardHeaderSection } from "./sections/DashboardHeaderSection";
import { PerformanceMetricsSection } from "./sections/PerformanceMetricsSection";
import { RecentActivitySection } from "./sections/RecentActivitySection";
import { RevenueTrendSection } from "./sections/RevenueTrendSection";
import { TopProductsSection } from "./sections/TopProductsSection";
import { CustomerProfilingSection } from "./sections/CustomerProfilingSection";
import { CustomerDetailedProfiling } from "./sections/CustomerProfilingSection/CustomerDetailedProfiling";
import { POSvsOESection } from "./sections/POSvsOESection";
import { CrossSellingSection } from "./sections/CrossSellingSection";
import CollaborativeRecommendationDashboard from "./sections/CollaborativeRecommendationSection";

export const Wireframe = (): JSX.Element => {
  const [timeFilter, setTimeFilter] = useState<string>('7days'); // Changed default to 7 days
  const [activeView, setActiveView] = useState<string>('Dashboard');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    if (value === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
    }
  };

  return (
    <div className="bg-foundation-whitewhite-100 w-full min-w-[1440px] min-h-[1024px] relative flex">
      <aside className="w-auto relative">
        <RevenueTrendSection 
          activeView={activeView}
          onNavigate={setActiveView}
        />
      </aside>

      <main className="flex-1 flex flex-col relative space-y-6 p-4">
        <DashboardHeaderSection />
        
        {/* Global Time Filter */}
        <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {activeView === 'Dashboard' ? 'Analytics Dashboard' : 
               activeView === 'Collaborative Recommendation' ? 'Collaborative Filtering' : 
               activeView}
            </h3>
          </div>
          
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
        </div>

        {/* Render different views based on activeView */}
        {activeView === 'Dashboard' && (
          <>
            <PerformanceMetricsSection />
            <TopProductsSection timeFilter={timeFilter} />
            <POSvsOESection timeFilter={timeFilter} />
            <RecentActivitySection />
          </>
        )}
        
        {activeView === 'Analytics' && (
          <>
            <PerformanceMetricsSection />
            <POSvsOESection timeFilter={timeFilter} />
          </>
        )}
        
        {activeView === 'Customer Profiling' && (
          <CustomerDetailedProfiling timeFilter={timeFilter} />
        )}
        
        {activeView === 'Conversion Rate' && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Conversion Rate Analytics</h2>
            <p className="text-gray-600">Coming Soon - Advanced conversion tracking and analytics</p>
          </div>
        )}
        
        {activeView === 'User Flow' && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">User Flow Analysis</h2>
            <p className="text-gray-600">Coming Soon - User journey and flow visualization</p>
          </div>
        )}
        
        {activeView === 'Cross-Selling' && (
          <CrossSellingSection timeFilter={timeFilter} />
        )}
        
        {activeView === 'Collaborative Recommendation' && (
          <CollaborativeRecommendationDashboard timeFilter={timeFilter} />
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
