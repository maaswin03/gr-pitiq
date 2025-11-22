"use client";

import { motion } from "framer-motion";
import { Flag, TrendingUp, TrendingDown, Minus, Clock, Zap } from "lucide-react";
import type { LapHistoryData } from "@/hooks/useBackendSimulation";

interface LapHistoryTableProps {
  laps: LapHistoryData[];
}

export default function LapHistoryTable({ laps }: LapHistoryTableProps) {
  if (!laps || laps.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-orange-600/30 rounded-xl bg-linear-to-br from-black via-zinc-950 to-black p-6 shadow-2xl shadow-orange-600/10"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-600/20 rounded-lg">
            <Flag className="w-5 h-5 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-orange-500 tracking-wider uppercase">Lap History</h2>
        </div>
        <div className="text-center py-8 text-zinc-500">
          <p>No completed laps yet. Start racing to see your lap history!</p>
        </div>
      </motion.div>
    );
  }

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "00.000";
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return mins > 0 ? `${mins}:${secs.padStart(6, '0')}` : secs;
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (!previous || previous <= 0) return <Minus className="w-3 h-3 text-zinc-500" />;
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return <Minus className="w-3 h-3 text-zinc-500" />;
    if (diff < 0) return <TrendingUp className="w-3 h-3 text-green-500" />;
    return <TrendingDown className="w-3 h-3 text-red-500" />;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (!previous || previous <= 0) return "text-zinc-400";
    const diff = current - previous;
    if (Math.abs(diff) < 0.01) return "text-zinc-400";
    if (diff < 0) return "text-green-500";
    return "text-red-500";
  };

  const fastestLapTime = Math.min(...laps.map(l => l.lap_time));
  const topSpeed = Math.max(...laps.map(l => l.speed_stats.top_speed));
  const reversedLaps = [...laps].reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <Flag className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-orange-500 tracking-wider uppercase">Lap History</h2>
              <p className="text-xs text-zinc-500">Completed laps with detailed telemetry</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-orange-500/70 uppercase tracking-wider">Total Laps</div>
            <div className="text-3xl font-bold text-orange-500">{laps.length}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Lap
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Lap Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  S1
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  S2
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  S3
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Avg Speed
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Top Speed
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Tire
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Fuel Remaining
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {reversedLaps.map((lap, idx) => {
                const previousLap = idx < reversedLaps.length - 1 ? reversedLaps[idx + 1] : null;
                const isFastestLap = lap.lap_time === fastestLapTime;
                
                return (
                  <motion.tr
                    key={lap.lap_number}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-zinc-100 font-bold ${isFastestLap ? 'text-orange-400' : ''}`}>
                          {lap.lap_number}
                        </span>
                        {isFastestLap && (
                          <span className="px-2 py-0.5 bg-orange-600/30 text-orange-400 text-[10px] font-bold rounded uppercase">
                            Fastest
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className={`text-zinc-100 font-bold ${isFastestLap ? 'text-orange-400' : ''}`}>
                          {formatTime(lap.lap_time)}
                        </span>
                        {previousLap && getTrendIcon(lap.lap_time, previousLap.lap_time)}
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className={`text-zinc-100 ${
                        previousLap ? getTrendColor(lap.sector_times.s1, previousLap.sector_times.s1) : ''
                      }`}>
                        {formatTime(lap.sector_times.s1)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className={`text-zinc-100 ${
                        previousLap ? getTrendColor(lap.sector_times.s2, previousLap.sector_times.s2) : ''
                      }`}>
                        {formatTime(lap.sector_times.s2)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className={`text-zinc-100 ${
                        previousLap ? getTrendColor(lap.sector_times.s3, previousLap.sector_times.s3) : ''
                      }`}>
                        {formatTime(lap.sector_times.s3)}
                      </span>
                    </td>
                    
                    <td className="px-4 py-4">
                      <span className="text-zinc-100">{lap.speed_stats.avg_speed.toFixed(1)} km/h</span>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="text-zinc-100 font-bold">{lap.speed_stats.top_speed.toFixed(1)} km/h</span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          lap.tire_stats.compound === 'Soft' ? 'bg-red-950/30 text-red-400' :
                          lap.tire_stats.compound === 'Medium' ? 'bg-yellow-950/30 text-yellow-400' :
                          'bg-zinc-800 text-zinc-300'
                        }`}>
                          {lap.tire_stats.compound}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {lap.tire_stats.age}L
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4">
                      <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${
                        lap.fuel_stats.remaining < 10 ? 'bg-red-950/30 text-red-400' :
                        lap.fuel_stats.remaining < 20 ? 'bg-yellow-950/30 text-yellow-400' :
                        'bg-green-950/30 text-green-400'
                      }`}>
                        {lap.fuel_stats.remaining.toFixed(2)}L
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-orange-950/40 to-black rounded-lg p-4 border border-orange-600/30">
            <div className="text-xs text-orange-400/70 mb-1 uppercase tracking-wider">Fastest Lap</div>
            <div className="text-2xl font-bold font-mono text-orange-400">
              {formatTime(fastestLapTime)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-950/40 to-black rounded-lg p-4 border border-orange-600/30">
            <div className="text-xs text-orange-400/70 mb-1 uppercase tracking-wider">Avg Lap Time</div>
            <div className="text-2xl font-bold font-mono text-orange-400">
              {formatTime(laps.reduce((sum, lap) => sum + lap.lap_time, 0) / laps.length)}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-950/40 to-black rounded-lg p-4 border border-orange-600/30">
            <div className="text-xs text-orange-400/70 mb-1 uppercase tracking-wider">Avg Speed</div>
            <div className="text-2xl font-bold font-mono text-orange-400">
              {(laps.reduce((sum, lap) => sum + lap.speed_stats.avg_speed, 0) / laps.length).toFixed(1)} km/h
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-950/40 to-black rounded-lg p-4 border border-orange-600/30">
            <div className="text-xs text-orange-400/70 mb-1 uppercase tracking-wider">Top Speed</div>
            <div className="text-2xl font-bold font-mono text-orange-400">
              {topSpeed.toFixed(1)} km/h
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
