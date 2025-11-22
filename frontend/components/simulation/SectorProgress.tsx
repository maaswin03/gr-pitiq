'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Circle } from 'lucide-react';

interface SectorProgressProps {
  sectors: Array<{
    number: number;
    time: string | null;
    isComplete: boolean;
    isCurrent: boolean;
  }>;
  currentLap: number;
  totalLaps: number;
}

export default function SectorProgress({ sectors, currentLap, totalLaps }: SectorProgressProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-10">
      <motion.div
        className="bg-zinc-950/90 border border-zinc-800 rounded-lg p-4 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Lap Counter */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <p className="text-sm font-bold text-zinc-100">
              LAP <span className="text-orange-500">{currentLap}</span> / {totalLaps}
            </p>
          </div>
          <div className="bg-zinc-900 rounded px-3 py-1">
            <p className="text-[10px] text-zinc-400">
              {((currentLap / totalLaps) * 100).toFixed(0)}% Complete
            </p>
          </div>
        </div>

        {/* Sector Progress Bar */}
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {sectors.map((sector) => (
              <motion.div
                key={sector.number}
                className={`relative rounded-lg p-3 border-2 transition-all ${
                  sector.isCurrent
                    ? 'border-orange-500 bg-orange-950/30'
                    : sector.isComplete
                    ? 'border-emerald-500/50 bg-emerald-950/20'
                    : 'border-zinc-800 bg-zinc-900/50'
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: sector.number * 0.05 }}
              >
                {/* Sector Header */}
                <div className="flex items-center justify-between mb-2">
                  <p
                    className={`text-[10px] font-bold tracking-wider ${
                      sector.isCurrent
                        ? 'text-orange-500'
                        : sector.isComplete
                        ? 'text-emerald-500'
                        : 'text-zinc-500'
                    }`}
                  >
                    S{sector.number}
                  </p>
                  {sector.isComplete ? (
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Circle
                      className={`w-3 h-3 ${
                        sector.isCurrent ? 'text-orange-500' : 'text-zinc-700'
                      }`}
                    />
                  )}
                </div>

                {/* Sector Time */}
                {sector.time ? (
                  <motion.p
                    className={`text-sm font-bold ${
                      sector.isCurrent
                        ? 'text-orange-400'
                        : sector.isComplete
                        ? 'text-emerald-400'
                        : 'text-zinc-400'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {sector.time}
                  </motion.p>
                ) : (
                  <p className="text-sm font-bold text-zinc-700">--:--</p>
                )}

                {/* Current Sector Pulse */}
                {sector.isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-lg border-2 border-orange-500"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] text-zinc-500">OVERALL PROGRESS</p>
              <p className="text-[9px] text-zinc-400">
                {sectors.filter((s) => s.isComplete).length} / {sectors.length} sectors
              </p>
            </div>
            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-linear-to-r from-orange-600 via-orange-500 to-orange-400"
                initial={{ width: 0 }}
                animate={{
                  width: `${(sectors.filter((s) => s.isComplete).length / sectors.length) * 100}%`,
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
