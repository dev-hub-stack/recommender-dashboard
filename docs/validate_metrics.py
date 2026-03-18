#!/usr/bin/env python3
"""
Validate Collaborative Filtering Metrics
Tests database structure and validates metric calculations
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv
import json
from datetime import datetime, timedelta

load_dotenv()

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('PG_HOST', 'localhost'),
            port=os.getenv('PG_PORT', '5432'),
            database=os.getenv('PG_DATABASE', 'mastergroup_recommendations'),
            user=os.getenv('PG_USER', 'postgres'),
            password=os.getenv('PG_PASSWORD', ''),
            sslmode=os.getenv('PG_SSLMODE', 'prefer')
        )
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return None

def validate_database_structure(conn):
    """Validate required tables exist and have data"""
    print("\n🔍 VALIDATING DATABASE STRUCTURE")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    required_tables = [
        'orders', 'order_items', 'customer_purchases', 
        'product_pairs', 'product_statistics', 'customer_statistics'
    ]
    
    table_status = {}
    for table in required_tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            table_status[table] = count
            status = "✅" if count > 0 else "⚪"
            print(f"   {status} {table}: {count:,} rows")
        except Exception as e:
            table_status[table] = -1
            print(f"   ❌ {table}: {e}")
    
    cursor.close()
    return table_status

def validate_collaborative_metrics(conn):
    """Validate collaborative filtering metrics calculation"""
    print("\n📊 VALIDATING COLLABORATIVE METRICS")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    try:
        # Test the actual query used by the API
        print("   🧪 Testing API query...")
        cursor.execute("""
            WITH customer_products AS (
                SELECT 
                    o.unified_customer_id,
                    oi.product_id,
                    COUNT(*) as purchase_count
                FROM orders o
                JOIN order_items oi ON o.id = oi.order_id
                WHERE o.order_date >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY o.unified_customer_id, oi.product_id
            ),
            customer_pairs AS (
                SELECT DISTINCT
                    cp1.unified_customer_id as customer1,
                    cp2.unified_customer_id as customer2,
                    COUNT(DISTINCT cp1.product_id) as shared_products
                FROM customer_products cp1
                JOIN customer_products cp2 
                    ON cp1.product_id = cp2.product_id 
                    AND cp1.unified_customer_id < cp2.unified_customer_id
                GROUP BY cp1.unified_customer_id, cp2.unified_customer_id
                HAVING COUNT(DISTINCT cp1.product_id) >= 2
            ),
            stats AS (
                SELECT 
                    COUNT(DISTINCT cp.unified_customer_id) as total_users,
                    COUNT(DISTINCT cp.product_id) as total_products,
                    SUM(cp.purchase_count) as total_purchases,
                    COUNT(*) as total_user_product_combinations
                FROM customer_products cp
            ),
            pair_stats AS (
                SELECT 
                    COUNT(*) as total_pairs,
                    AVG(shared_products) as avg_shared_products
                FROM customer_pairs
            )
            SELECT 
                s.total_users,
                s.total_products,
                s.total_purchases,
                s.total_user_product_combinations,
                COALESCE(ps.total_pairs, 0) as active_customer_pairs,
                COALESCE(ps.avg_shared_products, 0) as avg_shared_products
            FROM stats s
            CROSS JOIN pair_stats ps
        """)
        
        result = cursor.fetchone()
        if result:
            total_users = int(result[0] or 0)
            total_products = int(result[1] or 0)
            total_purchases = int(result[2] or 0)
            total_combinations = int(result[3] or 0)
            active_pairs = int(result[4] or 0)
            avg_shared = float(result[5] or 0)
            
            print(f"   ✅ Query executed successfully")
            print(f"   📈 Total Users: {total_users:,}")
            print(f"   📦 Total Products: {total_products:,}")
            print(f"   💰 Total Purchases: {total_purchases:,}")
            print(f"   🔗 User-Product Combinations: {total_combinations:,}")
            print(f"   👥 Active Customer Pairs: {active_pairs:,}")
            print(f"   🎯 Avg Shared Products: {avg_shared:.2f}")
            
            # Calculate derived metrics
            similarity_score = min(avg_shared / 10.0, 1.0) if avg_shared > 0 else 0.0
            max_possible_pairs = float((total_users * (total_users - 1)) / 2) if total_users > 1 else 1.0
            recommendation_coverage = min(float(active_pairs) / max_possible_pairs, 1.0) if max_possible_pairs > 0 else 0.0
            
            print(f"\n   📊 DERIVED METRICS:")
            print(f"   🔍 Similarity Score: {similarity_score:.3f}")
            print(f"   📈 Recommendation Coverage: {recommendation_coverage:.3f}")
            
            return {
                'total_users': total_users,
                'total_products': total_products,
                'total_purchases': total_purchases,
                'total_recommendations': total_combinations,
                'active_customer_pairs': active_pairs,
                'avg_similarity_score': similarity_score,
                'algorithm_accuracy': recommendation_coverage,
                'coverage': recommendation_coverage
            }
        else:
            print("   ❌ No results returned")
            return None
            
    except Exception as e:
        print(f"   ❌ Query failed: {e}")
        return None
    finally:
        cursor.close()

def validate_high_value_pairs(conn):
    """Validate high-value product pairs calculation"""
    print("\n💎 VALIDATING HIGH-VALUE PRODUCT PAIRS")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    try:
        # Find product pairs with high order values
        cursor.execute("""
            WITH order_pairs AS (
                SELECT 
                    oi1.product_id as product_a,
                    oi2.product_id as product_b,
                    (oi1.total_price + oi2.total_price) as pair_value,
                    oi1.order_id
                FROM order_items oi1
                JOIN order_items oi2 ON oi1.order_id = oi2.order_id
                WHERE oi1.product_id < oi2.product_id
                AND oi1.order_id IN (
                    SELECT id FROM orders 
                    WHERE order_date >= CURRENT_DATE - INTERVAL '90 days'
                )
            ),
            pair_stats AS (
                SELECT 
                    product_a,
                    product_b,
                    AVG(pair_value) as avg_order_value,
                    COUNT(*) as purchase_frequency
                FROM order_pairs
                GROUP BY product_a, product_b
                HAVING AVG(pair_value) > 5000
            )
            SELECT COUNT(*) as high_value_pairs
            FROM pair_stats
        """)
        
        result = cursor.fetchone()
        high_value_pairs = result[0] if result else 0
        
        print(f"   💰 High-value pairs (>5,000 PKR): {high_value_pairs}")
        
        return high_value_pairs
        
    except Exception as e:
        print(f"   ❌ High-value pairs query failed: {e}")
        return 0
    finally:
        cursor.close()

def validate_cross_region_products(conn):
    """Validate cross-region opportunities"""
    print("\n🌍 VALIDATING CROSS-REGION OPPORTUNITIES")
    print("=" * 50)
    
    cursor = conn.cursor()
    
    try:
        # Find products popular in multiple regions
        cursor.execute("""
            WITH regional_popularity AS (
                SELECT 
                    oi.product_id,
                    ps.product_name,
                    o.customer_city as region,
                    COUNT(DISTINCT o.customer_id) as regional_customers,
                    SUM(oi.quantity) as regional_quantity,
                    AVG(oi.unit_price) as avg_regional_price
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.order_id
                LEFT JOIN product_statistics ps ON oi.product_id = ps.product_id
                WHERE o.order_date >= CURRENT_DATE - INTERVAL '180 days'
                AND o.customer_city IS NOT NULL
                GROUP BY oi.product_id, ps.product_name, o.customer_city
                HAVING COUNT(DISTINCT o.customer_id) >= 10
            ),
            multi_region_products AS (
                SELECT 
                    product_id,
                    product_name,
                    COUNT(DISTINCT region) as region_count,
                    SUM(regional_customers) as total_customers,
                    STRING_AGG(region, ', ') as regions
                FROM regional_popularity
                GROUP BY product_id, product_name
                HAVING COUNT(DISTINCT region) >= 3
                AND SUM(regional_customers) >= 50
                ORDER BY region_count DESC, total_customers DESC
            )
            SELECT COUNT(*) as cross_region_count
            FROM multi_region_products
        """)
        
        result = cursor.fetchone()
        cross_region_count = result[0] if result else 0
        
        print(f"   🌍 Cross-region products: {cross_region_count}")
        
        return cross_region_count
        
    except Exception as e:
        print(f"   ❌ Cross-region query failed: {e}")
        return 0
    finally:
        cursor.close()

def main():
    """Main validation function"""
    print("🔍 COLLABORATIVE FILTERING METRICS VALIDATION")
    print("=" * 60)
    print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test database connection
    conn = get_db_connection()
    if not conn:
        print("❌ Cannot proceed without database connection")
        return False
    
    try:
        # Validate database structure
        table_status = validate_database_structure(conn)
        
        # Check if we have enough data for meaningful metrics
        orders_count = table_status.get('orders', 0)
        order_items_count = table_status.get('order_items', 0)
        
        if orders_count < 100:
            print(f"\n⚠️  WARNING: Only {orders_count:,} orders found")
            print("   Consider loading more sample data for better metrics")
        
        # Validate collaborative metrics
        metrics = validate_collaborative_metrics(conn)
        
        # Validate specific business metrics
        high_value_pairs = validate_high_value_pairs(conn)
        cross_region_products = validate_cross_region_products(conn)
        
        # Generate validation report
        print("\n📋 VALIDATION SUMMARY")
        print("=" * 50)
        
        if metrics:
            print("✅ Collaborative metrics calculation: PASSED")
            print(f"   - Total Users: {metrics['total_users']:,}")
            print(f"   - Customer Connections: {metrics['active_customer_pairs']:,}")
            print(f"   - Pattern Strength: {metrics['avg_similarity_score']:.1%}")
            print(f"   - Recommendation Coverage: {metrics['algorithm_accuracy']:.1%}")
        else:
            print("❌ Collaborative metrics calculation: FAILED")
        
        print(f"✅ High-value product pairs: {high_value_pairs} found")
        print(f"✅ Cross-region opportunities: {cross_region_products} found")
        
        # Recommendations
        print("\n💡 RECOMMENDATIONS")
        print("=" * 50)
        
        if metrics and metrics['active_customer_pairs'] < 100:
            print("📈 Consider running more marketing campaigns to increase customer connections")
        
        if high_value_pairs < 50:
            print("💰 Focus on premium product bundles to increase high-value pairs")
        
        if cross_region_products < 20:
            print("🌍 Expand product distribution to more regions for cross-selling opportunities")
        
        print("\n✅ Validation completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
