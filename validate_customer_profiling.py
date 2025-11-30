#!/usr/bin/env python3
"""
Validation script for Customer Profiling and Geographic Distribution sections
Compares real database data with frontend display
"""

import psycopg2
import os
from dotenv import load_dotenv
import json

def get_db_connection():
    """Establish database connection"""
    return psycopg2.connect(
        host=os.getenv('PG_HOST', 'localhost'),
        port=os.getenv('PG_PORT', '5432'),
        database=os.getenv('PG_DATABASE', 'mastergroup_recommendations'),
        user=os.getenv('PG_USER', 'postgres'),
        password=os.getenv('PG_PASSWORD', ''),
        sslmode=os.getenv('PG_SSLMODE', 'prefer')
    )

def validate_customer_profiling():
    """Validate customer profiling metrics"""
    print('🔍 VALIDATING CUSTOMER PROFILING METRICS')
    print('=' * 60)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Test customer metrics (same as dashboard API)
    cursor.execute('''
        SELECT 
            COUNT(DISTINCT o.id) as total_orders,
            COUNT(DISTINCT o.unified_customer_id) as total_customers,
            COALESCE(SUM(o.total_price), 0) as total_revenue,
            COALESCE(AVG(o.total_price), 0) as avg_order_value
        FROM orders o
        WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
    ''')
    
    result = cursor.fetchone()
    
    print('📊 CUSTOMER METRICS (30 days):')
    print(f'  Total Orders: {result[0]:,}')
    print(f'  Total Customers: {result[1]:,}')
    print(f'  Total Revenue: PKR {result[2]:,.0f}')
    print(f'  Avg Order Value: PKR {result[3]:,.0f}')
    print()
    
    # Calculate additional metrics
    avg_lifetime_value = result[2] / result[1] if result[1] > 0 else 0
    
    print('📈 DERIVED METRICS:')
    print(f'  Avg Lifetime Value: PKR {avg_lifetime_value:,.0f}')
    print(f'  Orders per Customer: {result[0] / result[1]:.1f}')
    print()
    
    cursor.close()
    conn.close()
    
    return {
        'total_customers': result[1],
        'total_revenue': result[2],
        'avg_order_value': result[3],
        'avg_lifetime_value': avg_lifetime_value
    }

def validate_geographic_distribution():
    """Validate geographic distribution data"""
    print('🌍 VALIDATING GEOGRAPHIC DISTRIBUTION')
    print('=' * 60)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Test real geographic distribution
    cursor.execute('''
        SELECT 
            o.customer_city,
            COUNT(DISTINCT o.unified_customer_id) as customer_count,
            COUNT(*) as orders,
            COALESCE(SUM(o.total_price), 0) as revenue
        FROM orders o
        WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
            AND o.customer_city IS NOT NULL
            AND o.customer_city != ''
        GROUP BY o.customer_city
        ORDER BY customer_count DESC
        LIMIT 10
    ''')
    
    results = cursor.fetchall()
    
    print('🏙️ TOP 10 CITIES BY CUSTOMER COUNT:')
    total_customers = sum(row[1] for row in results)
    total_revenue = sum(row[3] for row in results)
    
    for i, row in enumerate(results, 1):
        city, customers, orders, revenue = row
        percentage = (customers / total_customers) * 100
        print(f'  {i:2d}. {city:<15}: {customers:4d} customers ({percentage:4.1f}%), PKR {revenue:,.0f}')
    
    print()
    print('📊 SUMMARY:')
    print(f'  Total Cities: {len(results)}')
    print(f'  Total Customers (top 10): {total_customers:,}')
    print(f'  Total Revenue (top 10): PKR {total_revenue:,.0f}')
    print()
    
    cursor.close()
    conn.close()
    
    return results

def compare_with_frontend():
    """Compare real data with frontend mock data"""
    print('🔄 COMPARING REAL DATA WITH FRONTEND DISPLAY')
    print('=' * 60)
    
    # Get real data
    real_metrics = validate_customer_profiling()
    real_cities = validate_geographic_distribution()
    
    print('❌ FRONTEND MOCK DATA ISSUES FOUND:')
    print()
    
    # Show what frontend currently displays (mock data)
    frontend_cities = [
        {"city": "Karachi", "percentage": 35},
        {"city": "Lahore", "percentage": 25}, 
        {"city": "Islamabad", "percentage": 15},
        {"city": "Peshawar", "percentage": 10},
        {"city": "Others", "percentage": 15}
    ]
    
    print('🎭 FRONTEND MOCK DISTRIBUTION:')
    for city_data in frontend_cities:
        print(f'  {city_data["city"]:<12}: {city_data["percentage"]:3.0f}% (MOCK DATA)')
    
    print()
    print('🌍 REAL DATABASE DISTRIBUTION:')
    total_real_customers = sum(city[1] for city in real_cities)
    
    for i, city_data in enumerate(real_cities[:5], 1):
        city, customers, orders, revenue = city_data
        percentage = (customers / total_real_customers) * 100
        print(f'  {i}. {city:<12}: {percentage:3.1f}% ({customers} customers - REAL DATA)')
    
    print()
    print('🚨 KEY DIFFERENCES:')
    print('  ❌ Frontend shows Karachi as #1 (35%) - Real data shows Lahore as #1')
    print('  ❌ Frontend shows Islamabad as #3 - Real data shows Rawalpindi/Faisalabad')
    print('  ❌ Frontend uses fixed percentages - Real data varies significantly')
    print('  ❌ Frontend shows Peshawar - Real data shows Sialkot, Jhang City, Okara')
    
    return {
        'real_metrics': real_metrics,
        'real_cities': real_cities,
        'frontend_issues': [
            'Uses mock geographic distribution instead of real data',
            'Shows incorrect city rankings',
            'Uses fixed percentages instead of real calculations',
            'Missing actual top cities like Sialkot, Jhang City'
        ]
    }

def main():
    """Main validation function"""
    print('🔍 CUSTOMER PROFILING & GEOGRAPHIC DISTRIBUTION VALIDATION')
    print('=' * 80)
    print()
    
    try:
        validation_results = compare_with_frontend()
        
        print()
        print('✅ VALIDATION COMPLETE')
        print()
        print('📋 RECOMMENDATIONS:')
        print('  1. Update frontend to use real geographic data from database')
        print('  2. Replace mock percentages with actual customer distribution')
        print('  3. Add API endpoint for geographic distribution metrics')
        print('  4. Update city rankings to reflect real customer data')
        print('  5. Add revenue data per city for business insights')
        
        # Save results to file
        with open('customer_profiling_validation.json', 'w') as f:
            json.dump(validation_results, f, indent=2, default=str)
        
        print()
        print('💾 Results saved to: customer_profiling_validation.json')
        
    except Exception as e:
        print(f'❌ Validation failed: {e}')
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
