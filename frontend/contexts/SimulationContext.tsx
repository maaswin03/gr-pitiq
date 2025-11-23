'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

// Backend API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/simulation';

// Types
export interface SimulationConfig {
  driverSkill: 'Pro' | 'Amateur' | 'Aggressive' | 'Conservative';
  carNumber?: number;
  enginePower: number;
  downforceLevel: number;
  tireCompound: 'Soft' | 'Medium' | 'Hard';
  fuelLoad: number;
  airTemp: number;
  trackTemp: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  simulationMode: 'Single Lap' | 'Multi-Lap' | 'Continuous';
  lapCount: number;
  realTimeSpeed: number;
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

interface SimulationContextType {
  // State
  state: SimulationState | null;
  laps: LapHistoryData[];
  isActive: boolean;
  loading: boolean;
  error: string | null;
  isStarting: boolean;
  
  // Actions
  start: (userId: string, track: string, config: SimulationConfig, onShowAlert?: (config: any) => void) => Promise<void>;
  stop: (userId: string) => Promise<void>;
  update: (userId: string, config: Partial<SimulationConfig>) => Promise<void>;
  pitStop: (userId: string) => Promise<any>;
  resumeSimulation: (userId: string) => Promise<any>;
  
  // Computed
  currentLap: number;
  currentSector: number;
  lapTime: number;
  speed: number;
  fuel: number;
  tireAge: number;
  isPaused: boolean;
  pauseReason: string;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimulationState | null>(null);
  const [laps, setLaps] = useState<LapHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lapRefreshRef = useRef<NodeJS.Timeout | null>(null);

  // Get effective user ID from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userId = localStorage.getItem('auth_token') || '';
      setCurrentUserId(userId);
    }
  }, []);

  /**
   * Fetch current simulation state
   */
  const fetchState = useCallback(async (userId: string) => {
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
    }
  }, []);

  /**
   * Fetch lap history
   */
  const fetchLaps = useCallback(async (userId: string, limit = 50, sessionId?: string) => {
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
  }, []);

  /**
   * Get simulation status
   */
  const getStatus = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/status?user_id=${userId}`);
      const data = await response.json();

      if (data.success) {
        return data;
      }
      return null;
    } catch (err) {
      console.error('❌ Get status error:', err);
      return null;
    }
  }, []);

  /**
   * Start simulation
   */
  const start = useCallback(async (
    userId: string,
    track: string,
    config: SimulationConfig,
    onShowAlert?: (config: any) => void
  ) => {
    if (!userId) {
      setError('No user ID available');
      return;
    }

    // Check if simulation is already running
    try {
      const statusResponse = await fetch(`${API_BASE}/status?user_id=${userId}`);
      const statusData = await statusResponse.json();

      if (statusData.success && statusData.user_status && statusData.user_status.active) {
        setError('Simulation already running');
        setIsActive(true);
        setIsStarting(false);

        if (onShowAlert) {
          onShowAlert({
            title: 'SIMULATION ALREADY RUNNING',
            description: [
              `A simulation is already active on ${statusData.user_status.track || 'track'}.`,
              `Current Lap: ${statusData.user_status.current_lap || 'N/A'}`,
              '',
              'Click "View Dashboard" to see live telemetry.'
            ],
            confirmText: 'View Dashboard',
            onConfirm: () => {
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard';
              }
            }
          });
        }
        return;
      }
    } catch (statusErr) {
      console.warn('⚠️ Could not check existing simulation status:', statusErr);
    }

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
            driverSkill: config.driverSkill,
            carNumber: config.carNumber || 1,
            enginePower: config.enginePower,
            downforceLevel: config.downforceLevel,
            tireCompound: config.tireCompound,
            fuelLoad: config.fuelLoad,
            airTemp: config.airTemp,
            trackTemp: config.trackTemp,
            humidity: config.humidity,
            rainfall: config.rainfall,
            windSpeed: config.windSpeed,
            simulationMode: config.simulationMode,
            lapCount: config.lapCount,
            realTimeSpeed: config.realTimeSpeed
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsActive(true);
        setCurrentUserId(userId);

        if (onShowAlert) {
          onShowAlert({
            title: 'SIMULATION STARTED',
            description: [
              `Track: ${track}`,
              `Mode: ${config.simulationMode}`,
              `Laps: ${config.lapCount || 'N/A'}`,
              '',
              'Click "View Dashboard" to watch live telemetry.'
            ],
            confirmText: 'View Dashboard',
            onConfirm: () => {
              if (typeof window !== 'undefined') {
                window.location.href = '/dashboard';
              }
            }
          });
        }
      } else {
        setError(data.error || 'Failed to start simulation');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
    } finally {
      setIsStarting(false);
    }
  }, []);

  /**
   * Stop simulation
   */
  const stop = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();

      if (data.success) {
        setIsActive(false);
        setState(null);
        setLaps([]);
        localStorage.removeItem(`sim_active_${userId}`);
      } else {
        setError(data.error || 'Failed to stop simulation');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
    }
  }, []);

  /**
   * Update simulation configuration
   */
  const update = useCallback(async (userId: string, newConfig: Partial<SimulationConfig>) => {
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          config: newConfig
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to update simulation');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
    }
  }, []);

  /**
   * Pit stop
   */
  const pitStop = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/pitstop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Resume simulation
   */
  const resumeSimulation = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  /**
   * Check for existing simulation on mount
   */
  useEffect(() => {
    const checkExistingSimulation = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        const status = await getStatus(currentUserId);

        if (status && status.user_status && (status.user_status.active || status.user_status.is_running)) {
          setIsActive(true);
          localStorage.setItem(`sim_active_${currentUserId}`, 'true');
          await fetchState(currentUserId);
        } else {
          setIsActive(false);
          localStorage.removeItem(`sim_active_${currentUserId}`);
        }
      } catch (err) {
        console.error('❌ Error checking simulation status:', err);
        localStorage.removeItem(`sim_active_${currentUserId}`);
      } finally {
        setLoading(false);
      }
    };

    if (currentUserId) {
      checkExistingSimulation();
    }
  }, [currentUserId, getStatus, fetchState]);

  /**
   * Polling effect for state updates (2 seconds) - WITH VISIBILITY DETECTION
   */
  useEffect(() => {
    if (!isActive || !currentUserId) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Check if tab is visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden - stop polling to save resources
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else {
        // Tab visible - resume polling
        if (!pollIntervalRef.current && isActive) {
          pollIntervalRef.current = setInterval(() => {
            fetchState(currentUserId);
          }, 2000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start polling only if tab is visible
    if (!document.hidden) {
      pollIntervalRef.current = setInterval(() => {
        fetchState(currentUserId);
      }, 2000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isActive, currentUserId, fetchState]);

  /**
   * Fetch laps when session_id changes
   */
  useEffect(() => {
    if (state?.session_id && isActive && currentUserId) {
      fetchLaps(currentUserId, 50, state.session_id);
    }
  }, [state?.session_id, isActive, currentUserId, fetchLaps]);

  /**
   * Periodic lap history refresh (every 5 seconds) - WITH VISIBILITY DETECTION
   */
  useEffect(() => {
    if (!isActive || !state?.session_id || !currentUserId) {
      if (lapRefreshRef.current) {
        clearInterval(lapRefreshRef.current);
        lapRefreshRef.current = null;
      }
      return;
    }

    // Check visibility for lap refresh too
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (lapRefreshRef.current) {
          clearInterval(lapRefreshRef.current);
          lapRefreshRef.current = null;
        }
      } else {
        if (!lapRefreshRef.current && isActive && state?.session_id) {
          lapRefreshRef.current = setInterval(() => {
            fetchLaps(currentUserId, 50, state.session_id);
          }, 5000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start lap refresh only if tab is visible
    if (!document.hidden) {
      lapRefreshRef.current = setInterval(() => {
        fetchLaps(currentUserId, 50, state.session_id);
      }, 5000);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (lapRefreshRef.current) {
        clearInterval(lapRefreshRef.current);
        lapRefreshRef.current = null;
      }
    };
  }, [isActive, state?.session_id, currentUserId, fetchLaps]);

  const value: SimulationContextType = {
    state,
    laps,
    isActive,
    loading,
    error,
    isStarting,
    start,
    stop,
    update,
    pitStop,
    resumeSimulation,
    currentLap: state?.current_lap || 0,
    currentSector: state?.current_sector || 1,
    lapTime: state?.lap_time || 0,
    speed: state?.speed || 0,
    fuel: state?.fuel || 0,
    tireAge: state?.tire_age || 0,
    isPaused: state?.is_paused || false,
    pauseReason: state?.pause_reason || '',
  };

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
