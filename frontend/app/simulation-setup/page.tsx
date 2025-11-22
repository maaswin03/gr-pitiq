'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flag, 
  Gauge, 
  MapPin, 
  Settings, 
  Shuffle, 
  User, 
  Activity, 
  Zap
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useBackendSimulation, type SimulationConfig } from '@/hooks/useBackendSimulation';
import { TRACK_DATA, type TrackName } from '@/lib/track-data';

import { useAuth } from '@/contexts/AuthContext';

export default function SimulationSetupPage() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  const [selectedTrack, setSelectedTrack] = useState<TrackName>('COTA');
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [pitStopMessage, setPitStopMessage] = useState<string | null>(null);
  
  const trackData = TRACK_DATA[selectedTrack];
  
  const [config, setConfig] = useState<SimulationConfig>({
    driverSkill: 'Pro',
    enginePower: 100,
    downforceLevel: 50,
    tireCompound: 'Soft',
    fuelLoad: 50,
    rainfall: 0,
    airTemp: 25,
    trackTemp: 40,
    humidity: 50,
    windSpeed: 10,
    simulationMode: 'Multi-Lap',
    lapCount: 20,
    realTimeSpeed: 135
  });

  const {
    state: backendState,
    laps: completedLaps,
    error: simError,
    isActive,
    loading: isCheckingSimulation,
    startSimulation: backendStart,
    stopSimulation: backendStop,
    updateSimulation: backendUpdate,
    pitStop: backendPitStop,
    resumeSimulation: backendResume,
    isPaused,
    pauseReason,
  } = useBackendSimulation(userId, selectedTrack, config, { pollInterval: 2000 });

  const isSimulating = isActive;

  const simulationState = backendState ? {
    isRunning: backendState.is_active,
    currentLap: backendState.current_lap,
    currentSector: backendState.current_sector,
    currentSectorProgress: backendState.sector_progress,
    currentLapTime: backendState.lap_time,
    currentSpeed: backendState.raw_telemetry?.KPH || backendState.speed || 0,
    avgSpeed: backendState.raw_telemetry?.KPH || backendState.speed || 0,
    currentFuel: backendState.fuel || 0,
    fuelPercentage: (backendState.fuel / config.fuelLoad) * 100,
    tireAge: backendState.tire_age || 0,
    totalDistance: (backendState.current_lap - 1) * (trackData.length || 5.5),
    airTemp: backendState.raw_telemetry?.AIR_TEMP || config.airTemp,
    trackTemp: backendState.raw_telemetry?.TRACK_TEMP || config.trackTemp,
    humidity: backendState.raw_telemetry?.HUMIDITY || config.humidity,
    windSpeed: backendState.raw_telemetry?.WIND_SPEED || config.windSpeed,
    rainfall: backendState.raw_telemetry?.RAIN === 1 ? 100 : 0,
  } : null;

  const handleStartSimulation = async () => {
    await backendStart();
  };

  const handlePauseSimulation = () => {
    setShowStopDialog(true);
  };

  const handleConfirmStop = async () => {
    await backendStop();
    setShowStopDialog(false);
    setPitStopMessage(null); // Clear pit stop message when stopping
  };

  const handlePitStop = async () => {
    const result = await backendPitStop();
    if (result.success) {
      setPitStopMessage(
        `PIT STOP PAUSED • Change tire compound if needed, then click RESUME`
      );
    }
  };

  const handleResume = async () => {
    const result = await backendResume();
    if (result.success) {
      setPitStopMessage(
        `SIMULATION RESUMED • ${result.timePenaltyApplied?.toFixed(1)}s penalty applied • ` +
        `Tires: ${result.tireCompound}`
      );
      setTimeout(() => setPitStopMessage(null), 5000);
    }
  };

  const updateConfig = async <K extends keyof SimulationConfig>(key: K, value: SimulationConfig[K]) => {
    if (isSimulating) {
      if (key === 'fuelLoad' && (!isPaused || pauseReason !== 'pit_stop')) {
        console.warn('Cannot modify fuel while simulation is running. Use pit stop to refuel.');
        return;
      }
      if (key === 'simulationMode' || key === 'lapCount') {
        console.warn('Cannot change simulation mode or lap count while running.');
        return;
      }
    }
    
    const newConfig = { ...config, [key]: value } as SimulationConfig;
    
    if (key === 'simulationMode') {
      if (value === 'Single Lap') {
        newConfig.lapCount = 1;
      } else if (value === 'Multi-Lap' && config.lapCount === 1) {
        newConfig.lapCount = 20;
      } else if (value === 'Continuous') {
        newConfig.lapCount = 999; // Effectively unlimited
      }
    }
    
    setConfig(newConfig);
    
    if (isSimulating) {
      await backendUpdate(newConfig);
    }
  };

  const handleTrackChange = (trackName: TrackName) => {
    if (isSimulating) {
      console.warn('Cannot change track while simulation is running');
      return;
    }
    setSelectedTrack(trackName);
  };

  const randomizeConditions = () => {
    const tracks: TrackName[] = ['COTA', 'VIR', 'Sebring', 'Sonoma', 'Road America', 'Barber'];
    const skills: Array<'Pro' | 'Amateur' | 'Aggressive' | 'Conservative'> = ['Pro', 'Amateur', 'Aggressive', 'Conservative'];
    const compounds: Array<'Soft' | 'Medium' | 'Hard'> = ['Soft', 'Medium', 'Hard'];
    const modes: Array<'Single Lap' | 'Multi-Lap' | 'Continuous'> = ['Single Lap', 'Multi-Lap', 'Continuous'];
    
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    let lapCount: number;
    if (randomMode === 'Single Lap') {
      lapCount = 1;
    } else if (randomMode === 'Multi-Lap') {
      lapCount = Math.floor(Math.random() * 50) + 1;
    } else {
      lapCount = 999;
    }
    
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    const newConfig: SimulationConfig = {
      airTemp: Math.floor(Math.random() * 36) + 10,
      trackTemp: Math.floor(Math.random() * 41) + 20,
      humidity: Math.floor(Math.random() * 81) + 20,
      rainfall: Math.floor(Math.random() * 101),
      windSpeed: Math.floor(Math.random() * 51),
      driverSkill: skills[Math.floor(Math.random() * skills.length)],
      enginePower: Math.floor(Math.random() * 41) + 80,
      downforceLevel: Math.floor(Math.random() * 101),
      tireCompound: compounds[Math.floor(Math.random() * compounds.length)],
      fuelLoad: 50,
      simulationMode: randomMode,
      lapCount: lapCount,
      realTimeSpeed: Math.floor(Math.random() * 181) + 45,
    };
    
    setConfig(newConfig);
    handleTrackChange(randomTrack);
  };

  const resetParameters = () => {
    if (isSimulating) {
      console.warn('Cannot reset while simulation is running');
      return;
    }
    
    const defaultConfig: SimulationConfig = {
      driverSkill: 'Pro',
      enginePower: 100,
      downforceLevel: 50,
      tireCompound: 'Soft',
      fuelLoad: 50,
      rainfall: 0,
      airTemp: 25,
      trackTemp: 40,
      humidity: 50,
      windSpeed: 10,
      simulationMode: 'Multi-Lap',
      lapCount: 20,
      realTimeSpeed: 135
    };
    
    setConfig(defaultConfig);
    handleTrackChange('COTA');
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '00:00.00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  if (isCheckingSimulation) {
    return (
      <div className="h-screen w-screen bg-black text-zinc-400 font-rajdhani flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-zinc-400 text-sm">Checking for active simulation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black text-zinc-400 font-rajdhani overflow-hidden flex flex-col">
      <AlertDialog
        isOpen={showStopDialog}
        onClose={() => setShowStopDialog(false)}
        onConfirm={handleConfirmStop}
        title="STOP SIMULATION?"
        description={[
          'This will completely stop the current simulation',
          'All progress will be saved in lap history',
          'Starting again will begin a NEW simulation'
        ]}
        confirmText="STOP"
        cancelText="Cancel"
      />

      <div className="border-b border-zinc-800 bg-gradient-to-r from-black via-zinc-950 to-black">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/10 rounded-lg border border-orange-600/20">
              <Settings className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-wider">SIMULATION SETUP</h1>
              <p className="text-xs text-zinc-500">
                User: {user?.email || 'Guest'} • 
                {isActive ? ' Backend Simulation Active' : ' Ready to Start'}
                {simError && <span className="text-red-400 ml-2">• Error: {simError}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(234, 88, 12, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={randomizeConditions}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border border-zinc-800 hover:border-zinc-700"
            >
              <Shuffle className="w-4 h-4" />
              RANDOMIZE
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(234, 88, 12, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={resetParameters}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2 border border-zinc-800 hover:border-zinc-700"
            >
              <RotateCcw className="w-4 h-4" />
              RESET
            </motion.button>
            {!isSimulating ? (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(234, 88, 12, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartSimulation}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-black rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-orange-600/20"
              >
                <Play className="w-4 h-4 fill-black" />
                START SIMULATION
              </motion.button>
            ) : (
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(34, 197, 94, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResume}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-600/20"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    RESUME
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePitStop}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    PIT STOP
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePauseSimulation}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  STOP
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-3 overflow-hidden">
        <div className="grid grid-cols-12 gap-3 h-full">
          
          <div className="col-span-3 flex flex-col gap-2 overflow-hidden">
            <div className="border border-zinc-800 rounded-lg bg-gradient-to-br from-zinc-950 to-black p-3 shadow-xl overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                <div className="p-1 bg-orange-600/10 rounded">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-200">TRACK & WEATHER</h3>
              </div>
              <div className="space-y-2.5">
                <Field label="TRACK" value={selectedTrack} type="select" options={['COTA', 'VIR', 'Sebring', 'Sonoma', 'Road America', 'Barber']} onChange={handleTrackChange} disabled={isSimulating} />
                <Field label="AIR TEMP" value={config.airTemp} type="slider" min={10} max={45} unit="°C" onChange={(v: number) => updateConfig('airTemp', v)} disabled={false} />
                <Field label="TRACK TEMP" value={config.trackTemp} type="slider" min={20} max={60} unit="°C" onChange={(v: number) => updateConfig('trackTemp', v)} disabled={false} />
                <Field label="RAINFALL" value={config.rainfall} type="slider" min={0} max={100} unit="%" onChange={(v: number) => updateConfig('rainfall', v)} disabled={false} />
                <Field label="HUMIDITY" value={config.humidity} type="slider" min={20} max={100} unit="%" onChange={(v: number) => updateConfig('humidity', v)} disabled={false} />
                <Field label="WIND SPEED" value={config.windSpeed} type="slider" min={0} max={50} unit="km/h" onChange={(v: number) => updateConfig('windSpeed', v)} disabled={false} />
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg bg-gradient-to-br from-zinc-950 to-black p-3 shadow-xl overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                <div className="p-1 bg-orange-600/10 rounded">
                  <Activity className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-200">SIMULATION</h3>
              </div>
              <div className="space-y-2.5">
                <Field label="MODE" value={config.simulationMode} type="select" options={['Single Lap', 'Multi-Lap', 'Continuous']} onChange={(v: 'Single Lap' | 'Multi-Lap' | 'Continuous') => updateConfig('simulationMode', v)} disabled={isSimulating} />
                {config.simulationMode === 'Single Lap' && (
                  <div className="text-[10px] text-zinc-400 font-rajdhani px-2 py-1.5 bg-zinc-900/50 rounded border border-zinc-800">
                    LAP COUNT: 1 (Single lap time trial)
                  </div>
                )}
                {config.simulationMode === 'Multi-Lap' && (
                  <Field label="LAP COUNT" value={config.lapCount} type="slider" min={1} max={100} onChange={(v: number) => updateConfig('lapCount', v)} disabled={isSimulating} />
                )}
                {config.simulationMode === 'Continuous' && (
                  <div className="text-[10px] text-orange-500 font-rajdhani px-2 py-1.5 bg-zinc-900/50 rounded border border-orange-900/50">
                    LAP COUNT: ∞ (Runs until fuel depletes or manually stopped)
                  </div>
                )}
                <Field label="SPEED" value={config.realTimeSpeed} type="slider" min={45} max={225} unit="km/h" onChange={(v: number) => updateConfig('realTimeSpeed', v)} disabled={false} />
              </div>
            </div>
          </div>

          <div className="col-span-6 flex flex-col gap-2">
            <div className="border border-zinc-800 rounded-lg bg-gradient-to-br from-zinc-950 via-black to-zinc-950 relative flex-1 overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }} 
                  className="absolute w-[300px] h-[300px] border border-zinc-800/50 rounded-full" 
                />
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 90, repeat: Infinity, ease: "linear" }} 
                  className="absolute w-[220px] h-[220px] border border-zinc-800/50 rounded-full" 
                />
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 120, repeat: Infinity, ease: "linear" }} 
                  className="absolute w-[160px] h-[160px] border border-zinc-800/50 rounded-full" 
                />
                
                <div className="relative z-10 text-center">
                  <motion.div 
                    animate={{ scale: simulationState?.isRunning ? [1, 1.05, 1] : 1 }} 
                    transition={{ duration: 2, repeat: simulationState?.isRunning ? Infinity : 0 }} 
                    className="mb-2"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-600/20 blur-xl rounded-full"></div>
                      <Gauge className="w-16 h-16 text-orange-600 mx-auto relative" strokeWidth={0.5} />
                    </div>
                  </motion.div>
                  <h2 className="text-lg font-bold text-zinc-100 tracking-wider mb-2">TOYOTA GR86</h2>
                  <div className="flex items-center justify-center gap-3 text-[10px] text-zinc-400">
                    <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900/50 rounded">
                      <Zap className="w-3 h-3 text-orange-600" />
                      <span className="font-semibold">{config.enginePower}%</span>
                    </div>
                    <div className="h-3 w-px bg-zinc-700" />
                    <div className="flex items-center gap-1 px-2 py-1 bg-zinc-900/50 rounded">
                      <Activity className="w-3 h-3 text-orange-600" />
                      <span className="font-semibold">{config.downforceLevel}</span>
                    </div>
                    <div className="h-3 w-px bg-zinc-700" />
                    <div className={`flex items-center gap-1 px-2 py-1 rounded ${
                      simulationState?.isRunning ? 'bg-orange-600/20' : 'bg-zinc-900/50'
                    }`}>
                      <div className={`h-1 w-1 rounded-full ${
                        simulationState?.isRunning ? 'bg-orange-600 animate-pulse' : 'bg-zinc-600'
                      }`} />
                      <span className={`font-semibold ${
                        simulationState?.isRunning ? 'text-orange-500' : 'text-zinc-500'
                      }`}>
                        {simulationState?.isRunning ? 'LIVE' : 'READY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-black/95 backdrop-blur-sm">
                <div className="grid grid-cols-4 divide-x divide-zinc-800">
                  <Readout label="TRACK" value={selectedTrack} />
                  <Readout label="DRIVER" value={config.driverSkill} />
                  <Readout label="TIRES" value={config.tireCompound} />
                  <Readout 
                    label="MODE" 
                    value={
                      config.simulationMode === 'Single Lap' ? 'Single (1 Lap)' :
                      config.simulationMode === 'Continuous' ? 'Continuous (∞)' :
                      `Multi (${config.lapCount} Laps)`
                    } 
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <SpeedGauge speed={simulationState?.currentSpeed || 0} maxSpeed={225} />
              <FuelGauge 
                fuel={simulationState?.isRunning ? (simulationState?.currentFuel || 0) : config.fuelLoad} 
                fuelPercentage={simulationState?.isRunning ? simulationState?.fuelPercentage : (config.fuelLoad / 50) * 100}
                fuelWarning={(simulationState?.currentFuel ?? 0) < 10}
              />
              <TempGauge temp={simulationState?.airTemp || config.airTemp} label="AIR TEMP" />
              <TempGauge temp={simulationState?.trackTemp || config.trackTemp} label="TRACK" />
            </div>

            {simulationState && simulationState.isRunning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-orange-600/50 rounded-lg bg-gradient-to-br from-orange-950/30 to-black p-3 shadow-xl shadow-orange-600/20"
              >
                {simulationState.currentFuel > 0 && simulationState.currentFuel < 10 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-3 p-2 bg-red-950/50 border border-red-600/60 rounded flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-red-400 tracking-wider">
                      ⚠️ LOW FUEL - PIT STOP REQUIRED
                    </span>
                    <span className="text-xs text-red-300 ml-auto font-rajdhani">
                      {simulationState.currentFuel.toFixed(1)}L remaining
                    </span>
                  </motion.div>
                )}

                {simulationState.currentFuel <= 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-3 p-3 bg-gradient-to-r from-red-950 to-black border-2 border-red-600 rounded flex items-center gap-3"
                  >
                    <div className="text-2xl animate-pulse">🛑</div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-red-300 tracking-wider block">
                        OUT OF FUEL
                      </span>
                      <span className="text-[10px] text-red-400">
                        Simulation paused at Lap {simulationState.currentLap}
                      </span>
                    </div>
                  </motion.div>
                )}
                
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-600/30">
                  <div className="relative">
                    <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 bg-orange-600 rounded-full animate-ping" />
                  </div>
                  <h3 className="text-[10px] font-bold tracking-wider text-orange-400">LIVE TELEMETRY</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/50 rounded p-2 border border-zinc-800">
                    <div className="text-[8px] text-zinc-500 mb-1">LAP TIME</div>
                    <div className="text-lg font-bold font-rajdhani text-orange-500">
                      {formatTime(simulationState.currentLapTime)}
                    </div>
                  </div>

                  <div className="bg-black/50 rounded p-2 border border-zinc-800">
                    <div className="text-[8px] text-zinc-500 mb-1">CURRENT LAP</div>
                    <div className="text-lg font-bold text-orange-500">
                      {simulationState.currentLap} / {config.lapCount}
                    </div>
                  </div>

                  <div className="col-span-2 bg-black/50 rounded p-2 border border-zinc-800">
                    <div className="text-[8px] text-zinc-500 mb-2">
                      SECTOR {simulationState.currentSector} PROGRESS
                    </div>
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3].map((s) => (
                        <div 
                          key={s} 
                          className={`flex-1 h-2 rounded-full ${
                            s === simulationState.currentSector ? 'bg-orange-600' : 
                            s < simulationState.currentSector ? 'bg-green-600' : 'bg-zinc-800'
                          }`} 
                        />
                      ))}
                    </div>
                    <div className="text-right text-xs font-bold text-orange-500">
                      {simulationState.currentSectorProgress.toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-black/50 rounded p-2 border border-zinc-800">
                    <div className="text-[8px] text-zinc-500 mb-1">AVG SPEED</div>
                    <div className="text-sm font-bold text-zinc-300">
                      {simulationState.avgSpeed.toFixed(0)} km/h
                    </div>
                  </div>

                  <div className="bg-black/50 rounded p-2 border border-zinc-800">
                    <div className="text-[8px] text-zinc-500 mb-1">TIRE AGE</div>
                    <div className="text-sm font-bold text-zinc-300">
                      {simulationState.tireAge} laps
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="col-span-3 flex flex-col gap-2 overflow-hidden">
            <div className="border border-zinc-800 rounded-lg bg-gradient-to-br from-zinc-950 to-black p-3 shadow-xl overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                <div className="p-1 bg-orange-600/10 rounded">
                  <User className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-200">CAR & DRIVER</h3>
              </div>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold tracking-wider text-zinc-500">VEHICLE</label>
                  <div className="bg-black/50 border border-zinc-800 rounded px-2 py-1.5">
                    <div className="text-xs font-bold text-orange-600 tracking-wide">TOYOTA GR86</div>
                  </div>
                </div>
                <Field label="DRIVER" value={config.driverSkill} type="select" options={['Pro', 'Amateur', 'Aggressive', 'Conservative']} onChange={(v: 'Pro' | 'Amateur' | 'Aggressive' | 'Conservative') => updateConfig('driverSkill', v)} disabled={isSimulating} />
                <Field label="ENGINE" value={config.enginePower} type="slider" min={80} max={120} unit="%" onChange={(v: number) => updateConfig('enginePower', v)} disabled={false} />
                <Field label="DOWNFORCE" value={config.downforceLevel} type="slider" min={0} max={100} onChange={(v: number) => updateConfig('downforceLevel', v)} disabled={false} />
                <Field label="TIRE" value={config.tireCompound} type="select" options={['Soft', 'Medium', 'Hard']} onChange={(v: 'Soft' | 'Medium' | 'Hard') => updateConfig('tireCompound', v)} disabled={!isPaused || pauseReason !== 'pit_stop'} />
                <Field label="FUEL" value={isSimulating ? (simulationState?.currentFuel || 0) : config.fuelLoad} type="slider" min={0} max={50} unit="L" onChange={(v: number) => updateConfig('fuelLoad', v)} disabled={isSimulating && (!isPaused || pauseReason !== 'pit_stop')} />
              </div>
            </div>

            <div className="border border-zinc-800 rounded-lg bg-gradient-to-br from-zinc-950 to-black p-3 shadow-xl overflow-y-auto">
              <div className="flex items-center gap-2 mb-3 border-b border-zinc-800 pb-2">
                <div className="p-1 bg-orange-600/10 rounded">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <h3 className="text-[10px] font-bold tracking-wider text-zinc-200">TRACK INFO</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Length:</span>
                  <span className="text-zinc-200">{trackData.length} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sectors:</span>
                  <span className="text-zinc-200">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sector Length:</span>
                  <span className="text-zinc-200">{trackData.sectors[0]} km</span>
                </div>
                {simulationState && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Distance:</span>
                      <span className="text-zinc-200">{simulationState.totalDistance.toFixed(2)} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Laps Completed:</span>
                      <span className="text-zinc-200">{simulationState.currentLap - 1}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {pitStopMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 bg-gradient-to-r from-green-950 to-black border-2 border-green-600 rounded flex items-center gap-3"
              >
                <div className="text-2xl">🏁</div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-green-300 tracking-wider block">
                    {pitStopMessage}
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {completedLaps && completedLaps.length > 0 && (
          <div className="mt-4">
            <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3">
              <h3 className="text-sm font-bold text-green-500 mb-2 flex items-center gap-2">
                <Flag className="w-4 h-4" />
                COMPLETED LAPS ({completedLaps.length})
              </h3>
              <div className="text-xs text-zinc-500 mb-2">Stored in backend database</div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {completedLaps.slice(-10).reverse().map((lap, idx) => (
                  <div key={idx} className="p-2 bg-zinc-900/50 rounded border border-zinc-800 text-[10px]">
                    <div className="flex justify-between mb-1">
                      <span className="text-green-400 font-bold">LAP {lap.lap_number}</span>
                      <span className="text-zinc-200">{lap.lap_time.toFixed(3)}s</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-zinc-400">
                      <div>Avg Speed: <span className="text-zinc-200">{lap.speed_stats.avg_speed.toFixed(1)}</span></div>
                      <div>Fuel: <span className="text-zinc-200">{lap.fuel_stats.used.toFixed(2)}</span>L</div>
                      <div>Tire: <span className="text-zinc-200">{lap.tire_stats.age}</span> laps</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type FieldProps<T extends string | number = string | number> = {
  label: string;
  value: T;
  type: 'select' | 'slider';
  options?: string[];
  min?: number;
  max?: number;
  unit?: string;
  onChange?: (v: T) => void;
  disabled?: boolean;
};

function Field<T extends string | number = string | number>({ label, value, type, options, min, max, unit, onChange, disabled }: FieldProps<T>) {
  if (type === 'select') {
    return (
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <label className="text-[10px] text-zinc-400 mb-1 block tracking-wider font-medium">{label}</label>
        <Select value={String(value)} onValueChange={(v: string) => onChange?.(v as T)} disabled={disabled}>
          <SelectTrigger className={`w-full bg-zinc-900/50 border border-zinc-700 rounded px-2 py-1.5 text-[11px] text-zinc-200 focus:border-orange-600 focus:ring-1 focus:ring-orange-600/50 focus:outline-none transition-all hover:border-zinc-600 font-medium h-auto ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt: string) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
  
  if (type === 'slider') {
    const displayValue = typeof value === 'number' ? Math.round(value) : value;
    return (
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <div className="flex justify-between items-center mb-2">
          <label className="text-[10px] text-zinc-400 tracking-wider font-medium">{label}</label>
          <span className={`text-[10px] font-semibold font-rajdhani bg-orange-600/10 px-1.5 py-0.5 rounded ${disabled ? 'text-zinc-500' : 'text-orange-500'}`}>{displayValue}{unit}</span>
        </div>
        <Slider 
          value={[Number(value)]} 
          onValueChange={(vals: number[]) => onChange?.(vals[0] as T)} 
          min={min} 
          max={max} 
          step={1}
          disabled={disabled}
          className="w-full"
        />
      </div>
    );
  }
  
  return null;
}

// Readout Component
function Readout({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-2 text-center">
      <div className="text-[9px] text-zinc-500 mb-0.5 tracking-widest font-medium">{label}</div>
      <div className="text-xs text-zinc-200 font-bold tracking-wide truncate">{value}</div>
    </div>
  );
}

// Unified Gauge Component
function UnifiedGauge({ label, value, unit, max, ticks, displayValue }: { label: string; value: number; unit: string; max: number; ticks: number[]; displayValue?: string }) {
  const percentage = (value / max) * 100;
  
  return (
    <div className="border border-zinc-900 rounded bg-black p-2.5 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[9px] text-zinc-500 font-medium tracking-wider">{label}</div>
        <div className="text-xs text-orange-600 font-bold font-rajdhani">{displayValue ?? value}{unit}</div>
      </div>
      
      <div className="relative h-8 bg-zinc-950 rounded overflow-hidden border border-zinc-900">
        <div 
          className="absolute inset-y-0 left-0 bg-orange-600/20 border-r-2 border-orange-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-orange-600/30" />
        </div>
        
        <div className="absolute inset-0 flex justify-between px-1">
          {ticks.map((tick) => (
            <div key={tick} className="h-full border-l border-zinc-800 flex items-end pb-0.5">
              <span className="text-[7px] text-zinc-700 -ml-1">{tick}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Speed Gauge Component
function SpeedGauge({ speed, maxSpeed }: { speed: number; maxSpeed: number }) {
  return <UnifiedGauge label="SPEED" value={Math.round(speed)} unit=" km/h" max={maxSpeed} ticks={[0, 50, 100, 150, 200]} />;
}

// Fuel Gauge Component
function FuelGauge({ fuel, fuelPercentage, fuelWarning }: { fuel: number; fuelPercentage?: number; fuelWarning?: boolean }) {
  const percentage = fuelPercentage ?? ((fuel / 50) * 100);
  
  return (
    <div className="relative">
      <UnifiedGauge 
        label="FUEL" 
        value={Math.round(percentage)} 
        unit=" L" 
        max={100} 
        ticks={[0, 25, 50, 75, 100]}
        displayValue={fuel.toFixed(1)}
      />
      {fuelWarning && (
        <div className="absolute top-2 right-2 animate-pulse">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-600/50" />
        </div>
      )}
    </div>
  );
}

// Temperature Gauge Component
function TempGauge({ temp, label }: { temp: number; label: string }) {
  const maxTemp = label === 'TRACK' ? 60 : 45;
  const ticks = label === 'TRACK' ? [0, 15, 30, 45, 60] : [0, 10, 20, 30, 45];
  
  return <UnifiedGauge label={label} value={temp} unit="°C" max={maxTemp} ticks={ticks} />;
}