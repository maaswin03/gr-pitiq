'use client';

import { motion } from 'framer-motion';
import { Flag, MapPin, Fuel, Gauge, Cloud } from 'lucide-react';

interface PitWallOverviewProps {
  trackName: string;
  currentLap: number;
  totalLaps: number;
  currentFuel: number;
  tireAge: number;
  tireCompound: string;
  airTemp: number;
  trackTemp: number;
  windSpeed: number;
  rain: number;
}

export default function PitWallOverview({
  trackName,
  currentLap,
  totalLaps,
  currentFuel,
  tireAge,
  tireCompound,
  airTemp,
  trackTemp,
  windSpeed,
  rain,
}: PitWallOverviewProps) {
  const getRacePhase = () => {
    const progress = (currentLap / totalLaps) * 100;
    if (progress < 33) return 'Early';
    if (progress < 66) return 'Mid';
    return 'End';
  };

  const getTireCondition = () => {
    if (tireAge < 5) return 'Fresh';
    if (tireAge < 15) return 'Good';
    if (tireAge < 25) return 'Worn';
    return 'Critical';
  };

  const getTireColor = () => {
    if (tireAge < 5) return 'text-green-400';
    if (tireAge < 15) return 'text-yellow-400';
    if (tireAge < 25) return 'text-orange-400';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <Flag className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-zinc-100 font-rajdhani tracking-wider">
          PIT WALL OVERVIEW
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Track */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-orange-600" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">TRACK</p>
          </div>
          <p className="text-2xl font-bold text-zinc-100 font-rajdhani tracking-wide">
            {trackName}
          </p>
        </div>

        {/* Lap Progress */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-orange-600" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">LAP PROGRESS</p>
          </div>
          <p className="text-2xl font-bold text-zinc-100 font-rajdhani tracking-wide">
            {currentLap} / {totalLaps}
          </p>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-3">
            <div 
              className="bg-linear-to-r from-orange-500 to-orange-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(currentLap / totalLaps) * 100}%` }}
            />
          </div>
        </div>

        {/* Race Phase */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-orange-600" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">RACE PHASE</p>
          </div>
          <p className="text-2xl font-bold text-zinc-100 font-rajdhani tracking-wide">
            {getRacePhase()}
          </p>
        </div>

        {/* Fuel */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Fuel className="w-4 h-4 text-orange-600" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">FUEL LEFT</p>
          </div>
          <p className="text-2xl font-bold text-zinc-100 font-rajdhani tracking-wide">
            {((currentFuel / 50) * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-zinc-500 mt-1">{currentFuel.toFixed(1)} L</p>
        </div>

        {/* Tire Condition */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-orange-600" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">TIRE CONDITION</p>
          </div>
          <p className={`text-2xl font-bold font-rajdhani tracking-wide ${getTireColor()}`}>
            {getTireCondition()}
          </p>
          <p className="text-xs text-zinc-500 mt-1">{tireCompound} • {tireAge} laps</p>
        </div>

        {/* Weather */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-4 h-4 text-orange-600" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">WEATHER</p>
          </div>
          <p className="text-base font-bold text-zinc-100 font-rajdhani tracking-wide">
            {rain > 0 
              ? `🌧️ ${rain}% Rain • ${Math.round(airTemp)}°C • ${Math.round(windSpeed)} km/h`
              : `☀️ Dry • ${Math.round(airTemp)}°C • ${Math.round(windSpeed)} km/h`
            }
          </p>
          <p className="text-xs text-zinc-500 mt-1">Track: {Math.round(trackTemp)}°C</p>
        </div>
      </div>
    </motion.div>
  );
}
