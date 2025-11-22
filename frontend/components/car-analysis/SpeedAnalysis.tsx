'use client';

import { motion } from 'framer-motion';
import { Gauge, Zap, TrendingUp } from 'lucide-react';

interface SpeedAnalysisProps {
  avgSpeed: number;
  topSpeed: number;
}

export default function SpeedAnalysis({ avgSpeed, topSpeed }: SpeedAnalysisProps) {
  const speedEfficiency = (avgSpeed / topSpeed) * 100;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-zinc-950 border border-orange-600/20 rounded-lg overflow-hidden"
    >
      <div className="bg-linear-to-r from-orange-600/10 to-transparent p-6 border-b border-orange-600/20">
        <div className="flex items-center gap-3">
          <Gauge className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-zinc-100 font-rajdhani">Speed Analysis</h2>
            <p className="text-sm text-zinc-500 mt-1">Velocity performance metrics</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-bold text-zinc-400">Average Speed</span>
          </div>
          <span className="text-2xl font-black text-orange-600">{avgSpeed.toFixed(1)} KPH</span>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-bold text-zinc-400">Top Speed</span>
          </div>
          <span className="text-2xl font-black text-orange-600">{topSpeed.toFixed(1)} KPH</span>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-sm font-bold text-zinc-400">Speed Efficiency</span>
          </div>
          <span className="text-2xl font-black text-orange-600">{speedEfficiency.toFixed(1)}%</span>
        </div>
      </div>
    </motion.div>
  );
}
