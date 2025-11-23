'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Play, ExternalLink, Fuel, Gauge, AlertTriangle, Droplets, Thermometer, TrendingDown, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useSimulation } from '@/contexts/SimulationContext';
import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/ui/loading-screen';
import PitWallOverview from '@/components/pit-wall/PitWallOverview';
import AlertsSystem from '@/components/pit-wall/AlertsSystem';
import FuelProjection from '@/components/pit-wall/FuelProjection';
import TireDegradation from '@/components/pit-wall/TireDegradation';
import WeatherForecast from '@/components/pit-wall/WeatherForecast';
import SectorStrategy from '@/components/pit-wall/SectorStrategy';
import DriverStrategyInsight from '@/components/pit-wall/DriverStrategyInsight';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'normal';
  icon: React.ReactNode;
  message: string;
  timestamp: number;
}

export default function PitWallPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [prevState, setPrevState] = useState<any>(null);
  
  // Use centralized simulation context (no polling overhead)
  const {
    state: backendState,
    isActive,
    loading,
    laps: lapHistory,
  } = useSimulation();
  
  // Redirect to login if no user
  useEffect(() => {
    if (!authLoading && !user?.id) {
      // Clear localStorage before redirect
      localStorage.removeItem('hasSession');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('debug_userId');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sim_active_')) {
          localStorage.removeItem(key);
        }
      });
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const simulationRunning = isActive;
  const currentLap = backendState?.current_lap || 0;
  const totalLaps = backendState?.max_laps || 20;
  const trackName = backendState?.track || 'Unknown';
  const currentFuel = backendState?.fuel || 0;
  const tireAge = backendState?.tire_age || 0;
  const currentSpeed = backendState?.speed || 0;
  
  const rawTelemetry = backendState?.raw_telemetry || {};
  const tireCompound = rawTelemetry.TIRE_COMPOUND || 'Medium';
  const airTemp = rawTelemetry.AIR_TEMP || 0;
  const trackTemp = rawTelemetry.TRACK_TEMP || 0;
  const windSpeed = rawTelemetry.WIND_SPEED || 0;
  const rain = rawTelemetry.RAINFALL_PERCENTAGE || 0;
  const currentSectorTime = rawTelemetry.CURRENT_SECTOR_TIME || 0;

  // Alert checking logic
  useEffect(() => {
    if (!backendState || !simulationRunning) {
      setAlerts([]);
      return;
    }

    const newAlerts: Alert[] = [];
    const now = Date.now();

    // 1. FUEL CRITICAL - Below 20%
    const fuelPercent = (currentFuel / 50) * 100;
    if (fuelPercent < 20 && fuelPercent > 0) {
      newAlerts.push({
        id: 'fuel-critical',
        type: 'critical',
        icon: <Fuel className="w-4 h-4" />,
        message: `FUEL CRITICAL: ${fuelPercent.toFixed(0)}% remaining`,
        timestamp: now,
      });
    } else if (fuelPercent < 35 && fuelPercent > 0) {
      newAlerts.push({
        id: 'fuel-low',
        type: 'warning',
        icon: <Fuel className="w-4 h-4" />,
        message: `FUEL LOW: ${fuelPercent.toFixed(0)}% remaining`,
        timestamp: now,
      });
    }

    // 2. TIRE WEAR - Critical above 30 laps
    if (tireAge > 30) {
      newAlerts.push({
        id: 'tire-critical',
        type: 'critical',
        icon: <AlertTriangle className="w-4 h-4" />,
        message: `TIRE CRITICAL: ${tireAge} laps old - Pit recommended`,
        timestamp: now,
      });
    } else if (tireAge > 20) {
      newAlerts.push({
        id: 'tire-worn',
        type: 'warning',
        icon: <Gauge className="w-4 h-4" />,
        message: `TIRE WORN: ${tireAge} laps - Monitor closely`,
        timestamp: now,
      });
    }

    // 3. RAIN EXPECTED - Rain percentage increasing or above threshold
    if (rain > 50) {
      newAlerts.push({
        id: 'heavy-rain',
        type: 'critical',
        icon: <Droplets className="w-4 h-4" />,
        message: `HEAVY RAIN: ${rain}% - Wet setup recommended`,
        timestamp: now,
      });
    } else if (rain > 20) {
      newAlerts.push({
        id: 'rain-warning',
        type: 'warning',
        icon: <Droplets className="w-4 h-4" />,
        message: `RAIN DETECTED: ${rain}% - Monitor conditions`,
        timestamp: now,
      });
    }

    // 4. ENGINE OVERHEATING - Track temp very high
    if (trackTemp > 50) {
      newAlerts.push({
        id: 'engine-overheat',
        type: 'critical',
        icon: <Thermometer className="w-4 h-4" />,
        message: `ENGINE OVERHEAT RISK: Track ${Math.round(trackTemp)}°C`,
        timestamp: now,
      });
    } else if (trackTemp > 45) {
      newAlerts.push({
        id: 'high-temp',
        type: 'warning',
        icon: <Thermometer className="w-4 h-4" />,
        message: `HIGH TRACK TEMP: ${Math.round(trackTemp)}°C`,
        timestamp: now,
      });
    }

    // 5. SPEED DROP - Current speed significantly lower than expected
    if (prevState && currentSpeed > 0) {
      const speedDrop = prevState.speed - currentSpeed;
      if (speedDrop > 30) {
        newAlerts.push({
          id: 'speed-drop',
          type: 'critical',
          icon: <TrendingDown className="w-4 h-4" />,
          message: `SUDDEN SPEED DROP: -${speedDrop.toFixed(0)} km/h`,
          timestamp: now,
        });
      }
    }

    // 6. SECTOR TIME ANOMALY - Compare with lap history
    if (lapHistory && lapHistory.length > 2 && currentSectorTime > 0) {
      const recentLaps = lapHistory.slice(-3);
      const avgSectorTime = recentLaps.reduce((sum, lap) => {
        const sectorTimes = lap.sector_times || { s1: 30, s2: 30, s3: 30 };
        const avgTime = (sectorTimes.s1 + sectorTimes.s2 + sectorTimes.s3) / 3;
        return sum + avgTime;
      }, 0) / recentLaps.length;

      if (currentSectorTime > avgSectorTime + 1) {
        newAlerts.push({
          id: 'sector-slow',
          type: 'warning',
          icon: <Zap className="w-4 h-4" />,
          message: `SECTOR SLOW: +${(currentSectorTime - avgSectorTime).toFixed(1)}s vs avg`,
          timestamp: now,
        });
      }
    }

    // Update alerts (keep only recent ones, max 30 seconds old)
    setAlerts(prevAlerts => {
      const filtered = prevAlerts.filter(alert => now - alert.timestamp < 30000);
      const existingIds = new Set(filtered.map(a => a.id));
      const toAdd = newAlerts.filter(alert => !existingIds.has(alert.id));
      return [...filtered, ...toAdd];
    });

    setPrevState(backendState);
  }, [backendState, simulationRunning, currentFuel, tireAge, rain, trackTemp, currentSpeed, lapHistory, prevState]);

  const openSimulationSetup = () => {
    window.open('/simulation-setup', '_blank');
  };

  // Show loading while authenticating
  if (authLoading) {
    return <LoadingScreen message="Authenticating..." />;
  }

  if (loading) {
    return <LoadingScreen message="Checking simulation status..." />;
  }

  return (
<div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
  <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

  <div className="lg:ml-72 min-h-screen p-4 md:p-6">
    <div className="max-w-7xl mx-auto space-y-8"> {/* Increased from space-y-4 to space-y-8 */}
      <div className="border-b border-zinc-800 pb-4"> {/* Added more padding */}
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
          PIT WALL CONSOLE
        </h1>
        <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
          Live race control and real-time telemetry
        </p>
      </div>

      {!simulationRunning ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-md"
          >
            <div className="relative">
              <div className="text-8xl mb-4 animate-pulse">🏁</div>
              <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full" />
            </div>
            <h2 className="text-3xl font-bold text-zinc-100 tracking-wider">
              NO SIMULATION RUNNING
            </h2>
            <p className="text-zinc-400 text-lg">
              Start a simulation to access the pit wall console
            </p>
            <motion.button
              onClick={openSimulationSetup}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-orange-600/30"
            >
              <Play className="w-5 h-5" />
              START SIMULATION
              <ExternalLink className="w-4 h-4" />
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <div className="space-y-8"> {/* Increased from space-y-4 to space-y-8 */}
          {/* PIT WALL OVERVIEW */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <PitWallOverview
              trackName={trackName}
              currentLap={currentLap}
              totalLaps={totalLaps}
              currentFuel={currentFuel}
              tireAge={tireAge}
              tireCompound={tireCompound}
              airTemp={airTemp}
              trackTemp={trackTemp}
              windSpeed={windSpeed}
              rain={rain}
            />
          </motion.div>

          {/* ALERTS SYSTEM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AlertsSystem alerts={alerts} />
          </motion.div>

          {/* FUEL PROJECTION PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <FuelProjection
              currentFuel={currentFuel}
              currentLap={currentLap}
              totalLaps={totalLaps}
              lapHistory={lapHistory}
            />
          </motion.div>

          {/* TIRE DEGRADATION PANEL */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <TireDegradation
              tireCompound={tireCompound}
              tireAge={tireAge}
              trackTemp={trackTemp}
              currentLap={currentLap}
              totalLaps={totalLaps}
              lapHistory={lapHistory}
            />
          </motion.div>

          {/* WEATHER FORECAST TIMELINE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <WeatherForecast
              airTemp={airTemp}
              trackTemp={trackTemp}
              rain={rain}
              windSpeed={windSpeed}
              currentLap={currentLap}
              totalLaps={totalLaps}
              lapHistory={lapHistory}
              rawTelemetry={rawTelemetry}
            />
          </motion.div>

          {/* SECTOR STRATEGY SAMPLER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <SectorStrategy
              rawTelemetry={rawTelemetry}
              lapHistory={lapHistory}
              backendState={backendState as any}
              tireCompound={tireCompound}
              currentSpeed={rawTelemetry.SPEED || 0}
            />
          </motion.div>

          {/* DRIVER STRATEGY INSIGHT */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <DriverStrategyInsight
              currentLap={currentLap}
              totalLaps={totalLaps}
              lapHistory={lapHistory}
              tireAge={tireAge}
              trackTemp={trackTemp}
            />
          </motion.div>
        </div>
      )}
    </div>
  </div>
</div>
  );
}
