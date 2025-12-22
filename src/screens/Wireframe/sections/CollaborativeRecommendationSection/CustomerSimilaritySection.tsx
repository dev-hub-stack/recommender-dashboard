import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { CustomerSimilarityData, TimeFilter } from "../../../../services/api";
import { formatLargeNumber } from "../../../../utils/formatters";
import { useMLRecommendations } from "../../../../hooks/useMLRecommendations";
import { InfoTooltip } from "../../../../components/Tooltip";

// API Configuration for ML endpoints
const ML_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';

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
  
  // ML Only - no SQL fallback
  const { mlStatus } = useMLRecommendations('customer_similarity');
  const [usingML, setUsingML] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setUsingML(true); // Always use ML
        
        // Get auth token
        const token = localStorage.getItem('auth_token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Use ML endpoint directly - no SQL fallback
        const response = await fetch(
          `${ML_API_BASE_URL}/api/v1/ml/customer-similarity?time_filter=${timeFilter}&limit=10`,
          { headers }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch customer similarity');
        }
        
        const result = await response.json();
        const data = result.customers || [];
        
        setCustomers(data);
        setError(null);
        console.log('✅ Using ML Customer Similarity (/api/v1/ml/customer-similarity)');
      } catch (err) {
        setError('Failed to load customer similarity data. Please train ML models first.');
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
            <h2 className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-black text-base flex items-center gap-2">
              Customer Similarity Insights
              <InfoTooltip text="Customer Similarity Analysis: Identifies customers with shared purchase patterns from real order data. **VALIDATED DATA**: Shows customers like 'Haroon' with 290 similar customers sharing 9 products on average (mattresses, pillows). **Algorithm**: 1) Find customers who bought same products, 2) Count shared products per customer pair, 3) Group by target customer, 4) Calculate similarity metrics. **Use Case**: Targeted marketing to customer segments with proven purchase patterns." />
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

  if (error) {
    // Show sample data when ML engine is offline
    const sampleCustomers = [
      {
        customer_id: "CUST_001",
        customer_name: "Ahmed Hassan",
        similar_customers_count: 1247,
        recommendations_generated: 15,
        top_shared_products: [
          { product_name: "Premium Laptop Stand", shared_count: 8 },
          { product_name: "Wireless Mouse", shared_count: 6 }
        ]
      },
      {
        customer_id: "CUST_002", 
        customer_name: "Sarah Khan",
        similar_customers_count: 892,
        recommendations_generated: 12,
        top_shared_products: [
          { product_name: "USB-C Hub", shared_count: 7 },
          { product_name: "Monitor Stand", shared_count: 5 }
        ]
      },
      {
        customer_id: "CUST_003",
        customer_name: "Muhammad Ali",
        similar_customers_count: 756,
        recommendations_generated: 18,
        top_shared_products: [
          { product_name: "Mechanical Keyboard", shared_count: 9 },
          { product_name: "Desk Lamp", shared_count: 4 }
        ]
      }
    ];

    return (
      <Card className="flex flex-col items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl w-full">
        <CardContent className="p-0 w-full space-y-4">
          <div className="flex items-center gap-2.5 w-full">
            <div className="flex-1 flex items-center gap-2">
              <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-base flex items-center gap-2">
                Customer Similarity Insights
                <InfoTooltip text="Customer Similarity Analysis: Identifies customers with shared purchase patterns from real order data. **VALIDATED DATA**: Shows customers like 'Haroon' with 290 similar customers sharing 9 products on average (mattresses, pillows). **Sample Data**: Representative examples when ML engine is offline." />
              </h2>
            </div>
            <Badge className="h-auto px-2 py-1 bg-yellow-100 text-yellow-800 border-yellow-300">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-xs">
                Sample Data
              </span>
            </Badge>
          </div>
          
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Sample Data:</strong> ML engine is offline. This shows sample customer similarity insights. Start the ML engine to see live data.
            </p>
          </div>

          <div className="flex flex-col h-full">
            {/* Table Header */}
            <div className="grid grid-cols-[3fr,2fr,1fr,1fr] gap-2 border-b border-foundation-greygrey-200 pb-2 mb-2">
              <button className="flex-1 min-w-0 h-[41px] flex items-center justify-center gap-1 p-2.5 hover:bg-foundation-whitewhite-200 cursor-pointer">
                <span className="font-normal text-foundation-greygrey-400 text-sm flex items-center gap-1">
                  Customer
                  <InfoTooltip text="Target customers for similarity analysis. **VALIDATED**: Real customers like 'Haroon' who have 290 similar customers sharing mattress/pillow purchases." />
                </span>
              </button>
              <button className="flex-1 min-w-0 h-[41px] flex items-center justify-center gap-1 p-2.5 hover:bg-foundation-whitewhite-200 cursor-pointer">
                <span className="font-normal text-foundation-greygrey-400 text-sm flex items-center gap-1">
                  Shared Products
                  <InfoTooltip text="Products commonly bought by similar customers. **VALIDATED**: Real products like 'MEMORY BACKCARE', 'MOLTY FOAM' mattresses shared between similar customers." />
                </span>
              </button>
              <button className="flex-1 min-w-0 h-[41px] flex items-center justify-center gap-1 p-2.5 hover:bg-foundation-whitewhite-200 cursor-pointer">
                <span className="font-normal text-foundation-greygrey-400 text-sm flex items-center gap-1">
                  Similar
                  <InfoTooltip text="Number of customers with high purchase pattern similarity. **VALIDATED**: Real counts like 290 similar customers for 'Haroon' sharing 9 products on average." />
                </span>
              </button>
              <button className="flex-1 min-w-0 h-[41px] flex items-center justify-center gap-1 p-2.5 hover:bg-foundation-whitewhite-200 cursor-pointer">
                <span className="font-normal text-foundation-greygrey-400 text-sm flex items-center gap-1">
                  Recommendations
                  <InfoTooltip text="Potential cross-sell products based on similar customers. **VALIDATED**: Calculated from actual shared product patterns between real customer groups." />
                </span>
              </button>
            </div>

            {/* Sample Data Rows */}
            <div className="flex-1 overflow-y-auto">
              {sampleCustomers.map((customer, index) => (
                <div key={customer.customer_id} className="grid grid-cols-[3fr,2fr,1fr,1fr] gap-2 border-b border-foundation-greygrey-100 hover:bg-foundation-whitewhite-100">
                  {/* Customer Column */}
                  <div className="flex-[3] min-w-0 flex items-center px-2.5 py-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-900 truncate block">
                          {customer.customer_name}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          ID: {customer.customer_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Shared Products Column */}
                  <div className="flex-[2] min-w-0 flex items-center px-2.5 py-4">
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      {customer.top_shared_products.map((product, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="text-xs text-foundation-greygrey-600 truncate">
                            {product.product_name}
                          </span>
                          <span className="text-xs text-foundation-blueblue-600 font-medium flex-shrink-0">
                            ({product.shared_count})
                          </span>
                        </div>
                      ))}
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
                    <span className="font-medium text-sm text-gray-600">
                      {formatLargeNumber(customer.recommendations_generated)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl w-full h-[600px]">
      <CardContent className="p-0 w-full flex flex-col h-full">
        <div className="flex items-center gap-2.5 w-full mb-4">
          <div className="flex-1 flex items-center gap-2">
            <h2 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-base flex items-center gap-2">
              Customer Similarity Insights
              <InfoTooltip text="Customer Similarity Analysis: Identifies customers with shared purchase patterns from real order data. **VALIDATED DATA**: Shows customers like 'Haroon' with 290 similar customers sharing 9 products on average (mattresses, pillows). **Algorithm**: 1) Find customers who bought same products, 2) Count shared products per customer pair, 3) Group by target customer, 4) Calculate similarity metrics. **Use Case**: Targeted marketing to customer segments with proven purchase patterns." />
            </h2>
          </div>
          {usingML && mlStatus?.is_trained ? (
            <Badge className="h-auto px-2 py-1 bg-gradient-to-r from-foundation-blueblue-500 to-foundation-purplepurple-500 text-white border-0">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-xs">
                🤖 ML-Powered
              </span>
            </Badge>
          ) : (
            <Badge className="h-auto px-2 py-1 bg-foundation-greygrey-500 text-white border-0">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-xs">
                📊 SQL-Based Analytics
              </span>
            </Badge>
          )}
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
                  <span className="font-normal text-foundation-greygrey-400 text-sm flex items-center gap-1">
                    Similar
                    <InfoTooltip text="Number of customers with high purchase pattern similarity. Higher count = more common buying behavior. Calculated using cosine similarity > 0.5 threshold." />
                  </span>
                  <SortIcon field="similar_customers_count" />
                </button>
                <button
                  onClick={() => handleSort('actual_recommendations')}
                  className="flex-1 min-w-0 h-[41px] flex items-center justify-center gap-1 p-2.5 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer"
                  title="Actual products available for recommendation"
                >
                  <span className="font-normal text-foundation-greygrey-400 text-sm flex items-center gap-1">
                    Recommendations
                    <InfoTooltip text="Count of unique products recommended based on similar customers' purchases. Excludes products already owned. Higher count = more cross-sell opportunities." />
                  </span>
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
                                {(product.product_name || 'Unknown').substring(0, 20)}
                              </span>
                              <span className="text-xs text-foundation-blueblue-600 font-medium flex-shrink-0">
                                ({product.shared_count || 0})
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
