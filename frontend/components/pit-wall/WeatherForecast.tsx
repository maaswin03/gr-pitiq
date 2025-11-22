'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { CloudRain } from 'lucide-react';

interface WeatherData {
  air_temp?: number;
  track_temp?: number;
  rain?: number;
  wind_speed?: number;
  humidity?: number;
}

interface LapData {
  lap_number: number;
  weather?: WeatherData;
}

interface RawTelemetry {
  HUMIDITY?: number;
}

interface WeatherForecastProps {
  airTemp: number;
  trackTemp: number;
  rain: number;
  windSpeed: number;
  currentLap: number;
  totalLaps: number;
  lapHistory: LapData[] | null;
  rawTelemetry: RawTelemetry;
}

interface TooltipData {
  lap: number;
  airTemp: number;
  trackTemp: number;
  rain: number;
  wind: number;
  x: number;
  y: number;
}

export default function WeatherForecast({
  airTemp,
  trackTemp,
  rain,
  windSpeed,
  currentLap,
  totalLaps,
  lapHistory,
  rawTelemetry
}: WeatherForecastProps) {
  const humidity = rawTelemetry?.HUMIDITY || 50;
  const [tempTooltip, setTempTooltip] = useState<TooltipData | null>(null);
  const [rainTooltip, setRainTooltip] = useState<TooltipData | null>(null);

  // Calculate temperature trends
  const getTempTrend = () => {
    if (!lapHistory || lapHistory.length < 2) return '→';
    const recentLaps = lapHistory.slice(-5);
    const avgRecent = recentLaps.reduce((sum, lap) => sum + (lap.weather?.track_temp || trackTemp), 0) / recentLaps.length;
    const diff = trackTemp - avgRecent;
    if (diff > 1) return '↗';
    if (diff < -1) return '↘';
    return '→';
  };

  const tempTrend = getTempTrend();

  // Calculate weather conditions and recommendations
  const getWeatherCondition = () => {
    if (rain > 70) return { status: 'CRITICAL', color: 'text-red-400', message: 'Heavy rain imminent — Wet tire strategy required' };
    if (rain > 40) return { status: 'WARNING', color: 'text-yellow-400', message: 'Rain likely — Monitor track conditions closely' };
    if (trackTemp > 45) return { status: 'WARNING', color: 'text-orange-400', message: 'Extreme track temperature — High tire degradation' };
    if (windSpeed > 30) return { status: 'WARNING', color: 'text-yellow-400', message: 'Strong winds — Handling instability expected' };
    return { status: 'OPTIMAL', color: 'text-green-400', message: 'Weather stable — Optimal racing conditions' };
  };

  const weatherCondition = getWeatherCondition();

  // Prepare graph data (session-filtered)
  const graphData = lapHistory && lapHistory.length > 0
    ? lapHistory.map(lap => ({
        lap: lap.lap_number || 1,
        airTemp: lap.weather?.air_temp || 25,
        trackTemp: lap.weather?.track_temp || 30,
        rain: lap.weather?.rain || 0,
        wind: lap.weather?.wind_speed || 0,
      }))
    : [];

  // Add current lap if not already in history
  if (currentLap > 0 && !graphData.some(d => d.lap === currentLap)) {
    graphData.push({ lap: currentLap, airTemp, trackTemp, rain, wind: windSpeed });
  }

  graphData.sort((a, b) => a.lap - b.lap);

  const minLap = graphData.length > 0 ? graphData[0].lap : 1;
  const maxLap = Math.max(...graphData.map(d => d.lap), totalLaps || currentLap);
  const lapRange = maxLap - minLap || 1;

  // Temperature range for scaling
  const minTemp = graphData.length > 0 ? Math.min(...graphData.map(d => Math.min(d.airTemp, d.trackTemp))) - 5 : 20;
  const maxTemp = graphData.length > 0 ? Math.max(...graphData.map(d => Math.max(d.airTemp, d.trackTemp))) + 5 : 50;
  const tempRange = maxTemp - minTemp || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <CloudRain className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-zinc-100 font-rajdhani tracking-wider">WEATHER FORECAST</h2>
      </div>

      {/* Graphs Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Timeline Graph - 400px height */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-zinc-500 text-xs font-bold tracking-wider">TEMPERATURE TREND</p>
            <p className="text-zinc-600 text-xs">Current Simulation</p>
          </div>
          <div className="relative h-[400px] bg-black/40 rounded-lg p-4 border border-zinc-900">
            {tempTooltip && (
              <div 
                className="absolute bg-zinc-900 border border-orange-500 rounded-lg p-3 pointer-events-none z-10 shadow-lg"
                style={{ 
                  left: `${tempTooltip.x}%`, 
                  top: `${tempTooltip.y}%`,
                  transform: 'translate(-50%, -120%)'
                }}
              >
                <p className="text-white font-bold text-xs mb-1">Lap {tempTooltip.lap}</p>
                <p className="text-orange-400 text-xs">Track: {Math.round(tempTooltip.trackTemp)}°C</p>
                <p className="text-cyan-400 text-xs">Air: {Math.round(tempTooltip.airTemp)}°C</p>
              </div>
            )}
            {graphData.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center pt-48">No temperature data</p>
            ) : (
              <svg 
                className="w-full h-full cursor-crosshair" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none" 
                onMouseMove={(e) => {
                  const svg = e.currentTarget;
                  const rect = svg.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const hoveredLap = Math.round(minLap + ((x - 5) / 90) * lapRange);
                  const dataPoint = graphData.find(d => d.lap === hoveredLap);
                  if (dataPoint) {
                    const dataX = 5 + ((dataPoint.lap - minLap) / lapRange) * 90;
                    const dataY = 90 - ((dataPoint.trackTemp - minTemp) / tempRange) * 80;
                    setTempTooltip({
                      lap: dataPoint.lap,
                      airTemp: dataPoint.airTemp,
                      trackTemp: dataPoint.trackTemp,
                      rain: dataPoint.rain,
                      wind: dataPoint.wind,
                      x: dataX,
                      y: dataY
                    });
                  }
                }}
                onMouseLeave={() => setTempTooltip(null)}
              >
                {/* Horizontal Grid Lines */}
                <line x1="5" y1="10" x2="95" y2="10" stroke="rgb(39, 39, 42)" strokeWidth="0.2" />
                <line x1="5" y1="30" x2="95" y2="30" stroke="rgb(39, 39, 42)" strokeWidth="0.2" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="rgb(39, 39, 42)" strokeWidth="0.3" />
                <line x1="5" y1="70" x2="95" y2="70" stroke="rgb(39, 39, 42)" strokeWidth="0.2" />
                <line x1="5" y1="90" x2="95" y2="90" stroke="rgb(39, 39, 42)" strokeWidth="0.2" />

                {/* Track Temperature Area Fill */}
                <path
                  d={`M 5 90 ${graphData.map((d) => {
                    const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                    const y = 90 - ((d.trackTemp - minTemp) / tempRange) * 80;
                    return `L ${x} ${y}`;
                  }).join(' ')} L ${5 + ((graphData[graphData.length - 1].lap - minLap) / lapRange) * 90} 90 Z`}
                  fill="url(#trackTempGradient)"
                  opacity="0.2"
                />

                {/* Air Temperature Area Fill */}
                <path
                  d={`M 5 90 ${graphData.map((d) => {
                    const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                    const y = 90 - ((d.airTemp - minTemp) / tempRange) * 80;
                    return `L ${x} ${y}`;
                  }).join(' ')} L ${5 + ((graphData[graphData.length - 1].lap - minLap) / lapRange) * 90} 90 Z`}
                  fill="url(#airTempGradient)"
                  opacity="0.2"
                />

                {/* Track Temp Line */}
                <path
                  d={graphData.map((d, i) => {
                    const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                    const y = 90 - ((d.trackTemp - minTemp) / tempRange) * 80;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="rgb(249, 115, 22)"
                  strokeWidth="0.5"
                />

                {/* Air Temp Line */}
                <path
                  d={graphData.map((d, i) => {
                    const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                    const y = 90 - ((d.airTemp - minTemp) / tempRange) * 80;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="rgb(34, 211, 238)"
                  strokeWidth="0.5"
                />

                {/* Current Lap Marker */}
                {graphData.some(d => d.lap === currentLap) && (
                  <line
                    x1={5 + ((currentLap - minLap) / lapRange) * 90}
                    y1="10"
                    x2={5 + ((currentLap - minLap) / lapRange) * 90}
                    y2="90"
                    stroke="rgb(249, 115, 22)"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                    opacity="0.5"
                  />
                )}

                {/* Y-axis Labels */}
                <text x="1" y="12" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">{Math.round(maxTemp)}°</text>
                <text x="1" y="32" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">{Math.round(maxTemp - tempRange * 0.25)}°</text>
                <text x="1" y="52" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">{Math.round(maxTemp - tempRange * 0.5)}°</text>
                <text x="1" y="72" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">{Math.round(maxTemp - tempRange * 0.75)}°</text>
                <text x="1" y="92" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">{Math.round(minTemp)}°</text>

                {/* X-axis Lap Labels */}
                {graphData.filter((_, i) => i % Math.max(1, Math.floor(graphData.length / 8)) === 0).map((d) => {
                  const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                  return (
                    <text 
                      key={`lap-${d.lap}`}
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
                  <linearGradient id="trackTempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="airTempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(34, 211, 238)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="rgb(34, 211, 238)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-orange-500"></div>
              <span className="text-zinc-400">Track Temp</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-cyan-400"></div>
              <span className="text-zinc-400">Air Temp</span>
            </div>
            {graphData.some(d => d.lap === currentLap) && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-px bg-orange-500 opacity-50"></div>
                <span className="text-zinc-400">Current Lap</span>
              </div>
            )}
          </div>
        </div>

        {/* Rain & Wind Timeline Graph - 400px height */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6">
          <p className="text-zinc-400 text-xs font-bold mb-4">RAIN & WIND CONDITIONS</p>
          <div className="relative h-[400px] bg-black/30 rounded-lg p-4 border border-zinc-800">
            {rainTooltip && (
              <div 
                className="absolute bg-zinc-900 border border-orange-500 rounded-lg p-3 pointer-events-none z-10 shadow-lg"
                style={{ 
                  left: `${rainTooltip.x}%`, 
                  top: `${rainTooltip.y}%`,
                  transform: 'translate(-50%, -120%)'
                }}
              >
                <p className="text-white font-bold text-xs mb-1">Lap {rainTooltip.lap}</p>
                <p className="text-blue-400 text-xs">Rain: {Math.round(rainTooltip.rain)}%</p>
                <p className="text-gray-400 text-xs">Wind: {Math.round(rainTooltip.wind)} km/h</p>
              </div>
            )}
            {graphData.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center pt-48">No rain/wind data</p>
            ) : (
              <svg 
                className="w-full h-full cursor-crosshair" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
                onMouseMove={(e) => {
                  const svg = e.currentTarget;
                  const rect = svg.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 100;
                  const hoveredLap = Math.round(minLap + ((x - 5) / 90) * lapRange);
                  const dataPoint = graphData.find(d => d.lap === hoveredLap);
                  if (dataPoint) {
                    const dataX = 5 + ((dataPoint.lap - minLap) / lapRange) * 90;
                    const dataY = 90 - (dataPoint.rain / 100) * 70;
                    setRainTooltip({
                      lap: dataPoint.lap,
                      airTemp: dataPoint.airTemp,
                      trackTemp: dataPoint.trackTemp,
                      rain: dataPoint.rain,
                      wind: dataPoint.wind,
                      x: dataX,
                      y: dataY
                    });
                  }
                }}
                onMouseLeave={() => setRainTooltip(null)}
              >
                {/* Horizontal Grid Lines */}
                <line x1="5" y1="20" x2="95" y2="20" stroke="rgb(39, 39, 42)" strokeWidth="0.2" />
                <line x1="5" y1="40" x2="95" y2="40" stroke="rgb(39, 39, 42)" strokeWidth="0.2" />
                <line x1="5" y1="60" x2="95" y2="60" stroke="rgb(39, 39, 42)" strokeWidth="0.3" />
                <line x1="5" y1="80" x2="95" y2="80" stroke="rgb(39, 39, 42)" strokeWidth="0.2" />

                {/* Rain Area Fill */}
                <path
                  d={`M 5 90 ${graphData.map((d) => {
                    const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                    const y = 90 - (d.rain / 100) * 70;
                    return `L ${x} ${y}`;
                  }).join(' ')} L ${5 + ((graphData[graphData.length - 1].lap - minLap) / lapRange) * 90} 90 Z`}
                  fill="url(#rainGradient)"
                  opacity="0.4"
                />

                {/* Rain bars (for better visibility) */}
                {graphData.map((d, i) => {
                  const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                  const barHeight = (d.rain / 100) * 70;
                  const barWidth = 90 / graphData.length * 0.6;
                  return (
                    <rect
                      key={`rain-${i}`}
                      x={x - barWidth / 2}
                      y={90 - barHeight}
                      width={barWidth}
                      height={barHeight}
                      fill="rgb(59, 130, 246)"
                      opacity="0.6"
                    />
                  );
                })}

                {/* Wind Line */}
                <path
                  d={graphData.map((d, i) => {
                    const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                    const y = 90 - (d.wind / 50) * 70;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="rgb(156, 163, 175)"
                  strokeWidth="0.4"
                  strokeDasharray="1,0.5"
                />

                {/* Current Lap Marker */}
                {graphData.some(d => d.lap === currentLap) && (
                  <line
                    x1={5 + ((currentLap - minLap) / lapRange) * 90}
                    y1="20"
                    x2={5 + ((currentLap - minLap) / lapRange) * 90}
                    y2="90"
                    stroke="rgb(249, 115, 22)"
                    strokeWidth="0.3"
                    strokeDasharray="1,1"
                    opacity="0.5"
                  />
                )}

                {/* Y-axis Labels */}
                <text x="1" y="22" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">100</text>
                <text x="1" y="42" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">75</text>
                <text x="1" y="62" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">50</text>
                <text x="1" y="82" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">25</text>
                <text x="1" y="92" fontSize="2.5" fill="rgb(161, 161, 170)" fontFamily="monospace">0</text>

                {/* X-axis Lap Labels */}
                {graphData.filter((_, i) => i % Math.max(1, Math.floor(graphData.length / 8)) === 0).map((d) => {
                  const x = 5 + ((d.lap - minLap) / lapRange) * 90;
                  return (
                    <text 
                      key={`lap-rain-${d.lap}`}
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
                  <linearGradient id="rainGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-3 bg-blue-500 opacity-60"></div>
              <span className="text-zinc-400">Rain Probability %</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="12" height="4">
                <line x1="0" y1="2" x2="12" y2="2" stroke="rgb(156, 163, 175)" strokeWidth="1" strokeDasharray="2,1" />
              </svg>
              <span className="text-zinc-400">Wind Speed km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards Below Graphs - 2x3 Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Air Temperature */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-500 text-xs font-bold tracking-wider mb-1">AIR TEMP</p>
          <p className="text-3xl font-bold text-white mb-1">{Math.round(airTemp)}°C</p>
          <p className="text-zinc-400 text-xs">{tempTrend} {tempTrend === '↗' ? 'Rising' : tempTrend === '↘' ? 'Falling' : 'Stable'}</p>
        </div>

        {/* Track Temperature */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-500 text-xs font-bold tracking-wider mb-1">TRACK TEMP</p>
          <p className="text-3xl font-bold text-white mb-1">{Math.round(trackTemp)}°C</p>
          <p className="text-zinc-400 text-xs">
            {trackTemp > 45 ? 'Extreme' : trackTemp > 35 ? 'High' : 'Optimal'}
          </p>
        </div>

        {/* Rain Probability */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-500 text-xs font-bold tracking-wider mb-1">RAIN CHANCE</p>
          <p className="text-3xl font-bold text-white mb-1">{Math.round(rain)}%</p>
          <p className="text-zinc-400 text-xs">
            {rain > 70 ? 'Heavy Rain' : rain > 40 ? 'Likely' : 'Low'}
          </p>
        </div>

        {/* Wind Speed */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-500 text-xs font-bold tracking-wider mb-1">WIND SPEED</p>
          <p className="text-3xl font-bold text-white mb-1">{Math.round(windSpeed)} km/h</p>
          <p className="text-zinc-400 text-xs">
            {windSpeed > 30 ? 'Strong' : windSpeed > 20 ? 'Moderate' : 'Light'}
          </p>
        </div>

        {/* Humidity */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-500 text-xs font-bold tracking-wider mb-1">HUMIDITY</p>
          <p className="text-3xl font-bold text-white mb-1">{Math.round(humidity)}%</p>
          <p className="text-zinc-400 text-xs">
            {humidity > 70 ? 'High' : humidity > 50 ? 'Moderate' : 'Low'}
          </p>
        </div>

        {/* Weather Strategy Recommendation - Orange Theme */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-zinc-500 text-xs font-bold tracking-wider mb-1">WEATHER STRATEGY</p>
          <p className="text-xl font-bold text-orange-500 mb-1">{weatherCondition.status}</p>
          <p className="text-zinc-400 text-xs">{weatherCondition.message}</p>
        </div>
      </div>
    </motion.div>
  );
}
