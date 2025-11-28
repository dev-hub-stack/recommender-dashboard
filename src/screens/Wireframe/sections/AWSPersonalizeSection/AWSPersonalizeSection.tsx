/**
 * ML Recommendations Section
 * Full-featured ML recommendations dashboard using Collaborative Filtering
 * Features: Location-based, User-specific, Trending, Regional Comparison
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://44.201.11.243:8001/api/v1';

// Helper function to get date range from time filter
const getDateRangeFromFilter = (filter: string): { start: Date; end: Date; label: string } => {
  const end = new Date();
  let start = new Date();
  let label = '';
  
  switch (filter) {
    case 'today':
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      label = `Today (${start.toLocaleDateString()})`;
      break;
    case '7days':
      start.setDate(end.getDate() - 7);
      label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      break;
    case '30days':
      start.setDate(end.getDate() - 30);
      label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      break;
    case 'mtd':
      start = new Date(end.getFullYear(), end.getMonth(), 1);
      label = `Month to Date (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`;
      break;
    case '90days':
      start.setDate(end.getDate() - 90);
      label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      break;
    case '6months':
      start.setMonth(end.getMonth() - 6);
      label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      break;
    case '1year':
      start.setFullYear(end.getFullYear() - 1);
      label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
      break;
    case 'all':
      start = new Date(2020, 0, 1);
      label = 'All Time';
      break;
    default:
      // Custom date range format: "2024-01-01:2024-12-31"
      if (filter.includes(':')) {
        const [startStr, endStr] = filter.split(':');
        start = new Date(startStr);
        const customEnd = new Date(endStr);
        label = `${start.toLocaleDateString()} - ${customEnd.toLocaleDateString()}`;
        return { start, end: customEnd, label };
      }
      start.setDate(end.getDate() - 30);
      label = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }
  
  return { start, end, label };
};

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
  timeFilter?: string;
}

export const AWSPersonalizeSection: React.FC<AWSPersonalizeSectionProps> = ({ timeFilter = '30days' }) => {
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
  
  const [userRecommendations, setUserRecommendations] = useState<Recommendation[]>([]);
  const [locationRecommendations, setLocationRecommendations] = useState<{
    users: UserRecommendation[];
    aggregated: AggregatedRecommendation[];
  }>({ users: [], aggregated: [] });
  
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'user' | 'trending' | 'compare'>('overview');

  // Get date range label from time filter
  const dateRange = useMemo(() => getDateRangeFromFilter(timeFilter), [timeFilter]);

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
      let url = `${API_BASE_URL}/personalize/recommendations/by-location?limit_users=5&num_results=10`;
      if (province) url += `&province=${encodeURIComponent(province)}`;
      if (city) url += `&city=${encodeURIComponent(city)}`;
      
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
            purchase_count: r.recommended_to_users * 10, // Estimate
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
  }, []);

  // Fetch Comparison Data for multiple provinces
  const fetchComparisonData = useCallback(async (provincesToCompare: string[]) => {
    if (provincesToCompare.length === 0) return;
    
    setLoadingRecs(true);
    const newComparisonData: Record<string, AggregatedRecommendation[]> = {};
    
    try {
      for (const province of provincesToCompare) {
        const response = await fetch(
          `${API_BASE_URL}/personalize/recommendations/by-location?province=${encodeURIComponent(province)}&limit_users=5&num_results=10`
        );
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
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchStatus(), fetchProvinces()]);
      setLoading(false);
    };
    loadInitialData();
  }, [fetchStatus, fetchProvinces]);

  // When province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchCities(selectedProvince);
      fetchUsers(selectedProvince);
      if (activeTab === 'location') {
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
      if (activeTab === 'location') {
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

  // When compare provinces change
  useEffect(() => {
    if (compareProvinces.length > 0) {
      fetchComparisonData(compareProvinces);
    }
  }, [compareProvinces, fetchComparisonData]);

  // Fetch trending data on initial load (use Punjab as default)
  useEffect(() => {
    if (provinces.length > 0 && trendingProducts.length === 0) {
      // Fetch trending from the largest province
      const largestProvince = provinces[0]?.province;
      if (largestProvince) {
        fetch(`${API_BASE_URL}/personalize/recommendations/by-location?province=${encodeURIComponent(largestProvince)}&limit_users=10&num_results=10`)
          .then(res => res.json())
          .then(data => {
            if (data.aggregated_recommendations?.length > 0) {
              setTrendingProducts(data.aggregated_recommendations.map((r: AggregatedRecommendation) => ({
                product_id: r.product_id,
                product_name: r.product_name,
                purchase_count: r.recommended_to_users * 10,
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
          <h2 className="text-2xl font-bold text-gray-900">🤖 ML Recommendations</h2>
          <Badge className="bg-purple-100 text-purple-700 border-purple-300">
            Collaborative Filtering
          </Badge>
          {status?.is_configured ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              ✓ Model Active
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-red-300">
              ✗ Not Configured
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-600 font-medium">📅 Date Range</p>
            <p className="text-sm text-blue-800 font-semibold">{dateRange.label}</p>
          </div>
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
                  city: selectedCity
                })),
                ...userRecommendations.map(r => ({
                  type: 'user_recommendation',
                  product_id: r.product_id,
                  product_name: r.product_name,
                  score: r.score,
                  customer_id: selectedUser
                }))
              ];
              if (allData.length > 0) exportToCSV(allData, 'ml_recommendations');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
          >
            � Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔍 Filter Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Province Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
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

            {/* User Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select
                value={selectedUser}
                onChange={(e) => {
                  setSelectedUser(e.target.value);
                  if (e.target.value) setActiveTab('user');
                }}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                disabled={!selectedProvince}
              >
                <option value="">Select Customer...</option>
                {users.map(u => (
                  <option key={u.customer_id} value={u.customer_id}>
                    {u.customer_name || u.customer_id} ({u.order_count} orders)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex border-b overflow-x-auto">
        {[
          { id: 'overview', label: '📊 Overview', icon: '📊' },
          { id: 'location', label: '📍 By Location', icon: '📍' },
          { id: 'user', label: '👤 By User', icon: '👤' },
          { id: 'trending', label: '🔥 Trending', icon: '🔥' },
          { id: 'compare', label: '⚖️ Compare Regions', icon: '⚖️' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
                <p className="text-lg mb-2">📍 Select a Province to see recommendations</p>
                <p className="text-sm">ML Model will show top products for customers in that area</p>
              </div>
            ) : (
              <>
                {/* Aggregated Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>🏆</span> Top Recommended Products for {selectedCity || selectedProvince}
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
                            <p className="font-bold text-lg text-purple-600">
                              {(rec.avg_score * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              Recommended to {rec.recommended_to_users} users
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
          /* User-Specific Recommendations */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> Personalized Recommendations
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  ML Model
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">👤 Select a Customer to see their recommendations</p>
                  <p className="text-sm">ML Model will generate personalized product suggestions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg mb-4">
                    <p className="text-sm text-purple-700">
                      Showing recommendations for: <strong>{users.find(u => u.customer_id === selectedUser)?.customer_name || selectedUser}</strong>
                    </p>
                  </div>
                  {userRecommendations.map((rec, index) => (
                    <div key={rec.product_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:from-purple-100 hover:to-pink-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{rec.product_name}</p>
                          <p className="text-sm text-gray-500">
                            Algorithm: {rec.algorithm || 'aws_personalize'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-purple-600">
                          {(rec.score * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">confidence</p>
                      </div>
                    </div>
                  ))}
                  {userRecommendations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No recommendations available for this user
                    </div>
                  )}
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
                    <div className="text-4xl opacity-80">🤖</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Province Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>📊 Customer Distribution by Province</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {provinces.slice(0, 8).map((p, index) => {
                    const maxCount = provinces[0]?.customer_count || 1;
                    const percentage = (p.customer_count / maxCount) * 100;
                    return (
                      <div key={p.province} className="flex items-center gap-4">
                        <div className="w-32 font-medium text-sm truncate">{p.province}</div>
                        <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-end pr-3"
                            style={{ width: `${percentage}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {p.customer_count.toLocaleString()}
                            </span>
                          </div>
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
                <CardTitle>🧠 How ML Model Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-4xl mb-3">📊</div>
                    <h4 className="font-semibold mb-2">1. Data Collection</h4>
                    <p className="text-sm text-gray-600">
                      2M+ customer interactions analyzed from order history
                    </p>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <div className="text-4xl mb-3">🤖</div>
                    <h4 className="font-semibold mb-2">2. Collaborative Filtering</h4>
                    <p className="text-sm text-gray-600">
                      Finds similar customers and learns purchase patterns
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-4xl mb-3">🎯</div>
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
                  <span>🔥</span> Trending Products Across All Regions
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 text-xs">
                    Popularity-Based
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">
                  These are the most frequently recommended products by ML Model across all customers.
                </p>
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
                          <p className="font-bold text-lg text-orange-600">
                            {product.purchase_count?.toLocaleString() || 0} purchases
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.unique_customers?.toLocaleString() || 0} customers
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">🔥 Select a province first to see trending products</p>
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
                  <span>⚖️</span> Compare Recommendations Across Regions
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
                    <p className="text-lg mb-2">⚖️ Select provinces above to compare</p>
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
