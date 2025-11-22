'use client';

import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun, Wind } from 'lucide-react';

interface WeatherOverlayProps {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  temperature: number;
  humidity: number;
  windSpeed: number;
  trackTemp: number;
}

export default function WeatherOverlay({
  condition,
  temperature,
  humidity,
  windSpeed,
  trackTemp,
}: WeatherOverlayProps) {
  const weatherIcons = {
    sunny: <Sun className="w-6 h-6 text-yellow-500" />,
    cloudy: <Cloud className="w-6 h-6 text-zinc-400" />,
    rainy: <CloudRain className="w-6 h-6 text-blue-400" />,
    stormy: <CloudRain className="w-6 h-6 text-violet-400" />,
  };

  const weatherColors = {
    sunny: 'border-yellow-500',
    cloudy: 'border-zinc-700',
    rainy: 'border-blue-500',
    stormy: 'border-violet-500',
  };

  const getTrackCondition = () => {
    if (condition === 'rainy' || condition === 'stormy') return 'WET';
    if (condition === 'cloudy') return 'DAMP';
    return 'DRY';
  };

  return (
    <div className="absolute top-4 left-4 z-10">
      <motion.div
        className={`bg-zinc-950/95 border-2 rounded-xl p-5 backdrop-blur-md min-w-[280px] shadow-2xl ${weatherColors[condition]}`}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900/50 rounded-lg">
              {weatherIcons[condition]}
            </div>
            <p className="text-lg font-bold text-zinc-100 uppercase tracking-wide">{condition}</p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              getTrackCondition() === 'DRY'
                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-600'
                : getTrackCondition() === 'DAMP'
                ? 'bg-yellow-950/50 text-yellow-400 border border-yellow-600'
                : 'bg-blue-950/50 text-blue-400 border border-blue-600'
            }`}
          >
            {getTrackCondition()}
          </div>
        </div>

        {/* Weather Data Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Air Temperature */}
          <div className="bg-zinc-900/70 rounded-lg p-3 border border-zinc-800">
            <p className="text-[10px] text-zinc-400 mb-2 font-bold tracking-wider">AIR TEMP</p>
            <p className="text-2xl font-black text-zinc-100">{temperature}°C</p>
          </div>

          {/* Track Temperature */}
          <div className="bg-zinc-900/70 rounded-lg p-3 border border-zinc-800">
            <p className="text-[10px] text-zinc-400 mb-2 font-bold tracking-wider">TRACK TEMP</p>
            <p className="text-2xl font-black text-orange-400">{trackTemp}°C</p>
          </div>

          {/* Humidity */}
          <div className="bg-zinc-900/70 rounded-lg p-3 border border-zinc-800">
            <p className="text-[10px] text-zinc-400 mb-2 font-bold tracking-wider">HUMIDITY</p>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-black text-zinc-100">{humidity}</p>
              <p className="text-sm text-zinc-500">%</p>
            </div>
          </div>

          {/* Wind Speed */}
          <div className="bg-zinc-900/70 rounded-lg p-3 border border-zinc-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              <p className="text-[10px] text-zinc-400 font-bold tracking-wider">WIND</p>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-black text-cyan-400">{windSpeed}</p>
              <p className="text-sm text-zinc-500">km/h</p>
            </div>
          </div>
        </div>

        {/* Weather Impact Warning */}
        {(condition === 'rainy' || condition === 'stormy') && (
          <motion.div
            className="mt-2 bg-orange-950/30 border border-orange-500/30 rounded p-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p className="text-[8px] text-orange-400 font-bold">
              ⚠️ WET CONDITIONS - Reduced grip, consider tire strategy
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Visual Weather Effects Indicator */}
      {condition === 'rainy' && (
        <div className="absolute -inset-10 pointer-events-none">
          {[...Array(20)].map((_, i) => {
            const left = (i * 5.26) % 100;
            const top = ((i * 13.7) % 100);
            const delay = (i * 0.05) % 1;
            return (
              <motion.div
                key={i}
                className="absolute w-0.5 h-4 bg-blue-400/30"
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                }}
                animate={{
                  y: [0, 100],
                  opacity: [0.3, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: delay,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
