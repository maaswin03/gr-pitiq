"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Zap,
  Fuel,
  Thermometer,
} from "lucide-react";

interface LiveTelemetryProps {
  currentSpeed: number;
  avgSpeed: number;
  currentFuel: number;
  fuelPercentage: number;
  fuelUsedPerLap: number;
  fuelWarning: boolean;
  tireAge: number;
  tireCompound: string;
  tireVariations: number[];
}

export default function LiveTelemetry({
  currentSpeed,
  avgSpeed,
  currentFuel,
  fuelPercentage,
  fuelUsedPerLap,
  fuelWarning,
  tireAge,
  tireCompound,
  tireVariations,
}: LiveTelemetryProps) {
  const rpm = Math.round((currentSpeed / 350) * 9000);
  const gear = currentSpeed < 10 ? 'N' : Math.min(Math.floor((currentSpeed / 350) * 8) + 1, 8);
  const rpmPercentage = (rpm / 9000) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="border border-orange-600/30 rounded-xl bg-linear-to-br from-black via-zinc-950 to-black p-4 md:p-6 shadow-2xl shadow-orange-600/10 overflow-hidden relative"
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-linear-to-r from-orange-600/5 via-transparent to-orange-600/5" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm md:text-base font-bold text-orange-500 tracking-wider uppercase flex items-center gap-2">
            <Activity className="w-5 h-5" />
            LIVE TELEMETRY
          </h3>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-2 h-2 bg-orange-600 rounded-full"
            />
            <span className="text-xs text-orange-500 font-bold">RECORDING</span>
          </div>
        </div>

        {/* Main Dashboard Layout - Car Infotainment Style */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column - Gear & Tire Status */}
          <div className="xl:col-span-1 space-y-4">
            
            {/* Gear Display */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950/50 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Gear</span>
              </div>
              <div className="flex items-center justify-center h-20">
                <motion.div
                  key={gear}
                  initial={{ scale: 0.8, rotateY: -90 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="text-6xl font-bold text-orange-500 font-mono"
                >
                  {gear}
                </motion.div>
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                  <div
                    key={g}
                    className={`w-1 h-1 rounded-full ${
                      (typeof gear === 'number' && gear >= g) ? 'bg-orange-500' : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tire Compound & Age */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950/50 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Tire Status</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Compound</span>
                  <span className="text-sm font-bold text-orange-500 uppercase">{tireCompound}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-500">Age</span>
                  <span className="text-sm font-bold text-orange-500">{tireAge} laps</span>
                </div>
                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      tireAge > 25 ? 'bg-red-600' : 'bg-orange-600'
                    }`}
                    style={{ width: `${Math.min((tireAge / 30) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Center Column - Speedometer Gauge */}
          <div className="xl:col-span-1">
            <SpeedometerGauge speed={currentSpeed} avgSpeed={avgSpeed} maxSpeed={350} />
          </div>

          {/* Right Column - RPM & Fuel */}
          <div className="xl:col-span-1 space-y-4">
            
            {/* RPM Display */}
            <div className="border border-zinc-800 rounded-xl bg-zinc-950/50 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">RPM</span>
              </div>
              <div className="text-3xl font-bold text-orange-500 mb-2 font-mono">{rpm}</div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mb-2">
                <motion.div
                  className={`h-full transition-all duration-300 ${
                    rpmPercentage > 85 ? 'bg-red-600' : 'bg-orange-600'
                  }`}
                  style={{ width: `${rpmPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 font-medium">
                <span>0</span>
                <span className={rpmPercentage > 85 ? 'text-red-500 font-bold' : ''}>
                  {rpmPercentage > 85 && '⚠ '}REDLINE 9000
                </span>
              </div>
            </div>

            {/* Fuel Display */}
            <div className={`border rounded-xl p-4 backdrop-blur-sm ${
              fuelWarning 
                ? 'border-red-600/50 bg-red-950/20' 
                : 'border-zinc-800 bg-zinc-950/50'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Fuel className={`w-4 h-4 ${fuelWarning ? 'text-red-500' : 'text-orange-500'}`} />
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Fuel</span>
                {fuelWarning && (
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-xs text-red-500 font-bold ml-auto"
                  >
                    ⚠ LOW
                  </motion.span>
                )}
              </div>
              <div className="text-3xl font-bold text-orange-500 mb-2 font-mono">
                {currentFuel.toFixed(1)}<span className="text-lg text-zinc-500">L</span>
              </div>
              <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mb-2">
                <motion.div
                  className={`h-full transition-all duration-300 ${
                    fuelWarning ? 'bg-red-600' : 'bg-orange-600'
                  }`}
                  style={{ width: `${fuelPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 font-medium">
                <span>{fuelUsedPerLap.toFixed(2)}L/lap</span>
                <span>{fuelUsedPerLap > 0 ? `~${Math.floor(currentFuel / fuelUsedPerLap)} laps` : '--'}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Tire Temperature Grid - Bottom Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <TireCard
            position="FL"
            temp={Math.round(85 + (currentSpeed / 350) * 30 + tireVariations[0])}
            wear={Math.min((tireAge / 30) * 100 + tireVariations[0], 100)}
          />
          <TireCard
            position="FR"
            temp={Math.round(85 + (currentSpeed / 350) * 30 + tireVariations[1])}
            wear={Math.min((tireAge / 30) * 100 + tireVariations[1], 100)}
          />
          <TireCard
            position="RL"
            temp={Math.round(85 + (currentSpeed / 350) * 30 + tireVariations[2])}
            wear={Math.min((tireAge / 30) * 100 + tireVariations[2], 100)}
          />
          <TireCard
            position="RR"
            temp={Math.round(85 + (currentSpeed / 350) * 30 + tireVariations[3])}
            wear={Math.min((tireAge / 30) * 100 + tireVariations[3], 100)}
          />
        </div>
      </div>
    </motion.div>
  );
}

// Speedometer Gauge Component
function SpeedometerGauge({ speed, avgSpeed, maxSpeed }: { speed: number; avgSpeed: number; maxSpeed: number }) {
  const speedPercentage = (speed / maxSpeed) * 100;

  return (
    <div className="border border-zinc-800 rounded-xl bg-zinc-950/50 p-6 backdrop-blur-sm h-full flex flex-col items-center justify-center relative overflow-hidden min-h-80">
      {/* Rotating rings background effect */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 border border-zinc-800/40 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
          className="absolute w-48 h-48 border border-zinc-800/40 rounded-full"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Circular gauge */}
        <div className="relative w-56 h-56 mb-6">
          {/* Multiple Concentric Circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-56 h-56 border-2 border-zinc-800 rounded-full" />
            <div className="absolute w-48 h-48 border border-zinc-800/60 rounded-full" />
            <div className="absolute w-40 h-40 border-2 border-zinc-700 rounded-full bg-zinc-950/50" />
            <div className="absolute w-32 h-32 border border-zinc-800/40 rounded-full" />
            <div className="absolute w-24 h-24 border border-dashed border-zinc-800/30 rounded-full" />
          </div>

          {/* SVG Progress Arc */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="#27272a"
              strokeWidth="10"
              strokeDasharray="534"
              strokeDashoffset="53"
              strokeLinecap="round"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="url(#speedGradient)"
              strokeWidth="10"
              strokeDasharray="534"
              strokeDashoffset={53 + (534 * (100 - speedPercentage)) / 100}
              strokeLinecap="round"
              initial={{ strokeDashoffset: 587 }}
              animate={{ strokeDashoffset: 53 + (534 * (100 - speedPercentage)) / 100 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="60%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center speed display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              key={Math.floor(speed / 5)}
              initial={{ scale: 1.1, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-center"
            >
              <div className="text-6xl font-bold text-orange-500 font-mono leading-none tabular-nums">
                {Math.round(speed)}
              </div>
              <div className="text-xs text-zinc-500 mt-2 tracking-[0.3em] font-semibold">
                KM/H
              </div>
            </motion.div>
          </div>
        </div>

        {/* Average speed */}
        <div className="w-full max-w-xs">
          <div className="border border-zinc-800 rounded-lg bg-zinc-900/50 p-3">
            <div className="text-center">
              <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1 font-semibold">
                Average Speed
              </div>
              <div className="text-2xl font-bold text-zinc-300 font-mono tabular-nums">
                {Math.round(avgSpeed)}
                <span className="text-sm text-zinc-500 ml-1.5">km/h</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Tire Card Component
function TireCard({ position, temp, wear }: { position: string; temp: number; wear: number }) {
  const getTempColor = (temperature: number) => {
    if (temperature > 110) return 'text-red-500';
    return 'text-orange-500';
  };

  const getWearColor = (wearPercent: number) => {
    if (wearPercent > 80) return 'bg-red-600';
    return 'bg-orange-600';
  };

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2">
        <Thermometer className="w-3 h-3 text-zinc-500" />
        <span className="text-xs text-zinc-500 font-bold">{position}</span>
      </div>
      <div className={`text-2xl font-bold mb-1 font-mono ${getTempColor(temp)}`}>
        {temp}°
      </div>
      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden mb-1">
        <div
          className={`h-full transition-all ${getWearColor(wear)}`}
          style={{ width: `${wear}%` }}
        />
      </div>
      <div className="text-xs text-zinc-500 font-medium">{wear.toFixed(0)}% wear</div>
    </div>
  );
}
