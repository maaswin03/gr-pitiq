'use client';

import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

interface RawTelemetry {
  S1_SECONDS?: number;
  S2_SECONDS?: number;
  S3_SECONDS?: number;
  TIRE_AGE?: number;
}

interface SectorTimes {
  s1: number;
  s2: number;
  s3: number;
}

interface LapData {
  lap_number: number;
  sector_times?: SectorTimes;
}

interface PredictedOptimalSectors {
  s1: number;
  s2: number;
  s3: number;
}

interface BackendState {
  predictedOptimalSectors?: PredictedOptimalSectors;
  [key: string]: unknown;
}

interface SectorStrategyProps {
  rawTelemetry: RawTelemetry;
  lapHistory: LapData[] | null;
  backendState: BackendState | null;
  tireCompound: string;
  currentSpeed: number;
}

export default function SectorStrategy({
  rawTelemetry,
  lapHistory,
  backendState,
  tireCompound,
  currentSpeed,
}: SectorStrategyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-3">
        <Zap className="w-5 h-5 text-orange-600" />
        <h2 className="text-xl font-bold text-zinc-100 font-rajdhani tracking-wider">
          SECTOR STRATEGY SAMPLER
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sector 1 */}
        {(() => {
          const currentS1 = rawTelemetry.S1_SECONDS || 0;
          const bestS1 = lapHistory && lapHistory.length > 0
            ? Math.min(...lapHistory.map(l => l.sector_times?.s1 || Infinity).filter(t => t !== Infinity))
            : currentS1;
          const predictedS1 = backendState?.predictedOptimalSectors?.s1 || bestS1 * 0.98;
          const gainLoss = currentS1 > 0 ? currentS1 - predictedS1 : 0;

          return (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold tracking-wider text-zinc-500">SECTOR 1</h3>
                <div className="text-xs font-bold px-2 py-1 rounded bg-zinc-900 text-zinc-400">
                  {gainLoss > 0.1 ? `+${gainLoss.toFixed(2)}s` :
                   gainLoss < -0.1 ? `${gainLoss.toFixed(2)}s` :
                   'ON PACE'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Current</span>
                  <span className="text-orange-500 font-rajdhani font-bold text-2xl">
                    {currentS1 > 0 ? currentS1.toFixed(3) : '---.---'}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Best</span>
                  <span className="text-zinc-100 font-rajdhani font-bold text-lg">
                    {bestS1 !== Infinity && bestS1 > 0 ? bestS1.toFixed(3) : '---.---'}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Predicted</span>
                  <span className="text-zinc-100 font-rajdhani font-bold text-lg">
                    {predictedS1.toFixed(3)}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    {(() => {
                      if (gainLoss > 0.3) return 'Focus needed - significant time loss';
                      if (gainLoss > 0.1) return 'Room for improvement';
                      if (gainLoss < -0.1) return 'Excellent pace';
                      return 'On optimal pace';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Sector 2 */}
        {(() => {
          const currentS2 = rawTelemetry.S2_SECONDS || 0;
          const bestS2 = lapHistory && lapHistory.length > 0
            ? Math.min(...lapHistory.map(l => l.sector_times?.s2 || Infinity).filter(t => t !== Infinity))
            : currentS2;
          const predictedS2 = backendState?.predictedOptimalSectors?.s2 || bestS2 * 0.98;
          const gainLoss = currentS2 > 0 ? currentS2 - predictedS2 : 0;
          const hasOvertakeOpportunity = currentS2 > 0 && gainLoss < 0.05 && currentSpeed > 150;

          return (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold tracking-wider text-zinc-500">SECTOR 2</h3>
                <div className="text-xs font-bold px-2 py-1 rounded bg-zinc-900 text-zinc-400">
                  {gainLoss > 0.1 ? `+${gainLoss.toFixed(2)}s` :
                   gainLoss < -0.1 ? `${gainLoss.toFixed(2)}s` :
                   'ON PACE'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Current</span>
                  <span className="text-orange-500 font-rajdhani font-bold text-2xl">
                    {currentS2 > 0 ? currentS2.toFixed(3) : '---.---'}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Best</span>
                  <span className="text-zinc-100 font-rajdhani font-bold text-lg">
                    {bestS2 !== Infinity && bestS2 > 0 ? bestS2.toFixed(3) : '---.---'}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Predicted</span>
                  <span className="text-zinc-100 font-rajdhani font-bold text-lg">
                    {predictedS2.toFixed(3)}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    {(() => {
                      if (hasOvertakeOpportunity) return 'Strong pace - position for overtake';
                      if (gainLoss > 0.3) return 'Major time loss - check braking points';
                      if (gainLoss > 0.1) return 'Room for improvement';
                      if (gainLoss < -0.1) return 'Excellent sector';
                      return 'Consistent pace';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Sector 3 */}
        {(() => {
          const currentS3 = rawTelemetry.S3_SECONDS || 0;
          const bestS3 = lapHistory && lapHistory.length > 0
            ? Math.min(...lapHistory.map(l => l.sector_times?.s3 || Infinity).filter(t => t !== Infinity))
            : currentS3;
          const predictedS3 = backendState?.predictedOptimalSectors?.s3 || bestS3 * 0.98;
          const gainLoss = currentS3 > 0 ? currentS3 - predictedS3 : 0;
          const tireLaps = rawTelemetry.TIRE_AGE || 0;
          const shouldSaveTires = tireLaps > 15 || (tireCompound === 'SOFT' && tireLaps > 10);

          return (
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold tracking-wider text-zinc-500">SECTOR 3</h3>
                <div className="text-xs font-bold px-2 py-1 rounded bg-zinc-900 text-zinc-400">
                  {gainLoss > 0.1 ? `+${gainLoss.toFixed(2)}s` :
                   gainLoss < -0.1 ? `${gainLoss.toFixed(2)}s` :
                   'ON PACE'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Current</span>
                  <span className="text-orange-500 font-rajdhani font-bold text-2xl">
                    {currentS3 > 0 ? currentS3.toFixed(3) : '---.---'}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Best</span>
                  <span className="text-zinc-100 font-rajdhani font-bold text-lg">
                    {bestS3 !== Infinity && bestS3 > 0 ? bestS3.toFixed(3) : '---.---'}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs">Predicted</span>
                  <span className="text-zinc-100 font-rajdhani font-bold text-lg">
                    {predictedS3.toFixed(3)}<span className="text-sm">s</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    {(() => {
                      if (shouldSaveTires && gainLoss > 0.2) return 'Save tires - high wear detected';
                      if (shouldSaveTires) return 'Tire management mode';
                      if (gainLoss > 0.3) return 'Focus on corner exit';
                      if (gainLoss > 0.1) return 'Time available';
                      if (gainLoss < -0.1) return 'Excellent tire management';
                      return 'Balanced pace';
                    })()}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Overall Lap Strategy Summary */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold tracking-wider text-zinc-500 mb-2">LAP SUMMARY</p>
            <p className="text-2xl font-bold font-rajdhani text-orange-500 mb-1">
              {(() => {
                const s1 = rawTelemetry.S1_SECONDS || 0;
                const s2 = rawTelemetry.S2_SECONDS || 0;
                const s3 = rawTelemetry.S3_SECONDS || 0;
                const pred1 = backendState?.predictedOptimalSectors?.s1 || 0;
                const pred2 = backendState?.predictedOptimalSectors?.s2 || 0;
                const pred3 = backendState?.predictedOptimalSectors?.s3 || 0;
                const totalGL = (s1 - pred1) + (s2 - pred2) + (s3 - pred3);
                
                if (totalGL > 0.5) return 'LOSING TIME';
                if (totalGL > 0.2) return 'MODERATE PACE';
                if (totalGL < -0.2) return 'EXCEPTIONAL';
                return 'OPTIMAL PACE';
              })()}
            </p>
            <p className="text-xs text-zinc-500">
              {(() => {
                const s1 = rawTelemetry.S1_SECONDS || 0;
                const s2 = rawTelemetry.S2_SECONDS || 0;
                const s3 = rawTelemetry.S3_SECONDS || 0;
                const pred1 = backendState?.predictedOptimalSectors?.s1 || 0;
                const pred2 = backendState?.predictedOptimalSectors?.s2 || 0;
                const pred3 = backendState?.predictedOptimalSectors?.s3 || 0;
                const s1GL = s1 - pred1;
                const s2GL = s2 - pred2;
                const s3GL = s3 - pred3;
                const totalGL = s1GL + s2GL + s3GL;
                
                const weakestSector = s1GL > s2GL && s1GL > s3GL ? 'Sector 1' : s2GL > s3GL ? 'Sector 2' : 'Sector 3';
                const strongestSector = s1GL < s2GL && s1GL < s3GL ? 'Sector 1' : s2GL < s3GL ? 'Sector 2' : 'Sector 3';
                
                if (totalGL > 0.5) return `Focus on ${weakestSector} - biggest loss`;
                if (totalGL > 0.2) return `${weakestSector} needs improvement`;
                if (totalGL < -0.2) return `${Math.abs(totalGL).toFixed(2)}s ahead of predicted optimal`;
                return 'All sectors within predicted times';
              })()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 mb-1">TOTAL DELTA</p>
            <p className="text-3xl font-bold font-rajdhani text-orange-500">
              {(() => {
                const s1 = rawTelemetry.S1_SECONDS || 0;
                const s2 = rawTelemetry.S2_SECONDS || 0;
                const s3 = rawTelemetry.S3_SECONDS || 0;
                const pred1 = backendState?.predictedOptimalSectors?.s1 || 0;
                const pred2 = backendState?.predictedOptimalSectors?.s2 || 0;
                const pred3 = backendState?.predictedOptimalSectors?.s3 || 0;
                const totalGL = (s1 - pred1) + (s2 - pred2) + (s3 - pred3);
                
                if (Math.abs(totalGL) < 0.05) return '±0.00s';
                return totalGL > 0 ? `+${totalGL.toFixed(2)}s` : `${totalGL.toFixed(2)}s`;
              })()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
