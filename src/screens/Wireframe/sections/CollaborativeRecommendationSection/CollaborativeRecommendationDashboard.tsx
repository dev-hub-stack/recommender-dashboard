import React, { useState } from 'react';
import { CollaborativeMetricsSection } from './CollaborativeMetricsSection';
import { TopCollaborativeProductsSection } from './TopCollaborativeProductsSection';
import { CustomerSimilaritySection } from './CustomerSimilaritySection';
import { CollaborativeProductPairsSection } from './CollaborativeProductPairsSection';
import { ExportButton } from '../../../../components/ExportButton';
import { getCollaborativeMetrics, getTopCollaborativeProducts, getCustomerSimilarityData, getCollaborativeProductPairs } from '../../../../services/api';

interface CollaborativeRecommendationDashboardProps {
  timeFilter: string;
}

export const CollaborativeRecommendationDashboard: React.FC<CollaborativeRecommendationDashboardProps> = ({ 
  timeFilter 
}) => {
  const [exportingAll, setExportingAll] = useState(false);

  const handleExportAll = async () => {
    try {
      setExportingAll(true);
      
      // Fetch all data fresh for export
      const [metricsData, products, customers, pairs] = await Promise.all([
        getCollaborativeMetrics(timeFilter as any),
        getTopCollaborativeProducts(timeFilter as any, 10),
        getCustomerSimilarityData(timeFilter as any, 10),
        getCollaborativeProductPairs(timeFilter as any, 10)
      ]);

      // Generate CSV content
      let csvContent = '';
      
      // Header
      csvContent += 'COLLABORATIVE FILTERING DASHBOARD REPORT\n';
      csvContent += `Export Date,${new Date().toLocaleString()}\n`;
      csvContent += `Time Period,${timeFilter}\n`;
      csvContent += '\n';
      
      // Section 1: Dashboard Metrics
      csvContent += 'DASHBOARD METRICS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Collaborative Recommendations,${metricsData.total_recommendations}\n`;
      csvContent += `Average Similarity Score,${(metricsData.avg_similarity_score * 100).toFixed(1)}%\n`;
      csvContent += `Active Customer Pairs,${metricsData.active_customer_pairs}\n`;
      csvContent += `Algorithm Accuracy,${(metricsData.algorithm_accuracy * 100).toFixed(1)}%\n`;
      csvContent += '\n\n';
      
      // Section 2: Top Collaborative Products
      csvContent += 'TOP COLLABORATIVE PRODUCTS\n';
      csvContent += 'Rank,Product ID,Product Name,Recommendations,Revenue (PKR)\n';
      products.forEach((product, index) => {
        const name = product.product_name.replace(/,/g, ' ');
        csvContent += `${index + 1},${product.product_id},${name},${product.recommendation_count},${product.total_revenue.toFixed(2)}\n`;
      });
      csvContent += '\n\n';
      
      // Section 3: Customer Similarity Insights
      csvContent += 'CUSTOMER SIMILARITY INSIGHTS\n';
      csvContent += 'Rank,Customer ID,Customer Name,Similar Customers,Recommendations,Top Shared Products\n';
      customers.forEach((customer, index) => {
        const name = (customer.customer_name || 'Unknown').replace(/,/g, ' ');
        const sharedProducts = customer.top_shared_products
          ?.map((p: any) => `${p.product_name} (${p.shared_count})`)
          .join('; ')
          .replace(/,/g, ' ') || 'None';
        csvContent += `${index + 1},${customer.customer_id},${name},${customer.similar_customers_count},${customer.actual_recommendations || 0},${sharedProducts}\n`;
      });
      csvContent += '\n\n';
      
      // Section 4: Collaborative Product Pairs
      csvContent += 'COLLABORATIVE PRODUCT PAIRS\n';
      csvContent += 'Rank,Product A,Product B,Co-Recommendations,Combined Revenue (PKR)\n';
      pairs.forEach((pair, index) => {
        const productA = pair.product_a_name.replace(/,/g, ' ');
        const productB = pair.product_b_name.replace(/,/g, ' ');
        csvContent += `${index + 1},${productA},${productB},${pair.co_recommendation_count},${pair.combined_revenue.toFixed(2)}\n`;
      });
      
      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `collaborative_dashboard_${timeFilter}_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
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
          label="Export Report"
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
