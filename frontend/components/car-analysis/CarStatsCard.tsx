import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface CarStatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  delay?: number;
}

export default function CarStatsCard({ 
  icon: Icon, 
  label, 
  value, 
  subtitle, 
  delay = 0
}: CarStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-zinc-950 border border-orange-600/20 rounded-lg p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg bg-orange-600/10 text-orange-600 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
          <p className="text-2xl font-black text-white font-rajdhani">{value}</p>
        </div>
      </div>
      {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
    </motion.div>
  );
}
