// Collaborative Filtering Dashboard - Export Functions
// Handles CSV exports for all collaborative filtering sections

import { exportToCSV, generateFilename, formatCurrencyForCSV, formatPercentageForCSV, formatNumberForCSV } from './csvExport';
import type { CollaborativeMetrics, CollaborativeProduct, CustomerSimilarityData, CollaborativeProductPair } from '../services/api';

/**
 * Export Collaborative Metrics
 */
export function exportCollaborativeMetrics(
  metrics: CollaborativeMetrics | null,
  timeFilter: string
): void {
  if (!metrics) {
    throw new Error('No metrics data available to export');
  }

  const data = [
    {
      'Metric Name': 'Total Collaborative Recommendations',
      'Value': formatNumberForCSV(metrics.total_recommendations),
      'Unit': 'count',
      'Description': 'Total number of recommendations generated via collaborative filtering'
    },
    {
      'Metric Name': 'Average Similarity Score',
      'Value': formatPercentageForCSV(metrics.avg_similarity_score, 2),
      'Unit': '%',
      'Description': 'Average customer similarity score across all pairs'
    },
    {
      'Metric Name': 'Active Customer Pairs',
      'Value': formatNumberForCSV(metrics.active_customer_pairs),
      'Unit': 'count',
      'Description': 'Number of customer pairs with calculated similarities'
    },
    {
      'Metric Name': 'Algorithm Accuracy',
      'Value': formatPercentageForCSV(metrics.algorithm_accuracy, 2),
      'Unit': '%',
      'Description': 'Recommendation algorithm accuracy rate'
    }
  ];

  const filename = generateFilename('collaborative_metrics', timeFilter);

  exportToCSV({
    filename,
    data,
    headers: ['Metric Name', 'Value', 'Unit', 'Description'],
    timeFilter,
    reportType: 'Collaborative Filtering Metrics'
  });
}

/**
 * Export Top Collaborative Products
 */
export function exportTopCollaborativeProducts(
  products: CollaborativeProduct[],
  timeFilter: string
): void {
  if (!products || products.length === 0) {
    throw new Error('No products data available to export');
  }

  const data = products.map((product, index) => ({
    'Rank': index + 1,
    'Product ID': product.product_id,
    'Product Name': product.product_name,
    'Category': product.category,
    'Price (PKR)': formatCurrencyForCSV(product.price),
    'Recommendation Count': formatNumberForCSV(product.recommendation_count),
    'Avg Similarity Score': formatPercentageForCSV(product.avg_similarity_score * 100, 2),
    'Total Revenue (PKR)': formatCurrencyForCSV(product.total_revenue)
  }));

  const filename = generateFilename('collaborative_products', timeFilter);

  exportToCSV({
    filename,
    data,
    headers: [
      'Rank',
      'Product ID',
      'Product Name',
      'Category',
      'Price (PKR)',
      'Recommendation Count',
      'Avg Similarity Score',
      'Total Revenue (PKR)'
    ],
    timeFilter,
    reportType: 'Top Collaborative Products'
  });
}

/**
 * Export Customer Similarity Data
 */
export function exportCustomerSimilarity(
  customers: CustomerSimilarityData[],
  timeFilter: string
): void {
  if (!customers || customers.length === 0) {
    throw new Error('No customer similarity data available to export');
  }

  const data = customers.map((customer, index) => {
    // Extract customer name from ID if needed
    let displayName = customer.customer_name || customer.customer_id;
    if (displayName.includes('_')) {
      const parts = displayName.split('_');
      if (!isNaN(Number(parts[0]))) {
        displayName = parts.slice(1).join('_');
      }
    }

    // Get top shared products
    const topProduct1 = customer.top_shared_products?.[0];
    const topProduct2 = customer.top_shared_products?.[1];

    return {
      'Rank': index + 1,
      'Customer ID': customer.customer_id,
      'Customer Name': displayName,
      'Similar Customers Count': formatNumberForCSV(customer.similar_customers_count),
      'Recommendations Available': formatNumberForCSV(
        customer.actual_recommendations ?? customer.recommendations_generated
      ),
      'Top Shared Product 1': topProduct1?.product_name || 'N/A',
      'Shared Count 1': topProduct1 ? formatNumberForCSV(topProduct1.shared_count) : '0',
      'Top Shared Product 2': topProduct2?.product_name || 'N/A',
      'Shared Count 2': topProduct2 ? formatNumberForCSV(topProduct2.shared_count) : '0'
    };
  });

  const filename = generateFilename('customer_similarity', timeFilter);

  exportToCSV({
    filename,
    data,
    headers: [
      'Rank',
      'Customer ID',
      'Customer Name',
      'Similar Customers Count',
      'Recommendations Available',
      'Top Shared Product 1',
      'Shared Count 1',
      'Top Shared Product 2',
      'Shared Count 2'
    ],
    timeFilter,
    reportType: 'Customer Similarity Insights'
  });
}

/**
 * Export Collaborative Product Pairs
 */
export function exportCollaborativeProductPairs(
  pairs: CollaborativeProductPair[],
  timeFilter: string
): void {
  if (!pairs || pairs.length === 0) {
    throw new Error('No product pairs data available to export');
  }

  const data = pairs.map((pair, index) => ({
    'Rank': index + 1,
    'Product A ID': pair.product_a_id,
    'Product A Name': pair.product_a_name,
    'Product B ID': pair.product_b_id,
    'Product B Name': pair.product_b_name,
    'Co-Recommendation Count': formatNumberForCSV(pair.co_recommendation_count),
    'Combined Revenue (PKR)': formatCurrencyForCSV(pair.combined_revenue),
    'Confidence Score': formatPercentageForCSV(
      (pair.co_recommendation_count / Math.max(...pairs.map(p => p.co_recommendation_count))) * 100,
      2
    )
  }));

  const filename = generateFilename('product_pairs', timeFilter);

  exportToCSV({
    filename,
    data,
    headers: [
      'Rank',
      'Product A ID',
      'Product A Name',
      'Product B ID',
      'Product B Name',
      'Co-Recommendation Count',
      'Combined Revenue (PKR)',
      'Confidence Score'
    ],
    timeFilter,
    reportType: 'Collaborative Product Pairs'
  });
}

/**
 * Export All Collaborative Data (Batch Export)
 */
export async function exportAllCollaborativeData(
  metrics: CollaborativeMetrics | null,
  products: CollaborativeProduct[],
  customers: CustomerSimilarityData[],
  pairs: CollaborativeProductPair[],
  timeFilter: string
): Promise<void> {
  try {
    // Export each section with a small delay to avoid overwhelming the browser
    if (metrics) {
      exportCollaborativeMetrics(metrics, timeFilter);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (products.length > 0) {
      exportTopCollaborativeProducts(products, timeFilter);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (customers.length > 0) {
      exportCustomerSimilarity(customers, timeFilter);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (pairs.length > 0) {
      exportCollaborativeProductPairs(pairs, timeFilter);
    }
  } catch (error) {
    console.error('Error during batch export:', error);
    throw error;
  }
}
