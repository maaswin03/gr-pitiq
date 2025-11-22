import { motion } from 'framer-motion';
import { Target } from 'lucide-react';

interface SectorAnalysisProps {
  avgS1: number;
  avgS2: number;
  avgS3: number;
}

export default function SectorAnalysis({ avgS1, avgS2, avgS3 }: SectorAnalysisProps) {
  const formatTime = (seconds: number): string => {
    return seconds.toFixed(3);
  };

  const maxTime = Math.max(avgS1, avgS2, avgS3);

  const sectors = [
    { name: 'Sector 1', time: avgS1, color: 'from-orange-600 to-orange-700' },
    { name: 'Sector 2', time: avgS2, color: 'from-orange-500 to-orange-600' },
    { name: 'Sector 3', time: avgS3, color: 'from-orange-400 to-orange-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-zinc-950 border border-orange-600/20 rounded-lg overflow-hidden"
    >
      <div className="bg-linear-to-r from-orange-600/10 to-transparent p-6 border-b border-orange-600/20">
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-bold text-zinc-100 font-rajdhani">Sector Performance</h2>
            <p className="text-sm text-zinc-500 mt-1">Average sector times</p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {sectors.map((sector, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                {sector.name}
              </span>
              <span className="text-lg font-black text-orange-600 font-rajdhani">
                {formatTime(sector.time)}s
              </span>
            </div>
            <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-linear-to-r ${sector.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${(sector.time / maxTime) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
