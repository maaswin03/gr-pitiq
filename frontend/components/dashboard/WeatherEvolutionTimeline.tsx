"use client";

import { motion } from "framer-motion";
import { Cloud, Droplets, Wind, Thermometer } from "lucide-react";
import { useEffect, useState } from "react";

interface WeatherEvolutionTimelineProps {
  airTemp: number;
  trackTemp: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
}

interface WeatherDataPoint {
  time: number;
  airTemp: number;
  trackTemp: number;
  rainfall: number;
}

export default function WeatherEvolutionTimeline({
  airTemp,
  trackTemp,
  rainfall,
  humidity,
  windSpeed,
}: WeatherEvolutionTimelineProps) {
  const [dataPoints, setDataPoints] = useState<WeatherDataPoint[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const maxPoints = 30;

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
      setDataPoints((prev) => {
        const newPoints = [...prev, { 
          time: elapsedTime, 
          airTemp, 
          trackTemp, 
          rainfall 
        }];
        return newPoints.slice(-maxPoints);
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [airTemp, trackTemp, rainfall, elapsedTime]);

  const maxTemp = 60;
  const minTemp = 0;
  const maxRainfall = 10;

  const getRainfallStatus = (rain: number) => {
    if (rain === 0) return { text: "DRY", color: "#22c55e" };
    if (rain < 3) return { text: "LIGHT", color: "#f59e0b" };
    if (rain < 7) return { text: "MODERATE", color: "#f97316" };
    return { text: "HEAVY", color: "#ef4444" };
  };

  const rainfallStatus = getRainfallStatus(rainfall);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="border border-orange-600/30 rounded-xl bg-linear-to-br from-black via-zinc-950 to-black p-4 md:p-6 shadow-2xl shadow-orange-600/10 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-linear-to-r from-orange-600/5 via-transparent to-orange-600/5" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm md:text-base font-bold text-orange-500 tracking-wider uppercase flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            WEATHER EVOLUTION TIMELINE
          </h3>
          <div className="text-xs text-zinc-500">
            {dataPoints.length} data points
          </div>
        </div>

        {/* Current Weather Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
            <div className="flex items-center gap-1 mb-1">
              <Thermometer className="w-3 h-3 text-orange-500" />
              <span className="text-[10px] text-zinc-500 uppercase">Air</span>
            </div>
            <div className="text-lg font-bold text-orange-500 font-mono">{airTemp}°</div>
          </div>
          <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
            <div className="flex items-center gap-1 mb-1">
              <Thermometer className="w-3 h-3 text-red-500" />
              <span className="text-[10px] text-zinc-500 uppercase">Track</span>
            </div>
            <div className="text-lg font-bold text-red-500 font-mono">{trackTemp}°</div>
          </div>
          <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
            <div className="flex items-center gap-1 mb-1">
              <Droplets className="w-3 h-3" style={{ color: rainfallStatus.color }} />
              <span className="text-[10px] text-zinc-500 uppercase">Rain</span>
            </div>
            <div className="text-sm font-bold font-mono" style={{ color: rainfallStatus.color }}>
              {rainfallStatus.text}
            </div>
          </div>
          <div className="border border-zinc-800 rounded-lg bg-zinc-950/50 p-2">
            <div className="flex items-center gap-1 mb-1">
              <Wind className="w-3 h-3 text-cyan-500" />
              <span className="text-[10px] text-zinc-500 uppercase">Wind</span>
            </div>
            <div className="text-lg font-bold text-cyan-500 font-mono">{windSpeed}</div>
          </div>
        </div>

        {/* Weather Timeline Graph */}
        <div className="h-64 border border-zinc-800 rounded-lg bg-zinc-950/50 relative overflow-hidden">
          {/* Y-axis labels */}
          <div className="absolute left-2 top-4 bottom-8 w-10 flex flex-col justify-between text-[10px] text-zinc-500 font-mono text-right pr-2">
            <span>{maxTemp}°</span>
            <span>{Math.round(maxTemp * 0.75)}°</span>
            <span>{Math.round(maxTemp * 0.5)}°</span>
            <span>{Math.round(maxTemp * 0.25)}°</span>
            <span>0°</span>
          </div>

          {/* Graph area */}
          <div className="ml-14 mr-4 mt-4 mb-8 h-[calc(100%-3rem)] relative">
            {/* Grid lines */}
            <div className="absolute inset-0">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute w-full border-t border-zinc-800/50"
                  style={{ top: `${100 - percent}%` }}
                />
              ))}
            </div>

            {/* SVG for lines */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                {/* Air Temperature Gradient */}
                <linearGradient id="airTempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fb923c" stopOpacity="0.8" />
                </linearGradient>
                {/* Track Temperature Gradient */}
                <linearGradient id="trackTempGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.8" />
                </linearGradient>
                {/* Rainfall Gradient */}
                <linearGradient id="rainfallGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {dataPoints.length > 1 && (
                <>
                  {/* Air Temperature Line */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5 }}
                    d={dataPoints
                      .map((point, i) => {
                        const x = (i / (maxPoints - 1)) * 100;
                        const y = ((maxTemp - point.airTemp) / maxTemp) * 100;
                        return `${i === 0 ? "M" : "L"} ${x}% ${y}%`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="url(#airTempGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Track Temperature Line */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    d={dataPoints
                      .map((point, i) => {
                        const x = (i / (maxPoints - 1)) * 100;
                        const y = ((maxTemp - point.trackTemp) / maxTemp) * 100;
                        return `${i === 0 ? "M" : "L"} ${x}% ${y}%`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="url(#trackTempGradient)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Rainfall Bars */}
                  {dataPoints.map((point, i) => {
                    const x = (i / (maxPoints - 1)) * 100;
                    const barHeight = (point.rainfall / maxRainfall) * 100;
                    return (
                      <motion.rect
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 0.3 }}
                        x={`${x - 0.5}%`}
                        y={`${100 - barHeight}%`}
                        width="1%"
                        fill="url(#rainfallGradient)"
                        opacity="0.3"
                      />
                    );
                  })}

                  {/* Current point indicators */}
                  {dataPoints.length > 0 && (
                    <>
                      {/* Air Temp Point */}
                      <motion.circle
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        cx={`${((dataPoints.length - 1) / (maxPoints - 1)) * 100}%`}
                        cy={`${((maxTemp - dataPoints[dataPoints.length - 1].airTemp) / maxTemp) * 100}%`}
                        r="3"
                        fill="#f97316"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      {/* Track Temp Point */}
                      <motion.circle
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        cx={`${((dataPoints.length - 1) / (maxPoints - 1)) * 100}%`}
                        cy={`${((maxTemp - dataPoints[dataPoints.length - 1].trackTemp) / maxTemp) * 100}%`}
                        r="3"
                        fill="#ef4444"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                </>
              )}
            </svg>
          </div>

          {/* X-axis label */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
            Time
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs justify-center flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-orange-500" />
            <span className="text-zinc-500">Air Temperature</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500" />
            <span className="text-zinc-500">Track Temperature</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-2 bg-cyan-500/30 border border-cyan-500/50" />
            <span className="text-zinc-500">Rainfall</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
