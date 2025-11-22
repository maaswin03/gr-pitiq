'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';

interface AIPredictionsPanelProps {
  predictions: {
    nextLapTime: {
      value: string;
      confidence: number;
      trend: 'up' | 'down' | 'stable';
    };
    finalPosition: {
      value: number;
      confidence: number;
      change: number;
    };
    optimalPitWindow: {
      start: number;
      end: number;
      confidence: number;
    };
    riskFactors: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
    }>;
  };
}

export default function AIPredictionsPanel({ predictions }: AIPredictionsPanelProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-emerald-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 w-[320px]">
      <motion.div
        className="bg-zinc-950/95 border-2 border-violet-700 rounded-xl p-5 backdrop-blur-md shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-violet-900/50">
          <div className="p-2 bg-violet-950/50 rounded-lg border border-violet-800">
            <Brain className="w-5 h-5 text-violet-400" />
          </div>
          <h3 className="text-base font-bold text-violet-300 tracking-wider">AI PREDICTIONS</h3>
          <motion.div
            className="ml-auto w-2.5 h-2.5 rounded-full bg-violet-500"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>

        {/* Next Lap Prediction */}
        <motion.div
          className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-4 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-zinc-400 tracking-wider">NEXT LAP TIME</p>
            {predictions.nextLapTime.trend === 'down' ? (
              <TrendingDown className="w-3 h-3 text-emerald-500" />
            ) : predictions.nextLapTime.trend === 'up' ? (
              <TrendingUp className="w-3 h-3 text-red-500" />
            ) : (
              <TrendingUp className="w-3 h-3 text-zinc-500" />
            )}
          </div>
          <p className="text-2xl font-black text-violet-400 mb-2">
            {predictions.nextLapTime.value}
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-zinc-500 font-semibold">Confidence</p>
            <div className="flex items-center gap-2">
              <div className="w-20 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className={`h-full ${
                    predictions.nextLapTime.confidence >= 80
                      ? 'bg-emerald-500'
                      : predictions.nextLapTime.confidence >= 60
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${predictions.nextLapTime.confidence}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
              <p
                className={`text-[9px] font-bold ${getConfidenceColor(
                  predictions.nextLapTime.confidence
                )}`}
              >
                {predictions.nextLapTime.confidence}%
              </p>
            </div>
          </div>
        </motion.div>

        {/* Position Prediction */}
        <motion.div
          className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-4 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-orange-500" />
            <p className="text-[10px] font-bold text-zinc-400 tracking-wider">PREDICTED FINISH</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-4xl font-black text-orange-500">P{predictions.finalPosition.value}</p>
            <div
              className={`px-2 py-1 rounded text-[9px] font-bold ${
                predictions.finalPosition.change > 0
                  ? 'bg-emerald-950/50 text-emerald-400'
                  : predictions.finalPosition.change < 0
                  ? 'bg-red-950/50 text-red-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {predictions.finalPosition.change > 0 && '+'}
              {predictions.finalPosition.change}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-[8px] text-zinc-500">Confidence</p>
            <p
              className={`text-[9px] font-bold ${getConfidenceColor(
                predictions.finalPosition.confidence
              )}`}
            >
              {predictions.finalPosition.confidence}%
            </p>
          </div>
        </motion.div>

        {/* Optimal Pit Window */}
        <motion.div
          className="bg-violet-950/20 border border-violet-900/50 rounded-lg p-3 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <p className="text-[9px] font-bold text-violet-400 tracking-wider mb-2">
            OPTIMAL PIT WINDOW
          </p>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-zinc-400">Laps</p>
            <p className="text-lg font-bold text-violet-400">
              {predictions.optimalPitWindow.start}-{predictions.optimalPitWindow.end}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-zinc-500">Confidence</p>
            <p
              className={`text-[9px] font-bold ${getConfidenceColor(
                predictions.optimalPitWindow.confidence
              )}`}
            >
              {predictions.optimalPitWindow.confidence}%
            </p>
          </div>
        </motion.div>

        {/* Risk Factors */}
        {predictions.riskFactors.length > 0 && (
          <motion.div
            className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <p className="text-[9px] font-bold text-zinc-400 tracking-wider">RISK FACTORS</p>
            </div>
            <div className="space-y-1.5">
              {predictions.riskFactors.map((risk, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <p className="text-[9px] text-zinc-300">{risk.factor}</p>
                  <div
                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                      risk.severity === 'low'
                        ? 'bg-emerald-950/50 text-emerald-500'
                        : risk.severity === 'medium'
                        ? 'bg-yellow-950/50 text-yellow-500'
                        : 'bg-red-950/50 text-red-500'
                    }`}
                  >
                    {risk.severity.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Model Info */}
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between">
            <p className="text-[8px] text-zinc-600">Model: GR PitIQ v2.0</p>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <p className="text-[8px] text-emerald-500">Active</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
