/**
 * AWS Personalize Recommendations Section
 * Displays ML recommendations from AWS Personalize with province/city/user filters
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://44.201.11.243:8001/api/v1';

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

export const AWSPersonalizeSection: React.FC = () => {
  // State
  const [status, setStatus] = useState<PersonalizeStatus | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
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
  const [activeTab, setActiveTab] = useState<'user' | 'location'>('location');

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
      }
    } catch (err) {
      console.error('Failed to fetch location recommendations:', err);
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

  if (loading) {
    return (
      <section className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">AWS Personalize Recommendations</h2>
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
          <h2 className="text-2xl font-bold text-gray-900">☁️ AWS Personalize Recommendations</h2>
          {status?.is_configured ? (
            <Badge className="bg-green-100 text-green-700 border-green-300">
              ✓ Connected
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-700 border-red-300">
              ✗ Not Configured
            </Badge>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Region: {status?.region || 'N/A'}
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
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('location')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'location'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📍 Location-Based Recommendations
        </button>
        <button
          onClick={() => setActiveTab('user')}
          className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'user'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          👤 User-Specific Recommendations
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
                <p className="text-lg mb-2">📍 Select a Province to see recommendations</p>
                <p className="text-sm">AWS Personalize will show top products for customers in that area</p>
              </div>
            ) : (
              <>
                {/* Aggregated Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>🏆</span> Top Recommended Products for {selectedCity || selectedProvince}
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                        AWS Personalize
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
        ) : (
          /* User-Specific Recommendations */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> Personalized Recommendations
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 text-xs">
                  AWS Personalize
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">👤 Select a Customer to see their recommendations</p>
                  <p className="text-sm">AWS Personalize will generate personalized product suggestions</p>
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
        )}
      </div>
    </section>
  );
};

export default AWSPersonalizeSection;
