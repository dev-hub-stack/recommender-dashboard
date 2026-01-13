/**
 * Screen Filter Configuration
 * 
 * Centralized configuration for filter visibility across different dashboard screens.
 * This makes it easy to maintain and extend filter behavior for new screens.
 */

export interface ScreenFiltersConfig {
  timeFilter: boolean;
  categories: boolean;
  orderSource: boolean;
  deliveredOnly: boolean;
}

export const SCREEN_FILTER_CONFIG: Record<string, ScreenFiltersConfig> = {
  'Dashboard': {
    timeFilter: true,
    categories: true,
    orderSource: true,
    deliveredOnly: true
  },
  'Customer Profiling': {
    timeFilter: true,
    categories: true,
    orderSource: true,
    deliveredOnly: true
  },
  'Collaborative Filtering': { // Product Insights
    timeFilter: true,
    categories: true,
    orderSource: true,
    deliveredOnly: false // Product relationships don't care about delivery status
  },
  'Cross-Selling': { // Revenue Optimization
    timeFilter: true,
    categories: true,
    orderSource: true,
    deliveredOnly: true
  },
  'Geographic Intelligence': {
    timeFilter: true,
    categories: true,
    orderSource: true,
    deliveredOnly: true
  },
  'RFM Segmentation': {
    timeFilter: true,
    categories: false, // RFM is customer-centric, not product-centric
    orderSource: true,
    deliveredOnly: false // RFM scores include all order behavior
  },
  'ML Recommendations': {
    timeFilter: false, // ML uses all historical data
    categories: true,
    orderSource: false, // ML is agnostic to order source
    deliveredOnly: false
  }
};

/**
 * Helper function to get filter visibility for a screen
 */
export const getFilterVisibility = (screenName: string): ScreenFiltersConfig => {
  return SCREEN_FILTER_CONFIG[screenName] || {
    timeFilter: true,
    categories: true,
    orderSource: true,
    deliveredOnly: true
  };
};

/**
 * Helper to check if a specific filter should be shown
 */
export const shouldShowFilter = (
  screenName: string,
  filterName: keyof ScreenFiltersConfig
): boolean => {
  const config = getFilterVisibility(screenName);
  return config[filterName];
};

/**
 * Export section name mapping for API calls
 */
export const SCREEN_TO_SECTION_MAP: Record<string, string> = {
  'Dashboard': 'dashboard',
  'Customer Profiling': 'customer_profiling',
  'Collaborative Filtering': 'collaborative_filtering',
  'Cross-Selling': 'cross_selling',
  'Geographic Intelligence': 'geographic_intelligence',
  'RFM Segmentation': 'rfm_segmentation',
  'ML Recommendations': 'ml_recommendations'
};

/**
 * User-friendly screen names for export labels
 */
export const SCREEN_EXPORT_LABELS: Record<string, string> = {
  'Dashboard': 'Dashboard',
  'Customer Profiling': 'Customer Profiling',
  'Collaborative Filtering': 'Product Insights',
  'Cross-Selling': 'Revenue Optimization',
  'Geographic Intelligence': 'Geographic Intelligence',
  'RFM Segmentation': 'RFM Segmentation',
  'ML Recommendations': 'ML Recommendations'
};

/**
 * Get export label for a screen
 */
export const getExportLabel = (screenName: string): string => {
  return SCREEN_EXPORT_LABELS[screenName] || screenName;
};

/**
 * Get section slug for API calls
 */
export const getSectionSlug = (screenName: string): string => {
  return SCREEN_TO_SECTION_MAP[screenName] || screenName.toLowerCase().replace(/\s+/g, '_');
};
