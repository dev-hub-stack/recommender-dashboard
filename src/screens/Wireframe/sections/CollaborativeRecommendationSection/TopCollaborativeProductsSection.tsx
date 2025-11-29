import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Badge } from "../../../../components/ui/badge";
import { Card, CardContent } from "../../../../components/ui/card";
import { CollaborativeProduct, TimeFilter } from "../../../../services/api";
import { formatLargeNumber } from "../../../../utils/formatters";
import { useMLRecommendations } from "../../../../hooks/useMLRecommendations";

// API Configuration for ML endpoints
const ML_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '''';

interface TopCollaborativeProductsSectionProps {
  timeFilter?: TimeFilter;
}

type SortField = 'recommendation_count' | 'avg_similarity_score' | 'total_revenue';
type SortDirection = 'asc' | 'desc';

export const TopCollaborativeProductsSection: React.FC<TopCollaborativeProductsSectionProps> = ({ 
  timeFilter = 'all' 
}) => {
  const [products, setProducts] = useState<CollaborativeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('recommendation_count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // ML Integration
  const { mlStatus } = useMLRecommendations('collaborative_products');
  const [usingML, setUsingML] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setUsingML(true); // Always use ML
        
        // Use ML endpoint directly - no SQL fallback
        const mlResponse = await fetch(
          `${ML_API_BASE_URL}/api/v1/ml/collaborative-products?time_filter=${timeFilter}&limit=10&use_ml=true`
        );
        
        if (!mlResponse.ok) {
          throw new Error('Failed to fetch ML collaborative products');
        }
        
        const mlData = await mlResponse.json();
        const data = mlData.products || [];
        console.log('✅ Using ML Collaborative Products (/api/v1/ml/collaborative-products)');
        
        setProducts(data);
        setError(null);
      } catch (err) {
        setError('Failed to load collaborative products. Please train ML models first.');
        console.error('Error fetching collaborative products:', err);
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

  const sortedProducts = [...products].sort((a, b) => {
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
              Top Collaborative Products
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
      
      // Use ML endpoint directly
      const mlResponse = await fetch(
        `${ML_API_BASE_URL}/api/v1/ml/collaborative-products?time_filter=${timeFilter}&limit=10&use_ml=true`
      );
      
      if (!mlResponse.ok) {
        throw new Error('Failed to fetch ML collaborative products');
      }
      
      const mlData = await mlResponse.json();
      setProducts(mlData.products || []);
    } catch (err) {
      setError('Failed to load collaborative products. Please train ML models first.');
      console.error('Error fetching collaborative products:', err);
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
            Top Collaborative Products
          </h2>
          {usingML && mlStatus?.is_trained ? (
            <Badge className="h-auto px-2 py-1 bg-gradient-to-r from-foundation-blueblue-500 to-foundation-purplepurple-500 text-white border-0">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-xs">
                🤖 ML-Powered
              </span>
            </Badge>
          ) : (
            <Badge className="h-auto px-2 py-1 bg-green-100 rounded-[5px]">
              <span className="[font-family:'Poppins',Helvetica] font-normal text-green-800 text-xs">
                🔴 Live Data
              </span>
            </Badge>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <div className="flex min-w-[640px]">
            <div className="flex flex-col flex-1 min-w-[200px]">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Product
                </span>
              </div>

              {sortedProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 w-full bg-foundation-whitewhite-50 ${
                    index < sortedProducts.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <div className="w-[35px] h-[35px] bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-xs">#{index + 1}</span>
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-medium text-foundation-greygrey-800 text-sm truncate">
                      {product.product_name}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      ID: {product.product_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[120px] flex-shrink-0">
              <div className="h-[41px] flex items-center gap-2.5 p-2.5 w-full bg-foundation-whitewhite-100">
                <span className="font-normal text-foundation-greygrey-400 text-sm truncate">
                  Category
                </span>
              </div>

              {sortedProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 bg-foundation-whitewhite-50 ${
                    index < sortedProducts.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <span className="font-medium text-black text-sm truncate">
                    {product.category}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[140px] flex-shrink-0">
              <button
                onClick={() => handleSort('recommendation_count')}
                className="h-[41px] flex items-center gap-1 p-2.5 w-full bg-foundation-whitewhite-100 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer touch-manipulation"
              >
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Recommendations
                </span>
                <SortIcon field="recommendation_count" />
              </button>

              {sortedProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 bg-foundation-whitewhite-50 ${
                    index < sortedProducts.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <span className="font-normal text-foundation-greengreen-500 text-sm">
                    {formatLargeNumber(product.recommendation_count)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[130px] flex-shrink-0">
              <button
                onClick={() => handleSort('avg_similarity_score')}
                className="h-[41px] flex items-center gap-1 p-2.5 w-full bg-foundation-whitewhite-100 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer touch-manipulation"
              >
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Avg Score
                </span>
                <SortIcon field="avg_similarity_score" />
              </button>

              {sortedProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 bg-foundation-whitewhite-50 ${
                    index < sortedProducts.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <span className="font-normal text-blue-600 text-sm">
                    {(product.avg_similarity_score || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col w-[130px] flex-shrink-0">
              <button
                onClick={() => handleSort('total_revenue')}
                className="h-[41px] flex items-center gap-1 p-2.5 w-full bg-foundation-whitewhite-100 hover:bg-foundation-whitewhite-200 active:bg-foundation-whitewhite-300 cursor-pointer touch-manipulation"
              >
                <span className="font-normal text-foundation-greygrey-400 text-sm">
                  Revenue
                </span>
                <SortIcon field="total_revenue" />
              </button>

              {sortedProducts.map((product, index) => (
                <div
                  key={product.product_id}
                  className={`min-h-[70px] flex items-center gap-2 px-2.5 py-4 bg-foundation-whitewhite-50 ${
                    index < sortedProducts.length - 1
                      ? "border-b-[0.5px] border-solid border-[#cacbce]"
                      : ""
                  }`}
                >
                  <span className="font-medium text-black text-sm">
                    Rs {formatLargeNumber(product.total_revenue)}
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
