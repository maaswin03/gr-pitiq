"use client";

import { Flag, Clock, TrendingUp } from "lucide-react";

interface StatsGridProps {
  currentLap: number;
  currentSector: number;
  currentSectorProgress: number;
  currentLapTime: number;
  totalTimeElapsed: number;
  totalDistance: number;
  currentDistance: number;
}

export default function StatsGrid({
  currentLap,
  currentSector,
  currentSectorProgress,
  currentLapTime,
  totalTimeElapsed,
  totalDistance,
  currentDistance,
}: StatsGridProps) {
  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) return "00:00.00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        icon={<Flag className="w-4 h-4" />}
        label="CURRENT LAP"
        value={currentLap.toString()}
        color="orange"
        trend={`S${currentSector} - ${currentSectorProgress.toFixed(0)}%`}
      />
      <StatCard
        icon={<Clock className="w-4 h-4" />}
        label="LAP TIME"
        value={formatTime(currentLapTime)}
        color="orange"
        trend={`Total: ${formatTime(totalTimeElapsed)}`}
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="DISTANCE"
        value={`${totalDistance.toFixed(1)} km`}
        color="orange"
        trend={`Current: ${currentDistance.toFixed(2)} km`}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "orange" | "zinc" | "green" | "red";
  trend?: string;
}) {
  const colorClasses = {
    orange: "text-orange-500 bg-orange-600/10 border-orange-600/30",
    zinc: "text-zinc-500 bg-zinc-600/10 border-zinc-600/30",
    green: "text-green-500 bg-green-600/10 border-green-600/30",
    red: "text-red-500 bg-red-600/10 border-red-600/30",
  };

  return (
    <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-3 hover:border-orange-600/30 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded border ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-500 mb-0.5 uppercase tracking-wide font-semibold">
            {label}
          </div>
          <div
            className={`text-lg md:text-xl font-bold truncate ${
              color === "orange"
                ? "text-orange-500"
                : color === "green"
                ? "text-green-500"
                : color === "red"
                ? "text-red-500"
                : "text-zinc-500"
            }`}
          >
            {value}
          </div>
        </div>
      </div>
      {trend && (
        <div className="text-xs text-zinc-500 mt-1.5 pt-1.5 border-t border-zinc-800/50 font-medium">
          {trend}
        </div>
      )}
    </div>
  );
}
