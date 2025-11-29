import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { getCustomerSimilarityData, CustomerSimilarityData, TimeFilter } from "../../../../services/api";
import { formatLargeNumber, formatPercentage } from "../../../../utils/formatters";
import { ExportButton } from "../../../../components/ExportButton";
import { exportCustomerPairsDetail } from "../../../../services/exportApi";

interface CustomerSimilaritySectionProps {
  timeFilter?: TimeFilter;
}

type SortField = 'similar_customers_count' | 'actual_recommendations';
type SortDirection = 'asc' | 'desc';

export const CustomerSimilaritySection: React.FC<CustomerSimilaritySectionProps> = ({ 
  timeFilter = 'all' 
}) => {
  const [customers, setCustomers] = useState<CustomerSimilarityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sortField, setSortField] = useState<SortField>('similar_customers_count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getCustomerSimilarityData(timeFilter, 10); // Changed to 10 to match Product Pairs
        setCustomers(data);
        setError(null);
      } catch (err) {
        setError('Failed to load customer similarity data');
        console.error('Error fetching customer similarity data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    // Use actual_recommendations if available, fallback to recommendations_generated for backward compatibility
    const aValue = sortField === 'actual_recommendations' 
      ? (a.actual_recommendations ?? a.recommendations_generated)
      : a[sortField];
    const bValue = sortField === 'actual_recommendations'
      ? (b.actual_recommendations ?? b.recommendations_generated)
      : b[sortField];
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    return (aValue - bValue) * multiplier;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ArrowUpIcon className="w-3 h-3 inline ml-1" />
    ) : (
      <ArrowDownIcon className="w-3 h-3 inline ml-1" />
    );
  };

  if (loading) {
    return (
      <Card className="flex flex-col items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl w-full">
        <CardContent className="p-0 w-full space-y-4">
          <div className="flex items-center gap-2.5 w-full">
            <h2 className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-black text-base">
              Customer Similarity Insights
            </h2>
            <Badge className="h-auto px-2 py-1 bg-foundation-whitewhite-200 rounded-[5px]">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-800 text-xs">
                Loading...
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
    );
  }

  const handleRetry = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerSimilarityData(timeFilter, 10); // Changed to 10 to match Product Pairs
      setCustomers(data);
    } catch (err) {
      setError('Failed to load customer similarity data');
      console.error('Error fetching customer similarity data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Card className="flex flex-col items-start gap-4 p-5 bg-red-50 rounded-xl w-full">
        <CardContent className="p-0 w-full">
          <div className="flex flex-col items-center justify-center gap-4 py-6">
            <div className="text-red-600 text-center">
              {error}
            </div>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors text-sm touch-manipulation"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportCustomerPairsDetail({ timeFilter, limit: 1000 });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="flex flex-col items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl w-full h-[600px]">
      <CardContent className="p-0 w-full flex flex-col h-full">
        <div className="flex items-center gap-2.5 w-full mb-4">
          <h2 className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-black text-base">
            Customer Similarity Insights
          </h2>
          <ExportButton 
            onExport={handleExport}
            loading={exporting}
            disabled={customers.length === 0}
            size="sm"
            label="Export Report"
          />
        </div>

        <div className="w-full flex-1 overflow-hidden">
          <div className="flex w-full h-full">
            <div className="flex flex-col w-full overflow-y-auto"
              style={{ maxHeight: 'calc(600px - 100px)' }}>
              {/* Header Row */}
              <div className="flex w-full bg-foundation-whitewhite-100 sticky top-0 z-10">
                <div className="flex-[2] min-w-0 h-[41px] flex items-center gap-2.5 p-2.5">
                  <span className="font-normal text-foundation-greygrey-400 text-sm">Customer</span>
                </div>
                <div className="flex-[2] min-w-0 h-[41px] flex items-center gap-2.5 p-2.5">
                  <span className="font-normal text-foundation-greygrey-400 text-sm">Top Shared Products</span>
                </div>
                <button
                  onClick={() => handleSort('similar_customers_count')}
                  className="flex-1 min-w-0 h-[41px] flex items-center justify-center gap-1 p-2.5 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer"
                >
                  <span className="font-normal text-foundation-greygrey-400 text-sm">Similar</span>
                  <SortIcon field="similar_customers_count" />
                </button>
                <button
                  onClick={() => handleSort('actual_recommendations')}
                  className="flex-1 min-w-0 h-[41px] flex items-center justify-center gap-1 p-2.5 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer"
                  title="Actual products available for recommendation"
                >
                  <span className="font-normal text-foundation-greygrey-400 text-sm">Recommendations</span>
                  <SortIcon field="actual_recommendations" />
                </button>
              </div>

              {/* Data Rows */}
              {sortedCustomers.map((customer, index) => {
                const recommendationCount = customer.actual_recommendations ?? customer.recommendations_generated;
                const isActual = customer.actual_recommendations !== undefined;
                
                return (
                  <div
                    key={customer.customer_id}
                    className={`flex w-full min-h-[70px] bg-foundation-whitewhite-50 ${
                      index < sortedCustomers.length - 1 ? "border-b-[0.5px] border-solid border-[#cacbce]" : ""
                    }`}
                  >
                    {/* Customer Column */}
                    <div className="flex-[2] min-w-0 flex items-center gap-2 px-2.5 py-4">
                      <div className="w-[30px] h-[30px] bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold text-xs">#{index + 1}</span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-medium text-foundation-greygrey-800 text-sm truncate">
                          {(() => {
                            const name = customer.customer_name || customer.customer_id;
                            if (name.includes('_')) {
                              const parts = name.split('_');
                              if (!isNaN(Number(parts[0]))) {
                                return parts.slice(1).join('_');
                              }
                            }
                            return name.substring(0, 15);
                          })()}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          ID: {customer.customer_id.substring(0, 10)}...
                        </span>
                      </div>
                    </div>

                    {/* Top Shared Products Column */}
                    <div className="flex-[2] min-w-0 flex items-center px-2.5 py-4">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        {customer.top_shared_products && customer.top_shared_products.length > 0 ? (
                          customer.top_shared_products.slice(0, 2).map((product, idx) => (
                            <div key={idx} className="flex items-center gap-1">
                              <span className="text-xs text-foundation-greygrey-600 truncate">
                                {product.product_name.substring(0, 20)}
                              </span>
                              <span className="text-xs text-foundation-blueblue-600 font-medium flex-shrink-0">
                                ({product.shared_count})
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No shared products</span>
                        )}
                      </div>
                    </div>

                    {/* Similar Customers Column */}
                    <div className="flex-1 min-w-0 flex items-center justify-center px-2.5 py-4">
                      <span className="font-normal text-foundation-blueblue-600 text-sm">
                        {formatLargeNumber(customer.similar_customers_count)}
                      </span>
                    </div>

                    {/* Recommendations Column */}
                    <div className="flex-1 min-w-0 flex items-center justify-center px-2.5 py-4">
                      <span className={`font-medium text-sm ${isActual ? 'text-green-600' : 'text-gray-600'}`}>
                        {formatLargeNumber(recommendationCount)}
                      </span>
                      {!isActual && <span className="text-xs text-gray-400 ml-1">*</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
