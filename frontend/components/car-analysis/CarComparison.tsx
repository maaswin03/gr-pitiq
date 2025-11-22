'use client';

import { motion } from 'framer-motion';
import { Trophy, Clock, Gauge, Target, Activity, Award, TrendingUp, Zap } from 'lucide-react';

interface CarData {
  number: number;
  totalLaps: number;
  avgLapTime: number;
  bestLapTime: number;
  avgSpeed: number;
  topSpeed: number;
  avgS1: number;
  avgS2: number;
  avgS3: number;
  consistency: number;
}

interface CarComparisonProps {
  userCar: CarData;
  compareCar: CarData | null;
  formatTime: (seconds: number) => string;
}

export default function CarComparison({ userCar, compareCar, formatTime }: CarComparisonProps) {
  if (!compareCar) return null;

  const isBetter = (userVal: number, compareVal: number, lowerIsBetter = false) => {
    if (lowerIsBetter) return userVal < compareVal;
    return userVal > compareVal;
  };

  const getDifference = (userVal: number, compareVal: number) => {
    const diff = userVal - compareVal;
    return diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
  };

  const comparisons = [
    {
      icon: Clock,
      label: 'Best Lap Time',
      userVal: `${userCar.bestLapTime.toFixed(3)}s`,
      compareVal: `${compareCar.bestLapTime.toFixed(3)}s`,
      isBetter: isBetter(userCar.bestLapTime, compareCar.bestLapTime, true),
      diff: `${getDifference(userCar.bestLapTime, compareCar.bestLapTime)}s`
    },
    {
      icon: TrendingUp,
      label: 'Avg Lap Time',
      userVal: `${userCar.avgLapTime.toFixed(3)}s`,
      compareVal: `${compareCar.avgLapTime.toFixed(3)}s`,
      isBetter: isBetter(userCar.avgLapTime, compareCar.avgLapTime, true),
      diff: `${getDifference(userCar.avgLapTime, compareCar.avgLapTime)}s`
    },
    {
      icon: Gauge,
      label: 'Average Speed',
      userVal: `${userCar.avgSpeed.toFixed(1)} KPH`,
      compareVal: `${compareCar.avgSpeed.toFixed(1)} KPH`,
      isBetter: isBetter(userCar.avgSpeed, compareCar.avgSpeed),
      diff: `${getDifference(userCar.avgSpeed, compareCar.avgSpeed)} KPH`
    },
    {
      icon: Zap,
      label: 'Top Speed',
      userVal: `${userCar.topSpeed.toFixed(1)} KPH`,
      compareVal: `${compareCar.topSpeed.toFixed(1)} KPH`,
      isBetter: isBetter(userCar.topSpeed, compareCar.topSpeed),
      diff: `${getDifference(userCar.topSpeed, compareCar.topSpeed)} KPH`
    },
    {
      icon: Target,
      label: 'Sector 1 Time',
      userVal: `${userCar.avgS1.toFixed(3)}s`,
      compareVal: `${compareCar.avgS1.toFixed(3)}s`,
      isBetter: isBetter(userCar.avgS1, compareCar.avgS1, true),
      diff: `${getDifference(userCar.avgS1, compareCar.avgS1)}s`
    },
    {
      icon: Target,
      label: 'Sector 2 Time',
      userVal: `${userCar.avgS2.toFixed(3)}s`,
      compareVal: `${compareCar.avgS2.toFixed(3)}s`,
      isBetter: isBetter(userCar.avgS2, compareCar.avgS2, true),
      diff: `${getDifference(userCar.avgS2, compareCar.avgS2)}s`
    },
    {
      icon: Target,
      label: 'Sector 3 Time',
      userVal: `${userCar.avgS3.toFixed(3)}s`,
      compareVal: `${compareCar.avgS3.toFixed(3)}s`,
      isBetter: isBetter(userCar.avgS3, compareCar.avgS3, true),
      diff: `${getDifference(userCar.avgS3, compareCar.avgS3)}s`
    },
    {
      icon: Award,
      label: 'Consistency',
      userVal: `${userCar.consistency.toFixed(1)}%`,
      compareVal: `${compareCar.consistency.toFixed(1)}%`,
      isBetter: isBetter(userCar.consistency, compareCar.consistency),
      diff: `${getDifference(userCar.consistency, compareCar.consistency)}%`
    },
  ];

  const userWins = comparisons.filter(c => c.isBetter).length;
  const compareWins = comparisons.length - userWins;
  const bestCar = userWins > compareWins ? userCar.number : compareCar.number;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="bg-zinc-950 border border-orange-600/20 rounded-lg overflow-hidden"
    >
      <div className="bg-linear-to-r from-orange-600/10 to-transparent p-6 border-b border-orange-600/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-xl font-bold text-zinc-100 font-rajdhani">Head-to-Head Comparison</h2>
              <p className="text-sm text-zinc-500 mt-1">
                Car #{userCar.number} vs Car #{compareCar.number}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Best Overall</p>
            <p className="text-2xl font-black text-orange-600">#{bestCar}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {comparisons.map((comparison, index) => {
          const Icon = comparison.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.05 }}
              className="bg-zinc-900/50 rounded-lg p-4"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-600/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-orange-600" />
                </div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{comparison.label}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className={`text-center p-3 rounded-lg ${comparison.isBetter ? 'bg-orange-600/20 border border-orange-600/30' : 'bg-zinc-800/50'}`}>
                  <p className="text-xs text-zinc-500 mb-1">Car #{userCar.number}</p>
                  <p className={`text-lg font-black font-rajdhani ${comparison.isBetter ? 'text-orange-600' : 'text-white'}`}>
                    {comparison.userVal}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-zinc-600 mb-1">Difference</p>
                  <p className={`text-sm font-bold font-rajdhani ${comparison.isBetter ? 'text-green-500' : 'text-red-500'}`}>
                    {comparison.diff}
                  </p>
                </div>

                <div className={`text-center p-3 rounded-lg ${!comparison.isBetter ? 'bg-orange-600/20 border border-orange-600/30' : 'bg-zinc-800/50'}`}>
                  <p className="text-xs text-zinc-500 mb-1">Car #{compareCar.number}</p>
                  <p className={`text-lg font-black font-rajdhani ${!comparison.isBetter ? 'text-orange-600' : 'text-white'}`}>
                    {comparison.compareVal}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="mt-6 pt-6 border-t border-zinc-800">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-orange-600/10 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Car #{userCar.number} Wins</p>
              <p className="text-3xl font-black text-orange-600">{userWins}</p>
            </div>
            <div className="text-center p-4 bg-zinc-800/50 rounded-lg">
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Car #{compareCar.number} Wins</p>
              <p className="text-3xl font-black text-white">{compareWins}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
