'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Gauge } from 'lucide-react';

interface LapData {
  lap_number: number;
  tire_stats?: {
    age: number;
    wear?: number;
  };
}

interface TireDegradationProps {
  tireCompound: string;
  tireAge: number;
  trackTemp: number;
  currentLap: number;
  totalLaps: number;
  lapHistory: LapData[] | null;
}

interface TooltipData {
  lap: number;
  performance: number;
  age: number;
  x: number;
  y: number;
}

export default function TireDegradation({
  tireCompound,
  tireAge,
  trackTemp,
  currentLap,
  totalLaps,
  lapHistory,
}: TireDegradationProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const getTireCondition = () => {
    if (tireAge >= 20) return 'Critical';
    if (tireAge >= 15) return 'Worn';
    if (tireAge >= 10) return 'Good';
    return 'Fresh';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <Gauge className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-zinc-100 font-rajdhani tracking-wider">
          TIRE DEGRADATION
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Side - Tire Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Tire Compound */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">TIRE COMPOUND</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                tireCompound === 'Soft' ? 'bg-red-500' :
                tireCompound === 'Medium' ? 'bg-yellow-500' :
                'bg-white'
              }`}></div>
              <p className="text-2xl font-bold text-zinc-100 font-rajdhani">
                {tireCompound}
              </p>
            </div>
          </div>

          {/* Tire Age */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">TIRE AGE</p>
            <p className="text-2xl font-bold font-rajdhani text-orange-500">
              {tireAge} laps
            </p>
            <p className="text-xs text-zinc-500 mt-1">{getTireCondition()}</p>
          </div>

          {/* Tire Temperature */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">TIRE TEMP</p>
            <p className="text-2xl font-bold font-rajdhani text-orange-500">
              {Math.round(trackTemp)}°C
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {trackTemp > 45 ? 'Overheating' :
               trackTemp > 35 ? 'Hot' :
               trackTemp > 25 ? 'Optimal' :
               'Cold'}
            </p>
          </div>

          {/* Degradation Rate */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">DEGRADATION</p>
            <p className="text-2xl font-bold text-zinc-100 font-rajdhani">
              {(() => {
                const baseRate = tireCompound === 'Soft' ? 3.5 : tireCompound === 'Medium' ? 2.5 : 1.8;
                const tempFactor = trackTemp > 40 ? 1.3 : trackTemp > 30 ? 1.1 : 1.0;
                const rate = baseRate * tempFactor;
                return rate.toFixed(1);
              })()}%/lap
            </p>
          </div>

          {/* Laps Until Performance Drop */}
          <div className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">PERFORMANCE WINDOW</p>
            <p className="text-2xl font-bold text-zinc-100 font-rajdhani">
              {(() => {
                const maxLaps = tireCompound === 'Soft' ? 15 : tireCompound === 'Medium' ? 25 : 35;
                const remaining = Math.max(0, maxLaps - tireAge);
                return remaining;
              })()} laps
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Until significant grip loss
            </p>
          </div>

          {/* Tire Strategy Recommendation */}
          <div className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">TIRE STRATEGY RECOMMENDATION</p>
            {(() => {
              const maxLaps = tireCompound === 'Soft' ? 15 : tireCompound === 'Medium' ? 25 : 35;
              const remaining = Math.max(0, maxLaps - tireAge);
              const lapsToGo = totalLaps - currentLap;
              const tempFactor = trackTemp > 40 ? 1.3 : trackTemp > 30 ? 1.1 : 1.0;
              
              const isCritical = remaining < 3;
              const isWarning = remaining < 5;
              
              let recommendation = '';
              if (remaining < 3) {
                recommendation = `PIT IMMEDIATELY - ${tireCompound} critically worn`;
              } else if (remaining < 5) {
                recommendation = `PLAN PIT STOP - ${tireCompound} degrading fast`;
              } else if (tempFactor > 1.2 && tireCompound === 'Soft') {
                recommendation = `MONITOR - Soft tires degrading faster in heat`;
              } else if (remaining < lapsToGo) {
                const recommendedCompound = lapsToGo > 20 ? 'Hard' : 'Medium';
                recommendation = `${recommendedCompound} tires for remaining ${lapsToGo} laps`;
              } else {
                recommendation = 'TIRE OK - Current pace sustainable';
              }
              
              return (
                <>
                  <p className="text-2xl font-bold text-orange-500 font-rajdhani mb-2">
                    {recommendation}
                  </p>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-500">Performance window:</span>
                    <span className="text-orange-400 font-bold font-rajdhani text-sm">
                      {remaining} laps remaining
                    </span>
                  </div>
                  <div className="text-xs mt-2 pt-2 border-t border-zinc-800">
                    <span className="font-medium text-zinc-500">
                      {isCritical 
                        ? 'CRITICAL: Tires beyond optimal performance window' 
                        : isWarning 
                        ? 'WARNING: Tires nearing end of optimal window'
                        : 'OPTIMAL: Tires within performance window'
                      }
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Right Side - Tire Wear Line Graph */}
        <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider">TIRE WEAR PROGRESSION</p>
            <p className="text-zinc-600 text-xs">Current Simulation Data</p>
          </div>
          
          <div className="relative h-[400px] bg-black/40 rounded-lg border border-zinc-900 p-4">
            {(() => {
              // Only use current simulation data
              if (!lapHistory || lapHistory.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Gauge className="w-12 h-12 text-zinc-700" />
                    <p className="text-zinc-500 text-sm">No tire data yet</p>
                    <p className="text-zinc-600 text-xs">Start simulation to track tire wear</p>
                  </div>
                );
              }

              // Build clean data array from current simulation only
              const tireData = lapHistory
                .map(lap => {
                  let tireStats = lap.tire_stats;
                  
                  // If tire_stats is a string, parse it
                  if (typeof tireStats === 'string') {
                    try {
                      tireStats = JSON.parse(tireStats);
                    } catch {
                      console.error('Failed to parse tire_stats:', tireStats);
                      return null;
                    }
                  }
                  
                  const age = tireStats?.age;
                  if (age === undefined || age === null) {
                    return null;
                  }
                  
                  // Calculate tire performance (100% = fresh, 0% = worn out)
                  const maxPerformance = 100;
                  const baseWear = tireCompound === 'Soft' ? 3.5 : tireCompound === 'Medium' ? 2.5 : 1.8;
                  const performance = Math.max(0, maxPerformance - (Number(age) * baseWear));
                  
                  return {
                    lap: lap.lap_number,
                    age: Number(age),
                    performance: Number(performance)
                  };
                })
                .filter(data => data !== null)
                .sort((a, b) => a.lap - b.lap);

              if (tireData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-zinc-500 text-sm">Collecting tire data...</p>
                  </div>
                );
              }

              // Calculate projection
              const baseWear = tireCompound === 'Soft' ? 3.5 : tireCompound === 'Medium' ? 2.5 : 1.8;
              const lastPoint = tireData[tireData.length - 1];
              const projectedData: Array<{ lap: number; performance: number }> = [];
              let projPerformance = lastPoint.performance;
              
              for (let lap = lastPoint.lap + 1; lap <= totalLaps && projPerformance > 20; lap++) {
                projPerformance = Math.max(0, projPerformance - baseWear);
                projectedData.push({ lap, performance: projPerformance });
              }

              // Chart dimensions
              const maxPerformance = 100;
              const minLap = Math.min(...tireData.map(d => d.lap));
              const maxLap = Math.max(...tireData.map(d => d.lap), totalLaps);

              // Calculate positions for line graph
              const getXPosition = (lap: number) => {
                const lapRange = maxLap - minLap;
                const progress = (lap - minLap) / lapRange;
                return progress * 100;
              };

              const getYPosition = (performance: number) => {
                return 100 - (performance / maxPerformance) * 100;
              };

              // Generate SVG path for actual data
              const actualPath = tireData.map((point, i) => {
                const x = getXPosition(point.lap);
                const y = getYPosition(point.performance);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');

              // Generate SVG path for projected data
              const projectedPath = projectedData.map((point, i) => {
                const x = getXPosition(point.lap);
                const y = getYPosition(point.performance);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');

              const compoundColor = tireCompound === 'Soft' ? '#ef4444' : 
                                  tireCompound === 'Medium' ? '#eab308' : 
                                  '#ffffff';

              return (
                <>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-4 bottom-12 flex flex-col justify-between text-[11px] text-zinc-500 font-mono">
                    {[100, 80, 60, 40, 20, 0].map(perf => (
                      <div key={perf} className="text-right w-10 -mt-1.5">
                        <span className={perf === 40 ? 'text-red-500 font-bold' : ''}>{perf}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Chart area */}
                  <div className="absolute left-14 right-4 top-4 bottom-12">
                    {/* Grid lines */}
                    <div className="absolute inset-0">
                      {[0, 20, 40, 60, 80, 100].map(percent => (
                        <div
                          key={percent}
                          className={`absolute w-full ${
                            percent === 40 
                              ? 'border-t-2 border-red-600/50' 
                              : 'border-t border-zinc-800/50'
                          }`}
                          style={{ top: `${percent}%` }}
                        />
                      ))}
                    </div>

                    {/* Invisible hover area */}
                    <div 
                      className="absolute inset-0 cursor-crosshair"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const lapRange = maxLap - minLap;
                        const hoveredLap = Math.round(minLap + (x / 100) * lapRange);
                        
                        const dataPoint = tireData.find(d => d.lap === hoveredLap);
                        if (dataPoint) {
                          setTooltip({
                            lap: dataPoint.lap,
                            performance: dataPoint.performance,
                            age: dataPoint.age,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          });
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />

                    {/* SVG Line Graph */}
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
                      {/* Actual data line */}
                      <motion.path
                        d={actualPath}
                        fill="none"
                        stroke={compoundColor}
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                      />
                      
                      {/* Projected data line (dashed) */}
                      <motion.path
                        d={projectedPath}
                        fill="none"
                        stroke={compoundColor}
                        strokeWidth="0.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2,2"
                        opacity="0.6"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      />

                      {/* Data points for actual data */}
                      {tireData.map((point, i) => {
                        const x = getXPosition(point.lap);
                        const y = getYPosition(point.performance);
                        const isCurrentLap = point.lap === currentLap;
                        
                        return (
                          <motion.circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={isCurrentLap ? 1.5 : 0.8}
                            fill={isCurrentLap ? compoundColor : compoundColor}
                            stroke={isCurrentLap ? "#fff" : "none"}
                            strokeWidth={isCurrentLap ? 0.5 : 0}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="cursor-pointer group"
                          >
                            <title>
                              Lap {point.lap}: {point.performance.toFixed(0)}% performance
                              {isCurrentLap ? " (Current)" : ""}
                            </title>
                          </motion.circle>
                        );
                      })}

                      {/* Data points for projected data */}
                      {projectedData.map((point, i) => {
                        const x = getXPosition(point.lap);
                        const y = getYPosition(point.performance);
                        
                        return (
                          <motion.circle
                            key={`proj-${i}`}
                            cx={x}
                            cy={y}
                            r="1.5"
                            fill={compoundColor}
                            opacity="0.6"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.6 }}
                            transition={{ delay: 0.5 + i * 0.05, duration: 0.3 }}
                            className="cursor-pointer"
                          >
                            <title>
                              Lap {point.lap}: {point.performance.toFixed(0)}% performance (Projected)
                            </title>
                          </motion.circle>
                        );
                      })}
                    </svg>

                    {/* Warning line at 40% */}
                    <div className="absolute w-full border-t-2 border-dashed border-red-500/50" style={{ top: '40%' }}>
                      <span className="absolute right-0 -top-4 text-[10px] text-red-500 font-bold">
                        CRITICAL WEAR
                      </span>
                    </div>

                    {/* Tooltip */}
                    {tooltip && (
                      <div
                        className="absolute z-10 bg-black border border-orange-500 rounded px-3 py-2 text-xs pointer-events-none"
                        style={{
                          left: `${tooltip.x}px`,
                          top: `${tooltip.y - 60}px`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="text-orange-500 font-bold mb-1">Lap {tooltip.lap}</div>
                        <div className="text-white font-rajdhani">Performance: {tooltip.performance.toFixed(0)}%</div>
                        <div className="text-zinc-400">Age: {tooltip.age} laps</div>
                      </div>
                    )}
                  </div>

                  {/* X-axis labels */}
                  <div className="absolute left-14 right-4 bottom-0 flex justify-between text-[10px] text-zinc-600 font-mono">
                    <span className="bg-zinc-900/50 px-1 rounded">L{minLap}</span>
                    <span className="text-zinc-700">Lap Progress →</span>
                    <span className="bg-zinc-900/50 px-1 rounded">L{maxLap}</span>
                  </div>

                  {/* Current performance indicator */}
                  <div className="absolute top-4 right-4 bg-black/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs space-y-1.5 backdrop-blur-sm">
                    <div className="text-[10px] text-zinc-500 font-bold tracking-wider border-b border-zinc-800 pb-1 mb-1">
                      CURRENT STATUS
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: compoundColor }} />
                      <span className="text-zinc-300 font-medium">
                        {tireData[tireData.length - 1]?.performance.toFixed(0)}% Performance
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Lap {currentLap} of {totalLaps}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 right-4 bg-black/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs space-y-1.5 backdrop-blur-sm">
                    <div className="text-[10px] text-zinc-500 font-bold tracking-wider border-b border-zinc-800 pb-1 mb-1">
                      LEGEND
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5" style={{ backgroundColor: compoundColor }} />
                      <span className="text-zinc-300">Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: compoundColor }} />
                      <span className="text-zinc-500">Projected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-red-500/50" />
                      <span className="text-red-400 text-[11px]">Critical (&lt;40%)</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}