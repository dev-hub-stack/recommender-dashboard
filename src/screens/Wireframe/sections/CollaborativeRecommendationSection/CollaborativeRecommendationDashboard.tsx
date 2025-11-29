import React, { useState } from 'react';
import { CollaborativeMetricsSection } from './CollaborativeMetricsSection';
import { TopCollaborativeProductsSection } from './TopCollaborativeProductsSection';
import { CustomerSimilaritySection } from './CustomerSimilaritySection';
import { CollaborativeProductPairsSection } from './CollaborativeProductPairsSection';
import { ExportButton } from '../../../../components/ExportButton';
import { 
  exportProductPairsDetail, 
  exportCustomerPairsDetail, 
  exportProductsDetail,
  exportRecommendationsDetail,
  exportAllCollaborativeReports
} from '../../../../services/exportApi';

interface CollaborativeRecommendationDashboardProps {
  timeFilter: string;
}

export const CollaborativeRecommendationDashboard: React.FC<CollaborativeRecommendationDashboardProps> = ({ 
  timeFilter 
}) => {
  const [exporting, setExporting] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);

  const handleExportAll = async () => {
    try {
      setExportingAll(true);
      await exportAllCollaborativeReports({ timeFilter, limit: 1000 });
      // Show success toast
      alert('All reports exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportingAll(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header with Export All Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collaborative Filtering Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-powered product recommendations based on customer behavior</p>
        </div>
        <ExportButton 
          onExport={handleExportAll}
          loading={exportingAll}
          label="Export All Reports"
          variant="primary"
        />
      </div>

      {/* Collaborative Metrics Section - Top */}
      <CollaborativeMetricsSection timeFilter={timeFilter} />

      {/* Top Collaborative Products Section */}
      <TopCollaborativeProductsSection timeFilter={timeFilter as any} />

      {/* Customer Similarity and Product Pairs in Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CustomerSimilaritySection timeFilter={timeFilter as any} />
        <CollaborativeProductPairsSection timeFilter={timeFilter as any} />
      </div>
    </div>
  );
};
