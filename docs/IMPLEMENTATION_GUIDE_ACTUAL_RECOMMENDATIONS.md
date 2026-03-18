# Implementation Guide: Replace Arbitrary ×2 with Actual Recommendation Counts

## Overview
This guide shows how to replace the arbitrary `unique_products × 2` calculation with actual recommendation counts from the database.

---

## Changes Required

### 1. Backend Changes (recommender-engine/src/main.py)

**Location:** Find the `/api/v1/analytics/customer-similarity` endpoint (around line 2503)

**Current Implementation:**
```python
@app.get("/api/v1/analytics/customer-similarity")
async def get_customer_similarity(
    time_filter: str = Query("all", description="Time filter: today, 7days, 30days, all"),
    limit: int = Query(20, description="Number of customers to return"),
    current_user: dict = Depends(get_current_user)
):
    # Current query uses: cs.unique_products * 2 as recommendations_generated
    query = """
        SELECT 
            cs.customer_id,
            cs.customer_name,
            cs.similar_customers_count,
            LEAST(cs.unique_products / 20.0, 1.0) as avg_similarity_score,
            cs.unique_products * 2 as recommendations_generated  -- ❌ ARBITRARY
        FROM customer_similarities cs
        ORDER BY cs.similar_customers_count DESC
        LIMIT %s
    """
```

**New Implementation:**
```python
@app.get("/api/v1/analytics/customer-similarity")
async def get_customer_similarity(
    time_filter: str = Query("all", description="Time filter: today, 7days, 30days, all"),
    limit: int = Query(20, description="Number of customers to return"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get customer similarity insights with ACTUAL recommendation counts.
    
    Returns:
    - customer_id: Customer identifier
    - customer_name: Customer name
    - similar_customers_count: Number of similar customers
    - actual_recommendations: Real count of products that can be recommended
    - top_shared_products: Top 3 products creating similarity
    """
    
    # Build time filter
    time_filter_clause = build_time_filter(time_filter)
    
    # NEW QUERY: Calculate actual recommendation opportunities
    query = f"""
        WITH customer_purchases AS (
            -- Get all products each customer has bought
            SELECT 
                o.customer_id,
                COALESCE(o.customer_name, o.customer_id) as customer_name,
                ARRAY_AGG(DISTINCT oi.product_id) as purchased_products
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            {time_filter_clause}
            GROUP BY o.customer_id, o.customer_name
        ),
        similar_customers AS (
            -- Find similar customers (who bought same products)
            SELECT DISTINCT
                cp1.customer_id,
                cp2.customer_id as similar_customer_id
            FROM customer_purchases cp1
            JOIN customer_purchases cp2 
                ON cp1.customer_id != cp2.customer_id
                AND cp1.purchased_products && cp2.purchased_products  -- Array overlap
        ),
        recommendable_products AS (
            -- Count products that similar customers bought that this customer hasn't
            SELECT 
                sc.customer_id,
                COUNT(DISTINCT oi.product_id) as actual_recommendations
            FROM similar_customers sc
            JOIN orders o ON sc.similar_customer_id = o.customer_id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN customer_purchases cp ON sc.customer_id = cp.customer_id
            WHERE NOT (oi.product_id = ANY(cp.purchased_products))  -- Exclude owned products
            GROUP BY sc.customer_id
        ),
        top_shared_products AS (
            -- Get top 3 shared products per customer
            SELECT 
                cp1.customer_id,
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'product_name', p.product_name,
                        'shared_count', shared_count
                    ) ORDER BY shared_count DESC
                ) FILTER (WHERE rn <= 3) as top_products
            FROM customer_purchases cp1
            CROSS JOIN LATERAL (
                SELECT 
                    oi.product_id,
                    p.product_name,
                    COUNT(DISTINCT o.customer_id) as shared_count,
                    ROW_NUMBER() OVER (ORDER BY COUNT(DISTINCT o.customer_id) DESC) as rn
                FROM UNNEST(cp1.purchased_products) as product_id
                JOIN order_items oi ON oi.product_id = product_id
                JOIN orders o ON oi.order_id = o.id AND o.customer_id != cp1.customer_id
                JOIN products p ON oi.product_id = p.product_id
                GROUP BY oi.product_id, p.product_name
            ) shared
            WHERE rn <= 3
            GROUP BY cp1.customer_id
        )
        SELECT 
            cp.customer_id,
            cp.customer_name,
            COUNT(DISTINCT sc.similar_customer_id) as similar_customers_count,
            COALESCE(rp.actual_recommendations, 0) as actual_recommendations,
            COALESCE(tsp.top_products, '[]'::json) as top_shared_products
        FROM customer_purchases cp
        LEFT JOIN similar_customers sc ON cp.customer_id = sc.customer_id
        LEFT JOIN recommendable_products rp ON cp.customer_id = rp.customer_id
        LEFT JOIN top_shared_products tsp ON cp.customer_id = tsp.customer_id
        GROUP BY 
            cp.customer_id, 
            cp.customer_name, 
            rp.actual_recommendations,
            tsp.top_products
        HAVING COUNT(DISTINCT sc.similar_customer_id) > 0
        ORDER BY similar_customers_count DESC, actual_recommendations DESC
        LIMIT %s
    """
    
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(query, (limit,))
                rows = cur.fetchall()
                
                customers = []
                for row in rows:
                    customers.append({
                        "customer_id": row[0],
                        "customer_name": row[1],
                        "similar_customers_count": row[2],
                        "actual_recommendations": row[3],  # ✅ REAL COUNT
                        "top_shared_products": row[4] if row[4] else []
                    })
                
                return {
                    "success": True,
                    "customers": customers,
                    "time_period": get_time_period_label(time_filter)
                }
    
    except Exception as e:
        logger.error(f"Error fetching customer similarity: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


def build_time_filter(time_filter: str) -> str:
    """Build SQL WHERE clause for time filtering"""
    if time_filter == "today":
        return "WHERE o.order_date >= CURRENT_DATE"
    elif time_filter == "7days":
        return "WHERE o.order_date >= CURRENT_DATE - INTERVAL '7 days'"
    elif time_filter == "30days":
        return "WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'"
    else:  # all
        return ""


def get_time_period_label(time_filter: str) -> str:
    """Get human-readable time period label"""
    labels = {
        "today": "Today",
        "7days": "Last 7 Days",
        "30days": "Last 30 Days",
        "all": "All Time"
    }
    return labels.get(time_filter, "All Time")
```

---

### 2. Frontend TypeScript Interface Update

**File:** `src/services/api.ts`

**Current Interface:**
```typescript
export interface CustomerSimilarityData {
  customer_id: string;
  customer_name: string;
  similar_customers_count: number;
  avg_similarity_score: number;  // ❌ Remove this
  recommendations_generated: number;  // ❌ Rename this
  top_shared_products?: Array<{
    product_name: string;
    shared_count: number;
  }>;
}
```

**New Interface:**
```typescript
export interface CustomerSimilarityData {
  customer_id: string;
  customer_name: string;
  similar_customers_count: number;
  actual_recommendations: number;  // ✅ Real count from DB
  top_shared_products: Array<{
    product_name: string;
    shared_count: number;
  }>;
}
```

---

### 3. Frontend Component Update

**File:** `src/screens/Wireframe/sections/CollaborativeRecommendationSection/CustomerSimilaritySection.tsx`

**Find and update the table columns:**

```typescript
// Current column headers
<th>Avg Score</th>  // ❌ Remove this column
<th>Recommendations</th>  // ✅ Keep but update data source

// Update to:
<th>Similar Customers</th>
<th>Available Recommendations</th>  // ✅ Clearer name
<th>Top Shared Products</th>  // ✅ Add this column
```

**Update the table row rendering:**

```typescript
{customerData.map((customer) => (
  <tr key={customer.customer_id}>
    <td>{customer.customer_name}</td>
    <td>{customer.similar_customers_count}</td>
    
    {/* ✅ Show actual recommendations instead of arbitrary ×2 */}
    <td className="font-semibold text-green-600">
      {customer.actual_recommendations}
    </td>
    
    {/* ✅ Show top shared products */}
    <td>
      {customer.top_shared_products?.slice(0, 2).map((product, idx) => (
        <div key={idx} className="text-sm">
          {product.product_name} ({product.shared_count})
        </div>
      ))}
    </td>
  </tr>
))}
```

---

## Benefits of This Implementation

### ✅ Accuracy
- Shows **real** recommendation opportunities from database
- No arbitrary multipliers or estimates

### ✅ Context
- Shows **why** customers are similar (top shared products)
- Helps understand the recommendation basis

### ✅ Actionable
- Business users can see actual opportunities
- Can prioritize customers with high recommendation counts

### ✅ Performance
- Uses efficient PostgreSQL array operations
- CTEs make the query readable and maintainable

---

## Example Output

**Before (Arbitrary ×2):**
```
Customer: Adil
Similar Customers: 107
Avg Score: 0.4%
Recommendations: 8  ← (4 products × 2 = arbitrary)
```

**After (Actual Count):**
```
Customer: Adil
Similar Customers: 107
Available Recommendations: 23  ← (Real count from DB)
Top Shared Products: 
  - MASTER FOAM (45 customers)
  - GOLD PILLOW (32 customers)
```

---

## Testing

After implementing, test with:

```bash
# Test the API endpoint
curl -X GET "http://localhost:8001/api/v1/analytics/customer-similarity?limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response:
{
  "success": true,
  "customers": [
    {
      "customer_id": "03130662347...",
      "customer_name": "Adil",
      "similar_customers_count": 107,
      "actual_recommendations": 23,  // ✅ Real count
      "top_shared_products": [
        {"product_name": "MASTER FOAM", "shared_count": 45},
        {"product_name": "GOLD PILLOW", "shared_count": 32}
      ]
    }
  ],
  "time_period": "All Time"
}
```

---

## Migration Notes

1. **Backward Compatibility:** The API response structure changes, so frontend must be updated together
2. **Performance:** The new query is more complex but uses efficient PostgreSQL features
3. **Database:** Requires PostgreSQL 9.4+ for array operations (`&&` operator)
4. **Caching:** Consider caching results since this query is more expensive

---

## Next Steps

1. ✅ Update backend endpoint in `recommender-engine/src/main.py`
2. ✅ Update TypeScript interface in `src/services/api.ts`
3. ✅ Update React component in `CustomerSimilaritySection.tsx`
4. ✅ Test the endpoint
5. ✅ Deploy changes

Would you like me to help implement any specific part?
