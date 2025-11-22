/**
 * Custom React Hook for Backend Simulation Integration
 * Connects frontend simulation-setup page to backend API
 * Sends user configuration parameters to backend
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Backend API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/simulation';

// Types matching MODEL_PARAMETERS_REFERENCE.md
export interface SimulationConfig {
  // Driver Configuration
  driverSkill: 'Pro' | 'Amateur' | 'Aggressive' | 'Conservative';
  carNumber?: number;
  
  // Car Setup
  enginePower: number;        // 80-120% (affects speed)
  downforceLevel: number;     // 0-100 (affects cornering vs top speed)
  tireCompound: 'Soft' | 'Medium' | 'Hard';
  fuelLoad: number;           // Liters (typically 30-50)
  
  // Weather Conditions
  airTemp: number;            // °C (15-35)
  trackTemp: number;          // °C (20-55)
  humidity: number;           // % (30-95)
  rainfall: number;           // % (0-100, >50 = wet)
  windSpeed: number;          // km/h (0-40)
  
  // Session Configuration
  simulationMode: 'Single Lap' | 'Multi-Lap' | 'Continuous';
  lapCount: number;
  realTimeSpeed: number;      // Multiplier for update speed
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
  pollInterval?: number;      // Polling interval in ms (default 2500)
  autoStart?: boolean;         // Auto-start polling on mount (default false)
}

export function useBackendSimulation(
  userId: string,
  track: string,
  config: SimulationConfig,
  options: UseBackendSimulationOptions = {}
) {
  const { pollInterval = 2500, autoStart = false } = options;
  
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
   * Start simulation with user configuration
   * Sends all parameters from frontend to backend
   */
  const startSimulation = useCallback(async () => {
    setIsStarting(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
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
            realTimeSpeed: config.realTimeSpeed
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsActive(true);
        console.log('✅ Simulation started:', data);
      } else {
        setError(data.error || 'Failed to start simulation');
        console.error('❌ Start failed:', data.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      console.error('❌ Start error:', err);
    } finally {
      setIsStarting(false);
    }
  }, [userId, track, config]);
  
  /**
   * Update simulation configuration while running
   * Allows real-time parameter changes without stopping
   */
  const updateSimulation = useCallback(async (newConfig: Partial<SimulationConfig>) => {
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          config: {
            // Only send provided parameters
            ...(newConfig.driverSkill && { driverSkill: newConfig.driverSkill }),
            ...(newConfig.carNumber && { carNumber: newConfig.carNumber }),
            ...(newConfig.enginePower !== undefined && { enginePower: newConfig.enginePower }),
            ...(newConfig.downforceLevel !== undefined && { downforceLevel: newConfig.downforceLevel }),
            ...(newConfig.realTimeSpeed !== undefined && { realTimeSpeed: newConfig.realTimeSpeed }),
            ...(newConfig.tireCompound && { tireCompound: newConfig.tireCompound }),
            ...(newConfig.fuelLoad && { fuelLoad: newConfig.fuelLoad }),
            ...(newConfig.airTemp !== undefined && { airTemp: newConfig.airTemp }),
            ...(newConfig.trackTemp !== undefined && { trackTemp: newConfig.trackTemp }),
            ...(newConfig.humidity !== undefined && { humidity: newConfig.humidity }),
            ...(newConfig.rainfall !== undefined && { rainfall: newConfig.rainfall }),
            ...(newConfig.windSpeed !== undefined && { windSpeed: newConfig.windSpeed }),
            ...(newConfig.lapCount && { lapCount: newConfig.lapCount })
          }
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Configuration updated:', data.updated_params);
        return { success: true, updatedParams: data.updated_params };
      } else {
        setError(data.error || 'Failed to update configuration');
        console.error('❌ Update failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      console.error('❌ Update error:', err);
      return { success: false, error: errorMsg };
    }
  }, [userId]);
  
  /**
   * Execute manual pit stop
   */
  const pitStop = useCallback(async () => {
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/pit-stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('🏁 Pit stop completed:', data);
        return { 
          success: true, 
          pitDuration: data.pit_duration,
          fuelAdded: data.fuel_added,
          fuelNow: data.fuel_now,
          tireCompound: data.tire_compound,
          oldTireAge: data.old_tire_age,
          newTireAge: data.new_tire_age,
          timePenalty: data.time_penalty
        };
      } else {
        setError(data.error || 'Failed to execute pit stop');
        console.error('❌ Pit stop failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      console.error('❌ Pit stop error:', err);
      return { success: false, error: errorMsg };
    }
  }, [userId]);
  
  /**
   * Resume simulation after pit stop
   */
  const resumeSimulation = useCallback(async () => {
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('▶️ Simulation resumed:', data);
        return { 
          success: true, 
          resumed: data.resumed,
          timePenaltyApplied: data.time_penalty_applied,
          tireCompound: data.tire_compound
        };
      } else {
        setError(data.error || 'Failed to resume simulation');
        console.error('❌ Resume failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      console.error('❌ Resume error:', err);
      return { success: false, error: errorMsg };
    }
  }, [userId]);
  
  /**
   * Stop simulation
   */
  const stopSimulation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsActive(false);
        // Clear state and laps to reset UI
        setState(null);
        setLaps([]);
        console.log('✅ Simulation stopped');
      } else {
        setError(data.error || 'Failed to stop simulation');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      console.error('❌ Stop error:', err);
    }
  }, [userId]);
  
  /**
   * Fetch current simulation state
   */
  const fetchState = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/state?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setState(data.data);
        setError(null);
      } else if (!data.success) {
        setError(data.error);
      }
    } catch (err) {
      console.error('❌ Fetch state error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);
  
  /**
   * Fetch lap history with optional session filter
   */
  const fetchLaps = useCallback(async (limit = 50, sessionId?: string) => {
    try {
      let url = `${API_BASE}/laps?user_id=${userId}&limit=${limit}`;
      if (sessionId) {
        url += `&session_id=${sessionId}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.data) {
        setLaps(data.data);
      }
    } catch (err) {
      console.error('❌ Fetch laps error:', err);
    }
  }, [userId]);
  
  /**
   * Get simulation status
   */
  const getStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/status?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        return data; // Return the full status object
      }
      return null;
    } catch (err) {
      console.error('❌ Get status error:', err);
      return null;
    }
  }, [userId]);
  
  /**
   * Check for existing simulation on mount
   * If user has an active simulation, resume polling
   */
  useEffect(() => {
    const checkExistingSimulation = async () => {
      try {
        const status = await getStatus();
        
        // Check if user has active simulation running
        if (status && status.user_status && (status.user_status.active || status.user_status.is_running)) {
          console.log('🔄 Resuming existing simulation:', status.user_status);
          setIsActive(true);
          
          // Fetch initial state first to get session_id
          await fetchState();
          // Note: fetchLaps will be called by polling effect with session_id
        } else {
          console.log('📭 No active simulation found');
          setIsActive(false);
        }
      } catch (err) {
        console.error('❌ Error checking simulation status:', err);
      } finally {
        setLoading(false);
      }
    };
    
    // Check on mount
    checkExistingSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Only run once on mount when userId changes
  
  /**
   * Fetch laps when session_id changes or becomes available
   */
  useEffect(() => {
    if (state?.session_id && isActive) {
      console.log('📊 Fetching laps for session:', state.session_id);
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
      console.log('🔄 Refreshing lap history for session:', state.session_id);
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
    startSimulation,
    updateSimulation,
    pitStop,
    resumeSimulation,
    stopSimulation,
    fetchState,
    fetchLaps,
    getStatus,
    
    // Computed
    currentLap: state?.current_lap || 0,
    currentSector: state?.current_sector || 1,
    lapTime: state?.lap_time || 0,
    speed: state?.speed || 0,
    fuel: state?.fuel || 0,
    tireAge: state?.tire_age || 0,
    isPaused: state?.is_paused || false,
    pauseReason: state?.pause_reason || '',
  };
}
