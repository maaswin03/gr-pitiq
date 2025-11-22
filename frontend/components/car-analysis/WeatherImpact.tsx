'use client';

import { motion } from 'framer-motion';
import { Cloud, Thermometer, Droplets, Wind } from 'lucide-react';

interface WeatherImpactProps {
  avgAirTemp: number;
  avgTrackTemp: number;
  avgHumidity: number;
  avgWindSpeed: number;
}

export default function WeatherImpact({ 
  avgAirTemp, 
  avgTrackTemp, 
  avgHumidity, 
  avgWindSpeed 
}: WeatherImpactProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-zinc-950 border border-orange-600/20 rounded-lg overflow-hidden"
    >
      <div className="bg-linear-to-r from-orange-600/10 to-transparent p-6 border-b border-orange-600/20">
        <div className="flex items-center gap-3">
          <Cloud className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-zinc-100 font-rajdhani">Weather Impact</h2>
            <p className="text-sm text-zinc-500 mt-1">Track conditions analysis</p>
          </div>
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <Thermometer className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Air Temp</span>
          </div>
          <p className="text-2xl font-black text-orange-600">{avgAirTemp.toFixed(1)}°C</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <Thermometer className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Track Temp</span>
          </div>
          <p className="text-2xl font-black text-orange-600">{avgTrackTemp.toFixed(1)}°C</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Humidity</span>
          </div>
          <p className="text-2xl font-black text-orange-600">{avgHumidity.toFixed(1)}%</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center">
              <Wind className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Wind Speed</span>
          </div>
          <p className="text-2xl font-black text-orange-600">{avgWindSpeed.toFixed(1)} km/h</p>
        </div>
      </div>
    </motion.div>
  );
}
