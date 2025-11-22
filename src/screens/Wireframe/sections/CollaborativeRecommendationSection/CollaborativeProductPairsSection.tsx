import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../../components/ui/card';
import { getCollaborativeProductPairs, CollaborativeProductPair, TimeFilter } from '../../../../services/api';
import { formatCurrency, formatLargeNumber } from '../../../../utils/formatters';

interface CollaborativeProductPairsSectionProps {
  timeFilter?: TimeFilter;
}

export const CollaborativeProductPairsSection: React.FC<CollaborativeProductPairsSectionProps> = ({ 
  timeFilter = 'all' 
}) => {
  const [pairs, setPairs] = useState<CollaborativeProductPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductPairs();
  }, [timeFilter]);

  const fetchProductPairs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCollaborativeProductPairs(timeFilter, 10);
      setPairs(data);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to fetch collaborative product pairs';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-foundation-whitewhite-50 border-0 shadow-none rounded-xl">
        <CardContent className="p-5">
          <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal] mb-4">
            Collaborative Product Pairs
          </h3>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-foundation-greygrey-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-foundation-whitewhite-50 border-0 shadow-none rounded-xl">
        <CardContent className="p-5">
          <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal] mb-4">
            Collaborative Product Pairs
          </h3>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-red-600 text-sm [font-family:'Poppins',Helvetica]">{error}</p>
            <button 
              onClick={fetchProductPairs}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 text-sm [font-family:'Poppins',Helvetica] touch-manipulation"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-foundation-whitewhite-50 border-0 shadow-none rounded-xl">
      <CardContent className="p-5">
        <h3 className="[font-family:'Poppins',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal] mb-4">
          Collaborative Product Pairs
        </h3>
        <p className="text-foundation-greygrey-600 text-sm [font-family:'Poppins',Helvetica] mb-4">
          Products frequently recommended together based on collaborative filtering patterns
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-foundation-greygrey-200">
                <th className="text-left py-2 md:py-3 px-2 text-foundation-greygrey-600 [font-family:'Poppins',Helvetica] font-medium text-xs md:text-sm">
                  Product A
                </th>
                <th className="text-left py-2 md:py-3 px-2 text-foundation-greygrey-600 [font-family:'Poppins',Helvetica] font-medium text-xs md:text-sm">
                  Product B
                </th>
                <th className="text-center py-2 md:py-3 px-2 text-foundation-greygrey-600 [font-family:'Poppins',Helvetica] font-medium text-xs md:text-sm">
                  Co-Recommendations
                </th>
                <th className="text-center py-2 md:py-3 px-2 text-foundation-greygrey-600 [font-family:'Poppins',Helvetica] font-medium text-xs md:text-sm">
                  Similarity Score
                </th>
                <th className="text-right py-2 md:py-3 px-2 text-foundation-greygrey-600 [font-family:'Poppins',Helvetica] font-medium text-xs md:text-sm">
                  Combined Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((pair, index) => (
                <tr 
                  key={index}
                  className="border-b border-foundation-greygrey-100 hover:bg-foundation-greygrey-50 active:bg-foundation-greygrey-100 transition-colors"
                >
                  <td className="py-2 md:py-3 px-2">
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm font-medium text-foundation-greygrey-800 [font-family:'Poppins',Helvetica] truncate max-w-[120px] md:max-w-none">
                        {pair.product_a_name}
                      </span>
                      <span className="text-[10px] md:text-xs text-foundation-greygrey-500 [font-family:'Poppins',Helvetica] truncate">
                        ID: {pair.product_a_id}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 md:py-3 px-2">
                    <div className="flex flex-col">
                      <span className="text-xs md:text-sm font-medium text-foundation-blueblue-600 [font-family:'Poppins',Helvetica] truncate max-w-[120px] md:max-w-none">
                        {pair.product_b_name}
                      </span>
                      <span className="text-[10px] md:text-xs text-foundation-greygrey-500 [font-family:'Poppins',Helvetica] truncate">
                        ID: {pair.product_b_id}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 md:py-3 px-2 text-center">
                    <span className="inline-flex items-center justify-center px-2 md:px-3 py-0.5 md:py-1 bg-foundation-blueblue-50 rounded-full text-xs md:text-sm font-medium text-foundation-blueblue-600 [font-family:'Poppins',Helvetica]">
                      {formatLargeNumber(pair.co_recommendation_count)}
                    </span>
                  </td>
                  <td className="py-2 md:py-3 px-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs md:text-sm font-semibold text-foundation-greygrey-800 [font-family:'Poppins',Helvetica]">
                        {(pair.similarity_score * 100).toFixed(1)}%
                      </span>
                      <div className="w-12 md:w-16 bg-foundation-greygrey-100 rounded-full h-1 md:h-1.5 mt-1">
                        <div 
                          className="bg-foundation-greengreen-500 h-1 md:h-1.5 rounded-full" 
                          style={{ width: `${Math.min(pair.similarity_score * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 md:py-3 px-2 text-right">
                    <span className="text-xs md:text-sm font-semibold text-foundation-greengreen-500 [font-family:'Poppins',Helvetica]">
                      {formatCurrency(pair.combined_revenue)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pairs.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-foundation-greygrey-600 text-sm [font-family:'Poppins',Helvetica]">
              No collaborative product pairs found for the selected time period.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
