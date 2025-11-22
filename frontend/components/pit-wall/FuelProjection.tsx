'use client';

import { motion } from 'framer-motion';
import { Fuel } from 'lucide-react';

interface LapData {
  lap_number: number;
  fuel_stats?: {
    remaining: number;
    used: number;
  };
}

interface FuelProjectionProps {
  currentFuel: number;
  currentLap: number;
  totalLaps: number;
  lapHistory: LapData[] | null;
}

export default function FuelProjection({
  currentFuel,
  currentLap,
  totalLaps,
  lapHistory,
}: FuelProjectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <Fuel className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-zinc-100 font-rajdhani tracking-wider">
          FUEL PROJECTION
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left Side - Fuel Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Current Fuel */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">CURRENT FUEL</p>
            <p className="text-3xl font-bold text-orange-500 font-rajdhani">
              {currentFuel.toFixed(1)} L
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-2 mt-3">
              <div 
                className="bg-linear-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentFuel / 50) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {((currentFuel / 50) * 100).toFixed(0)}% of 50L capacity
            </p>
          </div>

          {/* Fuel Per Lap */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">FUEL PER LAP</p>
            <p className="text-2xl font-bold text-zinc-100 font-rajdhani">
              {lapHistory && lapHistory.length >= 2 ? (
                <>
                  {(() => {
                    const recentLaps = lapHistory.slice(-5);
                    const fuelUsed = recentLaps.reduce((sum, lap) => {
                      return sum + (lap.fuel_stats?.used || 1.8);
                    }, 0) / recentLaps.length;
                    return fuelUsed.toFixed(2);
                  })()}
                  <span className="text-sm text-zinc-500 ml-1">L/lap</span>
                </>
              ) : (
                <>1.80<span className="text-sm text-zinc-500 ml-1">L/lap</span></>
              )}
            </p>
          </div>

          {/* Laps Remaining on Fuel */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">LAPS ON FUEL</p>
            <p className="text-2xl font-bold text-zinc-100 font-rajdhani">
              {(() => {
                const fuelPerLap = lapHistory && lapHistory.length >= 2
                  ? lapHistory.slice(-5).reduce((sum, lap) => sum + (lap.fuel_stats?.used || 1.8), 0) / Math.min(5, lapHistory.length)
                  : 1.8;
                const lapsRemaining = Math.floor(currentFuel / fuelPerLap);
                return lapsRemaining;
              })()} laps
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Race ends: Lap {totalLaps}
            </p>
          </div>

          {/* Pit Stop Recommendation */}
          <div className="col-span-2 bg-zinc-950 border border-zinc-800 rounded-lg p-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider mb-2">PIT RECOMMENDATION</p>
            {(() => {
              const fuelPerLap = lapHistory && lapHistory.length >= 2
                ? lapHistory.slice(-5).reduce((sum, lap) => sum + (lap.fuel_stats?.used || 1.8), 0) / Math.min(5, lapHistory.length)
                : 1.8;
              const lapsRemaining = Math.floor(currentFuel / fuelPerLap);
              const lapsToGo = totalLaps - currentLap;
              const projectedEmptyLap = currentLap + lapsRemaining;
              
              const isCritical = lapsRemaining < lapsToGo - 2;
              const isWarning = lapsRemaining < lapsToGo + 2;
              
              return (
                <>
                  <p className="text-2xl font-bold text-orange-500 font-rajdhani mb-2">
                    {isCritical 
                      ? `PIT IN ${Math.max(1, lapsRemaining - 3)} LAPS` 
                      : isWarning 
                      ? `MONITOR - Pit lap ${Math.min(totalLaps, projectedEmptyLap - 2)}`
                      : 'FUEL OK - No pit required'
                    }
                  </p>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-zinc-500">Empty at lap:</span>
                    <span className="text-orange-400 font-bold font-rajdhani text-sm">
                      ~{Math.min(totalLaps, projectedEmptyLap)}
                    </span>
                  </div>
                  <div className="text-xs mt-2 pt-2 border-t border-zinc-800">
                    <span className="font-medium text-zinc-500">
                      {isCritical 
                        ? 'CRITICAL: Insufficient fuel to finish race' 
                        : isWarning 
                        ? 'WARNING: Fuel margin is tight'
                        : 'OPTIMAL: Sufficient fuel to finish'
                      }
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Right Side - Fuel Consumption Graph */}
        <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider">FUEL CONSUMPTION TREND</p>
            <p className="text-zinc-600 text-xs">Current Simulation Data</p>
          </div>
          
          <div className="relative h-[400px] bg-black/40 rounded-lg border border-zinc-900 p-4">
            {(() => {
              // Only use current simulation data
              if (!lapHistory || lapHistory.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Fuel className="w-12 h-12 text-zinc-700" />
                    <p className="text-zinc-500 text-sm">No fuel data yet</p>
                    <p className="text-zinc-600 text-xs">Start simulation to track consumption</p>
                  </div>
                );
              }

              // Build clean data array from current simulation only
              // Parse fuel_stats if it's a string (JSON stored as text in DB)
              const fuelData = lapHistory
                .map(lap => {
                  let fuelStats = lap.fuel_stats;
                  
                  // If fuel_stats is a string, parse it
                  if (typeof fuelStats === 'string') {
                    try {
                      fuelStats = JSON.parse(fuelStats);
                    } catch {
                      console.error('Failed to parse fuel_stats:', fuelStats);
                      return null;
                    }
                  }
                  
                  // Extract remaining fuel
                  const remaining = fuelStats?.remaining;
                  if (remaining === undefined || remaining === null) {
                    return null;
                  }
                  
                  return {
                    lap: lap.lap_number,
                    fuel: Number(remaining),
                    used: Number(fuelStats?.used || 0)
                  };
                })
                .filter(data => data !== null)
                .sort((a, b) => a.lap - b.lap);

              if (fuelData.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-zinc-500 text-sm">Collecting fuel data...</p>
                  </div>
                );
              }

              // Calculate fuel consumption rate
              const avgFuelPerLap = fuelData.length >= 2
                ? (fuelData[0].fuel - fuelData[fuelData.length - 1].fuel) / (fuelData.length - 1)
                : 1.8;

              // Project future consumption
              const lastLap = fuelData[fuelData.length - 1];
              const projectedData: Array<{ lap: number; fuel: number }> = [];
              let projectedFuel = lastLap.fuel;
              
              for (let lap = lastLap.lap + 1; lap <= totalLaps && projectedFuel > 0; lap++) {
                projectedFuel = Math.max(0, projectedFuel - avgFuelPerLap);
                projectedData.push({ lap, fuel: projectedFuel });
              }

              // Chart dimensions
              const maxLap = Math.max(...fuelData.map(d => d.lap), totalLaps);
              const minLap = Math.min(...fuelData.map(d => d.lap));
              const maxFuel = 50;

              return (
                <>
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-4 bottom-12 flex flex-col justify-between text-[11px] text-zinc-500 font-mono">
                    {[50, 40, 30, 20, 10, 0].map(fuel => (
                      <div key={fuel} className="text-right w-10 -mt-1.5">
                        <span className={fuel === 10 ? 'text-red-500 font-bold' : ''}>{fuel}L</span>
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
                            percent === 0 
                              ? 'border-t-2 border-zinc-600' 
                              : 'border-t border-zinc-800/50'
                          }`}
                          style={{ top: `${100 - percent}%` }}
                        />
                      ))}
                    </div>

                    {/* Fuel bars container - FIXED: Use normal flex layout */}
                    <div className="relative h-full flex items-end justify-start gap-1.5 px-2">
                      {fuelData.map((point, i) => {
                        const heightPercent = (point.fuel / maxFuel) * 100;
                        const isCurrentLap = point.lap === currentLap;
                        const barWidth = Math.max(12, Math.min(32, 400 / fuelData.length));
                        
                        return (
                          <div key={i} className="flex flex-col items-center justify-end group relative" style={{ width: `${barWidth}px`, height: '100%' }}>
                            {/* Hover tooltip for all bars */}
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-white px-2 py-1.5 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                              <div className="text-center">
                                <div className="text-[10px] text-zinc-400">Lap {point.lap}</div>
                                <div className="text-sm text-orange-400">{point.fuel.toFixed(1)}L</div>
                                {point.used > 0 && (
                                  <div className="text-[10px] text-zinc-500">Used: {point.used.toFixed(2)}L</div>
                                )}
                                <div className={`text-[10px] font-bold mt-0.5 ${
                                  point.fuel < 10 ? 'text-red-400' : point.fuel < 20 ? 'text-yellow-400' : 'text-green-400'
                                }`}>
                                  {point.fuel < 10 ? 'CRITICAL' : point.fuel < 20 ? 'LOW FUEL' : 'OPTIMAL'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Current lap indicator */}
                            {isCurrentLap && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -top-8 left-1/2 -translate-x-1/2 bg-orange-600 text-white px-2 py-1 rounded text-[10px] font-bold z-10 whitespace-nowrap"
                              >
                                <div>{point.fuel.toFixed(1)}L</div>
                                <div className="text-[8px] opacity-80">
                                  {point.fuel < 10 ? 'CRITICAL' : point.fuel < 20 ? 'LOW' : 'OK'}
                                </div>
                              </motion.div>
                            )}
                            
                            {/* Bar */}
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(1, heightPercent)}%` }}
                              transition={{ duration: 0.5, delay: i * 0.03 }}
                              className={`w-full rounded-t transition-all relative ${
                                isCurrentLap
                                  ? 'bg-linear-to-t from-orange-600 to-orange-500 shadow-lg shadow-orange-600/50'
                                  : point.fuel < 10
                                  ? 'bg-linear-to-t from-red-700 to-red-500'
                                  : point.fuel < 20
                                  ? 'bg-linear-to-t from-yellow-700 to-yellow-500'
                                  : 'bg-linear-to-t from-orange-900 to-orange-700'
                              }`}
                              style={{ minHeight: '3px' }}
                            >
                              {/* Small lap number at bottom of bar */}
                              {fuelData.length <= 20 && (
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-600 font-mono whitespace-nowrap">
                                  {point.lap}
                                </div>
                              )}
                            </motion.div>
                          </div>
                        );
                      })}

                      {/* Projected bars */}
                      {projectedData.map((point, i) => {
                        const heightPercent = (point.fuel / maxFuel) * 100;
                        const barWidth = Math.max(12, Math.min(32, 400 / (fuelData.length + projectedData.length)));
                        
                        return (
                          <div key={`proj-${i}`} className="flex flex-col items-center justify-end group relative" style={{ width: `${barWidth}px`, height: '100%' }}>
                            {/* Hover tooltip */}
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 text-white px-2 py-1.5 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                              <div className="text-center">
                                <div className="text-[10px] text-zinc-400">Lap {point.lap}</div>
                                <div className="text-sm text-zinc-400">{point.fuel.toFixed(1)}L</div>
                                <div className="text-[9px] text-zinc-600">Projected</div>
                              </div>
                            </div>
                            
                            <div
                              className="w-full rounded-t bg-linear-to-t from-zinc-700 to-zinc-600 opacity-40 border-t-2 border-zinc-600/50"
                              style={{ height: `${Math.max(1, heightPercent)}%`, minHeight: '3px' }}
                            >
                              {/* Lap number for projected bars if few enough */}
                              {(fuelData.length + projectedData.length) <= 20 && (
                                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-zinc-700 font-mono whitespace-nowrap">
                                  {point.lap}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Warning line at 10L */}
                    <div className="absolute w-full border-t-2 border-dashed border-red-500/50" style={{ bottom: '20%' }}>
                      <span className="absolute right-0 -top-4 text-[10px] text-red-500 font-bold">
                        LOW FUEL
                      </span>
                    </div>
                  </div>

                  {/* X-axis labels */}
                  <div className="absolute left-14 right-4 bottom-0 flex justify-between text-[10px] text-zinc-600 font-mono">
                    <span className="bg-zinc-900/50 px-1 rounded">L{minLap}</span>
                    <span className="text-zinc-700">Lap Progress →</span>
                    <span className="bg-zinc-900/50 px-1 rounded">L{maxLap}</span>
                  </div>

                  {/* Stats overlay */}
                  <div className="absolute top-4 right-4 bg-black/80 border border-zinc-800 rounded-lg px-3 py-2 text-xs space-y-1.5 backdrop-blur-sm">
                    <div className="text-[10px] text-zinc-500 font-bold tracking-wider border-b border-zinc-800 pb-1 mb-1">
                      LEGEND
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-linear-to-t from-orange-600 to-orange-500 rounded shadow-sm" />
                      <span className="text-zinc-300 font-medium">
                        Actual ({avgFuelPerLap.toFixed(2)} L/lap)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-linear-to-t from-zinc-700 to-zinc-600 rounded opacity-40 border border-zinc-600" />
                      <span className="text-zinc-500">Projected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-linear-to-t from-red-700 to-red-500 rounded" />
                      <span className="text-red-400 text-[11px]">Low Fuel (&lt;10L)</span>
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