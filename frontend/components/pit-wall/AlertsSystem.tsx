'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'normal';
  icon: React.ReactNode;
  message: string;
  timestamp: number;
}

interface AlertsSystemProps {
  alerts: Alert[];
}

export default function AlertsSystem({ alerts }: AlertsSystemProps) {
  const criticalCount = alerts.filter(a => a.type === 'critical').length;
  const warningCount = alerts.filter(a => a.type === 'warning').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-zinc-100 font-rajdhani tracking-wider">
          ALERTS SYSTEM
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active Alerts Count */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">ACTIVE ALERTS</p>
          </div>
          <p className="text-2xl font-bold text-zinc-100 font-rajdhani tracking-wide">
            {alerts.length}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {alerts.length === 0 ? 'All systems normal' : 'Requires attention'}
          </p>
        </div>

        {/* Critical Alerts */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">CRITICAL</p>
          </div>
          <p className={`text-2xl font-bold font-rajdhani tracking-wide ${criticalCount > 0 ? 'text-red-500' : 'text-zinc-100'}`}>
            {criticalCount}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {criticalCount > 0 ? 'Immediate action needed' : 'No critical issues'}
          </p>
        </div>

        {/* Warning Alerts */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 hover:border-orange-600/30 transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <p className="text-zinc-500 text-xs font-bold tracking-wider">WARNINGS</p>
          </div>
          <p className={`text-2xl font-bold font-rajdhani tracking-wide ${warningCount > 0 ? 'text-yellow-500' : 'text-zinc-100'}`}>
            {warningCount}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {warningCount > 0 ? 'Monitor closely' : 'No warnings'}
          </p>
        </div>
      </div>

      {/* Latest Alerts List */}
      {alerts.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold tracking-wider text-zinc-500 mb-2">LATEST ALERTS</p>
          <AnimatePresence mode="popLayout">
            {alerts.slice(0, 3).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex items-center gap-3"
              >
                <div className={
                  alert.type === 'critical' ? 'text-red-500' :
                  alert.type === 'warning' ? 'text-yellow-500' :
                  'text-orange-500'
                }>
                  {alert.icon}
                </div>
                <p className="font-rajdhani text-sm tracking-wide flex-1 text-zinc-100">
                  {alert.message}
                </p>
                {alert.type === 'critical' && (
                  <div className="w-2 h-2 rounded-full animate-pulse bg-red-500"></div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
