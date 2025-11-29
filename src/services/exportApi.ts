// Export API Service
// Handles CSV export API calls to backend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://master-group-recommender-9e2a306b76af.herokuapp.com/api/v1';

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// Helper function to trigger file download
function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export interface ExportOptions {
  timeFilter?: string;
  limit?: number;
  minCoP urchases?: number;
  minSimilarity?: number;
  sortBy?: string;
}

/**
 * Export Product Pairs Detail Report
 */
export async function exportProductPairsDetail(options: ExportOptions = {}): Promise<void> {
  const {
    timeFilter = 'all',
    limit = 1000,
    minCoPurchases = 2
  } = options;

  const params = new URLSearchParams({
    time_filter: timeFilter,
    limit: limit.toString(),
    min_co_purchases: minCoPurchases.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/export/collaborative/product-pairs-detail?${params}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `product_pairs_detail_${timeFilter}_${Date.now()}.csv`;

  downloadFile(blob, filename);
}

/**
 * Export Customer Pairs Detail Report
 */
export async function exportCustomerPairsDetail(options: ExportOptions = {}): Promise<void> {
  const {
    timeFilter = 'all',
    limit = 1000,
    minSimilarity = 0.0
  } = options;

  const params = new URLSearchParams({
    time_filter: timeFilter,
    limit: limit.toString(),
    min_similarity: minSimilarity.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/export/collaborative/customer-pairs-detail?${params}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `customer_pairs_detail_${timeFilter}_${Date.now()}.csv`;

  downloadFile(blob, filename);
}

/**
 * Export Products Detail Report
 */
export async function exportProductsDetail(options: ExportOptions = {}): Promise<void> {
  const {
    timeFilter = 'all',
    limit = 1000,
    sortBy = 'recommendations'
  } = options;

  const params = new URLSearchParams({
    time_filter: timeFilter,
    limit: limit.toString(),
    sort_by: sortBy
  });

  const response = await fetch(
    `${API_BASE_URL}/export/collaborative/products-detail?${params}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `products_detail_${timeFilter}_${Date.now()}.csv`;

  downloadFile(blob, filename);
}

/**
 * Export Recommendations Detail Report
 */
export async function exportRecommendationsDetail(options: ExportOptions = {}): Promise<void> {
  const {
    timeFilter = 'all',
    limit = 1000
  } = options;

  const params = new URLSearchParams({
    time_filter: timeFilter,
    limit: limit.toString()
  });

  const response = await fetch(
    `${API_BASE_URL}/export/collaborative/recommendations-detail?${params}`,
    {
      method: 'GET',
      headers: getAuthHeaders()
    }
  );

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')
    ?.split('filename=')[1]
    ?.replace(/"/g, '') || `recommendations_detail_${timeFilter}_${Date.now()}.csv`;

  downloadFile(blob, filename);
}

/**
 * Export All Collaborative Reports (Batch)
 */
export async function exportAllCollaborativeReports(options: ExportOptions = {}): Promise<void> {
  // Export all reports with a delay between each
  await exportProductPairsDetail(options);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await exportCustomerPairsDetail(options);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await exportProductsDetail(options);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await exportRecommendationsDetail(options);
}
