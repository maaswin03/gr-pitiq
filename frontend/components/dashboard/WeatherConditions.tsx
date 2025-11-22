"use client";

import { motion } from "framer-motion";
import { Thermometer, Cloud, Activity } from "lucide-react";

interface WeatherConditionsProps {
  trackName: string;
  airTemp: number;
  trackTemp: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
}

export default function WeatherConditions({
  airTemp,
  trackTemp,
  rainfall,
  humidity,
  windSpeed,
}: WeatherConditionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard
        icon={<Thermometer className="w-4 h-4" />}
        label="AIR TEMP"
        value={`${airTemp}°C`}
        color="orange"
        trend={
          airTemp < 15
            ? "COLD AIR"
            : airTemp < 28
            ? "OPTIMAL"
            : airTemp < 35
            ? "HOT"
            : "OVERHEATING RISK"
        }
      />

      <StatCard
        icon={<Thermometer className="w-4 h-4" />}
        label="TRACK TEMP"
        value={`${trackTemp}°C`}
        color="orange"
        trend={
          trackTemp < 25
            ? "LOW GRIP"
            : trackTemp < 40
            ? "OPTIMAL GRIP"
            : trackTemp < 50
            ? "HIGH WEAR"
            : "TRACK OVERHEATING"
        }
      />

      <StatCard
        icon={<Cloud className="w-4 h-4" />}
        label="RAINFALL"
        value={`${rainfall}%`}
        color="orange"
        trend={
          rainfall > 70
            ? "HEAVY RAIN"
            : rainfall > 30
            ? "MODERATE"
            : rainfall > 0
            ? "LIGHT RAIN"
            : "DRY"
        }
      />

      <StatCard
        icon={<Cloud className="w-4 h-4" />}
        label="HUMIDITY"
        value={`${humidity}%`}
        color="orange"
        trend={
          humidity < 40
            ? "DRY AIR"
            : humidity < 60
            ? "COMFORTABLE"
            : humidity < 80
            ? "STICKY AIR"
            : "HIGH MOISTURE"
        }
      />

      <StatCard
        icon={<Activity className="w-4 h-4" />}
        label="WIND SPEED"
        value={`${windSpeed} km/h`}
        color="orange"
        trend={
          windSpeed < 15
            ? "CALM"
            : windSpeed < 30
            ? "GUSTY"
            : windSpeed < 45
            ? "STRONG WIND"
            : "CROSSWIND RISK"
        }
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
