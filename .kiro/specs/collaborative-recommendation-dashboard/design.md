# Design Document: Collaborative Recommendation Dashboard

## Overview

The Collaborative Recommendation Dashboard is a new feature that extends the MasterGroup Recommendation Analytics Dashboard with a dedicated view for exploring collaborative filtering recommendations. This dashboard will be accessible through the existing sidebar navigation under "Growth Tools" and will maintain complete visual and architectural consistency with the existing dashboard implementation.

### Key Design Principles

1. **Architectural Consistency**: Reuse existing patterns, hooks, components, and API service structure
2. **Visual Harmony**: Match the existing dashboard's design system, color palette, typography, and spacing
3. **Data-Driven**: Display 100% live data from the recommendation engine with no mock fallbacks
4. **User Experience**: Provide intuitive navigation and clear data visualization
5. **Performance**: Implement efficient data fetching with loading states and error handling

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Wireframe (Main Layout)                  │  │
│  │  ┌─────────────────┐  ┌──────────────────────────┐  │  │
│  │  │  Sidebar Nav    │  │   Main Content Area      │  │  │
│  │  │  - Dashboard    │  │   - DashboardHeader      │  │  │
│  │  │  - Analytics    │  │   - TimeFilter           │  │  │
│  │  │  - Growth Tools │  │   - Active View Content  │  │  │
│  │  │    • Collab Rec │  │                          │  │  │
│  │  │    • Cross-Sell │  │   [Collaborative Rec     │  │  │
│  │  └─────────────────┘  │    Dashboard Sections]   │  │  │
│  │                        └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Service Layer                          │
│  - getCollaborativeMetrics()                                 │
│  - getCollaborativeRecommendations()                         │
│  - getCustomerSimilarityData()                               │
│  - getCollaborativeProductPairs()                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          Recommendation Engine Backend (Heroku)              │
│  /api/v1/recommendations/collaborative                       │
│  /api/v1/analytics/collaborative-metrics                     │
│  /api/v1/analytics/customer-similarity                       │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
Wireframe
├── RevenueTrendSection (Sidebar Navigation)
│   ├── Insights & Analysis
│   └── Growth Tools
│       └── Collaborative Rec. (NEW - navigates to collaborative view)
│
└── Main Content (when activeView === 'Collaborative Recommendation')
    ├── DashboardHeaderSection (existing, reused)
    ├── TimeFilter (existing, reused)
    └── CollaborativeRecommendationDashboard (NEW)
        ├── CollaborativeMetricsSection (NEW)
        │   ├── MetricCard: Total Collaborative Recommendations
        │   ├── MetricCard: Avg Similarity Score
        │   ├── MetricCard: Active Customer Pairs
        │   └── MetricCard: Algorithm Accuracy
        │
        ├── TopCollaborativeProductsSection (NEW)
        │   └── Table/List of top recommended products
        │
        ├── CustomerSimilaritySection (NEW)
        │   └── Visualization of customer similarity insights
        │
        └── CollaborativeProductPairsSection (NEW)
            └── Product pairs frequently recommended together
```

## Components and Interfaces

### 1. Navigation Integration

**File**: `src/screens/Wireframe/sections/RevenueTrendSection/RevenueTrendSection.tsx`

**Modification**: Update the "Collaborative Rec." button click handler to navigate to the collaborative recommendation view instead of showing "Coming Soon" alert.

```typescript
// Current behavior (to be modified):
if (item.label === "Collaborative Rec.") {
  alert(`${item.label} - Coming Soon!`);
}

// New behavior:
if (item.label === "Collaborative Rec.") {
  onNavigate("Collaborative Recommendation");
}
```

**Active State**: The button should highlight when `activeView === "Collaborative Recommendation"`.

### 2. Main Dashboard Component

**File**: `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CollaborativeRecommendationDashboard.tsx` (NEW)

**Purpose**: Main container component for the collaborative recommendation dashboard view.

**Props**:
```typescript
interface CollaborativeRecommendationDashboardProps {
  timeFilter: string;
}
```

**Structure**:
- Renders a grid layout similar to the main dashboard
- Contains 4 metric cards at the top
- Followed by 2-3 data visualization sections
- Uses existing Card components from `src/components/ui/card.tsx`

### 3. Metrics Section

**File**: `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CollaborativeMetricsSection.tsx` (NEW)

**Purpose**: Display key collaborative filtering metrics in card format.

**Metrics to Display**:
1. **Total Collaborative Recommendations**: Count of recommendations generated
2. **Average Similarity Score**: Mean similarity score across customer pairs
3. **Active Customer Pairs**: Number of customer pairs with similarity > threshold
4. **Algorithm Accuracy**: Percentage accuracy or confidence score

**Design Pattern**: Follow the same pattern as `PerformanceMetricsSection` with a 4-column grid of metric cards.

### 4. Top Collaborative Products Section

**File**: `src/screens/Wireframe/sections/CollaborativeRecommendationSection/TopCollaborativeProductsSection.tsx` (NEW)

**Purpose**: Display a table/list of top products recommended via collaborative filtering.

**Data Structure**:
```typescript
interface CollaborativeProduct {
  product_id: string;
  product_name: string;
  category: string;
  recommendation_count: number;
  avg_similarity_score: number;
  total_revenue: number;
}
```

**Design Pattern**: Follow the same table structure as `TopProductsSection` with sortable columns.

### 5. Customer Similarity Section

**File**: `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CustomerSimilaritySection.tsx` (NEW)

**Purpose**: Visualize customer similarity insights and patterns.

**Data Structure**:
```typescript
interface CustomerSimilarity {
  customer_id: string;
  similar_customers: number;
  avg_similarity_score: number;
  recommendations_generated: number;
}
```

**Visualization Options**:
- Table showing top customers with highest similarity scores
- Simple bar chart or list visualization
- Reuse existing styling patterns from other sections

### 6. Collaborative Product Pairs Section

**File**: `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CollaborativeProductPairsSection.tsx` (NEW)

**Purpose**: Show product pairs that are frequently recommended together via collaborative filtering.

**Data Structure**:
```typescript
interface CollaborativeProductPair {
  product_a_id: string;
  product_a_name: string;
  product_b_id: string;
  product_b_name: string;
  co_recommendation_count: number;
  similarity_score: number;
}
```

**Design Pattern**: Similar to the cross-selling section but focused on collaborative filtering patterns.

## Data Models

### API Response Types

```typescript
// Collaborative Metrics Response
export interface CollaborativeMetrics {
  total_recommendations: number;
  avg_similarity_score: number;
  active_customer_pairs: number;
  algorithm_accuracy: number;
  time_period: string;
}

// Collaborative Product Response
export interface CollaborativeProduct {
  product_id: string;
  product_name: string;
  category: string;
  price: number;
  recommendation_count: number;
  avg_similarity_score: number;
  total_revenue: number;
}

// Customer Similarity Response
export interface CustomerSimilarityData {
  customer_id: string;
  similar_customers_count: number;
  avg_similarity_score: number;
  recommendations_generated: number;
  top_similar_customers: Array<{
    customer_id: string;
    similarity_score: number;
  }>;
}

// Collaborative Product Pair Response
export interface CollaborativeProductPair {
  product_a_id: string;
  product_a_name: string;
  product_b_id: string;
  product_b_name: string;
  co_recommendation_count: number;
  similarity_score: number;
  combined_revenue: number;
}
```

### Custom Hook

**File**: `src/hooks/useCollaborativeMetrics.ts` (NEW)

**Purpose**: Fetch and manage collaborative filtering metrics with time filter support.

**Pattern**: Follow the exact same pattern as `useDashboardMetrics.ts`.

```typescript
export interface UseCollaborativeMetricsOptions {
  timeFilter?: TimeFilter;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useCollaborativeMetrics(options: UseCollaborativeMetricsOptions = {}) {
  // Similar implementation to useDashboardMetrics
  // Returns: { metrics, loading, error, refresh }
}
```

## API Service Extensions

**File**: `src/services/api.ts`

**New Functions to Add**:

```typescript
// Get Collaborative Filtering Metrics
export async function getCollaborativeMetrics(
  timeFilter: TimeFilter = 'all'
): Promise<CollaborativeMetrics> {
  const response = await fetch(
    `${API_BASE_URL}/analytics/collaborative-metrics?time_filter=${timeFilter}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch collaborative metrics');
  }
  
  return response.json();
}

// Get Top Collaborative Products
export async function getTopCollaborativeProducts(
  timeFilter: TimeFilter = 'all',
  limit: number = 10
): Promise<CollaborativeProduct[]> {
  const response = await fetch(
    `${API_BASE_URL}/analytics/collaborative-products?time_filter=${timeFilter}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch collaborative products');
  }
  
  const data = await response.json();
  return data.products || [];
}

// Get Customer Similarity Data
export async function getCustomerSimilarityData(
  timeFilter: TimeFilter = 'all',
  limit: number = 20
): Promise<CustomerSimilarityData[]> {
  const response = await fetch(
    `${API_BASE_URL}/analytics/customer-similarity?time_filter=${timeFilter}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch customer similarity data');
  }
  
  const data = await response.json();
  return data.customers || [];
}

// Get Collaborative Product Pairs
export async function getCollaborativeProductPairs(
  timeFilter: TimeFilter = 'all',
  limit: number = 10
): Promise<CollaborativeProductPair[]> {
  const response = await fetch(
    `${API_BASE_URL}/analytics/collaborative-pairs?time_filter=${timeFilter}&limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch collaborative product pairs');
  }
  
  const data = await response.json();
  return data.pairs || [];
}
```

## Routing and Navigation

### Current Routing Structure

The application uses a view-based navigation system within the `Wireframe` component rather than React Router routes. The `activeView` state determines which content to render.

### Integration Approach

**File**: `src/screens/Wireframe/Wireframe.tsx`

**Modification**: Add a new conditional render block for the collaborative recommendation view.

```typescript
{activeView === 'Collaborative Recommendation' && (
  <CollaborativeRecommendationDashboard timeFilter={timeFilter} />
)}
```

**Navigation Flow**:
1. User clicks "Collaborative Rec." in sidebar
2. `onNavigate('Collaborative Recommendation')` is called
3. `activeView` state updates to 'Collaborative Recommendation'
4. `Wireframe` component renders `CollaborativeRecommendationDashboard`
5. Time filter controls remain visible and functional

## Error Handling

### Error States

1. **API Failure**: Display error message with retry button
2. **No Data Available**: Show empty state with helpful message
3. **Authentication Error**: Redirect to login (handled by existing ProtectedRoute)
4. **Network Timeout**: Display timeout message with retry option

### Error Handling Pattern

Follow the existing pattern from `useDashboardMetrics`:

```typescript
try {
  // Fetch data
  const data = await getCollaborativeMetrics(timeFilter);
  setMetrics(data);
  setError(null);
} catch (err) {
  const errorMessage = err instanceof Error 
    ? err.message 
    : 'Failed to fetch collaborative metrics';
  setError(errorMessage);
  setMetrics(null); // NO MOCK FALLBACK
}
```

### Error UI Components

Reuse existing error display patterns:

```typescript
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-600 text-sm">{error}</p>
    <button 
      onClick={refresh}
      className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Retry
    </button>
  </div>
)}
```

## Testing Strategy

### Unit Testing

**Components to Test**:
1. `CollaborativeRecommendationDashboard` - renders all sections correctly
2. `CollaborativeMetricsSection` - displays metrics with proper formatting
3. `TopCollaborativeProductsSection` - renders product table correctly
4. `useCollaborativeMetrics` hook - handles loading, success, and error states

**Testing Approach**:
- Use React Testing Library for component tests
- Mock API calls using MSW (Mock Service Worker) or jest.mock
- Test loading states, error states, and successful data rendering
- Verify time filter integration

### Integration Testing

**Scenarios to Test**:
1. Navigation from sidebar to collaborative dashboard
2. Time filter changes trigger data refresh
3. Error handling and retry functionality
4. Authentication protection (redirect to login when unauthenticated)

### Manual Testing Checklist

- [ ] Navigation: Click "Collaborative Rec." in sidebar navigates correctly
- [ ] Active state: Sidebar button highlights when on collaborative view
- [ ] Data loading: Loading spinner displays while fetching data
- [ ] Metrics display: All 4 metric cards render with correct data
- [ ] Product table: Products display with sortable columns
- [ ] Time filter: Changing time filter updates all sections
- [ ] Error handling: API errors display error message with retry
- [ ] Responsive design: Dashboard adapts to mobile, tablet, desktop
- [ ] Authentication: Unauthenticated users redirect to login
- [ ] Theme consistency: Colors, fonts, spacing match main dashboard

## Design System Consistency

### Color Palette

Reuse existing color classes:
- Primary: `bg-foundation-blueblue-900`, `text-foundation-blueblue-900`
- Background: `bg-foundation-whitewhite-100`, `bg-foundation-whitewhite-50`
- Text: `text-grey-900`, `text-foundation-greygrey-400`, `text-foundation-greygrey-500`
- Success: `bg-green-100`, `text-green-700`, `bg-green-500`
- Error: `bg-red-50`, `text-red-600`, `border-red-200`

### Typography

- Headings: `font-semibold text-xl` or `text-2xl`
- Body text: `font-normal text-sm` or `text-base`
- Labels: `text-sm font-medium`
- Font family: `[font-family:'Poppins',Helvetica]`

### Spacing

- Section gaps: `gap-6` or `space-y-6`
- Card padding: `p-6`, `p-4`
- Button padding: `px-4 py-2`
- Grid gaps: `gap-4`

### Components

Reuse existing UI components:
- `Card`, `CardHeader`, `CardTitle`, `CardContent` from `src/components/ui/card.tsx`
- `Button` from `src/components/ui/button.tsx`
- `Badge` from `src/components/ui/badge.tsx`

### Layout Patterns

- Metric cards: 4-column grid (`grid grid-cols-4 gap-4`)
- Content sections: Full-width cards with rounded corners (`rounded-xl`)
- Tables: Striped rows with hover effects
- Responsive: Use Tailwind breakpoints (`md:`, `lg:`)

## Performance Considerations

### Data Fetching

1. **Initial Load**: Fetch data on component mount
2. **Auto-refresh**: Optional auto-refresh every 60 seconds (configurable)
3. **Time Filter Changes**: Debounce filter changes to avoid excessive API calls
4. **Caching**: Leverage browser cache and backend Redis cache

### Optimization Techniques

1. **Lazy Loading**: Consider lazy loading the collaborative dashboard component
2. **Memoization**: Use `React.memo` for child components that don't need frequent re-renders
3. **Efficient Re-renders**: Use `useMemo` and `useCallback` for expensive computations
4. **Loading States**: Show skeleton loaders for better perceived performance

### Bundle Size

- Reuse existing components and utilities (no new dependencies)
- Keep component files focused and modular
- Avoid importing large libraries for simple tasks

## Accessibility

### ARIA Labels

- Add `aria-label` to navigation buttons
- Use `aria-live` regions for dynamic content updates
- Provide `aria-describedby` for metric cards

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Maintain logical tab order
- Provide visible focus indicators

### Screen Reader Support

- Use semantic HTML elements (`<nav>`, `<main>`, `<section>`)
- Provide descriptive text for icons and images
- Announce loading and error states

## Security

### Authentication

- All API calls include authentication headers (existing pattern)
- Protected by `ProtectedRoute` component
- Token stored in localStorage (existing implementation)

### Data Validation

- Validate API responses before rendering
- Handle malformed data gracefully
- Sanitize user inputs (if any filters/search added in future)

## Future Enhancements

### Phase 2 Features (Out of Scope for Initial Implementation)

1. **Customer Detail View**: Click on a customer to see detailed similarity analysis
2. **Product Detail View**: Click on a product to see collaborative recommendation details
3. **Recommendation Explanations**: Show why products were recommended together
4. **Similarity Heatmap**: Visual heatmap of customer similarity matrix
5. **Export Functionality**: Export collaborative data to CSV/Excel
6. **Advanced Filters**: Filter by category, price range, similarity threshold
7. **Real-time Updates**: WebSocket integration for live recommendation updates
8. **A/B Testing Integration**: Compare collaborative vs. other algorithms

## Implementation Notes

### Development Workflow

1. Create new directory structure under `src/screens/Wireframe/sections/CollaborativeRecommendationSection/`
2. Implement API service functions first
3. Create custom hook for data fetching
4. Build individual section components
5. Compose main dashboard component
6. Integrate with navigation
7. Test thoroughly across devices and scenarios

### Code Organization

```
src/
├── services/
│   └── api.ts (extend with collaborative functions)
├── hooks/
│   └── useCollaborativeMetrics.ts (NEW)
├── screens/
│   └── Wireframe/
│       ├── Wireframe.tsx (add collaborative view case)
│       └── sections/
│           ├── RevenueTrendSection/
│           │   └── RevenueTrendSection.tsx (update navigation)
│           └── CollaborativeRecommendationSection/ (NEW)
│               ├── CollaborativeRecommendationDashboard.tsx
│               ├── CollaborativeMetricsSection.tsx
│               ├── TopCollaborativeProductsSection.tsx
│               ├── CustomerSimilaritySection.tsx
│               ├── CollaborativeProductPairsSection.tsx
│               └── index.ts
```

### Backend Requirements

The backend recommendation engine must provide the following endpoints:

1. `GET /api/v1/analytics/collaborative-metrics?time_filter={filter}`
2. `GET /api/v1/analytics/collaborative-products?time_filter={filter}&limit={limit}`
3. `GET /api/v1/analytics/customer-similarity?time_filter={filter}&limit={limit}`
4. `GET /api/v1/analytics/collaborative-pairs?time_filter={filter}&limit={limit}`

**Note**: If these endpoints don't exist yet, they need to be implemented in the backend before the dashboard can display real data.

## Conclusion

This design provides a comprehensive blueprint for implementing the Collaborative Recommendation Dashboard while maintaining complete consistency with the existing MasterGroup Recommendation Analytics Dashboard. The design leverages existing patterns, components, and architecture to ensure a seamless integration that feels like a natural extension of the current system.

The modular component structure allows for incremental development and testing, while the clear separation of concerns (API layer, hooks, components) ensures maintainability and scalability for future enhancements.
