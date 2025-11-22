import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { getCustomerSimilarityData, CustomerSimilarityData, TimeFilter } from "../../../../services/api";
import { formatLargeNumber, formatPercentage } from "../../../../utils/formatters";

interface CustomerSimilaritySectionProps {
  timeFilter?: TimeFilter;
}

type SortField = 'similar_customers_count' | 'avg_similarity_score' | 'recommendations_generated';
type SortDirection = 'asc' | 'desc';

export const CustomerSimilaritySection: React.FC<CustomerSimilaritySectionProps> = ({ 
  timeFilter = 'all' 
}) => {
  const [customers, setCustomers] = useState<CustomerSimilarityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('avg_similarity_score');
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
    const aValue = a[sortField];
    const bValue = b[sortField];
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
          <Badge className="h-auto px-2 py-1 bg-green-100 rounded-[5px]">
            <span className="[font-family:'Poppins',Helvetica] font-normal text-green-800 text-xs">
              🔴 Live Data
            </span>
          </Badge>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex min-w-[640px]">
            <div className="flex flex-col flex-1 min-w-[150px]">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Customer ID
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
                >
                  <div className="w-[35px] h-[35px] bg-purple-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-purple-600 font-bold text-xs">#{index + 1}</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-foundation-greygrey-800 text-sm truncate">
                      {customer.customer_id}
                    </span>
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

            <div className="flex flex-col w-[150px] flex-shrink-0">
              <button
                onClick={() => handleSort('avg_similarity_score')}
                className="h-[41px] flex items-center gap-1 p-2.5 w-full bg-foundation-whitewhite-100 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer touch-manipulation"
              >
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Avg Score
                </span>
                <SortIcon field="avg_similarity_score" />
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
                  <span className="font-normal text-foundation-greengreen-500 text-sm">
                    {formatPercentage(customer.avg_similarity_score, 1)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[180px] flex-shrink-0">
              <button
                onClick={() => handleSort('recommendations_generated')}
                className="h-[41px] flex items-center gap-1 p-2.5 w-full bg-foundation-whitewhite-100 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer touch-manipulation"
              >
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Recommendations
                </span>
                <SortIcon field="recommendations_generated" />
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
                  <span className="font-medium text-black text-sm">
                    {formatLargeNumber(customer.recommendations_generated)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
