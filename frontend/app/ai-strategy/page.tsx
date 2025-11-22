"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useBackendSimulation } from "@/hooks/useBackendSimulation";
import Sidebar from "@/components/Sidebar";
import { Loader2, Brain, TrendingUp, AlertTriangle, Target, Zap, Activity, Clock, Fuel, Droplet, Gauge, ThermometerSun, Wind, Trophy, BarChart3, LineChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PredictionData {
  lap_time: number;
  pit_stop_time: number;
  fuel_consumption: number;
  driver_consistency: number;
  weather_impact: number;
  optimal_sector: {
    s1: number;
    s2: number;
    s3: number;
  };
  weather_pit_strategy: string;
  timestamp: string;
  current_lap: number;
}

export default function AIStrategyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  const {
    state: backendState,
    isActive,
    loading: isCheckingSimulation,
  } = useBackendSimulation(userId, 'COTA', {} as any, { pollInterval: 2000 });

  const isRunning = isActive;
  const currentLap = backendState?.current_lap || 0;
  const rawTelemetry = backendState?.raw_telemetry || {};
  const trackName = backendState?.track || 'Unknown';

  useEffect(() => {
    const validateSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/login");
        return;
      }
      setIsValidating(false);
    };

    validateSession();
  }, [router]);

  useEffect(() => {
    if (!isRunning || !userId) return;

    const fetchPredictions = async () => {
      try {
        setLoadingPredictions(true);
        const response = await fetch(`http://localhost:8000/api/simulation/predict?user_id=${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setPredictions(data.data);
        }
      } catch (error) {
      } finally {
        setLoadingPredictions(false);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10000);

    return () => clearInterval(interval);
  }, [isRunning, userId]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-zinc-400">Loading AI Strategy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              AI STRATEGY BRAIN
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              AI-powered race strategy predictions and insights
            </p>
          </div>

          {!isRunning && !isCheckingSimulation && (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center space-y-6 max-w-md">
                <div className="relative">
                  <div className="text-8xl mb-4 animate-pulse">🏎️</div>
                  <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full" />
                </div>
                <h2 className="text-3xl font-bold text-zinc-100 tracking-wider">
                  NO SIMULATION RUNNING
                </h2>
                <p className="text-zinc-400 text-lg">
                  Start your engine and begin racing simulation
                </p>
                <button
                  onClick={() => window.open('/simulation-setup', '_blank')}
                  className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-lg font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  START YOUR CAR
                </button>
              </div>
            </div>
          )}

          {isRunning && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Gauge className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">Current Telemetry</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide font-semibold">
                          CURRENT LAP
                        </div>
                        <div className="text-lg md:text-xl font-bold truncate text-orange-500">
                          {currentLap || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-800/50 font-medium">
                      Live Session
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Fuel className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide font-semibold">
                          FUEL LEFT
                        </div>
                        <div className="text-lg md:text-xl font-bold truncate text-orange-500">
                          {backendState?.fuel ? backendState.fuel.toFixed(1) : '0.0'}L
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-800/50 font-medium">
                      Remaining
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Target className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide font-semibold">
                          TIRE AGE
                        </div>
                        <div className="text-lg md:text-xl font-bold truncate text-orange-500">
                          {backendState?.tire_age || 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-800/50 font-medium">
                      Laps on Tires
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide font-semibold">
                          SPEED
                        </div>
                        <div className="text-lg md:text-xl font-bold truncate text-orange-500">
                          {rawTelemetry.KPH ? Math.round(rawTelemetry.KPH) : 0}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-800/50 font-medium">
                      km/h
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <ThermometerSun className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide font-semibold">
                          TRACK TEMP
                        </div>
                        <div className="text-lg md:text-xl font-bold truncate text-orange-500">
                          {rawTelemetry.TRACK_TEMP ? Math.round(rawTelemetry.TRACK_TEMP) : 0}°C
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-800/50 font-medium">
                      Temperature
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Droplet className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide font-semibold">
                          RAINFALL
                        </div>
                        <div className="text-lg md:text-xl font-bold truncate text-orange-500">
                          {rawTelemetry.RAINFALL_PERCENTAGE ? Math.round(rawTelemetry.RAINFALL_PERCENTAGE) : 0}%
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-800/50 font-medium">
                      Rainfall Level
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">AI Recommendations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded border text-green-500 bg-green-600/10 border-green-600/30">
                        <Target className="w-4 h-4" />
                      </div>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <div className="text-xs text-green-500 font-bold uppercase tracking-wide">Tire Strategy</div>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Tire degradation optimal. Continue current pace. Pit window opens at lap {currentLap + 8}-{currentLap + 12}.
                    </p>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Fuel className="w-4 h-4" />
                      </div>
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      <div className="text-xs text-orange-500 font-bold uppercase tracking-wide">Fuel Management</div>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Reduce 2% consumption to extend pit window by 3 laps. Current rate: {predictions?.fuel_consumption.toFixed(2) || '2.10'}L/lap.
                    </p>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      <div className="text-xs text-orange-500 font-bold uppercase tracking-wide">Position Strategy</div>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Hold position. Overtake window in sector 2 after lap {currentLap + 5}. Gap management critical.
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="border border-zinc-800 rounded-lg bg-zinc-950 p-6 hover:border-orange-600/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">Session Progress</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border border-zinc-800/50 rounded-lg p-3 bg-zinc-900/30">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide font-semibold">Track</p>
                    <p className="text-xl font-bold text-orange-500">{trackName}</p>
                  </div>
                  <div className="border border-zinc-800/50 rounded-lg p-3 bg-zinc-900/30">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide font-semibold">Current Lap</p>
                    <p className="text-xl font-bold text-orange-500">{currentLap}<span className="text-zinc-500 text-sm">/35</span></p>
                  </div>
                  <div className="border border-zinc-800/50 rounded-lg p-3 bg-zinc-900/30">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide font-semibold">Progress</p>
                    <p className="text-xl font-bold text-orange-500">{Math.round((currentLap / 35) * 100)}%</p>
                  </div>
                  <div className="border border-zinc-800/50 rounded-lg p-3 bg-zinc-900/30">
                    <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wide font-semibold">Status</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <p className="text-xl font-bold text-green-500">Active</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="bg-zinc-800/50 rounded-full h-2 overflow-hidden border border-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentLap / 35) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-orange-500"
                    />
                  </div>
                </div>
              </motion.div>

              {currentLap >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">ML Predictions</h3>
                    {loadingPredictions && (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500 ml-2" />
                    )}
                  </div>

                  {predictions ? (
                  <>
                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 mb-4 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-zinc-500 uppercase tracking-wide font-semibold">Next Lap Forecast</p>
                        <h4 className="text-2xl font-bold text-orange-500">Lap {currentLap + 1}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">Based on Current Data</p>
                        <p className="text-sm text-zinc-400">7 ML Models Active</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            NEXT LAP TIME
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            {predictions.lap_time.toFixed(3)}s
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50 font-medium">
                        ML Model: Stacking Regressor
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                          <Fuel className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            FUEL PER LAP
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            {predictions.fuel_consumption.toFixed(2)}L
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50 font-medium">
                        Remaining: {backendState?.fuel ? (backendState.fuel - predictions.fuel_consumption).toFixed(1) : '0.0'}L
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            PIT STOP TIME
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            {predictions.pit_stop_time.toFixed(2)}s
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50 font-medium">
                        Expected Duration
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded border text-green-500 bg-green-600/10 border-green-600/30">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            CONSISTENCY SCORE
                          </div>
                          <div className="text-2xl font-bold text-green-500">
                            {predictions.driver_consistency.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50 font-medium">
                        Performance Stability
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                          <Wind className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            WEATHER IMPACT
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            +{predictions.weather_impact.toFixed(2)}s
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50 font-medium">
                        Time Penalty/Lap
                      </div>
                    </div>

                    <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                          <Target className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            PIT STRATEGY
                          </div>
                          <div className="text-2xl font-bold text-orange-500">
                            {predictions.weather_pit_strategy}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50 font-medium">
                        Recommended Plan
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6 hover:border-orange-600/30 transition-colors mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">Optimal Sector Times</h3>
                      <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full font-bold ml-auto">TARGET</span>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide font-semibold">Sector 1</p>
                        <div className="border border-zinc-800/50 rounded-lg p-4 bg-zinc-900/30">
                          <p className="text-3xl font-bold text-orange-500">{predictions.optimal_sector.s1.toFixed(3)}<span className="text-sm text-zinc-500 ml-1">s</span></p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide font-semibold">Sector 2</p>
                        <div className="border border-zinc-800/50 rounded-lg p-4 bg-zinc-900/30">
                          <p className="text-3xl font-bold text-orange-500">{predictions.optimal_sector.s2.toFixed(3)}<span className="text-sm text-zinc-500 ml-1">s</span></p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide font-semibold">Sector 3</p>
                        <div className="border border-zinc-800/50 rounded-lg p-4 bg-zinc-900/30">
                          <p className="text-3xl font-bold text-orange-500">{predictions.optimal_sector.s3.toFixed(3)}<span className="text-sm text-zinc-500 ml-1">s</span></p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800/50 text-center">
                      <p className="text-xs text-zinc-500">Combined Optimal: <span className="text-orange-500 font-bold">{(predictions.optimal_sector.s1 + predictions.optimal_sector.s2 + predictions.optimal_sector.s3).toFixed(3)}s</span></p>
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6 hover:border-orange-600/30 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <LineChart className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-zinc-100 uppercase tracking-wider">Future Lap Projections</h3>
                      <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full font-bold ml-auto">SIMULATED</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {[1, 2, 3, 4, 5].map((offset) => {
                        const lapNum = currentLap + offset;
                        const projectedTime = predictions.lap_time + (Math.random() * 0.5 - 0.25);
                        const projectedFuel = backendState?.fuel ? backendState.fuel - (predictions.fuel_consumption * offset) : 0;
                        
                        return (
                          <div
                            key={offset}
                            className="border border-zinc-800/50 rounded-lg p-4 bg-zinc-900/30 hover:border-orange-600/30 transition-colors"
                          >
                            <div className="text-center mb-3">
                              <p className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">Lap {lapNum}</p>
                              <div className="h-0.5 bg-orange-500/30 rounded-full" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500">Time:</span>
                                <span className="text-sm font-bold text-orange-500">{projectedTime.toFixed(3)}s</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500">Fuel:</span>
                                <span className="text-sm font-bold text-orange-500">{projectedFuel.toFixed(1)}L</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-zinc-500">Tires:</span>
                                <span className="text-sm font-bold text-orange-500">{(backendState?.tire_age || 0) + offset}L</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>📊 Projections based on current ML predictions and historical patterns</span>
                        <span className="text-orange-500 font-bold">±0.25s variance</span>
                      </div>
                    </div>
                  </div>
                  </>
                  
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Loading predictions...</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
