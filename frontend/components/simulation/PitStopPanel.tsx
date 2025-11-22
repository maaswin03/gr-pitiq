'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Fuel, CircleDot, X, Check } from 'lucide-react';

interface PitStopPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (strategy: PitStrategy) => void;
  currentFuel: number;
  currentTireWear: number;
}

interface PitStrategy {
  changeTires: boolean;
  tireCompound: 'soft' | 'medium' | 'hard';
  refuelAmount: number;
  estimatedTime: number;
}

export default function PitStopPanel({
  isOpen,
  onClose,
  onConfirm,
  currentFuel,
  currentTireWear,
}: PitStopPanelProps) {
  const [strategy, setStrategy] = useState<PitStrategy>({
    changeTires: true,
    tireCompound: 'medium',
    refuelAmount: 50,
    estimatedTime: 0,
  });

  // Calculate pit stop time based on selections
  const calculatePitTime = (strat: PitStrategy) => {
    let time = 2; // Base time
    if (strat.changeTires) time += 3;
    if (strat.refuelAmount > 0) time += strat.refuelAmount / 20;
    return parseFloat(time.toFixed(1));
  };

  const handleStrategyChange = (updates: Partial<PitStrategy>) => {
    const newStrategy = { ...strategy, ...updates };
    newStrategy.estimatedTime = calculatePitTime(newStrategy);
    setStrategy(newStrategy);
  };

  const handleConfirm = () => {
    onConfirm({
      ...strategy,
      estimatedTime: calculatePitTime(strategy),
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-950 border border-zinc-800 rounded-lg p-6 w-full max-w-md z-50 shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-950/30 rounded">
                  <Wrench className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">PIT STOP STRATEGY</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-zinc-900 rounded transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-zinc-900/50 rounded p-3 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 mb-1">CURRENT FUEL</p>
                <p className="text-2xl font-bold text-zinc-100">{currentFuel.toFixed(0)}%</p>
              </div>
              <div className="bg-zinc-900/50 rounded p-3 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 mb-1">TIRE WEAR</p>
                <p className="text-2xl font-bold text-zinc-100">{currentTireWear.toFixed(0)}%</p>
              </div>
            </div>

            {/* Tire Change Section */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-bold text-zinc-100">Change Tires</p>
                </div>
                <button
                  onClick={() => handleStrategyChange({ changeTires: !strategy.changeTires })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    strategy.changeTires ? 'bg-orange-600' : 'bg-zinc-700'
                  }`}
                >
                  <motion.div
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                    animate={{ x: strategy.changeTires ? 24 : 0 }}
                    transition={{ duration: 0.2 }}
                  />
                </button>
              </div>

              {strategy.changeTires && (
                <motion.div
                  className="grid grid-cols-3 gap-2"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {(['soft', 'medium', 'hard'] as const).map((compound) => (
                    <button
                      key={compound}
                      onClick={() => handleStrategyChange({ tireCompound: compound })}
                      className={`p-3 rounded border-2 transition-all ${
                        strategy.tireCompound === compound
                          ? 'border-orange-500 bg-orange-950/30'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'
                      }`}
                    >
                      <p
                        className={`text-xs font-bold uppercase ${
                          strategy.tireCompound === compound ? 'text-orange-500' : 'text-zinc-400'
                        }`}
                      >
                        {compound}
                      </p>
                      <p className="text-[9px] text-zinc-600 mt-1">
                        {compound === 'soft' && '+Speed'}
                        {compound === 'medium' && 'Balanced'}
                        {compound === 'hard' && '+Durability'}
                      </p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Refuel Section */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Fuel className="w-4 h-4 text-orange-500" />
                <p className="text-sm font-bold text-zinc-100">Refuel Amount</p>
              </div>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={strategy.refuelAmount}
                  onChange={(e) =>
                    handleStrategyChange({ refuelAmount: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-zinc-400">Amount:</p>
                  <p className="text-lg font-bold text-orange-500">{strategy.refuelAmount}%</p>
                </div>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="bg-zinc-900/50 rounded p-4 border border-zinc-800 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Estimated Pit Stop Time:</p>
                <p className="text-2xl font-bold text-orange-500">
                  {calculatePitTime(strategy).toFixed(1)}s
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded font-bold text-zinc-400 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 bg-orange-600 rounded font-bold text-white hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm Pit Stop
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
