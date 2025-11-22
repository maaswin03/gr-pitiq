'use client';

import { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import Track3D from '@/components/simulation/Track3D';
import Car3D from '@/components/simulation/Car3D';
import TelemetryHUD from '@/components/simulation/TelemetryHUD';
import WeatherOverlay from '@/components/simulation/WeatherOverlay';
import PitStopPanel from '@/components/simulation/PitStopPanel';
import AIPredictionsPanel from '@/components/simulation/AIPredictionsPanel';
import { Play, Pause, RotateCcw, Wrench } from 'lucide-react';

export default function SimulationPage() {
  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [fuel, setFuel] = useState(100);
  const [currentLap, setCurrentLap] = useState(1);
  const [currentSector, setCurrentSector] = useState(0);
  const [tireWear, setTireWear] = useState({
    frontLeft: 100,
    frontRight: 100,
    rearLeft: 100,
    rearRight: 100,
  });
  const [isPitPanelOpen, setIsPitPanelOpen] = useState(false);

  // Weather conditions
  const [weather] = useState({
    condition: 'sunny' as 'sunny' | 'cloudy' | 'rainy' | 'stormy',
    temperature: 28,
    humidity: 45,
    windSpeed: 12,
    trackTemp: 42,
  });

  // AI Predictions
  const [predictions, setPredictions] = useState({
    nextLapTime: {
      value: '1:45.23',
      confidence: 85,
      trend: 'stable' as 'up' | 'down' | 'stable',
    },
    finalPosition: {
      value: 3,
      confidence: 78,
      change: 2,
    },
    optimalPitWindow: {
      start: 12,
      end: 15,
      confidence: 82,
    },
    riskFactors: [
      { factor: 'Tire degradation', severity: 'medium' as 'low' | 'medium' | 'high' },
      { factor: 'Fuel consumption', severity: 'low' as 'low' | 'medium' | 'high' },
    ],
  });

  // Simulation logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Update speed with variation
      setSpeed((prev) => {
        const variation = (Math.random() - 0.5) * 20;
        const newSpeed = Math.max(150, Math.min(320, prev + variation));
        return newSpeed;
      });

      // Update fuel consumption
      setFuel((prev) => Math.max(0, prev - 0.05));

      // Update tire wear
      setTireWear((prev) => ({
        frontLeft: Math.max(0, prev.frontLeft - 0.03),
        frontRight: Math.max(0, prev.frontRight - 0.03),
        rearLeft: Math.max(0, prev.rearLeft - 0.04),
        rearRight: Math.max(0, prev.rearRight - 0.04),
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleSectorChange = (newSector: number) => {
    if (newSector !== currentSector) {
      setCurrentSector(newSector);
    }
  };

  const handleLapComplete = () => {
    // Reset for next lap
    setCurrentLap((prev) => prev + 1);

    // Update predictions
    setPredictions((prev) => ({
      ...prev,
      nextLapTime: {
        ...prev.nextLapTime,
        confidence: Math.min(95, prev.nextLapTime.confidence + 1),
      },
    }));
  };

  const handleReset = () => {
    setIsRunning(false);
    setSpeed(0);
    setFuel(100);
    setCurrentLap(1);
    setCurrentSector(0);
    setTireWear({
      frontLeft: 100,
      frontRight: 100,
      rearLeft: 100,
      rearRight: 100,
    });
  };

  const handlePitStop = (strategy: {
    changeTires: boolean;
    tireCompound: string;
    refuelAmount: number;
    estimatedTime: number;
  }) => {
    setIsRunning(false);
    
    // Simulate pit stop
    setTimeout(() => {
      if (strategy.changeTires) {
        setTireWear({
          frontLeft: 100,
          frontRight: 100,
          rearLeft: 100,
          rearRight: 100,
        });
      }
      if (strategy.refuelAmount > 0) {
        setFuel((prev) => Math.min(100, prev + strategy.refuelAmount));
      }
      setIsRunning(true);
    }, strategy.estimatedTime * 1000);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Canvas */}
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[15, 40, 50]} fov={50} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={20}
            maxDistance={100}
          />
          
          {/* Enhanced Lighting */}
          <ambientLight intensity={0.4} />
          
          {/* Main directional light */}
          <directionalLight
            position={[15, 30, 20]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            color="#ffffff"
          />
          
          {/* Fill lights for better visibility */}
          <directionalLight
            position={[-15, 20, 20]}
            intensity={0.8}
            color="#4a5568"
          />
          
          {/* Top spotlight */}
          <spotLight
            position={[15, 40, 20]}
            angle={0.8}
            penumbra={0.5}
            intensity={2}
            castShadow
            target-position={[15, 0, 20]}
          />
          
          {/* Orange accent lights */}
          <pointLight position={[15, 15, 20]} intensity={1.5} color="#ff4500" distance={40} />
          <pointLight position={[35, 10, 20]} intensity={1} color="#ff6600" distance={30} />
          <pointLight position={[-5, 10, 20]} intensity={1} color="#ff6600" distance={30} />
          
          {/* Environment */}
          <Environment preset="night" />
          
          {/* Track and Car */}
          <Track3D />
          <Car3D
            speed={speed}
            currentSector={currentSector}
            isPitting={false}
            onSectorChange={handleSectorChange}
            onLapComplete={handleLapComplete}
          />
        </Suspense>
      </Canvas>

      {/* HUD Overlays */}
      <TelemetryHUD
        speed={speed}
        currentLap={currentLap}
        totalLaps={20}
      />

      <WeatherOverlay
        condition={weather.condition}
        temperature={weather.temperature}
        humidity={weather.humidity}
        windSpeed={weather.windSpeed}
        trackTemp={weather.trackTemp}
      />

      <AIPredictionsPanel predictions={predictions} />

      {/* Control Panel */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
        <motion.button
          onClick={() => {
            if (!isRunning && speed === 0) {
              setSpeed(250);
            }
            setIsRunning(!isRunning);
          }}
          className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRunning ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
        </motion.button>

        <motion.button
          onClick={handleReset}
          className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="w-5 h-5 text-zinc-100" />
        </motion.button>

        <motion.button
          onClick={() => setIsPitPanelOpen(true)}
          className="p-3 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Wrench className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Pit Stop Panel */}
      <PitStopPanel
        isOpen={isPitPanelOpen}
        onClose={() => setIsPitPanelOpen(false)}
        onConfirm={handlePitStop}
        currentFuel={fuel}
        currentTireWear={(tireWear.frontLeft + tireWear.frontRight + tireWear.rearLeft + tireWear.rearRight) / 4}
      />

      {/* Title */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-zinc-950/90 border border-orange-600 rounded-lg px-6 py-3 backdrop-blur-sm">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-orange-600 to-red-600">
            GR PitIQ 3D SIMULATION
          </h1>
        </div>
      </motion.div>
    </div>
  );
}
