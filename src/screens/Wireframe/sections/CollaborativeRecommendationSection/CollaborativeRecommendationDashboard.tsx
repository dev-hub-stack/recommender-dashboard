import React from 'react';
import { CollaborativeMetricsSection } from './CollaborativeMetricsSection';
import { TopCollaborativeProductsSection } from './TopCollaborativeProductsSection';
import { CustomerSimilaritySection } from './CustomerSimilaritySection';
import { CollaborativeProductPairsSection } from './CollaborativeProductPairsSection';

interface CollaborativeRecommendationDashboardProps {
  timeFilter: string;
  category?: string;
}

export const CollaborativeRecommendationDashboard: React.FC<CollaborativeRecommendationDashboardProps> = ({
  timeFilter,
  category
}) => {
  return (
    <div className="w-full space-y-6">
      {/* Collaborative Metrics Section - Top */}
      <CollaborativeMetricsSection timeFilter={timeFilter} />

      {/* Top Collaborative Products Section */}
      <TopCollaborativeProductsSection timeFilter={timeFilter as any} category={category} />

      {/* Customer Similarity and Product Pairs in Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerSimilaritySection timeFilter={timeFilter as any} category={category} />
        <CollaborativeProductPairsSection timeFilter={timeFilter as any} category={category} />
      </div>
    </div>
  );
};
