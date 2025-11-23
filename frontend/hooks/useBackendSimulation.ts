/**
 * Custom React Hook for Backend Simulation Integration
 * Connects frontend simulation-setup page to backend API
 * Sends user configuration parameters to backend
 */

import { useState, useEffect, useCallback, useRef } from "react";

// Backend API configuration
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/simulation";

// Types matching MODEL_PARAMETERS_REFERENCE.md
export interface SimulationConfig {
  // Driver Configuration
  driverSkill: "Pro" | "Amateur" | "Aggressive" | "Conservative";
  carNumber?: number;

  // Car Setup
  enginePower: number; // 80-120% (affects speed)
  downforceLevel: number; // 0-100 (affects cornering vs top speed)
  tireCompound: "Soft" | "Medium" | "Hard";
  fuelLoad: number; // Liters (typically 30-50)

  // Weather Conditions
  airTemp: number; // °C (15-35)
  trackTemp: number; // °C (20-55)
  humidity: number; // % (30-95)
  rainfall: number; // % (0-100, >50 = wet)
  windSpeed: number; // km/h (0-40)

  // Session Configuration
  simulationMode: "Single Lap" | "Multi-Lap" | "Continuous";
  lapCount: number;
  realTimeSpeed: number; // Multiplier for update speed
}

export interface SimulationState {
  user_id: string;
  session_id?: string;
  timestamp: string;
  current_lap: number;
  current_sector: number;
  sector_progress: number;
  lap_time: number;
  speed: number;
  fuel: number;
  tire_age: number;
  track: string;
  max_laps: number;
  is_active: boolean;
  is_paused: boolean;
  pause_reason: string;
  s1_time?: number;
  s2_time?: number;
  s3_time?: number;
  raw_telemetry: Record<string, any>;
  engineered_features: Record<string, any>;
}

export interface LapHistoryData {
  lap_number: number;
  lap_time: number;
  sector_times: {
    s1: number;
    s2: number;
    s3: number;
  };
  speed_stats: {
    avg_speed: number;
    top_speed: number;
  };
  tire_stats: {
    age: number;
    compound: string;
  };
  fuel_stats: {
    used: number;
    remaining: number;
  };
  weather: Record<string, any>;
  timestamp: string;
}

interface UseBackendSimulationOptions {
  pollInterval?: number; // Polling interval in ms (default 2500)
  autoStart?: boolean; // Auto-start polling on mount (default false)
  onShowAlert?: (config: {
    title: string;
    description: string[];
    confirmText: string;
    onConfirm: () => void;
  }) => void; // Callback to show alert dialog
}

export function useBackendSimulation(
  userId: string,
  track: string,
  config: SimulationConfig,
  options: UseBackendSimulationOptions = {}
) {
  const { pollInterval = 2500, autoStart = false, onShowAlert } = options;

  // Use auth_token from localStorage as fallback if userId is empty
  const effectiveUserId =
    userId ||
    (typeof window !== "undefined"
      ? localStorage.getItem("auth_token") || ""
      : "");

  // State
  const [state, setState] = useState<SimulationState | null>(null);
  const [laps, setLaps] = useState<LapHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // Refs for polling
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Sync isActive state with localStorage
   */
  useEffect(() => {
    if (effectiveUserId) {
      if (isActive) {
        localStorage.setItem(`sim_active_${effectiveUserId}`, "true");
      } else {
        localStorage.removeItem(`sim_active_${effectiveUserId}`);
      }
    }
  }, [isActive, effectiveUserId]);

  /**
   * Start simulation with user configuration
   * Sends all parameters from frontend to backend
   */
  const startSimulation = useCallback(async () => {
    if (!effectiveUserId) {
      setError("No user ID available");
      console.error("❌ Cannot start simulation without user ID");
      return;
    }

    // Check if simulation is already running
    try {
      const statusResponse = await fetch(
        `${API_BASE}/status?user_id=${effectiveUserId}`
      );
      const statusData = await statusResponse.json();

      if (
        statusData.success &&
        statusData.user_status &&
        statusData.user_status.active
      ) {
        setError("Simulation already running");
        setIsActive(true); // Update state to reflect reality
        setIsStarting(false);

        // Show alert dialog via callback
        if (onShowAlert) {
          onShowAlert({
            title: "SIMULATION ALREADY RUNNING",
            description: [
              `A simulation is already active on ${
                statusData.user_status.track || "track"
              }.`,
              `Current Lap: ${statusData.user_status.current_lap || "N/A"}`,
              "",
              'Click "View Dashboard" to see live telemetry.',
            ],
            confirmText: "View Dashboard",
            onConfirm: () => {
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard";
              }
            },
          });
        }
        return;
      }
    } catch (statusErr) {
      console.warn("⚠️ Could not check existing simulation status:", statusErr);
      // Continue with start attempt if status check fails
    }

    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: effectiveUserId,
          track: track,
          config: {
            // Driver settings
            driverSkill: config.driverSkill,
            carNumber: config.carNumber || 1,

            // Car setup
            enginePower: config.enginePower,
            downforceLevel: config.downforceLevel,
            tireCompound: config.tireCompound,
            fuelLoad: config.fuelLoad,

            // Weather
            airTemp: config.airTemp,
            trackTemp: config.trackTemp,
            humidity: config.humidity,
            rainfall: config.rainfall,
            windSpeed: config.windSpeed,

            // Session
            simulationMode: config.simulationMode,
            lapCount: config.lapCount,
            realTimeSpeed: config.realTimeSpeed,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsActive(true);

        // Show success alert dialog via callback
        if (onShowAlert) {
          onShowAlert({
            title: "SIMULATION STARTED",
            description: [
              `Track: ${track}`,
              `Mode: ${config.simulationMode}`,
              `Laps: ${config.lapCount || "N/A"}`,
            ],
            confirmText: "View Dashboard",
            onConfirm: () => {
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard";
              }
            },
          });
        }
      } else {
        setError(data.error || "Failed to start simulation");
        console.error("❌ Start failed:", data.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      setError(errorMsg);
      console.error("❌ Start error:", err);
    } finally {
      setIsStarting(false);
    }
  }, [effectiveUserId, track, config]);

  /**
   * Update simulation configuration while running
   * Allows real-time parameter changes without stopping
   */
  const updateSimulation = useCallback(
    async (newConfig: Partial<SimulationConfig>) => {
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: effectiveUserId,
            config: {
              // Only send provided parameters
              ...(newConfig.driverSkill && {
                driverSkill: newConfig.driverSkill,
              }),
              ...(newConfig.carNumber && { carNumber: newConfig.carNumber }),
              ...(newConfig.enginePower !== undefined && {
                enginePower: newConfig.enginePower,
              }),
              ...(newConfig.downforceLevel !== undefined && {
                downforceLevel: newConfig.downforceLevel,
              }),
              ...(newConfig.realTimeSpeed !== undefined && {
                realTimeSpeed: newConfig.realTimeSpeed,
              }),
              ...(newConfig.tireCompound && {
                tireCompound: newConfig.tireCompound,
              }),
              ...(newConfig.fuelLoad && { fuelLoad: newConfig.fuelLoad }),
              ...(newConfig.airTemp !== undefined && {
                airTemp: newConfig.airTemp,
              }),
              ...(newConfig.trackTemp !== undefined && {
                trackTemp: newConfig.trackTemp,
              }),
              ...(newConfig.humidity !== undefined && {
                humidity: newConfig.humidity,
              }),
              ...(newConfig.rainfall !== undefined && {
                rainfall: newConfig.rainfall,
              }),
              ...(newConfig.windSpeed !== undefined && {
                windSpeed: newConfig.windSpeed,
              }),
              ...(newConfig.lapCount && { lapCount: newConfig.lapCount }),
            },
          }),
        });

        const data = await response.json();

        if (data.success) {
          return { success: true, updatedParams: data.updated_params };
        } else {
          setError(data.error || "Failed to update configuration");
          console.error("❌ Update failed:", data.error);
          return { success: false, error: data.error };
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Network error";
        setError(errorMsg);
        console.error("❌ Update error:", err);
        return { success: false, error: errorMsg };
      }
    },
    [effectiveUserId]
  );

  /**
   * Execute manual pit stop
   */
  const pitStop = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/pit-stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: effectiveUserId }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          pitDuration: data.pit_duration,
          fuelAdded: data.fuel_added,
          fuelNow: data.fuel_now,
          tireCompound: data.tire_compound,
          oldTireAge: data.old_tire_age,
          newTireAge: data.new_tire_age,
          timePenalty: data.time_penalty,
        };
      } else {
        setError(data.error || "Failed to execute pit stop");
        console.error("❌ Pit stop failed:", data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      setError(errorMsg);
      console.error("❌ Pit stop error:", err);
      return { success: false, error: errorMsg };
    }
  }, [effectiveUserId]);

  /**
   * Resume simulation after pit stop
   */
  const resumeSimulation = useCallback(async () => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: effectiveUserId }),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          resumed: data.resumed,
          timePenaltyApplied: data.time_penalty_applied,
          tireCompound: data.tire_compound,
        };
      } else {
        setError(data.error || "Failed to resume simulation");
        console.error("❌ Resume failed:", data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      setError(errorMsg);
      console.error("❌ Resume error:", err);
      return { success: false, error: errorMsg };
    }
  }, [effectiveUserId]);

  /**
   * Stop simulation
   */
  const stopSimulation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: effectiveUserId }),
      });

      const data = await response.json();

      if (data.success) {
        setIsActive(false);
        // Clear state and laps to reset UI
        setState(null);
        setLaps([]);
        // Clear localStorage cache
        localStorage.removeItem(`sim_active_${effectiveUserId}`);
      } else {
        setError(data.error || "Failed to stop simulation");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error";
      setError(errorMsg);
      console.error("❌ Stop error:", err);
    }
  }, [effectiveUserId]);

  /**
   * Fetch current simulation state
   */
  const fetchState = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/state?user_id=${effectiveUserId}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setState(data.data);
        setError(null);
      } else if (!data.success) {
        setError(data.error);
      }
    } catch (err) {
      console.error("❌ Fetch state error:", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  /**
   * Fetch lap history with optional session filter
   */
  const fetchLaps = useCallback(
    async (limit = 50, sessionId?: string) => {
      try {
        let url = `${API_BASE}/laps?user_id=${effectiveUserId}&limit=${limit}`;
        if (sessionId) {
          url += `&session_id=${sessionId}`;
        }
        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data) {
          setLaps(data.data);
        }
      } catch (err) {
        console.error("❌ Fetch laps error:", err);
      }
    },
    [effectiveUserId]
  );

  /**
   * Get simulation status
   */
  const getStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE}/status?user_id=${effectiveUserId}`
      );
      const data = await response.json();

      if (data.success) {
        return data; // Return the full status object
      }
      return null;
    } catch (err) {
      console.error("❌ Get status error:", err);
      return null;
    }
  }, [effectiveUserId]);

  /**
   * Check for existing simulation on mount
   * If user has an active simulation, resume polling
   */
  useEffect(() => {
    const checkExistingSimulation = async () => {
      try {
        // First check localStorage for cached active state
        const cachedActive = localStorage.getItem(
          `sim_active_${effectiveUserId}`
        );

        const status = await getStatus();

        // Check if user has active simulation running
        if (
          status &&
          status.user_status &&
          (status.user_status.active || status.user_status.is_running)
        ) {
          setIsActive(true);
          localStorage.setItem(`sim_active_${effectiveUserId}`, "true");

          // Retry fetching state until it's available (handles race condition)
          let retries = 0;
          const maxRetries = 5;

          while (retries < maxRetries) {
            await fetchState();
            const currentState = await new Promise<boolean>((resolve) => {
              setTimeout(() => {
                // Check if state was set
                resolve(state !== null);
              }, 100);
            });

            if (currentState) {
              break;
            }

            retries++;
            if (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }

          // Note: fetchLaps will be called by polling effect with session_id
        } else if (cachedActive === "true") {
          // Cached state says active but backend says no - clear cache
          localStorage.removeItem(`sim_active_${effectiveUserId}`);
          setIsActive(false);
        } else {
          setIsActive(false);
        }
      } catch (err) {
        console.error("❌ Error checking simulation status:", err);
        // Clear cache on error
        localStorage.removeItem(`sim_active_${effectiveUserId}`);
      } finally {
        setLoading(false);
      }
    };

    // Only check if we have a valid effectiveUserId
    if (effectiveUserId) {
      checkExistingSimulation();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveUserId]); // Only run once on mount when effectiveUserId changes

  /**
   * Fetch laps when session_id changes or becomes available
   */
  useEffect(() => {
    if (state?.session_id && isActive) {
      fetchLaps(50, state.session_id);
    }
  }, [state?.session_id, isActive, fetchLaps]);

  /**
   * Polling effect for state updates
   */
  useEffect(() => {
    if (!isActive) {
      // Clear polling if not active
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Start polling for state updates
    pollIntervalRef.current = setInterval(() => {
      fetchState();
    }, pollInterval);

    // Cleanup
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isActive, pollInterval, fetchState]);

  /**
   * Periodic lap history refresh (every 5 seconds)
   */
  useEffect(() => {
    if (!isActive || !state?.session_id) return;

    const lapRefreshInterval = setInterval(() => {
      fetchLaps(50, state.session_id);
    }, 5000); // Every 5 seconds

    return () => clearInterval(lapRefreshInterval);
  }, [isActive, state?.session_id, fetchLaps]);

  /**
   * Auto-start effect
   */
  useEffect(() => {
    if (autoStart && !isActive && !isStarting) {
      startSimulation();
    }
  }, [autoStart, isActive, isStarting, startSimulation]);

  return {
    // State
    state,
    laps,
    loading,
    error,
    isActive,
    isStarting,

    // Actions
    start: startSimulation,
    stop: stopSimulation,
    update: updateSimulation,
    pitStop,
    resumeSimulation,
    fetchState,
    fetchLaps,
    getStatus,

    // Legacy exports (for backwards compatibility)
    startSimulation,
    stopSimulation,
    updateSimulation,

    // Computed
    currentLap: state?.current_lap || 0,
    currentSector: state?.current_sector || 1,
    lapTime: state?.lap_time || 0,
    speed: state?.speed || 0,
    fuel: state?.fuel || 0,
    tireAge: state?.tire_age || 0,
    isPaused: state?.is_paused || false,
    pauseReason: state?.pause_reason || "",
  };
}
