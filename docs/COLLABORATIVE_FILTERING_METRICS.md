# Collaborative Filtering Metrics - Detailed Calculation Guide

## Overview
This document explains how each collaborative filtering metric is calculated, the business logic behind them, and the data sources used. These metrics provide actionable business insights for cross-selling, customer segmentation, and product recommendations.

---

## 1. High-Value Product Pairs

### Business Definition
Product combinations with >5,000 PKR average order value. These pairs drive premium revenue and should be prioritized for bundle promotions.

### Technical Calculation

#### Step 1: Identify Product Co-purchases
```sql
-- Find all products purchased together in the same order
SELECT 
    oi1.product_id as product_a,
    oi2.product_id as product_b,
    o.order_id,
    (oi1.quantity * oi1.unit_price) + (oi2.quantity * oi2.unit_price) as pair_value
FROM order_items oi1
JOIN order_items oi2 ON oi1.order_id = oi2.order_id
JOIN orders o ON oi1.order_id = o.order_id
WHERE oi1.product_id < oi2.product_id  -- Avoid duplicate pairs
AND o.order_date >= CURRENT_DATE - INTERVAL '90 days';
```

#### Step 2: Calculate Average Order Value per Pair
```sql
-- Calculate average value for each product pair
SELECT 
    product_a,
    product_b,
    AVG(pair_value) as avg_order_value,
    COUNT(*) as purchase_frequency
FROM product_co_purchases
GROUP BY product_a, product_b
HAVING AVG(pair_value) > 5000;  -- Filter for high-value pairs
ORDER BY avg_order_value DESC;
```

#### Step 3: Count High-Value Pairs
```python
# Final count returned to dashboard
high_value_pairs_count = len(results)  # Where results are pairs > 5,000 PKR
```

### Data Sources
- **Primary**: `order_items` table (product-level purchase data)
- **Secondary**: `orders` table (order dates and context)
- **Time Range**: Last 90 days (configurable)

### Business Insights
- **Bundle Opportunities**: Products frequently bought together at premium prices
- **Cross-Sell Priority**: Which pairs to promote for maximum revenue
- **Inventory Planning**: Stock high-value complementary products together

---

## 2. Cross-Region Opportunities

### Business Definition
Products popular in multiple regions. These have expansion potential and should be stocked in new markets.

### Technical Calculation

#### Step 1: Calculate Regional Product Popularity
```sql
-- Calculate product popularity by region
SELECT 
    p.product_id,
    p.product_name,
    c.city_province as region,
    COUNT(DISTINCT o.customer_id) as regional_customers,
    SUM(oi.quantity) as regional_quantity,
    AVG(oi.unit_price) as avg_regional_price
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '180 days'
GROUP BY p.product_id, p.product_name, c.city_province
HAVING COUNT(DISTINCT o.customer_id) >= 10;  -- Minimum regional traction
```

#### Step 2: Identify Multi-Region Products
```sql
-- Find products popular in multiple regions
WITH regional_popularity AS (
    -- (Query from Step 1)
)
SELECT 
    product_id,
    product_name,
    COUNT(DISTINCT region) as region_count,
    SUM(regional_customers) as total_customers,
    STRING_AGG(region, ', ') as regions
FROM regional_popularity
GROUP BY product_id, product_name
HAVING COUNT(DISTINCT region) >= 3  -- Popular in 3+ regions
AND SUM(regional_customers) >= 50   -- Minimum total customer base
ORDER BY region_count DESC, total_customers DESC;
```

#### Step 3: Calculate Expansion Score
```python
# Expansion opportunity scoring
def calculate_expansion_score(region_count, total_customers, avg_price):
    # Higher score for products in many regions with many customers
    region_score = min(region_count / 10, 1.0)  # Normalize to 0-1
    customer_score = min(total_customers / 1000, 1.0)  # Normalize to 0-1
    price_score = min(avg_price / 10000, 1.0)  # Normalize to 0-1
    
    return (region_score * 0.4 + customer_score * 0.4 + price_score * 0.2) * 100

cross_region_opportunities = len(results)  # Count of multi-region products
```

### Data Sources
- **Primary**: `order_items`, `products`, `orders`, `customers` tables
- **Geographic Data**: `customers.city_province` field
- **Time Range**: Last 180 days (6 months for regional patterns)

### Business Insights
- **Market Expansion**: Which products have proven cross-regional appeal
- **New Market Entry**: Products likely to succeed in new regions
- **Regional Strategy**: Tailor marketing by regional product preferences

---

## 3. Seasonal Trend Products

### Business Definition
Products with strong seasonal patterns. Use these for timed campaigns and inventory planning.

### Technical Calculation

#### Step 1: Analyze Seasonal Purchase Patterns
```sql
-- Calculate monthly purchase patterns for each product
SELECT 
    p.product_id,
    p.product_name,
    EXTRACT(MONTH FROM o.order_date) as month,
    COUNT(DISTINCT o.order_id) as monthly_orders,
    SUM(oi.quantity) as monthly_quantity,
    AVG(oi.unit_price) as avg_monthly_price
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_date >= CURRENT_DATE - INTERVAL '2 years'
GROUP BY p.product_id, p.product_name, EXTRACT(MONTH FROM o.order_date)
ORDER BY p.product_id, month;
```

#### Step 2: Calculate Seasonality Coefficient
```python
import numpy as np
from scipy import stats

def calculate_seasonality(monthly_data):
    """Calculate seasonality strength using coefficient of variation"""
    monthly_quantities = [row['monthly_quantity'] for row in monthly_data]
    
    if len(monthly_quantities) < 12:
        return 0  # Insufficient data for seasonality analysis
    
    mean_quantity = np.mean(monthly_quantities)
    std_quantity = np.std(monthly_quantities)
    
    # Coefficient of variation (higher = more seasonal)
    cv = std_quantity / mean_quantity if mean_quantity > 0 else 0
    
    return cv

# Identify seasonal products
seasonal_products = []
for product_id, monthly_data in product_monthly_data.items():
    seasonality_score = calculate_seasonality(monthly_data)
    if seasonality_score > 0.5:  # Threshold for seasonal products
        seasonal_products.append({
            'product_id': product_id,
            'seasonality_score': seasonality_score,
            'peak_month': max(monthly_data, key=lambda x: x['monthly_quantity'])['month']
        })
```

#### Step 3: Categorize Seasonal Patterns
```python
# Categorize by seasonal pattern
def categorize_seasonal_pattern(peak_month):
    if peak_month in [12, 1, 2]:
        return "Winter"
    elif peak_month in [3, 4, 5]:
        return "Spring"
    elif peak_month in [6, 7, 8]:
        return "Summer"
    else:  # [9, 10, 11]
        return "Fall"

seasonal_trend_products = len(seasonal_products)
```

### Data Sources
- **Primary**: `order_items`, `products`, `orders` tables
- **Time Range**: Last 2 years (for seasonal pattern detection)
- **Analysis**: Monthly aggregation for seasonality detection

### Business Insights
- **Campaign Timing**: When to promote specific products
- **Inventory Planning**: Seasonal stock management
- **Marketing Calendar**: Plan campaigns around seasonal peaks

---

## 4. Undiscovered Gems

### Business Definition
Low-volume products with high customer satisfaction. These have growth potential with proper marketing.

### Technical Calculation

#### Step 1: Calculate Customer Satisfaction Metrics
```sql
-- Calculate customer satisfaction indicators for each product
WITH product_metrics AS (
    SELECT 
        p.product_id,
        p.product_name,
        COUNT(DISTINCT o.order_id) as order_count,
        COUNT(DISTINCT o.customer_id) as customer_count,
        AVG(oi.unit_price) as avg_price,
        SUM(oi.quantity) as total_quantity,
        -- Customer satisfaction proxies
        AVG(CASE WHEN o.order_date > (
            SELECT MAX(order_date) FROM orders 
            WHERE customer_id = o.customer_id 
            AND order_date < o.order_date
        ) THEN 1 ELSE 0 END) as repeat_purchase_rate,
        -- Customer retention (customers who buy again)
        COUNT(DISTINCT CASE WHEN repeat_orders.customer_id IS NOT NULL THEN o.customer_id END) / 
        COUNT(DISTINCT o.customer_id) as customer_retention_rate
    FROM products p
    JOIN order_items oi ON p.product_id = oi.product_id
    JOIN orders o ON oi.order_id = o.order_id
    LEFT JOIN (
        SELECT DISTINCT customer_id, product_id
        FROM orders o2
        JOIN order_items oi2 ON o2.order_id = oi2.order_id
        WHERE o2.order_date >= CURRENT_DATE - INTERVAL '180 days'
    ) repeat_orders ON o.customer_id = repeat_orders.customer_id 
                    AND oi.product_id = repeat_orders.product_id
    WHERE o.order_date >= CURRENT_DATE - INTERVAL '180 days'
    GROUP BY p.product_id, p.product_name
)
```

#### Step 2: Identify Hidden Gems
```python
# Calculate hidden gem score
def calculate_hidden_gem_score(product):
    """Score products based on satisfaction vs volume metrics"""
    
    # Low volume threshold (bottom 30% by order count)
    volume_percentile = stats.percentileofscore(all_volumes, product['order_count'])
    is_low_volume = volume_percentile < 30
    
    # High satisfaction criteria
    high_satisfaction = (
        product['repeat_purchase_rate'] > 0.3 and  # 30%+ repeat purchases
        product['customer_retention_rate'] > 0.2 and  # 20%+ customer retention
        product['avg_price'] > 1000  # Premium product
    )
    
    if is_low_volume and high_satisfaction:
        # Calculate growth potential score
        satisfaction_score = (
            product['repeat_purchase_rate'] * 0.4 +
            product['customer_retention_rate'] * 0.3 +
            min(product['avg_price'] / 5000, 1.0) * 0.3
        )
        return satisfaction_score
    
    return 0

# Find hidden gems
undiscovered_gems = []
for product in product_metrics:
    gem_score = calculate_hidden_gem_score(product)
    if gem_score > 0.5:  # Threshold for hidden gems
        undiscovered_gems.append({
            **product,
            'gem_score': gem_score
        })

undiscovered_gems_count = len(undiscovered_gems)
```

### Data Sources
- **Primary**: `order_items`, `products`, `orders`, `customers` tables
- **Satisfaction Proxies**: Repeat purchase rates, customer retention
- **Time Range**: Last 180 days (6 months for behavior patterns)

### Business Insights
- **Growth Opportunities**: Products that could perform better with marketing
- **Marketing Focus**: Which products to highlight in campaigns
- **Product Development**: Hidden gems to feature and expand

---

## Data Quality and Validation

### Data Freshness
- **Real-time Updates**: Metrics recalculated every 6 hours
- **Cache Layer**: PostgreSQL cache tables for fast retrieval
- **Data Validation**: Automated checks for data completeness

### Accuracy Metrics
- **Sample Size**: Minimum 100 orders for reliable statistics
- **Statistical Significance**: 95% confidence intervals for key metrics
- **Outlier Detection**: Remove extreme values affecting averages

### Performance Optimization
- **Indexing Strategy**: Optimized indexes on product_id, customer_id, order_date
- **Query Optimization**: Pre-aggregated tables for common calculations
- **Caching**: Redis cache for frequently accessed metrics

---

## Business Actionability

### Executive Dashboard
Each metric provides clear business actions:
- **High-Value Pairs** → Create bundle promotions
- **Cross-Region** → Plan market expansion
- **Seasonal Trends** → Time marketing campaigns
- **Hidden Gems** → Focus marketing efforts

### Implementation Roadmap
1. **Week 1-2**: Validate data sources and calculations
2. **Week 3-4**: Implement automated metric calculation
3. **Week 5-6**: Create business action plans for each metric
4. **Week 7-8**: Set up monitoring and alerting

### Success Metrics
- **Revenue Impact**: Track revenue from metric-based decisions
- **Customer Satisfaction**: Monitor changes in customer behavior
- **Operational Efficiency**: Measure improvement in inventory and marketing

---

## Technical Implementation

### API Endpoints
```
GET /api/v1/collaborative-metrics
- Returns all 4 metrics with current values
- Supports time_filter parameter (7days, 30days, 90days, all)
- Includes calculation timestamps and data sources

GET /api/v1/collaborative-metrics/{metric_type}
- Detailed breakdown for specific metric
- Includes top products and recommendations
- Historical trends and comparisons
```

### Database Schema
```sql
-- Cache tables for performance
CREATE TABLE collaborative_metrics_cache (
    metric_type VARCHAR(50) PRIMARY KEY,
    value DECIMAL(15,2),
    calculated_at TIMESTAMP,
    data_sources TEXT,
    time_filter VARCHAR(20)
);

-- High-value pairs cache
CREATE TABLE high_value_pairs_cache (
    product_a VARCHAR(50),
    product_b VARCHAR(50),
    avg_order_value DECIMAL(10,2),
    purchase_count INTEGER,
    last_calculated TIMESTAMP
);
```

### Monitoring and Alerts
- **Data Freshness**: Alert if metrics > 12 hours old
- **Quality Checks**: Alert on data anomalies or missing values
- **Performance**: Monitor API response times and database queries

---

## Conclusion

These collaborative filtering metrics transform raw purchase data into actionable business insights. Each metric is calculated using proven statistical methods and provides specific recommendations for business growth. The system is designed for scalability, accuracy, and real-time decision-making.

For technical support or metric customization, contact the data analytics team.
