# Metrics and Calculations - Complete Guide

## Overview
This document explains every metric, calculation, and algorithm used in the Master Group Analytics Dashboard. Each section provides clear definitions, formulas, and business interpretations.

## 1. Customer Profiling Metrics

### RFM Analysis (Recency, Frequency, Monetary)

#### What is RFM?
RFM analysis segments customers based on three behavioral dimensions:
- **Recency**: How recently did the customer purchase?
- **Frequency**: How often do they purchase?
- **Monetary**: How much do they spend?

#### Calculation Method

```sql
-- Recency Score (1-5, higher is better)
CASE 
  WHEN days_since_last_purchase <= 30 THEN 5
  WHEN days_since_last_purchase <= 60 THEN 4
  WHEN days_since_last_purchase <= 90 THEN 3
  WHEN days_since_last_purchase <= 180 THEN 2
  ELSE 1
END as recency_score

-- Frequency Score (1-5, higher is better)
CASE 
  WHEN total_orders >= 20 THEN 5
  WHEN total_orders >= 10 THEN 4
  WHEN total_orders >= 5 THEN 3
  WHEN total_orders >= 3 THEN 2
  ELSE 1
END as frequency_score

-- Monetary Score (1-5, higher is better)
CASE 
  WHEN total_spent >= 100000 THEN 5
  WHEN total_spent >= 50000 THEN 4
  WHEN total_spent >= 20000 THEN 3
  WHEN total_spent >= 10000 THEN 2
  ELSE 1
END as monetary_score

-- Combined RFM Score (1-125)
recency_score * 25 + frequency_score * 5 + monetary_score
```

#### Segment Definitions

| Segment | RFM Pattern | Business Meaning | Action |
|---------|-------------|------------------|--------|
| **Champions** | 555, 554, 545, 454 | Recent, frequent, high spenders | VIP treatment, exclusive offers |
| **Loyal Customers** | 543, 444, 344, 355 | Good frequency and spending | Loyalty programs, cross-sell |
| **Potential Loyalists** | 334, 335, 343, 443 | Recent customers with good frequency | Nurture relationship, upsell |
| **New Customers** | 511, 411, 311 | Recent first-time buyers | Welcome series, education |
| **At Risk** | 244, 233, 224 | Previously good, now inactive | Re-engagement campaigns |
| **Cannot Lose Them** | 155, 154, 144 | High spenders but haven't purchased recently | Personal outreach, special offers |
| **Need Attention** | 332, 322, 231, 241 | Average metrics, declining | Survey, feedback collection |
| **Hibernating** | 222, 221, 212 | Low frequency and recency | Win-back campaigns |
| **Lost** | 111, 121, 112 | Inactive for long time | Last-chance offers or remove |

#### Key Metrics Explained

**Customer ID**: Unique identifier from unified_customer_id field
**Customer Name**: Extracted from orders table
**Customer City**: Primary location from order data
**Total Orders**: Count of all orders per customer
**Total Spent**: Sum of all order values per customer
**RFM Score**: Combined score (1-125) for ranking customers

---

## 2. AWS Personalize Recommendations

### Match Rate Calculation

#### Formula
```
Match Rate = (Number of sampled users who received this recommendation / Total sampled users) × 100
```

#### Example Calculation
- Sample size: 50 users from Punjab
- Product A recommended to: 45 users
- Match Rate = (45/50) × 100 = 90%

#### Business Interpretation
- **90%+ Match**: Extremely strong regional preference - stock heavily
- **60-89% Match**: Strong preference - good inventory levels
- **40-59% Match**: Moderate interest - consider promotions
- **<40% Match**: Niche product - targeted marketing only

### Regional Affinity Levels

| Affinity Level | Match Rate Range | Business Action |
|----------------|------------------|------------------|
| **🔥 High** | 80-100% | Increase inventory, feature prominently |
| **✓ Medium** | 40-79% | Maintain stock, consider bundle deals |
| **Low** | 0-39% | Limited stock, targeted campaigns |

### AWS Personalize Algorithm Details

#### User Personalization Model
- **Algorithm**: Collaborative Filtering with implicit feedback
- **Input Data**: User-item interaction matrix (purchases)
- **Output**: Personalized product recommendations per user
- **Score Range**: 0.0 to 1.0 (confidence × relevance)

#### Similar Items Model
- **Algorithm**: Item-to-item collaborative filtering
- **Input**: Co-purchase patterns and item similarity
- **Output**: Similar products for each item
- **Use Case**: "Customers who bought X also bought Y"

#### Data Pipeline
1. **Ingestion**: Orders → PostgreSQL → AWS S3
2. **Training**: Daily model retraining with new data
3. **Batch Inference**: Pre-compute recommendations for all users
4. **Caching**: Store results in PostgreSQL for fast retrieval
5. **Sampling**: Real-time sampling of 50 users per region

---

## 3. Collaborative Filtering Metrics

### Customer Similarity Insights

#### What It Measures
Finds customers with similar purchase patterns using collaborative filtering.

#### Algorithm Steps
1. **Create User-Item Matrix**: Each customer = vector of product purchases
2. **Calculate Similarity**: Cosine similarity between customer vectors
3. **Find Similar Customers**: Top N most similar customers per person
4. **Generate Recommendations**: Products bought by similar customers

#### Metrics Explained

**Similar Customers Count**: Number of customers with high similarity scores
- Higher count = more common purchase patterns
- Lower count = unique buying behavior

**Actual Recommendations**: Count of unique products recommended
- Based on similar customers' purchases
- Excludes products already owned by target customer

**Similarity Score**: 0.0 to 1.0 indicating how similar customers are
- 0.8+ = Very similar purchase patterns
- 0.5-0.7 = Moderately similar
- <0.5 = Weak similarity

#### Business Applications
- **Cross-selling**: Recommend products bought by similar customers
- **Customer Segmentation**: Group customers by behavior
- **Churn Prediction**: Identify customers with declining similarity

### Collaborative Product Pairs

#### What It Measures
Identifies products frequently purchased together using market basket analysis.

#### Algorithm Steps
1. **Count Co-purchases**: Track which products appear in same orders
2. **Calculate Lift**: `P(A&B) / (P(A) × P(B))`
3. **Filter by Support**: Minimum co-purchase frequency
4. **Rank by Confidence**: `P(A|B) = P(A&B) / P(B)`

#### Metrics Explained

**Product A & Product B**: The paired products
**Co-purchase Count**: Number of orders containing both products
**Lift Ratio**: How much more likely they are to be bought together than random
- **Lift > 1**: Products are positively associated
- **Lift = 1**: No association
- **Lift < 1**: Products are negatively associated

**Confidence**: Probability that if Product A is bought, Product B is also bought
- Formula: `Confidence(A→B) = Orders with both / Orders with A`
- Range: 0.0 to 1.0

#### Business Applications
- **Bundle Creation**: Package frequently bought together items
- **Store Layout**: Place related products near each other
- **Promotions**: "Buy X, get Y discount" offers

---

## 4. Performance Metrics

### Revenue Metrics

#### Total Revenue
```
Total Revenue = SUM(order_total_amount) across all orders in time period
```

#### Average Order Value (AOV)
```
AOV = Total Revenue / Total Number of Orders
```

#### Customer Lifetime Value (CLV)
```
CLV = Total Revenue per Customer = Total Spent / Customer Count
```

### Customer Metrics

#### Total Customers
```
Total Customers = COUNT(DISTINCT unified_customer_id)
```

#### New vs Returning Customers
```
New Customers = COUNT(DISTINCT customers with first purchase in period)
Returning Customers = Total Customers - New Customers
```

#### Customer Growth Rate
```
Growth Rate = ((Current Period Customers - Previous Period Customers) / Previous Period Customers) × 100
```

### Geographic Metrics

#### Customers by City
```
City Customer Count = COUNT(DISTINCT customer_id) WHERE city = 'CityName'
City Revenue = SUM(order_total) WHERE city = 'CityName'
```

#### Regional Analysis
- **Province-level aggregation** of customer metrics
- **Market penetration** by geographic area
- **Revenue distribution** across regions

---

## 5. Top Products Analysis

### Product Performance Metrics

#### Product Rank
Based on total revenue or quantity sold in the selected time period.

#### Product Metrics
- **Product ID**: Unique identifier
- **Product Name**: Display name
- **Total Revenue**: Sum of all sales
- **Quantity Sold**: Total units sold
- **Order Count**: Number of orders containing this product
- **Average Price**: Revenue / Quantity

#### Trending Products
Products with highest growth rate in recent period:
```
Growth Rate = ((Current Period Sales - Previous Period Sales) / Previous Period Sales) × 100
```

---

## 6. Time Filter Effects

### How Time Filters Work

**Today**: Orders from current day only
**7 Days**: Last 7 days including today
**30 Days**: Last 30 days including today
**Month to Date**: From 1st of current month to today
**3 Months**: Last 90 days including today
**6 Months**: Last 180 days including today
**1 Year**: Last 365 days including today
**All Time**: All available historical data
**Custom**: User-defined date range

### Impact on Metrics

Different time filters affect:
- **RFM Scores**: Recency calculations change based on time window
- **Trending Products**: Shorter windows show recent trends
- **Customer Segments**: Customer behavior may vary by time period
- **Recommendations**: AWS Personalize uses all historical data regardless of filter

---

## 7. Data Quality and Validation

### Data Validation Rules

1. **Customer ID Consistency**: unified_customer_id must be present
2. **Order Completeness**: Orders must have items and totals
3. **Product Data**: Products must have names and IDs
4. **Date Validity**: Order dates must be within reasonable ranges
5. **Revenue Accuracy**: Order totals must match sum of item totals

### Missing Data Handling

- **Missing Customer Names**: Display "Unknown Customer"
- **Missing Cities**: Exclude from geographic analysis
- **Missing Product Names**: Use Product ID
- **Zero Revenue Orders**: Include for frequency metrics but exclude from revenue calculations

### Anomaly Detection

- **Unusually Large Orders**: Flag for review (> 3 standard deviations)
- **Negative Revenue**: Investigate refunds/cancellations
- **Duplicate Orders**: Remove duplicates based on order ID
- **Future Dates**: Validate order dates are not in future

---

## 8. Business Intelligence Insights

### What to Look For

#### High-Value Indicators
- **Champions segment growth**: Increasing VIP customers
- **High Match Rate products**: Strong regional preferences
- **Increasing AOV**: Customers spending more per order
- **Geographic expansion**: New markets showing growth

#### Warning Signs
- **At Risk segment growth**: Customer churn increasing
- **Declining purchase frequency**: Lower customer engagement
- **High customer acquisition cost**: Low new customer retention
- **Geographic concentration**: Over-reliance on single market

#### Action Opportunities
- **Cross-sell pairs**: High-confidence product associations
- **Regional preferences**: Products with high match rates
- **Customer similarity**: Target similar customer groups
- **Trending products**: Capitalize on growing popularity

### Recommended Actions by Metric

| Metric | Good Signal | Action |
|--------|-------------|--------|
| **Champions > 20%** | Healthy VIP base | Exclusive programs |
| **At Risk > 15%** | Churn risk | Re-engagement campaigns |
| **Match Rate > 80%** | Strong preference | Increase inventory |
| **Lift Ratio > 2.0** | Strong association | Bundle products |
| **AOV increasing** | Higher spend per order | Upsell strategies |

---

## 9. Technical Implementation Details

### Data Sources
- **Primary**: PostgreSQL database with orders, customers, products
- **ML Models**: AWS Personalize for recommendations
- **Cache Layer**: PostgreSQL for pre-computed recommendations
- **API Layer**: FastAPI backend with ML endpoints

### Update Frequencies
- **Real-time**: Order ingestion and event tracking
- **Hourly**: Recommendation cache updates
- **Daily**: Model retraining and data sync
- **Weekly**: Full data pipeline refresh

### Performance Optimization
- **Caching**: Pre-computed recommendations for fast response
- **Sampling**: 50-user samples for regional analysis
- **Indexing**: Database indexes on customer_id, product_id, dates
- **Batch Processing**: ML model inference in batches

### Monitoring
- **API Response Times**: <200ms for cached data
- **Model Accuracy**: Precision@10, NDCG@10 metrics
- **Data Freshness**: Cache age and update frequency
- **Error Rates**: Failed recommendations and API calls

---

## 10. FAQ

### Q: Why do some products show 0.0% in AWS Personalize?
A: This indicates the ML model hasn't learned strong patterns for this product yet. It could be due to insufficient purchase history or the product being too niche.

### Q: What's the difference between Collaborative Filtering and AWS Personalize?
A: Collaborative Filtering uses local ML models on your data, while AWS Personalize uses Amazon's sophisticated algorithms with continuous learning from real-time events.

### Q: How often are recommendations updated?
A: Recommendations are updated every 6 hours through batch inference, with real-time events continuously sent to AWS for model improvement.

### Q: Why do we sample only 50 users for regional analysis?
A: 50 users provides a statistically significant sample while keeping API costs low and response times fast. This represents the regional patterns accurately.

### Q: Can I use these metrics for inventory planning?
A: Yes! Match Rate and Regional Affinity are excellent indicators for inventory allocation. High match rate products should be stocked more heavily in those regions.

### Q: How do I interpret a low RFM score?
A: Low RFM scores indicate customers who haven't purchased recently (low recency), buy infrequently (low frequency), or spend little (low monetary). These customers need re-engagement strategies.

---

## Conclusion

This metrics framework provides a comprehensive view of customer behavior, product performance, and business health. Each metric is designed to be actionable, helping you make data-driven decisions for customer retention, product strategy, and business growth.

For technical implementation details or custom metric requests, refer to the API documentation or contact the analytics team.
