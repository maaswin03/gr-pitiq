'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { MODEL_METADATA, type ModelId } from '@/lib/modelMetadata';
import { 
  Brain, 
  Database, 
  TrendingUp, 
  Activity, 
  Zap, 
  Download,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  CloudRain,
  Gauge,
  Flag
} from 'lucide-react';

export default function ModelInsightsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelId>('lap_time_predictor');
  const metadata = MODEL_METADATA[selectedModel];

  const models = [
    { id: 'lap_time_predictor' as ModelId, name: 'Lap Time Predictor', icon: Clock, description: 'Predict lap times based on conditions' },
    { id: 'driver_consistency' as ModelId, name: 'Driver Consistency', icon: TrendingUp, description: 'Analyze driver performance consistency' },
    { id: 'fuel_consumption_predictor' as ModelId, name: 'Fuel Consumption', icon: Zap, description: 'Forecast fuel usage per lap' },
    { id: 'weather_impact_predictor' as ModelId, name: 'Weather Impact', icon: CloudRain, description: 'Assess weather effects on performance' },
    { id: 'pit_stop_time_predictor' as ModelId, name: 'Pit Stop Time', icon: Gauge, description: 'Estimate pit stop duration' },
    { id: 'weather_pit_strategy' as ModelId, name: 'Weather Pit Strategy', icon: Brain, description: 'Optimize pit strategy for weather' },
    { id: 'optimal_sector_predictor' as ModelId, name: 'Optimal Sector', icon: Target, description: 'Predict optimal sector times' },
    { id: 'position_metadata' as ModelId, name: 'Position Predictor', icon: Flag, description: 'Forecast race position changes' },
    { id: 'weather_pit_strategy_predictor' as ModelId, name: 'Pit Strategy Alt', icon: Activity, description: 'Alternative pit strategy model' },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const downloadMetadata = () => {
    if (!metadata) return;
    const dataStr = JSON.stringify(metadata, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${selectedModel}_metadata.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
                  MODEL INSIGHTS
                </h1>
                <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
                  Comprehensive ML model analytics and metadata
                </p>
              </div>
              {metadata && (
                <button
                  onClick={downloadMetadata}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {models.map((model) => {
              const Icon = model.icon;
              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedModel === model.id
                      ? 'border-orange-500 bg-orange-950/30'
                      : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${
                    selectedModel === model.id ? 'text-orange-500' : 'text-zinc-400'
                  }`} />
                  <p className={`text-xs text-center font-medium ${
                    selectedModel === model.id ? 'text-orange-400' : 'text-zinc-400'
                  }`}>
                    {model.name}
                  </p>
                </button>
              );
            })}
          </div>

          {metadata ? (
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
                  <Brain className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-zinc-100">Model Design</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-2">MODEL TYPE</p>
                    <p className="text-lg font-bold text-orange-500 font-rajdhani">
                      {metadata.model_type || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-2">FEATURES</p>
                    <p className="text-lg font-bold text-orange-500 font-rajdhani">
                      {metadata.num_features}
                    </p>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
                    <p className="text-xs text-zinc-500 mb-2">TARGET</p>
                    <p className="text-lg font-bold text-orange-500 font-rajdhani">
                      {metadata.target_variable || 'N/A'}
                    </p>
                  </div>
                </div>
                {metadata.base_models && (
                  <div className="mt-4">
                    <p className="text-xs text-zinc-500 mb-2">BASE MODELS</p>
                    <div className="flex gap-2 flex-wrap">
                      {metadata.base_models.map((model, idx) => (
                        <span key={idx} className="px-3 py-1 bg-zinc-950 border border-zinc-700 rounded text-sm text-zinc-300">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
                  <CheckCircle className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-zinc-100">Evaluation</h2>
                </div>
                <div className="space-y-3">
                  {'test_metrics' in metadata && metadata.test_metrics && Object.entries(metadata.test_metrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-zinc-800">
                      <span className="text-sm text-zinc-400">{key.toUpperCase()}</span>
                      <span className="text-sm font-bold text-orange-500">
                        {typeof value === 'number' ? value.toFixed(4) : String(value)}
                      </span>
                    </div>
                  ))}
                  {'cv_scores' in metadata && metadata.cv_scores && (
                    <div className="mt-3">
                      <p className="text-xs text-zinc-500 mb-2">CV SCORES</p>
                      {'cv_scores' in metadata && metadata.cv_scores && Object.entries(metadata.cv_scores).map(([model, scores]) => (
                        <div key={model} className="mb-2">
                          <p className="text-xs font-bold text-zinc-400 mb-1">{model}</p>
                          {typeof scores === 'object' && scores && Object.entries(scores).map(([metric, val]) => (
                            <div key={metric} className="flex justify-between text-xs py-1">
                              <span className="text-zinc-500">{metric}</span>
                              <span className="text-orange-400">{typeof val === 'number' ? val.toFixed(4) : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
              >
                <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
                  <Zap className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-zinc-100">Feature Engineering</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-96 overflow-y-auto">
                  {metadata.feature_names.map((feature, idx) => (
                    <div key={idx} className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-300">
                      {feature}
                    </div>
                  ))}
                </div>
              </motion.div>

              {metadata.feature_importance && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
                >
                  <div className="flex items-center gap-3 mb-3 border-b border-zinc-800 pb-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-bold text-zinc-100">Explainability</h2>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(metadata.feature_importance)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 15)
                      .map(([feature, importance], idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-sm text-zinc-400 w-48 truncate">{feature}</span>
                          <div className="flex-1 h-6 bg-zinc-950 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500"
                              style={{ width: `${(importance as number) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-orange-500 font-mono w-16 text-right">
                            {((importance as number) * 100).toFixed(2)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {/* Production Pipeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
                  <Activity className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-bold text-zinc-100">Production Pipeline</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Status</p>
                      <p className="text-sm font-bold text-green-500">Deployed</p>
                    </div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <Database className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Backend</p>
                      <p className="text-sm font-bold text-blue-400">Flask API</p>
                    </div>
                  </div>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 flex items-center gap-3">
                    <Activity className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-xs text-zinc-500">Format</p>
                      <p className="text-sm font-bold text-orange-400">Pickle (.pkl)</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-zinc-600 mb-4" />
              <p className="text-zinc-500">No metadata available for this model</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
