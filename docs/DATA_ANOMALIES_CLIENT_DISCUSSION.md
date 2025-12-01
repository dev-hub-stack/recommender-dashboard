# Data Anomalies & Client Discussion Points

## Executive Summary
This document identifies data anomalies found in the production database and provides validated answers based on actual data analysis performed on **2025-12-01**.

---

## ✅ DATA QUALITY VALIDATION RESULTS

### Overall Data Health: EXCELLENT

| Metric | Value | Status |
|--------|-------|--------|
| **Total Orders** | 234,959 | ✅ |
| **Missing Customer IDs** | 0 (0.00%) | ✅ Perfect |
| **Zero Revenue Orders** | 504 (0.21%) | ⚠️ Minor |
| **Missing City Data** | 0 (0.00%) | ✅ Perfect |
| **Future Dates** | 0 | ✅ Perfect |
| **Negative Revenue** | 0 | ✅ Perfect |
| **Unique Customers** | 180,484 | ✅ |
| **Order Items** | 1,971,527 | ✅ |
| **Date Range** | 2021-08-17 to 2025-11-26 | ✅ |

### Order Distribution by Year:
- **2021**: 240 orders
- **2022**: 34,668 orders
- **2023**: 69,170 orders
- **2024**: 56,129 orders
- **2025**: 74,752 orders

### Order Type Breakdown:
- **OE (Online)**: 131,915 orders (56%)
- **POS (Point of Sale)**: 103,044 orders (44%)

### Top 10 Cities:
1. Lahore: 100,698 orders
2. Karachi: 32,699 orders
3. Islamabad: 13,524 orders
4. Rawalpindi: 10,632 orders
5. Sialkot: 7,136 orders
6. Faisalabad: 6,268 orders
7. Okara: 4,265 orders
8. Multan: 3,417 orders
9. Wah Cantonment: 3,126 orders
10. Gujranwala: 3,025 orders

---

## 🚨 ANOMALIES TO DISCUSS WITH CLIENT

### 1. ✅ Customer Identification - NO ISSUES
**Status**: PERFECT - 0% missing customer IDs
**Finding**: All 234,959 orders have valid `unified_customer_id`
**Action Required**: None

---

### 2. ⚠️ Zero Revenue Orders (504 orders - 0.21%)
**Status**: Minor anomaly requiring clarification

**Sample Orders Found**:
| Order | Type | Customer |
|-------|------|----------|
| MO-1119 | OE | Abdur rab rabb |
| MHO-1015 | OE | Majid Lodhi |
| MO-1122 | OE | Saffiullah Qadir |
| MO-1124 | OE | Wahaj Pirwani |
| MHO-1021 | OE | Sidra Tul Muntaha |

**Key Finding**: ALL zero-revenue orders are from OE (Online) system

**Questions for Client**:
1. Are these cancelled/refunded orders?
2. Are these sample/promotional orders?
3. Should we exclude from revenue but include in frequency metrics?

---

### 3. ✅ Geographic Data - NO ISSUES
**Status**: PERFECT - 0% missing city data
**Finding**: All orders have valid city information
**Action Required**: None

---

### 4. 🚨 Statistical Outliers - NEEDS REVIEW
**Status**: Critical anomaly requiring immediate attention

**Largest Orders Found**:
| Order | Amount | Customer | Issue |
|-------|--------|----------|-------|
| (No ID) | PKR 1,930,000,000 | Crewlogix Shahzad | ⚠️ Likely test data |
| DF-6966 | PKR 247,252,766 | Inappropriate name | ⚠️ Data quality issue |
| CE-1131 | PKR 13,444,420 | Sheikh Amna Saleem | B2B? |
| AF-LP26061-67703 | PKR 11,626,448 | Crewlogix shahzad | B2B? |
| AF-LP26061-67704 | PKR 9,130,118 | Crewlogix shahzad | B2B? |

**Potential B2B Orders**: 305 orders > 500K PKR

**Questions for Client**:
1. Is "Crewlogix Shahzad" a test account? (PKR 1.93B order is suspicious)
2. Should we remove test data from analytics?
3. Are B2B orders (305 orders > 500K) to be analyzed separately?
4. The DF-6966 order has an inappropriate customer name - data quality issue?

---

### 5. ✅ Date Validity - NO ISSUES
**Status**: PERFECT
- No future-dated orders
- No negative revenue orders
- Date range: 2021-08-17 to 2025-11-26 (valid)
**Action Required**: None

---

## 🤖 ML MODEL IMPLEMENTATION

### Dual-Layer Recommendation System

The system uses a **hybrid approach** with both AWS Personalize ML and SQL-based analytics:

#### Layer 1: AWS Personalize (True ML)
```
┌─────────────────────────────────────────────────────────────┐
│                AWS PERSONALIZE IMPLEMENTATION                │
├─────────────────────────────────────────────────────────────┤
│ Dataset Group ARN:                                           │
│ arn:aws:personalize:us-east-1:657020414783:dataset-group/    │
│ mastergroup-recommendations                                  │
│                                                              │
│ Campaign ARN:                                                │
│ arn:aws:personalize:us-east-1:657020414783:campaign/         │
│ mastergroup-campaign                                         │
│                                                              │
│ Tracking ID: 6b8748e4-4cbe-412e-8247-b6978d2814ac           │
│                                                              │
│ Models:                                                      │
│ - User Personalization (aws-user-personalization)            │
│ - Similar Items (aws-sims)                                   │
│ - Personalized Ranking (aws-personalized-ranking)            │
└─────────────────────────────────────────────────────────────┘
```

#### Layer 2: SQL-Based Analytics (Complementary)
```
┌─────────────────────────────────────────────────────────────┐
│                SQL-BASED COLLABORATIVE FILTERING             │
├─────────────────────────────────────────────────────────────┤
│ 1. Real-time co-purchase queries                             │
│    - Finds customers who bought same products                │
│    - Used for quick analytics when cache is cold             │
│                                                              │
│ 2. Product Pair Analysis                                     │
│    - Counts products bought together                         │
│    - Used for bundle recommendations                         │
│                                                              │
│ 3. RFM Scoring                                               │
│    - Customer segmentation based on behavior                 │
│    - Direct database calculations                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ AWS PERSONALIZE CONFIGURATION

### Current Status: FULLY IMPLEMENTED

**AWS Resources Deployed**:
- **Region**: us-east-1
- **Dataset Group**: mastergroup-recommendations
- **Campaign**: mastergroup-campaign
- **Event Tracker**: Real-time event ingestion enabled

### Training Behavior:
- AWS Personalize trains on **all historical data** initially
- **Incremental updates** via Event Tracker for real-time learning
- **Full retraining**: Weekly with complete dataset
- **Batch inference**: Every 6 hours for cost optimization

### Data Pipeline:
```
PostgreSQL → S3 → AWS Personalize → Batch Jobs → PostgreSQL Cache
     ↓
Real-time Events → Event Tracker → Model Updates
```

### Key Files:
- `/aws_personalize/personalize_service.py` - Main service
- `/aws_personalize/batch_sync.py` - Data synchronization
- `/aws_personalize/run_batch_inference.py` - Batch recommendations
- `/aws_personalize/export_data_for_personalize.py` - Data export

---

## ✅ AWS PERSONALIZE BATCH INFERENCE STATUS

### Current Status: RUNNING ✅

**Validated on 2025-12-01:**

| Component | Status | Last Updated |
|-----------|--------|--------------|
| **User Recommendations Cache** | 180,483 records | 2025-12-01 03:00:49 |
| **Similar Items Cache** | 4,182 records | 2025-12-01 03:00:50 |
| **Product Pairs** | 19,457 records | Active |
| **Customer Statistics** | 357,668 records | Active |

### Batch Inference Schedule:
- **Frequency**: Every 6 hours (03:00, 09:00, 15:00, 21:00 UTC)
- **Last Run**: 2025-12-01 03:00:49 ✅
- **Coverage**: 180,483 out of 180,484 customers (99.99%)

### Training Behavior:
1. **Initial Training**: Complete historical dataset
2. **Incremental Updates**: Real-time via Event Tracker
3. **Full Retraining**: Weekly schedule
4. **Batch Inference**: Every 6 hours for cost optimization

---

## 📊 DATA PIPELINE ARCHITECTURE

### Complete Data Flow:
```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ POS System  │───▶│  PostgreSQL  │───▶│  Dashboard API  │
└─────────────┘    │   Database   │    │  (FastAPI)      │
                   └──────────────┘    └─────────────────┘
┌─────────────┐           │                    │
│ OE System   │───────────┘                    │
└─────────────┘                                ▼
                                        ┌─────────────────┐
                                        │   Frontend      │
                                        │   Dashboard     │
                                        └─────────────────┘

AWS Personalize Pipeline:
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ PostgreSQL  │───▶│    AWS S3    │───▶│ AWS Personalize │
└─────────────┘    │ (Data Export)│    │  (ML Models)    │
                   └──────────────┘    └─────────────────┘
                                              │
                   ┌──────────────┐           │
                   │ Batch Results│◀──────────┘
                   │ (Cache)      │
                   └──────────────┘
```

### Pipeline Components:
1. **Data Ingestion**: POS/OE → PostgreSQL via sync scripts
2. **Data Export**: PostgreSQL → S3 via `export_data_for_personalize.py`
3. **ML Training**: AWS Personalize automatic training
4. **Batch Inference**: `run_batch_inference.py` every 6 hours
5. **Cache Loading**: Results stored in PostgreSQL for fast API response

---

## 🎯 RECOMMENDATIONS FOR CLIENT MEETING

### Priority 1: Data Quality (Immediate)
1. Get sample rows for each anomaly type
2. Understand root cause before ingesting more data
3. Define data quality rules with client approval

### Priority 2: ML Optimization (Short-term)
1. Verify AWS Personalize batch inference is running on schedule
2. Review model accuracy metrics (Precision@10, NDCG@10)
3. Ensure Event Tracker is receiving real-time purchase events

### Priority 3: Data Pipeline (Medium-term)
1. Establish clear data validation rules
2. Create automated anomaly detection
3. Set up monitoring for data quality

---

##  VALIDATED ANSWERS & REMAINING QUESTIONS

### ✅ Answered from Database:

| Question | Answer |
|----------|--------|
| What % of orders have customer IDs? | **100%** - All orders have valid IDs |
| How complete is geographic data? | **100%** - All orders have city data |
| Is batch inference running? | **Yes** - Last run 2025-12-01 03:00:49 |
| What's the data date range? | 2021-08-17 to 2025-11-26 (4+ years) |
| How many unique customers? | 180,484 customers |
| POS vs OE distribution? | OE: 56%, POS: 44% |
| Are there B2B orders? | Yes - 305 orders > 500K PKR |

### ❓ Remaining Questions for Client:

**Data Quality:**
1. Are the 504 zero-revenue OE orders cancelled/refunded orders?
2. Is "Crewlogix Shahzad" a test account (PKR 1.93B order)?
3. Should we exclude test data from analytics?
4. The DF-6966 order has inappropriate customer name - should we flag/remove?

**Business Decisions:**
1. Should B2B orders (305 orders > 500K) be analyzed separately?
2. What's the maximum legitimate retail order value?
3. Should zero-revenue orders count for frequency metrics?

---

## 📅 Next Steps

### ✅ Completed:
1. ~~Verify AWS Personalize status~~ - **RUNNING** (Last batch: 2025-12-01 03:00:49)
2. ~~Collect sample rows for anomalies~~ - Documented above
3. ~~Validate data quality metrics~~ - 100% customer IDs, 100% city data

### 🔜 Pending (Client Input Required):
1. **Clarify zero-revenue orders** - Are 504 OE orders cancelled/refunded?
2. **Identify test accounts** - Is "Crewlogix Shahzad" test data?
3. **Define B2B threshold** - Should orders > 500K be analyzed separately?
4. **Clean inappropriate data** - DF-6966 has inappropriate customer name

---

*Document prepared for client discussion. All sample data should be anonymized if shared externally.*
