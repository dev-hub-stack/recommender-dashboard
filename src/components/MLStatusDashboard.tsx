/**
 * ML Status Dashboard Component
 * Displays ML model status, training controls, and algorithm health
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || '';

interface MLStatus {
  is_trained: boolean;
  training_timestamp: string | null;
  model_metadata: {
    training_started?: string;
    training_completed?: string;
    total_training_time_seconds?: number;
    successful_models?: number;
    total_models?: number;
    data_stats?: {
      n_interactions: number;
      n_users: number;
      n_items: number;
    };
    models?: Record<string, {
      status: string;
      training_time_seconds?: number;
      accuracy?: number;
      coverage?: number;
    }>;
  };
  algorithms: {
    collaborative_filtering: boolean;
    content_based: boolean;
    matrix_factorization: boolean;
    popularity_based: boolean;
  };
}

interface MLStatusDashboardProps {
  onTrainingComplete?: () => void;
}

export const MLStatusDashboard: React.FC<MLStatusDashboardProps> = ({ onTrainingComplete }) => {
  const [status, setStatus] = useState<MLStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<string>('');

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/ml/status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setError(null);
      } else {
        setError('Failed to fetch ML status');
      }
    } catch (err) {
      setError('ML service unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Poll status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleTrainModels = async (timeFilter: string = '30days', forceRetrain: boolean = false) => {
    setTraining(true);
    setTrainingProgress('Starting training...');
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/ml/train?time_filter=${timeFilter}&force_retrain=${forceRetrain}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Training failed');
      }

      const data = await response.json();
      setTrainingProgress(`Training complete! ${data.successful_models}/${data.total_models} models trained.`);
      
      // Refresh status
      await fetchStatus();
      
      if (onTrainingComplete) {
        onTrainingComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
      setTrainingProgress('');
    } finally {
      setTraining(false);
    }
  };

  const getAlgorithmStatus = (isActive: boolean, name: string) => {
    const modelInfo = status?.model_metadata?.models?.[name];
    const statusText = modelInfo?.status || (isActive ? 'Ready' : 'Not Trained');
    const accuracy = modelInfo?.accuracy;

    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="font-medium capitalize">{name.replace(/_/g, ' ')}</span>
        </div>
        <div className="flex items-center gap-2">
          {accuracy !== undefined && (
            <span className="text-xs text-gray-500">
              {accuracy.toFixed(1)}% accuracy
            </span>
          )}
          <span className={`text-xs px-2 py-1 rounded ${
            statusText === 'success' || statusText === 'Ready' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {statusText}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Loading ML Status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            ML Recommendation Engine Status
          </CardTitle>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            status?.is_trained 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              status?.is_trained ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            {status?.is_trained ? 'Models Trained' : 'Training Required'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Training Stats */}
        {status?.model_metadata?.data_stats && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {status.model_metadata.data_stats.n_interactions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Interactions</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {status.model_metadata.data_stats.n_users.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {status.model_metadata.data_stats.n_items.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Products</div>
            </div>
          </div>
        )}

        {/* Algorithm Status */}
        <div className="space-y-2">
          <h3 className="font-medium text-gray-700">Algorithm Status</h3>
          <div className="space-y-2">
            {getAlgorithmStatus(status?.algorithms.collaborative_filtering || false, 'collaborative_filtering')}
            {getAlgorithmStatus(status?.algorithms.content_based || false, 'content_based')}
            {getAlgorithmStatus(status?.algorithms.matrix_factorization || false, 'matrix_factorization')}
            {getAlgorithmStatus(status?.algorithms.popularity_based || false, 'popularity_based')}
          </div>
        </div>

        {/* Training Info */}
        {status?.training_timestamp && (
          <div className="text-sm text-gray-500">
            Last trained: {new Date(status.training_timestamp).toLocaleString()}
            {status.model_metadata?.total_training_time_seconds && (
              <span className="ml-2">
                ({status.model_metadata.total_training_time_seconds.toFixed(1)}s)
              </span>
            )}
          </div>
        )}

        {/* Training Progress */}
        {trainingProgress && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            {trainingProgress}
          </div>
        )}

        {/* Training Controls */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => handleTrainModels('30days', false)}
            disabled={training}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              training
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {training ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Training...
              </span>
            ) : (
              'Train Models (30 Days)'
            )}
          </button>
          
          <button
            onClick={() => handleTrainModels('all', true)}
            disabled={training}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              training
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Force Retrain (All Data)
          </button>
          
          <button
            onClick={fetchStatus}
            disabled={training}
            className="px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Pre-computation Section */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-2">⚡ Pre-computed Data</h4>
          <p className="text-sm text-gray-500 mb-3">
            Pre-compute recommendations for instant frontend responses
          </p>
          <button
            onClick={async () => {
              setTrainingProgress('Pre-computing recommendations...');
              try {
                const response = await fetch(
                  `${API_BASE_URL}/api/v1/ml/precompute?time_filter=30days`,
                  { method: 'POST' }
                );
                const data = await response.json();
                if (data.success) {
                  setTrainingProgress(`✅ Pre-computed: ${Object.keys(data.precomputed || {}).join(', ')}`);
                } else {
                  setError('Pre-computation failed');
                }
              } catch (err) {
                setError('Pre-computation failed');
              }
            }}
            disabled={training || !status?.is_trained}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
              training || !status?.is_trained
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            Pre-compute Recommendations
          </button>
        </div>

        {/* A/B Testing Info */}
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-medium text-gray-700 mb-2">🧪 A/B Testing</h4>
          <div className="grid grid-cols-5 gap-2 text-sm">
            <div className="p-2 bg-purple-50 rounded text-center">
              <div className="font-bold text-purple-600">Hybrid</div>
              <div className="text-xs text-gray-500">40%</div>
            </div>
            <div className="p-2 bg-blue-50 rounded text-center">
              <div className="font-bold text-blue-600">Collab</div>
              <div className="text-xs text-gray-500">25%</div>
            </div>
            <div className="p-2 bg-orange-50 rounded text-center">
              <div className="font-bold text-orange-600">Content</div>
              <div className="text-xs text-gray-500">15%</div>
            </div>
            <div className="p-2 bg-green-50 rounded text-center">
              <div className="font-bold text-green-600">SVD</div>
              <div className="text-xs text-gray-500">10%</div>
            </div>
            <div className="p-2 bg-gray-50 rounded text-center">
              <div className="font-bold text-gray-600">Popular</div>
              <div className="text-xs text-gray-500">10%</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Traffic is automatically distributed across algorithms for testing
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLStatusDashboard;
