import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { getCustomerSimilarityData, CustomerSimilarityData, TimeFilter } from "../../../../services/api";
import { formatLargeNumber, formatPercentage } from "../../../../utils/formatters";

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
  const [sortField, setSortField] = useState<SortField>('similar_customers_count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getCustomerSimilarityData(timeFilter, 20);
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
      const data = await getCustomerSimilarityData(timeFilter, 20);
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

  return (
    <Card className="flex flex-col items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl w-full">
      <CardContent className="p-0 w-full space-y-4">
        <div className="flex items-center gap-2.5 w-full">
          <h2 className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-black text-base">
            Customer Similarity Insights
          </h2>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex min-w-[640px]">
            <div className="flex flex-col flex-1 min-w-[200px]">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Customer
                </span>
              </div>

              {sortedCustomers.map((customer, index) => (
                <div
                  key={customer.customer_id}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 w-full bg-foundation-whitewhite-50 ${
                    index < sortedCustomers.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                  title={`${customer.customer_name || customer.customer_id}\nID: ${customer.customer_id}`}
                >
                  <div className="w-[35px] h-[35px] bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-xs">#{index + 1}</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-foundation-greygrey-800 text-sm truncate">
                      {(() => {
                        const name = customer.customer_name || customer.customer_id;
                        // If format is "number_name", extract just the name part
                        if (name.includes('_')) {
                          const parts = name.split('_');
                          // Check if first part is a number
                          if (!isNaN(Number(parts[0]))) {
                            return parts.slice(1).join('_');
                          }
                        }
                        return name.substring(0, 20);
                      })()}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      ID: {customer.customer_id.substring(0, 12)}...
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col flex-1 min-w-[250px]">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Top Shared Products
                </span>
              </div>

              {sortedCustomers.map((customer, index) => (
                <div
                  key={`${customer.customer_id}-products`}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 bg-foundation-whitewhite-50 ${
                    index < sortedCustomers.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    {customer.top_shared_products && customer.top_shared_products.length > 0 ? (
                      customer.top_shared_products.slice(0, 2).map((product, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-xs text-foundation-greygrey-600 truncate">
                            {product.product_name}
                          </span>
                          <span className="text-xs text-foundation-blueblue-600 font-medium">
                            ({product.shared_count})
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">No shared products</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[160px] flex-shrink-0">
              <button
                onClick={() => handleSort('similar_customers_count')}
                className="h-[41px] flex items-center gap-1 p-2.5 w-full bg-foundation-whitewhite-100 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer touch-manipulation"
              >
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Similar Customers
                </span>
                <SortIcon field="similar_customers_count" />
              </button>

              {sortedCustomers.map((customer, index) => (
                <div
                  key={customer.customer_id}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 bg-foundation-whitewhite-50 ${
                    index < sortedCustomers.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <span className="font-normal text-foundation-blueblue-600 text-sm">
                    {formatLargeNumber(customer.similar_customers_count)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[180px] flex-shrink-0">
              <button
                onClick={() => handleSort('actual_recommendations')}
                className="h-[41px] flex items-center gap-1 p-2.5 w-full bg-foundation-whitewhite-100 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer touch-manipulation"
                title="Actual products available for recommendation (from database)"
              >
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Available Recommendations
                </span>
                <SortIcon field="actual_recommendations" />
              </button>

              {sortedCustomers.map((customer, index) => {
                // Use actual_recommendations if available, fallback to recommendations_generated
                const recommendationCount = customer.actual_recommendations ?? customer.recommendations_generated;
                const isActual = customer.actual_recommendations !== undefined;
                
                return (
                  <div
                    key={customer.customer_id}
                    className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 bg-foundation-whitewhite-50 ${
                      index < sortedCustomers.length - 1
                        ? "border-b-[0.5px] border-solid border-[#cacbce]"
                        : ""
                    }`}
                    title={isActual ? "Real count from database" : "Estimated (products × 2)"}
                  >
                    <span className={`font-medium text-sm ${isActual ? 'text-green-600' : 'text-gray-600'}`}>
                      {formatLargeNumber(recommendationCount)}
                    </span>
                    {!isActual && (
                      <span className="text-xs text-gray-400">*</span>
                    )}
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
