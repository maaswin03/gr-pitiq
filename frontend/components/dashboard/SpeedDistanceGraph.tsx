"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

interface SpeedDistanceGraphProps {
  currentSpeed: number;
  currentDistance: number;
}

interface DataPoint {
  distance: number;
  speed: number;
}

export default function SpeedDistanceGraph({
  currentSpeed,
  currentDistance,
}: SpeedDistanceGraphProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const maxPoints = 50;

  // Generate demo data on mount if no data exists
  useEffect(() => {
    if (dataPoints.length === 0 && currentDistance === 0) {
      const demoData: DataPoint[] = [];
      for (let i = 0; i < 30; i++) {
        const distance = i * 0.2;
        // Simulate speed variations (straights, corners, braking zones)
        const baseSpeed = 200 + Math.sin(i * 0.5) * 80 + Math.cos(i * 0.3) * 50;
        const speed = Math.max(80, Math.min(340, baseSpeed + (Math.random() - 0.5) * 20));
        demoData.push({ distance, speed });
      }
      setDataPoints(demoData);
    }
  }, []);

  useEffect(() => {
    if (currentDistance > 0 || currentSpeed > 0) {
      setDataPoints((prev) => {
        const newPoints = [...prev, { distance: currentDistance, speed: currentSpeed }];
        return newPoints.slice(-maxPoints);
      });
    }
  }, [currentSpeed, currentDistance]);

  const maxSpeed = 350;
  const minDistance = dataPoints.length > 0 ? dataPoints[0].distance : 0;
  const maxDistance = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].distance : 1;
  const distanceRange = Math.max(maxDistance - minDistance, 0.1);
  const avgSpeed = dataPoints.length > 0 
    ? Math.round(dataPoints.reduce((sum, p) => sum + p.speed, 0) / dataPoints.length)
    : 0;
  const maxRecordedSpeed = dataPoints.length > 0
    ? Math.round(Math.max(...dataPoints.map(p => p.speed)))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="border border-orange-600/30 rounded-xl bg-linear-to-br from-black via-zinc-950 to-black p-4 md:p-6 shadow-2xl shadow-orange-600/10 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-linear-to-r from-orange-600/5 via-transparent to-orange-600/5" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm md:text-base font-bold text-orange-500 tracking-wider uppercase">
                SPEED VS DISTANCE
              </h3>
              <p className="text-[10px] text-zinc-600 mt-0.5">Real-time telemetry tracking</p>
            </div>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="text-right">
              <div className="text-zinc-600">Avg Speed</div>
              <div className="font-bold text-orange-500 font-mono">{avgSpeed} km/h</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-600">Max Speed</div>
              <div className="font-bold text-orange-500 font-mono">{maxRecordedSpeed} km/h</div>
            </div>
            <div className="text-right">
              <div className="text-zinc-600">Points</div>
              <div className="font-bold text-zinc-500 font-mono">{dataPoints.length}</div>
            </div>
          </div>
        </div>

        {/* Current Speed Display */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
            <div className="text-[10px] text-zinc-500 uppercase mb-1">Current</div>
            <div className="text-2xl font-bold text-orange-500 font-mono leading-none">
              {Math.round(currentSpeed)}
              <span className="text-xs text-zinc-500 ml-1">km/h</span>
            </div>
          </div>
          <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
            <div className="text-[10px] text-zinc-500 uppercase mb-1">Distance</div>
            <div className="text-2xl font-bold text-cyan-500 font-mono leading-none">
              {currentDistance.toFixed(1)}
              <span className="text-xs text-zinc-500 ml-1">km</span>
            </div>
          </div>
          <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
            <div className="text-[10px] text-zinc-500 uppercase mb-1">Points</div>
            <div className="text-2xl font-bold text-zinc-400 font-mono leading-none">
              {dataPoints.length}
              <span className="text-xs text-zinc-500 ml-1">/{maxPoints}</span>
            </div>
          </div>
        </div>
        
        <div className="h-64 border border-zinc-800 rounded-lg bg-zinc-950/50 relative overflow-hidden">
          {/* Y-axis labels (Speed) */}
          <div className="absolute left-2 top-4 bottom-8 w-12 flex flex-col justify-between text-[10px] text-zinc-500 font-mono text-right pr-2">
            <span>{maxSpeed}</span>
            <span>{Math.round(maxSpeed * 0.75)}</span>
            <span>{Math.round(maxSpeed * 0.5)}</span>
            <span>{Math.round(maxSpeed * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Y-axis label */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-zinc-600 font-bold uppercase tracking-wider whitespace-nowrap">
            Speed (km/h)
          </div>

          {/* Graph area */}
          <div className="ml-16 mr-4 mt-4 mb-8 h-[calc(100%-3rem)] relative">
            {/* Grid lines - horizontal */}
            <div className="absolute inset-0">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div key={`h-${percent}`} className="absolute w-full">
                  <div
                    className="border-t border-zinc-800/50"
                    style={{ marginTop: `${100 - percent}%` }}
                  />
                  <span 
                    className="absolute -left-14 -translate-y-1/2 text-[10px] text-zinc-600 font-mono"
                    style={{ top: `${100 - percent}%` }}
                  >
                    {Math.round((percent / 100) * maxSpeed)}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Grid lines - vertical */}
            <div className="absolute inset-0">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={`v-${percent}`}
                  className="absolute h-full border-l border-zinc-800/30"
                  style={{ left: `${percent}%` }}
                />
              ))}
            </div>

            {/* Speed line graph */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="speedGradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="speedGradientFill" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {dataPoints.length > 1 && (
                <>
                  {/* Area fill */}
                  <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    d={`
                      M 0 ${256}
                      ${dataPoints
                        .map((point, i) => {
                          const x = ((point.distance - minDistance) / distanceRange) * 100;
                          const y = ((maxSpeed - point.speed) / maxSpeed) * 100;
                          return `L ${x}% ${y}%`;
                        })
                        .join(" ")}
                      L ${((dataPoints[dataPoints.length - 1].distance - minDistance) / distanceRange) * 100}% 100%
                      L 0 100%
                      Z
                    `}
                    fill="url(#speedGradientFill)"
                  />

                  {/* Line */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    d={dataPoints
                      .map((point, i) => {
                        const x = ((point.distance - minDistance) / distanceRange) * 100;
                        const y = ((maxSpeed - point.speed) / maxSpeed) * 100;
                        return `${i === 0 ? "M" : "L"} ${x}% ${y}%`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="url(#speedGradientLine)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Current point indicator */}
                  {dataPoints.length > 0 && (
                    <motion.circle
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      cx={`${((dataPoints[dataPoints.length - 1].distance - minDistance) / distanceRange) * 100}%`}
                      cy={`${((maxSpeed - dataPoints[dataPoints.length - 1].speed) / maxSpeed) * 100}%`}
                      r="4"
                      fill="#f97316"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                  )}
                </>
              )}
            </svg>

            {/* Current speed indicator */}
            <div className="absolute top-0 right-0 bg-black/90 border border-orange-600/50 rounded-lg px-3 py-2 backdrop-blur-sm shadow-lg shadow-orange-600/20">
              <div className="text-[10px] text-zinc-500 mb-0.5 uppercase tracking-wider">Current</div>
              <div className="text-2xl font-bold text-orange-500 font-mono leading-none">
                {Math.round(currentSpeed)}
                <span className="text-xs text-zinc-500 ml-1.5">km/h</span>
              </div>
            </div>
          </div>

          {/* X-axis label */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
            Distance (km)
          </div>

          {/* X-axis ticks */}
          <div className="absolute bottom-2 left-16 right-4 flex justify-between text-[10px] text-zinc-600 font-mono">
            <span>{minDistance.toFixed(1)}</span>
            <span>{((minDistance + maxDistance) / 2).toFixed(1)}</span>
            <span>{maxDistance.toFixed(1)}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500" />
            <span className="text-zinc-500">Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-zinc-500">Current Position</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
