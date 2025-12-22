/**
 * ML Recommendations Section
 * Full-featured ML recommendations dashboard using Collaborative Filtering
 * Features: Location-based, User-specific, Trending, Regional Comparison
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  Cpu, MapPin, User, GitCompare, Search, 
  Info, Brain, BarChart3, Flame, Target, Award, Download
} from 'lucide-react';
import { MultiSelectFilter } from '../../../../components/MultiSelectFilter';
import { getProductCategories, ProductCategory } from '../../../../services/api';
import { InfoTooltip } from '../../../../components/Tooltip';

// API Configuration - Use environment variable or relative path for Netlify proxy
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// CSV Export helper
const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Types
interface Recommendation {
  product_id: string;
  product_name: string;
  score: number;
  algorithm?: string;
}

interface Province {
  province: string;
  order_count: number;
  customer_count: number;
}

interface City {
  city: string;
  province: string;
  order_count: number;
  customer_count: number;
}

interface User {
  customer_id: string;
  customer_name: string;
  city: string;
  province: string;
  order_count: number;
  total_spent: number;
}

// RFM Customer Segments
interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: string;
  color: string;
}

const RFM_SEGMENTS: CustomerSegment[] = [
  { id: 'champions', name: 'Champions', description: 'Best customers - high value, frequent, recent', criteria: 'R≤30, F≥5, M≥50K', color: 'bg-green-500' },
  { id: 'loyal', name: 'Loyal Customers', description: 'Regular buyers with good spending', criteria: 'R≤60, F≥3, M≥30K', color: 'bg-blue-500' },
  { id: 'potential', name: 'Potential Loyalists', description: 'Recent customers with growth potential', criteria: 'R≤30, F≥2', color: 'bg-purple-500' },
  { id: 'new', name: 'New Customers', description: 'First-time buyers', criteria: 'F=1, R≤30', color: 'bg-cyan-500' },
  { id: 'at_risk', name: 'At Risk', description: 'Good customers who haven\'t purchased recently', criteria: 'R>90, F≥3, M≥20K', color: 'bg-orange-500' },
  { id: 'hibernating', name: 'Hibernating', description: 'Low activity, need re-engagement', criteria: 'R>120, F≤2', color: 'bg-yellow-500' },
  { id: 'lost', name: 'Lost', description: 'Haven\'t purchased in a long time', criteria: 'R>180', color: 'bg-red-500' },
];

interface UserRecommendation {
  customer_id: string;
  customer_name: string;
  city: string;
  province: string;
  recommendations: Recommendation[];
}

interface AggregatedRecommendation {
  product_id: string;
  product_name: string;
  avg_score: number;
  recommended_to_users: number;
}

interface PersonalizeStatus {
  is_configured: boolean;
  region: string;
  campaign_arn: string;
}

interface TrendingProduct {
  product_id: string;
  product_name: string;
  purchase_count: number;
  unique_customers: number;
  total_revenue: number;
}

interface AWSPersonalizeSectionProps {
  // No props needed - ML uses all historical data
}

export const AWSPersonalizeSection: React.FC<AWSPersonalizeSectionProps> = () => {
  // State
  const [status, setStatus] = useState<PersonalizeStatus | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<TrendingProduct[]>([]);
  const [compareProvinces, setCompareProvinces] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<Record<string, AggregatedRecommendation[]>>({});
  
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const selectedCategory = selectedCategories.length === 1 ? selectedCategories[0] : 
                          selectedCategories.length > 1 ? selectedCategories.join(',') : '';
  
  const [userRecommendations, setUserRecommendations] = useState<Recommendation[]>([]);
  const [locationRecommendations, setLocationRecommendations] = useState<{
    users: UserRecommendation[];
    aggregated: AggregatedRecommendation[];
  }>({ users: [], aggregated: [] });
  
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'user' | 'trending' | 'compare'>('overview');

  // Fetch Personalize Status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/personalize/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch Personalize status:', err);
    }
  }, []);

  // Fetch Provinces
  const fetchProvinces = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/locations/provinces`);
      if (response.ok) {
        const data = await response.json();
        setProvinces(data.provinces || []);
      }
    } catch (err) {
      console.error('Failed to fetch provinces:', err);
    }
  }, []);

  // Fetch Cities
  const fetchCities = useCallback(async (province?: string) => {
    try {
      const url = province 
        ? `${API_BASE_URL}/locations/cities?province=${encodeURIComponent(province)}`
        : `${API_BASE_URL}/locations/cities`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCities(data.cities || []);
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err);
    }
  }, []);

  // Fetch Users
  const fetchUsers = useCallback(async (province?: string, city?: string) => {
    try {
      let url = `${API_BASE_URL}/locations/users?limit=50`;
      if (province) url += `&province=${encodeURIComponent(province)}`;
      if (city) url += `&city=${encodeURIComponent(city)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  // Fetch User Recommendations
  const fetchUserRecommendations = useCallback(async (userId: string) => {
    setLoadingRecs(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/personalize/recommendations/${encodeURIComponent(userId)}?num_results=10`
      );
      if (response.ok) {
        const data = await response.json();
        setUserRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error('Failed to fetch user recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, []);

  // Fetch Location-based Recommendations
  const fetchLocationRecommendations = useCallback(async (province?: string, city?: string) => {
    if (!province && !city) return;
    
    setLoadingRecs(true);
    try {
      let url = `${API_BASE_URL}/personalize/recommendations/by-location?limit_users=50&num_results=10`;
      if (province) url += `&province=${encodeURIComponent(province)}`;
      if (city) url += `&city=${encodeURIComponent(city)}`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLocationRecommendations({
          users: data.users || [],
          aggregated: data.aggregated_recommendations || []
        });
        // Also update trending with aggregated data
        if (data.aggregated_recommendations?.length > 0) {
          setTrendingProducts(data.aggregated_recommendations.map((r: AggregatedRecommendation) => ({
            product_id: r.product_id,
            product_name: r.product_name,
            purchase_count: r.recommended_to_users, // Actual recommendation count
            unique_customers: r.recommended_to_users,
            total_revenue: 0
          })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch location recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, [selectedCategory]);

  // Fetch Segment-based Recommendations
  const fetchSegmentRecommendations = useCallback(async (segment: string, province?: string, city?: string) => {
    if (!segment) return;
    
    setLoadingRecs(true);
    try {
      let url = `${API_BASE_URL}/personalize/recommendations/by-segment?segment=${encodeURIComponent(segment)}&limit=10`;
      if (province) url += `&province=${encodeURIComponent(province)}`;
      if (city) url += `&city=${encodeURIComponent(city)}`;
      if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLocationRecommendations({
          users: [],
          aggregated: data.aggregated_recommendations || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch segment recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, [selectedCategory]);

  // Fetch Comparison Data for multiple provinces
  const fetchComparisonData = useCallback(async (provincesToCompare: string[]) => {
    if (provincesToCompare.length === 0) return;
    
    setLoadingRecs(true);
    const newComparisonData: Record<string, AggregatedRecommendation[]> = {};
    
    try {
      for (const province of provincesToCompare) {
        let url = `${API_BASE_URL}/personalize/recommendations/by-location?province=${encodeURIComponent(province)}&limit_users=50&num_results=10`;
        if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          newComparisonData[province] = data.aggregated_recommendations || [];
        }
      }
      setComparisonData(newComparisonData);
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
    } finally {
      setLoadingRecs(false);
    }
  }, [selectedCategory]);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchProvinces(), getProductCategories().then(setCategories)]);
      setLoading(false);
    };
    loadInitialData();
  }, [fetchStatus, fetchProvinces]);

  // When province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
      fetchUsers(selectedProvince);
      // Fetch for both location and trending tabs
      if (activeTab === 'location' || activeTab === 'trending') {
        fetchLocationRecommendations(selectedProvince);
      }
    } else {
      setCities([]);
      setUsers([]);
    }
    setSelectedCity('');
    setSelectedUser('');
  }, [selectedProvince, fetchCities, fetchUsers, fetchLocationRecommendations, activeTab]);

  // When city changes
  useEffect(() => {
    if (selectedCity) {
      fetchUsers(selectedProvince, selectedCity);
      // Fetch for both location and trending tabs
      if (activeTab === 'location' || activeTab === 'trending') {
        fetchLocationRecommendations(selectedProvince, selectedCity);
      }
    }
    setSelectedUser('');
  }, [selectedCity, selectedProvince, fetchUsers, fetchLocationRecommendations, activeTab]);

  // When user changes
  useEffect(() => {
    if (selectedUser) {
      fetchUserRecommendations(selectedUser);
    } else {
      setUserRecommendations([]);
    }
  }, [selectedUser, fetchUserRecommendations]);

  // When segment changes - fetch segment-based recommendations
  useEffect(() => {
    if (selectedSegment) {
      fetchSegmentRecommendations(selectedSegment, selectedProvince || undefined, selectedCity || undefined);
    }
  }, [selectedSegment, selectedProvince, selectedCity, fetchSegmentRecommendations]);

  // When compare provinces or category change
  useEffect(() => {
    if (compareProvinces.length > 0) {
      fetchComparisonData(compareProvinces);
    }
  }, [compareProvinces, selectedCategory, fetchComparisonData]);

  // When switching to trending tab with province already selected or category changes
  useEffect(() => {
    if (activeTab === 'trending' && selectedProvince) {
      fetchLocationRecommendations(selectedProvince, selectedCity || undefined);
    }
  }, [activeTab, selectedProvince, selectedCity, selectedCategory, fetchLocationRecommendations]);

  // Fetch trending data on initial load (use Punjab as default)
  useEffect(() => {
    if (provinces.length > 0 && trendingProducts.length === 0) {
      // Fetch trending from the largest province
      const largestProvince = provinces[0]?.province;
      if (largestProvince) {
        let url = `${API_BASE_URL}/personalize/recommendations/by-location?province=${encodeURIComponent(largestProvince)}&limit_users=50&num_results=10`;
        if (selectedCategory) url += `&category=${encodeURIComponent(selectedCategory)}`;
        
        fetch(url)
          .then(res => res.json())
          .then(data => {
            if (data.aggregated_recommendations?.length > 0) {
              setTrendingProducts(data.aggregated_recommendations.map((r: AggregatedRecommendation) => ({
                product_id: r.product_id,
                product_name: r.product_name,
                purchase_count: r.recommended_to_users, // Actual recommendation count
                unique_customers: r.recommended_to_users,
                total_revenue: 0
              })));
            }
          })
          .catch(err => console.error('Failed to fetch trending:', err));
      }
    }
  }, [provinces, trendingProducts.length]);

  if (loading) {
    return (
      <section className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">ML Model Recommendations</h2>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 bg-gray-100" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Cpu className="w-6 h-6" /> ML Recommendations</h2>
          <Badge className="bg-purple-100 text-purple-700 border-purple-300">
            Collaborative Filtering
          </Badge>
          {status?.is_configured ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              ✓ ML Model Active
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
              ⏳ Loading Model...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const allData = [
                ...locationRecommendations.aggregated.map(r => ({
                  type: 'location_recommendation',
                  product_id: r.product_id,
                  product_name: r.product_name,
                  score: r.avg_score,
                  recommended_to_users: r.recommended_to_users,
                  province: selectedProvince,
                  city: selectedCity,
                  category: selectedCategory || 'All'
                })),
                ...userRecommendations.map(r => ({
                  type: 'user_recommendation',
                  product_id: r.product_id,
                  product_name: r.product_name,
                  score: r.score,
                  customer_id: selectedUser,
                  category: selectedCategory || 'All'
                })),
                ...trendingProducts.map(r => ({
                  type: 'trending_product',
                  product_id: r.product_id,
                  product_name: r.product_name,
                  purchase_count: r.purchase_count,
                  unique_customers: r.unique_customers,
                  total_revenue: r.total_revenue,
                  province: selectedProvince || 'All',
                  category: selectedCategory || 'All'
                }))
              ];
              if (allData.length > 0) exportToCSV(allData, `ml_recommendations_${selectedCategory || 'all'}_${selectedProvince || 'all'}`);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            � Export CSV
          </button>
        </div>
      </div>

      {/* ML Info Banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Brain className="w-6 h-6 text-purple-600" />
          <div>
            <p className="font-medium text-purple-900">Powered by Machine Learning</p>
            <p className="text-sm text-purple-700 mt-1">
              Recommendations are generated using <strong>ML algorithms</strong> trained on <strong>180,000+ users</strong> and <strong>4,000+ products</strong>. 
              Select a location below to see trending products and personalized recommendations for that region.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5" /> Filter by Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <MultiSelectFilter
                options={categories.slice(0, 20).map(cat => ({
                  value: cat.category,
                  label: cat.category,
                  count: (cat as any).product_count || (cat as any).count
                }))}
                selectedValues={selectedCategories}
                onChange={setSelectedCategories}
                placeholder="All Categories"
              />
            </div>
            
            {/* Province Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Province...</option>
                {provinces.map(p => (
                  <option key={p.province} value={p.province}>
                    {p.province} ({p.customer_count} customers)
                  </option>
                ))}
              </select>
            </div>

            {/* City Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                disabled={!selectedProvince}
              >
                <option value="">Select City...</option>
                {cities.map(c => (
                  <option key={c.city} value={c.city}>
                    {c.city} ({c.customer_count} customers)
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Segment Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Segment</label>
              <select
                value={selectedSegment}
                onChange={(e) => {
                  setSelectedSegment(e.target.value);
                  if (e.target.value) setActiveTab('user');
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                disabled={!selectedProvince}
              >
                <option value="">Select Segment...</option>
                {RFM_SEGMENTS.map(segment => (
                  <option key={segment.id} value={segment.id}>
                    {segment.name} - {segment.description}
                  </option>
                ))}
              </select>
              {selectedSegment && (
                <p className="text-xs text-gray-500 mt-1">
                  Criteria: {RFM_SEGMENTS.find(s => s.id === selectedSegment)?.criteria}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'overview' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Overview
        </button>
        <button
          onClick={() => setActiveTab('location')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'location' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="w-4 h-4" /> By Location
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'user' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Target className="w-4 h-4" /> By Segment
        </button>
        <button
          onClick={() => setActiveTab('trending')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'trending' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Flame className="w-4 h-4" /> Trending
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'compare' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <GitCompare className="w-4 h-4" /> Compare Regions
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loadingRecs ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          </div>
        ) : activeTab === 'location' ? (
          /* Location-Based Recommendations */
          <div className="space-y-6">
            {!selectedProvince ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2 flex items-center gap-2"><MapPin className="w-5 h-5" /> Select a Province to see recommendations</p>
                <p className="text-sm">ML Model will show top products for customers in that area</p>
              </div>
            ) : (
              <>
                {/* Aggregated Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-500" /> Top Recommended Products for {selectedCity || selectedProvince}
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                        ML Model
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {locationRecommendations.aggregated.map((rec, index) => (
                        <div key={rec.product_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-purple-500'
                            }`}>
                              #{index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{rec.product_name}</p>
                              <p className="text-sm text-gray-500">ID: {rec.product_id}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-purple-600 flex items-center gap-1">
                              {Math.round((rec.recommended_to_users / 50) * 100)}% Match Rate
                              <InfoTooltip text="Match Rate = % of sampled users who could receive this as a top recommendation. Higher % = stronger regional potential. This shows opportunity, not actual recommendations delivered." />
                            </p>
                            <p className={`text-xs font-medium ${
                              rec.recommended_to_users >= 40 ? 'text-green-600' : 
                              rec.recommended_to_users >= 20 ? 'text-blue-600' : 'text-gray-500'
                            }`}>
                              {rec.recommended_to_users >= 40 ? '🔥 High Regional Affinity' : 
                               rec.recommended_to_users >= 20 ? '✓ Medium Regional Affinity' : 
                               'Low Regional Affinity'}
                              <InfoTooltip text={
                                rec.recommended_to_users >= 40 ? 'High: Stock more of this product in this region' :
                                rec.recommended_to_users >= 20 ? 'Medium: Good regional demand, consider promotions' :
                                'Low: Niche interest, targeted marketing may help'
                              } />
                            </p>
                          </div>
                        </div>
                      ))}
                      {locationRecommendations.aggregated.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          No recommendations available for this location
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Per-User Breakdown */}
                {locationRecommendations.users.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>👥 Per-Customer Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {locationRecommendations.users.map(user => (
                          <div key={user.customer_id} className="border rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                                {user.customer_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-medium">{user.customer_name || 'Unknown'}</p>
                                <p className="text-xs text-gray-500">{user.city}, {user.province}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {user.recommendations.slice(0, 5).map((rec, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {rec.product_name || rec.product_id}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        ) : activeTab === 'user' ? (
          /* Segment-Based Recommendations */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> Segment-Based Recommendations
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  RFM Targeting
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedSegment ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">🎯 Select a Customer Segment to see targeted recommendations</p>
                  <p className="text-sm mb-6">Target specific customer groups based on RFM analysis</p>
                  
                  {/* Segment Cards Preview */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                    {RFM_SEGMENTS.slice(0, 4).map(segment => (
                      <div 
                        key={segment.id}
                        onClick={() => {
                          setSelectedSegment(segment.id);
                        }}
                        className="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow text-left"
                      >
                        <div className={`w-3 h-3 rounded-full ${segment.color} mb-2`}></div>
                        <p className="font-medium text-sm text-gray-800">{segment.name}</p>
                        <p className="text-xs text-gray-500">{segment.criteria}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Segment Info */}
                  <div className={`p-4 rounded-lg ${RFM_SEGMENTS.find(s => s.id === selectedSegment)?.color.replace('bg-', 'bg-opacity-10 bg-')} border`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${RFM_SEGMENTS.find(s => s.id === selectedSegment)?.color}`}></div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {RFM_SEGMENTS.find(s => s.id === selectedSegment)?.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {RFM_SEGMENTS.find(s => s.id === selectedSegment)?.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        📍 {selectedProvince || 'All Provinces'} {selectedCity ? `> ${selectedCity}` : ''}
                      </span>
                      <span className="text-gray-500">
                        📊 Criteria: {RFM_SEGMENTS.find(s => s.id === selectedSegment)?.criteria}
                      </span>
                    </div>
                  </div>

                  {/* Recommended Products for Segment */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-700">Top Products for this Segment:</h4>
                    {locationRecommendations.aggregated.length > 0 ? (
                      locationRecommendations.aggregated.slice(0, 10).map((rec, index) => (
                        <div key={rec.product_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{rec.product_name}</p>
                              <p className="text-sm text-gray-500">
                                Recommended to {rec.recommended_to_users} customers in segment
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-purple-600">
                              {rec.recommended_to_users} users
                            </p>
                            <p className="text-xs text-gray-500">Segment Reach</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p>Select a province/city to see segment-specific recommendations</p>
                      </div>
                    )}
                  </div>

                  {/* Segment Marketing Tips */}
                  <div className="p-4 bg-blue-50 rounded-lg mt-4">
                    <h4 className="font-medium text-blue-800 mb-2">💡 Marketing Tips for {RFM_SEGMENTS.find(s => s.id === selectedSegment)?.name}</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {selectedSegment === 'champions' && (
                        <>
                          <li>• Offer exclusive early access to new products</li>
                          <li>• Create VIP loyalty rewards program</li>
                          <li>• Ask for referrals and reviews</li>
                        </>
                      )}
                      {selectedSegment === 'loyal' && (
                        <>
                          <li>• Upsell premium products</li>
                          <li>• Offer bundle deals</li>
                          <li>• Invite to loyalty program</li>
                        </>
                      )}
                      {selectedSegment === 'at_risk' && (
                        <>
                          <li>• Send win-back campaigns with special offers</li>
                          <li>• Personalized "We miss you" emails</li>
                          <li>• Offer time-limited discounts</li>
                        </>
                      )}
                      {selectedSegment === 'new' && (
                        <>
                          <li>• Welcome series with product education</li>
                          <li>• First-purchase discount for second order</li>
                          <li>• Showcase best-sellers and reviews</li>
                        </>
                      )}
                      {selectedSegment === 'lost' && (
                        <>
                          <li>• Deep discount reactivation offers</li>
                          <li>• Survey to understand why they left</li>
                          <li>• Highlight new products since last purchase</li>
                        </>
                      )}
                      {!['champions', 'loyal', 'at_risk', 'new', 'lost'].includes(selectedSegment) && (
                        <>
                          <li>• Personalized product recommendations</li>
                          <li>• Targeted promotions based on purchase history</li>
                          <li>• Re-engagement campaigns</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : activeTab === 'overview' ? (
          /* Overview Tab */
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Provinces</p>
                      <p className="text-3xl font-bold">{provinces.length}</p>
                    </div>
                    <div className="text-4xl opacity-80">🗺️</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-pink-100 text-sm">Total Customers</p>
                      <p className="text-3xl font-bold">
                        {provinces.reduce((sum, p) => sum + p.customer_count, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-4xl opacity-80">👥</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Orders</p>
                      <p className="text-3xl font-bold">
                        {provinces.reduce((sum, p) => sum + p.order_count, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-4xl opacity-80">📦</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">ML Model</p>
                      <p className="text-xl font-bold">User-Personalization</p>
                    </div>
                    <Brain className="w-12 h-12 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Province Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Customer Distribution by Province</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {provinces.slice(0, 8).map((p) => {
                    const maxCount = provinces[0]?.customer_count || 1;
                    const percentage = (p.customer_count / maxCount) * 100;
                    const isSmallBar = percentage < 15;
                    
                    return (
                      <div key={p.province} className="flex items-center gap-4">
                        <div className="w-32 font-medium text-sm truncate">{p.province}</div>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-end pr-3"
                              style={{ width: `${percentage}%`, minWidth: isSmallBar ? '4px' : 'auto' }}
                            >
                              {!isSmallBar && (
                                <span className="text-white text-xs font-medium">
                                  {p.customer_count.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                          {isSmallBar && (
                            <span className="text-gray-600 text-xs font-medium w-16">
                              {p.customer_count.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="w-20 text-right text-sm text-gray-500">
                          {p.order_count.toLocaleString()} orders
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> How ML Model Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <BarChart3 className="w-10 h-10 mb-3 text-purple-600" />
                    <h4 className="font-semibold mb-2">1. Data Collection</h4>
                    <p className="text-sm text-gray-600">
                      2M+ customer interactions analyzed from order history
                    </p>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <Cpu className="w-10 h-10 mb-3 text-purple-600" />
                    <h4 className="font-semibold mb-2">2. Collaborative Filtering</h4>
                    <p className="text-sm text-gray-600">
                      Finds similar customers and learns purchase patterns
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="w-10 h-10 mb-3 text-purple-600" />
                    <h4 className="font-semibold mb-2">3. Real-time Inference</h4>
                    <p className="text-sm text-gray-600">
                      Personalized recommendations generated in milliseconds
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'trending' ? (
          /* Trending Products Tab */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" /> Trending Products Across All Regions
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs">
                    Popularity-Based
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  These are the most popular products recommended by ML across customers{selectedProvince ? ` in ${selectedProvince}` : ''}{selectedCity ? `, ${selectedCity}` : ''}{selectedCategory ? ` (${selectedCategory})` : ''}.
                </p>
                
                {/* How It Works Info Box */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="w-6 h-6 text-blue-600" />
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-blue-900">How It Works:</p>
                        <ul className="text-sm text-blue-800 list-disc list-inside space-y-1 mt-1">
                          <li>ML algorithms analyzed <strong>180,000+ users</strong> and their purchase history</li>
                          <li>For users in <strong>{selectedProvince || 'the selected region'}</strong>, we sample 50 customers in real-time</li>
                          <li><strong>Match Rate</strong> = % of sampled users who could receive this as a top recommendation</li>
                          <li><strong>100% Match Rate</strong> = Every sampled customer matches this product profile = Very High Regional Potential</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">What This Means for You:</p>
                        <ul className="text-sm text-purple-800 list-disc list-inside space-y-1 mt-1">
                          <li><strong>🔥 High Affinity (80%+)</strong>: Stock more of this product in this region</li>
                          <li><strong>✓ Medium Affinity (40-79%)</strong>: Good regional demand, consider promotions</li>
                          <li><strong>Low Affinity (&lt;40%)</strong>: Niche interest, targeted marketing may help</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                
                {trendingProducts.length > 0 ? (
                  <div className="space-y-3">
                    {trendingProducts.map((product, index) => (
                      <div key={product.product_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-orange-500'
                          }`}>
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.product_name}</p>
                            <p className="text-sm text-gray-500">ID: {product.product_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-orange-600 flex items-center gap-1">
                            {Math.round(((product.purchase_count || 0) / 50) * 100)}% Match Rate
                            <InfoTooltip text="Match Rate = % of sampled users who could receive this as a top recommendation. Higher % = stronger regional potential. This shows opportunity, not actual recommendations delivered." />
                          </p>
                          <p className={`text-xs font-medium ${
                            (product.purchase_count || 0) >= 40 ? 'text-green-600' : 
                            (product.purchase_count || 0) >= 20 ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {(product.purchase_count || 0) >= 40 ? '🔥 High Regional Affinity' : 
                             (product.purchase_count || 0) >= 20 ? '✓ Medium Regional Affinity' : 
                             'Low Regional Affinity'}
                            <InfoTooltip text={
                              (product.purchase_count || 0) >= 40 ? 'High: Stock more of this product in this region' :
                              (product.purchase_count || 0) >= 20 ? 'Medium: Good regional demand, consider promotions' :
                              'Low: Niche interest, targeted marketing may help'
                            } />
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2 flex items-center gap-2"><Flame className="w-5 h-5" /> Select a province first to see trending products</p>
                    <p className="text-sm">Trending data is aggregated from location-based recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : activeTab === 'compare' ? (
          /* Compare Regions Tab */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5 text-blue-500" /> Compare Recommendations Across Regions
                  <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 text-xs">
                    Regional Analysis
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <p className="text-gray-500 mb-4">
                    Select multiple provinces to compare what products are recommended in each region.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {provinces.slice(0, 6).map(p => (
                      <button
                        key={p.province}
                        onClick={() => {
                          if (compareProvinces.includes(p.province)) {
                            setCompareProvinces(compareProvinces.filter(x => x !== p.province));
                          } else if (compareProvinces.length < 3) {
                            setCompareProvinces([...compareProvinces, p.province]);
                          }
                        }}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          compareProvinces.includes(p.province)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {p.province}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Select up to 3 provinces to compare</p>
                </div>

                {compareProvinces.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {compareProvinces.map(province => (
                      <Card key={province} className="border-2 border-purple-200">
                        <CardHeader className="bg-purple-50">
                          <CardTitle className="text-lg">{province}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {comparisonData[province]?.length > 0 ? (
                            <div className="space-y-2">
                              {comparisonData[province].slice(0, 5).map((rec, i) => (
                                <div key={rec.product_id} className="flex items-center gap-2 text-sm">
                                  <span className="font-bold text-purple-600">{i + 1}.</span>
                                  <span className="truncate">{rec.product_name}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">Loading...</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2 flex items-center gap-2"><GitCompare className="w-5 h-5" /> Select provinces above to compare</p>
                    <p className="text-sm">See how recommendations differ across regions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default AWSPersonalizeSection;
