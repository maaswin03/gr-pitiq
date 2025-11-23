"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useBackendSimulation } from "@/hooks/useBackendSimulation";
import Sidebar from "@/components/Sidebar";
import TrackProgress from "@/components/dashboard/TrackProgress";
import StatsGrid from "@/components/dashboard/StatsGrid";
import LiveTelemetry from "@/components/dashboard/LiveTelemetry";
import WeatherConditions from "@/components/dashboard/WeatherConditions";
import LapHistoryTable from "@/components/dashboard/LapHistoryTable";
import LoadingScreen from "@/components/ui/loading-screen";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tireVariations] = useState([2, -3, 1, -2]);
  
  // Get user ID from localStorage (auth_token)
  const userId = typeof window !== 'undefined' ? (localStorage.getItem('auth_token') || '') : '';

  const {
    state: backendState,
    laps: completedLaps,
    isActive,
    loading: isCheckingSimulation,
  } = useBackendSimulation(
    userId,
    "COTA",
    {
      driverSkill: "Pro",
      enginePower: 100,
      downforceLevel: 50,
      tireCompound: "Soft",
      fuelLoad: 50,
      rainfall: 0,
      airTemp: 25,
      trackTemp: 40,
      humidity: 50,
      windSpeed: 10,
      simulationMode: "Multi-Lap",
      lapCount: 20,
      realTimeSpeed: 135,
    },
    { pollInterval: 2000 }
  );

  const isRunning = isActive;
  const currentLap = backendState?.current_lap || 0;
  const currentSector = backendState?.current_sector || 1;
  const currentSectorProgress = backendState?.sector_progress || 0;
  const currentLapTime = backendState?.lap_time || 0;
  const tireAge = backendState?.tire_age || 0;
  const currentFuel = backendState?.fuel || 0;
  const fuelPercentage = currentFuel > 0 ? (currentFuel / 50) * 100 : 0;

  const rawTelemetry = backendState?.raw_telemetry || {};
  const trackName = backendState?.track || "Unknown";
  const tireCompound = rawTelemetry.TIRE_COMPOUND || "Medium";

  const currentSpeed = rawTelemetry.KPH || 0;
  const avgSpeed =
    currentLapTime > 0 && rawTelemetry.DISTANCE_LAP_KM
      ? rawTelemetry.DISTANCE_LAP_KM / (currentLapTime / 3600)
      : currentSpeed;

  const airTemp = rawTelemetry.AIR_TEMP || 25;
  const trackTemp = rawTelemetry.TRACK_TEMP || 40;
  const rainfall = rawTelemetry.RAINFALL_PERCENTAGE || 0;
  const humidity = rawTelemetry.HUMIDITY || 50;
  const windSpeed = rawTelemetry.WIND_SPEED || 10;

  const totalDistance = rawTelemetry.DISTANCE_TOTAL_KM || 0;
  const currentDistance = rawTelemetry.DISTANCE_LAP_KM || 0;
  const totalTimeElapsed = rawTelemetry.TIME_ELAPSED_SECONDS || 0;

  const fuelUsedPerLap = 2.1;
  const fuelWarning = currentFuel < 10;

  // Redirect to login if no user
  useEffect(() => {
    if (!authLoading && !user) {
      localStorage.removeItem('hasSession');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('debug_userId');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sim_active_')) {
          localStorage.removeItem(key);
        }
      });
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              TELEMETRY DASHBOARD
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              Real-time simulation data
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
                  onClick={() => window.open("/simulation-setup", "_blank")}
                  className="px-8 py-4 bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-lg text-lg font-bold transition-all shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  START YOUR CAR
                </button>
              </div>
            </div>
          )}

          {isRunning && (
            <TrackProgress
              currentSector={currentSector}
              currentSectorProgress={currentSectorProgress}
              currentSpeed={currentSpeed}
            />
          )}

          {isRunning && (
            <StatsGrid
              currentLap={currentLap}
              currentSector={currentSector}
              currentSectorProgress={currentSectorProgress}
              currentLapTime={currentLapTime}
              totalTimeElapsed={totalTimeElapsed}
              totalDistance={totalDistance}
              currentDistance={currentDistance}
            />
          )}

          {isRunning && (
            <LiveTelemetry
              currentSpeed={currentSpeed}
              avgSpeed={avgSpeed}
              currentFuel={currentFuel}
              fuelPercentage={fuelPercentage}
              fuelUsedPerLap={fuelUsedPerLap}
              fuelWarning={fuelWarning}
              tireAge={tireAge}
              tireCompound={tireCompound}
              tireVariations={tireVariations}
            />
          )}

          {isRunning && (
            <WeatherConditions
              trackName={trackName}
              airTemp={airTemp}
              trackTemp={trackTemp}
              rainfall={rainfall}
              humidity={humidity}
              windSpeed={windSpeed}
            />
          )}

          {completedLaps && completedLaps.length > 0 && (
            <LapHistoryTable laps={completedLaps} />
          )}
        </div>
      </div>
    </div>
  );
}
