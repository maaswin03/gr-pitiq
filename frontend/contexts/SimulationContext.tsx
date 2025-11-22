'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Define the simulation state interface
export interface SimulationState {
  // General Simulation Info
  isRunning: boolean;
  currentLap: number;
  currentSector: number;
  currentSectorProgress: number;
  currentLapTime: number;
  totalTimeElapsed: number;
  currentSpeed: number;
  avgSpeed: number;
  currentDistance: number;
  totalDistance: number;
  
  // Car & Driver
  driverSkill: 'Pro' | 'Amateur' | 'Aggressive' | 'Conservative';
  enginePower: number;
  downforceLevel: number;
  tireCompound: 'Soft' | 'Medium' | 'Hard';
  tireAge: number;
  currentFuel: number;
  fuelPercentage: number;
  fuelUsedPerLap: number;
  fuelWarning: boolean;
  
  // Track & Weather
  trackName: string;
  lapLength: number;
  airTemp: number;
  trackTemp: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
  
  // Lap History
  lapHistory: Array<{
    lapNumber: number;
    lapTime: number;
    avgSpeed: number;
    topSpeed: number;
    minSpeed: number;
    fuelUsed: number;
    fuelRemaining: number;
    tireAge: number;
    tireCompound: string;
    sectorTimes: number[];
    totalDistance: number;
  }>;
  currentSectorTimes: number[];
}

// Define the context type
interface SimulationContextType {
  state: SimulationState;
  updateState: (updates: Partial<SimulationState>) => void;
  resetState: () => void;
  startSimulation: (config: Partial<SimulationState>) => void;
  stopSimulation: () => void;
}

// Default state
const defaultState: SimulationState = {
  isRunning: false,
  currentLap: 1,
  currentSector: 1,
  currentSectorProgress: 0,
  currentLapTime: 0,
  totalTimeElapsed: 0,
  currentSpeed: 0,
  avgSpeed: 0,
  currentDistance: 0,
  totalDistance: 0,
  
  driverSkill: 'Pro',
  enginePower: 100,
  downforceLevel: 50,
  tireCompound: 'Soft',
  tireAge: 0,
  currentFuel: 50,
  fuelPercentage: 100,
  fuelUsedPerLap: 0,
  fuelWarning: false,
  
  trackName: 'COTA',
  lapLength: 5.513,
  airTemp: 25,
  trackTemp: 40,
  rainfall: 0,
  humidity: 45,
  windSpeed: 12,
  
  lapHistory: [],
  currentSectorTimes: [0, 0, 0, 0],
};

// Create the context
const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Provider component
export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimulationState>(defaultState);

  const updateState = useCallback((updates: Partial<SimulationState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(defaultState);
  }, []);

  const startSimulation = useCallback((config: Partial<SimulationState>) => {
    setState(prev => ({
      ...prev,
      ...config,
      isRunning: true,
    }));
  }, []);

  const stopSimulation = useCallback(() => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      currentLapTime: 0,
      currentSectorProgress: 0,
    }));
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        state,
        updateState,
        resetState,
        startSimulation,
        stopSimulation,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

// Custom hook to use the simulation context
export function useSimulation() {
  const context = useContext(SimulationContext);
  if (context === undefined) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}
