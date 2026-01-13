# Visual Testing Guide - CSV Export & Smart Filters

## 🎯 **Testing Objective**

Verify that filters show/hide correctly per screen and CSV export works with proper context.

---

## 📋 **Pre-Testing Checklist**

- [ ] Frontend development server is running (`npm run dev`)
- [ ] Backend API is accessible
- [ ] You have test data in the database
- [ ] Browser console is open (F12) to see export logs

---

## 🧪 **Test Scenarios**

### **Scenario 1: Dashboard Screen**

**Expected Filter Visibility:**
- ✅ Time Period dropdown
- ✅ Categories multi-select
- ✅ Order Source (All/OE/POS)
- ✅ Delivered Only checkbox

**Steps:**
1. Navigate to "Dashboard"
2. Verify all 4 filters are visible
3. Select filters:
   - Time: "Last 30 Days"
   - Categories: Select 2 categories
   - Source: "OE"
   - Check "Delivered Only"
4. Click "Export Dashboard" button
5. Verify CSV downloads with filename: `mastergroup_dashboard_30days_oe_delivered_2cats_[timestamp].csv`

**Expected Result:**
- ✅ All filters visible
- ✅ Button shows "Export Dashboard"
- ✅ Filename includes filter parameters

---

### **Scenario 2: Customer Profiling**

**Expected Filter Visibility:**
- ✅ Time Period dropdown
- ✅ Categories multi-select
- ✅ Order Source (All/OE/POS)
- ✅ Delivered Only checkbox

**Steps:**
1. Navigate to "Customer Profiling"
2. Verify all 4 filters are visible
3. Select filters:
   - Time: "Last 7 Days"
   - Categories: 1 category
   - Source: "POS"
   - Check "Delivered Only"
4. Click "Export Customer Profiling" button

**Expected Result:**
- ✅ Button shows "Export Customer Profiling"
- ✅ Filename: `mastergroup_customer_profiling_7days_pos_delivered_1cats_[timestamp].csv`

---

### **Scenario 3: Product Insights (Collaborative Filtering)** ⚠️ **KEY TEST**

**Expected Filter Visibility:**
- ✅ Time Period dropdown
- ✅ Categories multi-select
- ✅ Order Source (All/OE/POS)
- ❌ **Delivered Only checkbox HIDDEN** ✨

**Steps:**
1. Navigate to "Collaborative Filtering" (Product Insights)
2. **Verify "Delivered Only" checkbox is NOT visible** ⭐
3. Verify other 3 filters ARE visible
4. Select filters:
   - Time: "Last 90 Days"
   - Categories: 3 categories
   - Source: "All"
5. Click export button

**Expected Result:**
- ✅ "Delivered Only" checkbox **HIDDEN**
- ✅ Button shows "Export Collaborative Filtering"
- ✅ Filename: `mastergroup_collaborative_filtering_90days_3cats_[timestamp].csv`
- ✅ No "delivered" in filename (since filter not applied)

**Rationale:** Product relationships are based on co-purchase patterns, not delivery status.

---

### **Scenario 4: Cross-Selling (Revenue Optimization)**

**Expected Filter Visibility:**
- ✅ Time Period dropdown
- ✅ Categories multi-select
- ✅ Order Source (All/OE/POS)
- ✅ Delivered Only checkbox

**Steps:**
1. Navigate to "Cross-Selling"
2. Verify all 4 filters are visible
3. Select filters and click export

**Expected Result:**
- ✅ Button shows "Export Cross Selling"

---

### **Scenario 5: Geographic Intelligence**

**Expected Filter Visibility:**
- ✅ Time Period dropdown
- ✅ Categories multi-select
- ✅ Order Source (All/OE/POS)
- ✅ Delivered Only checkbox

**Steps:**
1. Navigate to "Geographic Intelligence"
2. Verify all 4 filters are visible
3. Select filters and click export

**Expected Result:**
- ✅ Button shows "Export Geographic Intelligence"
- ✅ Filename: `mastergroup_geographic_intelligence_[filters]_[timestamp].csv`

---

### **Scenario 6: RFM Segmentation** ⚠️ **KEY TEST**

**Expected Filter Visibility:**
- ✅ Time Period dropdown
- ❌ **Categories multi-select HIDDEN** ✨
- ✅ Order Source (All/OE/POS)
- ❌ **Delivered Only checkbox HIDDEN** ✨

**Steps:**
1. Navigate to "RFM Segmentation"
2. **Verify "Categories" filter is NOT visible** ⭐
3. **Verify "Delivered Only" checkbox is NOT visible** ⭐
4. Verify Time Period and Order Source ARE visible
5. Select filters:
   - Time: "Last 6 Months"
   - Source: "All"
6. Click export button

**Expected Result:**
- ✅ "Categories" filter **HIDDEN**
- ✅ "Delivered Only" checkbox **HIDDEN**
- ✅ Button shows "Export RFM Segmentation"
- ✅ Filename: `mastergroup_rfm_segmentation_6months_[timestamp].csv`
- ✅ No category or delivered info in filename

**Rationale:** 
- RFM is customer-centric, not product-centric (no categories needed)
- RFM analyzes all customer behavior, not just delivered orders

---

### **Scenario 7: ML Recommendations** ⚠️ **KEY TEST**

**Expected Filter Visibility:**
- ❌ **Time Period dropdown HIDDEN** ✨
- ✅ Categories multi-select
- ❌ **Order Source HIDDEN** ✨
- ❌ **Delivered Only checkbox HIDDEN** ✨

**Steps:**
1. Navigate to "ML Recommendations"
2. **Verify ONLY "Categories" filter is visible** ⭐
3. **Verify Time Period, Order Source, and Delivered Only are ALL hidden**
4. Select categories:
   - Categories: 2 categories
5. Click export button

**Expected Result:**
- ✅ ONLY "Categories" filter visible
- ✅ All other filters **HIDDEN**
- ✅ Button shows "Export ML Recommendations"
- ✅ Filename: `mastergroup_ml_recommendations_2cats_[timestamp].csv`
- ✅ No time/source/delivered info in filename

**Rationale:** ML models use all historical data and are trained globally, not filtered by time or order source.

---

## 🔍 **Filter Toggle Testing**

### **Test Filter Persistence When Switching Screens**

**Steps:**
1. Start on Dashboard
2. Set filters:
   - Time: "Last 30 Days"
   - Categories: "Electronics, Fashion"
   - Source: "OE"
   - Check "Delivered Only"
3. Switch to "Product Insights"
4. **Expected:** "Delivered Only" disappears, other filters remain
5. Switch to "RFM Segmentation"
6. **Expected:** "Categories" and "Delivered Only" disappear, Time and Source remain
7. Switch to "ML Recommendations"
8. **Expected:** Only "Categories" visible
9. Switch back to "Dashboard"
10. **Expected:** All filters reappear with same values

**Verification:**
- ✅ Filters hide/show correctly on screen change
- ✅ Filter values persist when switching screens
- ✅ Export button label updates on each screen

---

## 🐛 **Error Cases to Test**

### **Test 1: Export with No Data**

**Steps:**
1. Select a time period with no data (e.g., "Today" if no orders today)
2. Click export button

**Expected Result:**
- ⚠️ Alert: "No data available to export" OR empty CSV with headers only

---

### **Test 2: Export with All Filters**

**Steps:**
1. On Dashboard, enable ALL filters with restrictive values
2. Click export

**Expected Result:**
- ✅ CSV contains only data matching all filter criteria
- ✅ Filename reflects all filters

---

### **Test 3: Network Error During Export**

**Steps:**
1. Disconnect from internet
2. Click export button

**Expected Result:**
- ⚠️ Error message: "Export failed. Please try again."
- ✅ Button returns to normal state (not stuck in "Exporting...")

---

## 📊 **Visual Verification Matrix**

| Screen | Time | Categories | Source | Delivered | Export Label |
|--------|------|------------|--------|-----------|--------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | Export Dashboard |
| Customer Profiling | ✅ | ✅ | ✅ | ✅ | Export Customer Profiling |
| Product Insights | ✅ | ✅ | ✅ | ❌ | Export Collaborative Filtering |
| Cross-Selling | ✅ | ✅ | ✅ | ✅ | Export Cross Selling |
| Geographic Intelligence | ✅ | ✅ | ✅ | ✅ | Export Geographic Intelligence |
| RFM Segmentation | ✅ | ❌ | ✅ | ❌ | Export RFM Segmentation |
| ML Recommendations | ❌ | ✅ | ❌ | ❌ | Export ML Recommendations |

**Legend:**
- ✅ = Should be visible
- ❌ = Should be hidden
- ⚠️ = Conditional

---

## 🎥 **Browser Console Verification**

Open browser console (F12) and check for:

**Successful Export:**
```
✅ Export completed successfully!
```

**Failed Export:**
```
❌ Export error: [error details]
❌ Export failed. Please try again.
```

**API Call Verification:**
Check Network tab for:
```
GET /api/v1/export/dashboard-csv?
  time_filter=30days
  &sections=dashboard
  &categories=Electronics,Fashion
  &order_source=oe
  &delivered_only=true
```

---

## ✅ **Test Completion Checklist**

### **Filter Visibility:**
- [ ] Dashboard - All 4 filters visible
- [ ] Customer Profiling - All 4 filters visible
- [ ] Product Insights - "Delivered Only" hidden ✨
- [ ] Cross-Selling - All 4 filters visible
- [ ] Geographic Intelligence - All 4 filters visible
- [ ] RFM Segmentation - "Categories" and "Delivered Only" hidden ✨
- [ ] ML Recommendations - Only "Categories" visible ✨

### **Export Functionality:**
- [ ] Export button label updates per screen
- [ ] CSV downloads successfully
- [ ] Filename includes filter parameters
- [ ] Filename excludes hidden filter values
- [ ] Export respects time filter
- [ ] Export respects category filter
- [ ] Export respects order source filter
- [ ] Export respects delivered only filter

### **Edge Cases:**
- [ ] Export with no data shows appropriate message
- [ ] Export with network error shows error message
- [ ] Filters persist when switching screens
- [ ] Filter values reset correctly

---

## 🚀 **Sign-Off**

**Tested By:** ___________________  
**Date:** ___________________  
**Browser:** ___________________  
**Result:** ☐ Pass  ☐ Fail  

**Issues Found:**
```
(List any bugs or unexpected behavior)
```

---

**Last Updated:** January 12, 2026  
**Test Environment:** Development  
**Status:** Ready for QA
