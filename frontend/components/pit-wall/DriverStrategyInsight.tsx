"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useState } from "react";

interface LapData {
  lap_number: number;
  lap_time: number;
}

interface DriverStrategyInsightProps {
  currentLap: number;
  totalLaps: number;
  lapHistory: LapData[] | null;
  tireAge: number;
  trackTemp: number;
}

interface PerformanceTooltip {
  lap: number;
  time: number;
  x: number;
  y: number;
}

export default function DriverStrategyInsight({
  currentLap,
  totalLaps,
  lapHistory,
  tireAge,
  trackTemp,
}: DriverStrategyInsightProps) {
  const [perfTooltip, setPerfTooltip] = useState<PerformanceTooltip | null>(
    null
  );
  // Calculate driver consistency from last 5 laps
  const last5Laps =
    lapHistory && lapHistory.length >= 5
      ? lapHistory.slice(-5).filter((l) => l.lap_time > 0)
      : [];

  const avgLapTime =
    last5Laps.length > 0
      ? last5Laps.reduce((sum, lap) => sum + lap.lap_time, 0) / last5Laps.length
      : 0;

  const lapVariance =
    last5Laps.length > 0
      ? last5Laps.reduce(
          (sum, lap) => sum + Math.abs(lap.lap_time - avgLapTime),
          0
        ) / last5Laps.length
      : 0;

  const driverConsistency = Math.max(50, Math.min(100, 100 - lapVariance * 10));

  // Calculate driver fatigue
  const raceProgress = (currentLap / totalLaps) * 100;
  let driverFatigue = raceProgress * 0.8;

  if (last5Laps.length >= 3) {
    const firstLap = last5Laps[0].lap_time;
    const lastLap = last5Laps[last5Laps.length - 1].lap_time;
    if (lastLap > firstLap + 0.5) driverFatigue += 15;
  }

  if (tireAge > 20) driverFatigue += 10;
  if (trackTemp > 45) driverFatigue += 8;
  driverFatigue = Math.min(100, driverFatigue);

  // Find best lap
  const validLaps = lapHistory?.filter((l) => l.lap_time > 0) || [];
  const bestLapData =
    validLaps.length > 0
      ? validLaps.reduce(
          (best, current) =>
            current.lap_time < best.lap_time ? current : best,
          validLaps[0]
        )
      : null;

  // Performance trend
  const firstHalfAvg =
    last5Laps.length >= 2
      ? last5Laps
          .slice(0, Math.ceil(last5Laps.length / 2))
          .reduce((s, l) => s + l.lap_time, 0) / Math.ceil(last5Laps.length / 2)
      : 0;

  const secondHalfAvg =
    last5Laps.length >= 2
      ? last5Laps
          .slice(Math.ceil(last5Laps.length / 2))
          .reduce((s, l) => s + l.lap_time, 0) /
        Math.floor(last5Laps.length / 2)
      : 0;

  const trendDiff = secondHalfAvg - firstHalfAvg;
  const performanceTrend =
    trendDiff < -0.2 ? "Improving" : trendDiff > 0.2 ? "Declining" : "Stable";

  // Driver state
  let driverState = "Peak Performance";

  if (driverFatigue > 70) {
    driverState = "Fatigue Management";
  } else if (driverConsistency < 75) {
    driverState = "Inconsistent Pace";
  } else if (driverFatigue < 40 && driverConsistency >= 90) {
    driverState = "Optimal Zone";
  }

  // Performance data for graph
  const performanceData = validLaps.map((lap) => ({
    lap: lap.lap_number,
    time: lap.lap_time,
  }));

  const minLap =
    performanceData.length > 0
      ? Math.min(...performanceData.map((d) => d.lap))
      : 0;
  const maxLap =
    performanceData.length > 0
      ? Math.max(...performanceData.map((d) => d.lap))
      : 1;
  const minTime =
    performanceData.length > 0
      ? Math.min(...performanceData.map((d) => d.time))
      : 0;
  const maxTime =
    performanceData.length > 0
      ? Math.max(...performanceData.map((d) => d.time))
      : 1;
  const timeRange = maxTime - minTime;
  const timePadding = timeRange * 0.1;

  // Strategy recommendation
  let recommendText = "Monitor for changes in pace or conditions";

  if (driverFatigue > 80 && performanceTrend === "Declining") {
    recommendText = "Consider pit stop, hydration check, reduce pace by 5%";
  } else if (driverFatigue > 70 && driverConsistency < 75) {
    recommendText =
      "Conservative strategy needed, focus on consistency over speed";
  } else if (performanceTrend === "Declining" && raceProgress < 70) {
    recommendText =
      "Check telemetry for potential mechanical issues, pace dropping early";
  } else if (performanceTrend === "Improving" && driverConsistency > 85) {
    recommendText = "Push for position gain, driver hitting rhythm";
  } else if (driverConsistency > 90 && driverFatigue < 50) {
    recommendText =
      "Maintain current pace, podium finish achievable with this consistency";
  } else if (raceProgress > 80 && driverFatigue < 60) {
    recommendText = "Maximum attack available, driver fresh for final push";
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <User className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-zinc-100 font-rajdhani tracking-wider">
          DRIVER STRATEGY INSIGHT
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Panel - Driver Stats */}
        <div className="lg:col-span-2 space-y-4">
          {/* Driver Consistency */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-wider text-zinc-500">
                DRIVER CONSISTENCY
              </h3>
              <span className="text-3xl font-bold font-rajdhani text-orange-500">
                {driverConsistency.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  driverConsistency >= 90
                    ? "bg-green-500"
                    : driverConsistency >= 75
                    ? "bg-yellow-500"
                    : "bg-orange-500"
                }`}
                style={{ width: `${driverConsistency}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {driverConsistency >= 90
                ? "Excellent consistency"
                : driverConsistency >= 75
                ? "Good consistency"
                : "Variable lap times"}
            </p>
          </div>

          {/* Driver Fatigue */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold tracking-wider text-zinc-500">
                DRIVER FATIGUE
              </h3>
              <span className="text-3xl font-bold font-rajdhani text-orange-500">
                {driverFatigue.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  driverFatigue < 40
                    ? "bg-green-500"
                    : driverFatigue < 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${driverFatigue}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500">
              {driverFatigue < 40
                ? "Driver fresh"
                : driverFatigue < 70
                ? "Managing fatigue"
                : "High fatigue level"}
            </p>
          </div>

          {/* Best Lap */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-bold tracking-wider text-zinc-500 mb-2">
              BEST LAP
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-rajdhani text-orange-500">
                {bestLapData ? bestLapData.lap_time.toFixed(3) : "---.---"}
              </span>
              <span className="text-sm text-zinc-500">seconds</span>
            </div>
            {bestLapData && (
              <p className="text-xs text-zinc-500 mt-2">
                Lap {bestLapData.lap_number}
              </p>
            )}
          </div>

          {/* Performance Trend */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-bold tracking-wider text-zinc-500 mb-2">
              PERFORMANCE TREND
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-3xl text-orange-500">
                {performanceTrend === "Improving"
                  ? "↗"
                  : performanceTrend === "Declining"
                  ? "↘"
                  : "→"}
              </span>
              <div>
                <p className="text-2xl font-bold font-rajdhani text-orange-500">
                  {performanceTrend}
                </p>
                <p className="text-xs text-zinc-500">Last 5 laps</p>
              </div>
            </div>
          </div>

          {/* Driver State */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-xs font-bold tracking-wider text-zinc-500 mb-2">
              DRIVER STATE
            </h3>
            <p className="text-2xl font-bold font-rajdhani text-orange-500">
              {driverState}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              {driverFatigue > 70
                ? "Requires attention"
                : driverConsistency < 75
                ? "Focus needed"
                : driverFatigue < 40 && driverConsistency >= 90
                ? "Excellent form"
                : "Performing well"}
            </p>
          </div>
        </div>

        {/* Right Panel - Performance Graph & Recommendations */}
        <div className="lg:col-span-3 space-y-4">
          {/* Performance Trend Graph */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-zinc-500 text-xs font-bold tracking-wider">
                PERFORMANCE TREND
              </p>
              <p className="text-zinc-600 text-xs">Current Simulation</p>
            </div>

            <div className="relative h-[400px] bg-black/30 rounded-lg p-4 border border-zinc-800">
              {perfTooltip && (
                <div
                  className="absolute bg-zinc-900 border border-orange-500 rounded-lg p-3 pointer-events-none z-10 shadow-lg"
                  style={{
                    left: `${perfTooltip.x}%`,
                    top: `${perfTooltip.y}%`,
                    transform: "translate(-50%, -120%)",
                  }}
                >
                  <p className="text-white font-bold text-xs mb-1">
                    Lap {perfTooltip.lap}
                  </p>
                  <p className="text-orange-400 text-xs">
                    Time: {perfTooltip.time.toFixed(3)}s
                  </p>
                </div>
              )}
              {performanceData.length > 0 ? (
                <svg
                  className="w-full h-full cursor-crosshair"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  onMouseMove={(e) => {
                    const svg = e.currentTarget;
                    const rect = svg.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const lapRange = maxLap - minLap;
                    const hoveredLap = Math.round(
                      minLap + ((x - 5) / 90) * lapRange
                    );
                    const dataPoint = performanceData.find(
                      (d) => d.lap === hoveredLap
                    );
                    if (dataPoint) {
                      const dataX =
                        5 + ((dataPoint.lap - minLap) / lapRange) * 90;
                      const dataY =
                        90 -
                        ((dataPoint.time - (minTime - timePadding)) /
                          (maxTime + timePadding - (minTime - timePadding))) *
                          70;
                      setPerfTooltip({
                        lap: dataPoint.lap,
                        time: dataPoint.time,
                        x: dataX,
                        y: dataY,
                      });
                    }
                  }}
                  onMouseLeave={() => setPerfTooltip(null)}
                >
                  {/* Horizontal Grid Lines */}
                  <line
                    x1="5"
                    y1="20"
                    x2="95"
                    y2="20"
                    stroke="rgb(39, 39, 42)"
                    strokeWidth="0.2"
                  />
                  <line
                    x1="5"
                    y1="40"
                    x2="95"
                    y2="40"
                    stroke="rgb(39, 39, 42)"
                    strokeWidth="0.2"
                  />
                  <line
                    x1="5"
                    y1="60"
                    x2="95"
                    y2="60"
                    stroke="rgb(39, 39, 42)"
                    strokeWidth="0.3"
                  />
                  <line
                    x1="5"
                    y1="80"
                    x2="95"
                    y2="80"
                    stroke="rgb(39, 39, 42)"
                    strokeWidth="0.2"
                  />

                  {/* Performance Area Fill */}
                  <path
                    d={`M 5 90 ${performanceData
                      .map((d) => {
                        const lapRange = maxLap - minLap;
                        const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                        const y =
                          90 -
                          ((d.time - (minTime - timePadding)) /
                            (maxTime + timePadding - (minTime - timePadding))) *
                            70;
                        return `L ${x} ${y}`;
                      })
                      .join(" ")} L ${
                      5 +
                      ((performanceData[performanceData.length - 1].lap -
                        minLap) /
                        (maxLap - minLap)) *
                        90
                    } 90 Z`}
                    fill="url(#performanceGradient)"
                    opacity="0.4"
                  />

                  {/* Performance Line */}
                  <path
                    d={performanceData
                      .map((d, i) => {
                        const lapRange = maxLap - minLap;
                        const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                        const y =
                          90 -
                          ((d.time - (minTime - timePadding)) /
                            (maxTime + timePadding - (minTime - timePadding))) *
                            70;
                        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
                      })
                      .join(" ")}
                    fill="none"
                    stroke="rgb(249, 115, 22)"
                    strokeWidth="0.4"
                  />

                  {/* Current Lap Marker */}
                  {performanceData.some((d) => d.lap === currentLap) && (
                    <line
                      x1={5 + ((currentLap - minLap) / (maxLap - minLap)) * 90}
                      y1="20"
                      x2={5 + ((currentLap - minLap) / (maxLap - minLap)) * 90}
                      y2="90"
                      stroke="rgb(249, 115, 22)"
                      strokeWidth="0.3"
                      strokeDasharray="1,1"
                      opacity="0.5"
                    />
                  )}

                  {/* Y-axis Labels */}
                  <text
                    x="1"
                    y="22"
                    fontSize="2.5"
                    fill="rgb(161, 161, 170)"
                    fontFamily="monospace"
                  >
                    {(maxTime + timePadding).toFixed(1)}s
                  </text>
                  <text
                    x="1"
                    y="42"
                    fontSize="2.5"
                    fill="rgb(161, 161, 170)"
                    fontFamily="monospace"
                  >
                    {((maxTime + minTime) / 2).toFixed(1)}s
                  </text>
                  <text
                    x="1"
                    y="62"
                    fontSize="2.5"
                    fill="rgb(161, 161, 170)"
                    fontFamily="monospace"
                  >
                    {(
                      (maxTime + minTime) / 2 -
                      (maxTime - minTime) / 4
                    ).toFixed(1)}
                    s
                  </text>
                  <text
                    x="1"
                    y="82"
                    fontSize="2.5"
                    fill="rgb(161, 161, 170)"
                    fontFamily="monospace"
                  >
                    {(minTime - timePadding + (maxTime - minTime) / 4).toFixed(
                      1
                    )}
                    s
                  </text>
                  <text
                    x="1"
                    y="92"
                    fontSize="2.5"
                    fill="rgb(161, 161, 170)"
                    fontFamily="monospace"
                  >
                    {(minTime - timePadding).toFixed(1)}s
                  </text>

                  {/* X-axis Lap Labels */}
                  {performanceData
                    .filter(
                      (_, i) =>
                        i %
                          Math.max(
                            1,
                            Math.floor(performanceData.length / 8)
                          ) ===
                        0
                    )
                    .map((d) => {
                      const lapRange = maxLap - minLap;
                      const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                      return (
                        <text
                          key={`lap-perf-${d.lap}`}
                          x={x}
                          y="96"
                          fontSize="2.5"
                          fill="rgb(161, 161, 170)"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          L{d.lap}
                        </text>
                      );
                    })}

                  {/* Gradients */}
                  <defs>
                    <linearGradient
                      id="performanceGradient"
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <stop
                        offset="0%"
                        stopColor="rgb(249, 115, 22)"
                        stopOpacity="0.6"
                      />
                      <stop
                        offset="100%"
                        stopColor="rgb(249, 115, 22)"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <User className="w-12 h-12 text-zinc-700" />
                  <p className="text-zinc-500 text-sm">
                    No performance data available
                  </p>
                  <p className="text-zinc-600 text-xs">
                    Complete laps to see driver insights
                  </p>
                </div>
              )}
            </div>

            {/* Legend */}
            {performanceData.length > 0 && (
              <div className="flex items-center gap-4 text-xs mt-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-orange-500"></div>
                  <span className="text-zinc-400">Lap Times</span>
                </div>
                {bestLapData && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 border border-white"></div>
                    <span className="text-zinc-400">
                      Best: {bestLapData.lap_time.toFixed(3)}s
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-zinc-400">Current Lap</span>
                </div>
              </div>
            )}
          </div>

          {/* Strategy Recommendation */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-xs font-bold tracking-wider text-zinc-500 mb-2">
              STRATEGY RECOMMENDATION
            </p>
            <p className="text-2xl font-bold font-rajdhani text-orange-500 mb-2">
              {driverFatigue > 80 && performanceTrend === "Declining"
                ? "CRITICAL"
                : driverFatigue > 70 && driverConsistency < 75
                ? "WARNING"
                : performanceTrend === "Improving" && driverConsistency > 85
                ? "EXCELLENT"
                : driverConsistency > 90 && driverFatigue < 50
                ? "OPTIMAL"
                : "STABLE"}
            </p>
            <p className="text-xs text-zinc-500">{recommendText}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
