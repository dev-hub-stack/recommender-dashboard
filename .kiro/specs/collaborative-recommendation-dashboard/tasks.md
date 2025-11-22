# Implementation Plan

- [x] 1. Extend API service with collaborative filtering endpoints
  - Add TypeScript interfaces for collaborative data types (CollaborativeMetrics, CollaborativeProduct, CustomerSimilarityData, CollaborativeProductPair) to `src/services/api.ts`
  - Implement `getCollaborativeMetrics()` function to fetch collaborative filtering metrics with time filter support
  - Implement `getTopCollaborativeProducts()` function to fetch top recommended products via collaborative filtering
  - Implement `getCustomerSimilarityData()` function to fetch customer similarity insights
  - Implement `getCollaborativeProductPairs()` function to fetch product pairs recommended together
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 2. Create custom hook for collaborative metrics
  - Create `src/hooks/useCollaborativeMetrics.ts` following the pattern of `useDashboardMetrics.ts`
  - Implement state management for metrics, loading, error, and lastUpdated
  - Implement `fetchMetrics()` function that calls `getCollaborativeMetrics()` API
  - Add time filter support and auto-refresh functionality
  - Handle error states without mock data fallback
  - Export hook with metrics, loading, error, and refresh function
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Build collaborative metrics section component
  - Create `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CollaborativeMetricsSection.tsx`
  - Use `useCollaborativeMetrics` hook to fetch data
  - Create 4-column grid layout using existing Card components
  - Display metric cards for: Total Collaborative Recommendations, Average Similarity Score, Active Customer Pairs, Algorithm Accuracy
  - Apply consistent styling matching PerformanceMetricsSection
  - Implement loading skeleton states
  - Implement error display with retry button
  - _Requirements: 3.3, 4.1, 4.2, 4.3_

- [x] 4. Build top collaborative products section component
  - Create `src/screens/Wireframe/sections/CollaborativeRecommendationSection/TopCollaborativeProductsSection.tsx`
  - Fetch data using `getTopCollaborativeProducts()` API function
  - Create table/list component displaying product_id, product_name, category, recommendation_count, avg_similarity_score, total_revenue
  - Implement sortable columns (default sort by recommendation_count descending)
  - Display at least 10 products per view
  - Format numerical values using existing formatters (formatPKR for revenue)
  - Apply consistent table styling matching TopProductsSection
  - Implement loading and error states
  - _Requirements: 3.4, 6.1, 6.2, 6.3, 6.5_

- [x] 5. Build customer similarity section component
  - Create `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CustomerSimilaritySection.tsx`
  - Fetch data using `getCustomerSimilarityData()` API function
  - Create table/list displaying customer_id, similar_customers_count, avg_similarity_score, recommendations_generated
  - Display top 20 customers with highest similarity scores
  - Apply Card component wrapper with consistent styling
  - Format similarity scores as percentages or decimals consistently
  - Implement loading and error states
  - _Requirements: 3.5_

- [x] 6. Build collaborative product pairs section component
  - Create `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CollaborativeProductPairsSection.tsx`
  - Fetch data using `getCollaborativeProductPairs()` API function
  - Create table displaying product_a_name, product_b_name, co_recommendation_count, similarity_score, combined_revenue
  - Display at least 10 product pairs
  - Format revenue using formatPKR utility
  - Apply consistent styling matching cross-selling section patterns
  - Implement loading and error states
  - _Requirements: 3.4_

- [x] 7. Create main collaborative recommendation dashboard component
  - Create `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CollaborativeRecommendationDashboard.tsx`
  - Accept `timeFilter` prop from parent Wireframe component
  - Compose layout with CollaborativeMetricsSection at top
  - Add TopCollaborativeProductsSection below metrics
  - Add CustomerSimilaritySection and CollaborativeProductPairsSection in grid layout
  - Apply consistent spacing and gap patterns (space-y-6, gap-4)
  - Ensure responsive layout using Tailwind breakpoints
  - Pass timeFilter prop to all child sections
  - _Requirements: 3.1, 3.2, 3.3, 7.1, 7.3_

- [x] 8. Create index file for collaborative recommendation section
  - Create `src/screens/Wireframe/sections/CollaborativeRecommendationSection/index.ts`
  - Export CollaborativeRecommendationDashboard as default export
  - Export individual section components as named exports
  - _Requirements: 3.2_

- [x] 9. Update sidebar navigation to enable collaborative recommendation
  - Modify `src/screens/Wireframe/sections/RevenueTrendSection/RevenueTrendSection.tsx`
  - Update "Collaborative Rec." button click handler to call `onNavigate("Collaborative Recommendation")` instead of showing alert
  - Add active state highlighting when `activeView === "Collaborative Recommendation"`
  - Apply active styling (bg-foundation-blueblue-900, text-white) when collaborative view is active
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 10. Integrate collaborative dashboard into main Wireframe component
  - Modify `src/screens/Wireframe/Wireframe.tsx`
  - Import CollaborativeRecommendationDashboard component
  - Add conditional render block: `{activeView === 'Collaborative Recommendation' && <CollaborativeRecommendationDashboard timeFilter={timeFilter} />}`
  - Ensure DashboardHeaderSection and TimeFilter remain visible when on collaborative view
  - Verify navigation state management works correctly
  - _Requirements: 1.3, 3.1, 3.2, 4.1_

- [x] 11. Implement responsive design for mobile and tablet
  - Update CollaborativeRecommendationDashboard to use responsive grid classes
  - Change metric cards from 4-column to stacked layout on mobile (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
  - Ensure tables are horizontally scrollable on small screens
  - Test navigation menu adapts to mobile format (verify existing responsive behavior)
  - Verify text remains readable across viewport sizes (320px to 1920px)
  - Test touch interactions on buttons and interactive elements
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Implement authentication protection
  - Verify CollaborativeRecommendationDashboard is rendered within ProtectedRoute wrapper (inherited from Wireframe)
  - Verify API calls include authentication headers using existing `getAuthHeaders()` function
  - Test unauthenticated access redirects to login page
  - Test session expiration handling redirects to login
  - Verify authenticated user info displays in DashboardHeaderSection
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 13. Add loading states and error handling
  - Implement loading spinners or skeleton loaders in all section components
  - Add error message display with retry buttons in each section
  - Ensure error messages are user-friendly and actionable
  - Verify no mock data fallback is used (display error instead)
  - Test network timeout scenarios
  - Update "Engine Online" indicator based on API health check
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 14. Apply consistent theme and styling
  - Verify all components use existing color palette (foundation-blueblue-900, foundation-whitewhite-100, etc.)
  - Ensure typography matches existing dashboard (Poppins font, consistent sizes)
  - Apply consistent spacing patterns (gap-6, p-6, p-4)
  - Reuse existing Card, Button, and Badge components
  - Verify rounded corners (rounded-xl) on all cards
  - Test visual consistency by comparing side-by-side with main dashboard
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 15. Implement time filter integration
  - Verify timeFilter prop is passed from Wireframe to CollaborativeRecommendationDashboard
  - Ensure all API calls include time_filter parameter
  - Test that changing time filter in dropdown triggers data refresh in all sections
  - Verify loading states display during filter changes
  - Test all time filter options (today, 7days, 30days, all)
  - _Requirements: 4.1, 4.3_

- [ ]* 16. Write unit tests for collaborative components
  - Write tests for useCollaborativeMetrics hook (loading, success, error states)
  - Write tests for CollaborativeMetricsSection component rendering
  - Write tests for TopCollaborativeProductsSection component rendering
  - Write tests for API service functions (mock fetch calls)
  - Test time filter integration
  - Test error handling and retry functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 17. Perform integration testing
  - Test complete navigation flow from sidebar to collaborative dashboard
  - Test time filter changes update all sections correctly
  - Test authentication protection (redirect scenarios)
  - Test error recovery (retry after API failure)
  - Test responsive behavior across devices (desktop, tablet, mobile)
  - Verify data consistency across all sections
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 5.1, 7.1_

- [ ]* 18. Add accessibility features
  - Add aria-label attributes to navigation buttons
  - Add aria-live regions for dynamic content updates
  - Add aria-describedby for metric cards
  - Verify keyboard navigation works for all interactive elements
  - Test with screen reader to ensure proper announcements
  - Add visible focus indicators for keyboard navigation
  - _Requirements: 7.4_
