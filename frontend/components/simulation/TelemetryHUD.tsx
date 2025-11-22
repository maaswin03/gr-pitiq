'use client';

import { motion } from 'framer-motion';
import { Gauge, Flag } from 'lucide-react';

interface TelemetryHUDProps {
  speed: number;
  currentLap: number;
  totalLaps: number;
}

export default function TelemetryHUD({
  speed,
  currentLap,
  totalLaps,
}: TelemetryHUDProps) {
  return (
    <div className="absolute top-4 right-4 space-y-3 z-10">
      {/* Speed Display */}
      <motion.div
        className="bg-zinc-950/95 border-2 border-orange-600 rounded-xl p-4 backdrop-blur-md min-w-[220px] shadow-2xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-orange-600/20 rounded">
            <Gauge className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-xs font-bold text-orange-400 tracking-wider">SPEED</p>
        </div>
        <div className="flex items-baseline gap-2">
          <motion.p
            className="text-5xl font-black text-orange-500"
            key={speed}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.15 }}
          >
            {speed.toFixed(0)}
          </motion.p>
          <p className="text-lg text-zinc-400 font-bold">km/h</p>
        </div>
      </motion.div>

      {/* Current Lap */}
      <motion.div
        className="bg-zinc-950/95 border-2 border-zinc-700 rounded-xl p-4 backdrop-blur-md shadow-2xl"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-emerald-600/20 rounded">
            <Flag className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-emerald-400 tracking-wider">CURRENT LAP</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-black text-emerald-500">{currentLap}</p>
          <p className="text-xl text-zinc-500 font-bold">/ {totalLaps}</p>
        </div>
        <div className="mt-3 w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-emerald-600 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${(currentLap / totalLaps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    </div>
  );
}
