"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/Sidebar";
import LoadingScreen from "@/components/ui/loading-screen";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calculator,
  Zap,
  Droplet,
  Target,
  TrendingUp,
  AlertCircle,
  Clock,
  Gauge,
  Activity,
  Flag,
  Settings,
  ThermometerSun,
  Wind,
  Fuel,
} from "lucide-react";

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface OptimizationResult {
  fastest_race_time: number;
  optimal_pit_lap: number;
  risk_level: string;
  risk_score: number;
  tire_wear_curve: number[];
  fuel_delta: number;
  lap_time_delta: number;
  total_laps: number;
  estimated_finish_position: number;
  tire_degradation_rate: number;
  fuel_efficiency: number;
  strategy_confidence: number;
  expected_lap_time: number;
  sector_1_time: number;
  sector_2_time: number;
  sector_3_time: number;
  max_speed: number;
  avg_speed: number;
  min_speed: number;
  top_speed_sector: string;
  acceleration: number;
  braking_efficiency: number;
}

interface TrackData {
  baseLapTime: number;
  trackLength: number;
}

type TrackName = 'COTA' | 'VIR' | 'Sebring' | 'Sonoma' | 'Road America' | 'Barber';

export default function StrategyOptimizer() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState(false);

  const [selectedTrack, setSelectedTrack] = useState<TrackName>('COTA');
  const [tireType, setTireType] = useState<"soft" | "medium" | "hard">(
    "medium"
  );
  const [fuelLoad, setFuelLoad] = useState(50);
  const [weatherForecast, setWeatherForecast] = useState<
    "dry" | "light_rain" | "heavy_rain"
  >("dry");
  const [aggressionLevel, setAggressionLevel] = useState(5);
  const [pitStopTiming, setPitStopTiming] = useState(15);
  const [enginePower, setEnginePower] = useState(100);
  const [downforceLevel, setDownforceLevel] = useState(50);
  const [airTemp, setAirTemp] = useState(25);
  const [trackTemp, setTrackTemp] = useState(40);
  const [humidity, setHumidity] = useState(50);
  const [windSpeed, setWindSpeed] = useState(10);
  const [rainfall, setRainfall] = useState(0);
  const [lapMode, setLapMode] = useState<"single" | "multi" | "continuous">("single");
  const [speed, setSpeed] = useState(150);
  const [driverType, setDriverType] = useState<"pro" | "amateur" | "aggressive" | "conservative">("pro");
  const [lapCount, setLapCount] = useState(20);
  const [trackDataMap, setTrackDataMap] = useState<Map<TrackName, TrackData>>(new Map());

  useEffect(() => {
    const loadTrackData = async () => {
      try {
        const response = await fetch('/track_lap_times.csv');
        const csvText = await response.text();
        const lines = csvText.trim().split('\n');
        const dataMap = new Map<TrackName, TrackData>();
        
        for (let i = 1; i < lines.length; i++) {
          const [track, baseLapTime, trackLength] = lines[i].split(',');
          dataMap.set(track as TrackName, {
            baseLapTime: parseFloat(baseLapTime),
            trackLength: parseFloat(trackLength)
          });
        }
        
        setTrackDataMap(dataMap);
      } catch (error) {
        console.error('Error loading track data:', error);
      }
    };

    loadTrackData();
  }, []);

  const getAIInsight = async (resultData: OptimizationResult) => {
    setLoadingAI(true);
    try {
      const prompt = `You are an expert motorsport race strategist with deep knowledge of tire degradation, fuel management, and race dynamics. Analyze this comprehensive race strategy data and provide tactical insights.

**RACE CONFIGURATION:**
Track: ${selectedTrack} (${trackDataMap.get(selectedTrack)?.trackLength || 'N/A'} km)
Weather Conditions: ${weatherForecast.replace('_', ' ')} | Rainfall: ${rainfall}%
Air Temp: ${airTemp}°C | Track Temp: ${trackTemp}°C
Wind Speed: ${windSpeed} km/h | Humidity: ${humidity}%
Total Race Distance: ${lapCount} laps | Lap Mode: ${lapMode.toUpperCase()}

**CAR SETUP:**
Driver Type: ${driverType.toUpperCase()} (skill level and consistency)
Tire Compound: ${tireType.toUpperCase()} (affects grip, wear rate, and lap times)
Fuel Load: ${fuelLoad}L starting fuel
Engine Power: ${enginePower}% | Downforce: ${downforceLevel}%
Target Speed: ${speed} km/h | Driver Aggression: ${aggressionLevel}/10
Target Pit Window: Lap ${pitStopTiming}

**OPTIMIZATION RESULTS:**
✓ Projected Race Time: ${Math.floor(resultData.fastest_race_time / 60)}m ${(resultData.fastest_race_time % 60).toFixed(1)}s
✓ Optimal Pit Stop: Lap ${resultData.optimal_pit_lap} (${resultData.optimal_pit_lap < pitStopTiming ? 'EARLIER' : resultData.optimal_pit_lap > pitStopTiming ? 'LATER' : 'MATCHES'} your target)
✓ Lap Time Delta: ${resultData.lap_time_delta > 0 ? '+' : ''}${resultData.lap_time_delta.toFixed(3)}s per lap vs baseline
✓ Fuel Delta: ${resultData.fuel_delta > 0 ? '+' : ''}${resultData.fuel_delta.toFixed(2)}L over baseline consumption
✓ Tire Degradation: ${resultData.tire_degradation_rate.toFixed(2)}% per lap

**PERFORMANCE METRICS:**
⚠ Risk Assessment: ${resultData.risk_level} (${resultData.risk_score.toFixed(0)}% risk score)
📊 Fuel Efficiency: ${resultData.fuel_efficiency.toFixed(0)}%
🎯 Strategy Confidence: ${resultData.strategy_confidence.toFixed(0)}%
🏁 Est. Finishing Position: P${resultData.estimated_finish_position}

**YOUR TASK:**
Provide a comprehensive 3-4 sentence strategic analysis covering:
1. Whether the chosen tire compound is optimal for these conditions and why
2. The rationale behind the recommended pit lap timing
3. Key risks to monitor (fuel, tire wear, weather changes)
4. One specific tactical adjustment to improve performance or reduce risk

Be direct, technical, and actionable. Focus on the most critical strategic decision points.`;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsight(data.response || "AI analysis unavailable.");
      }
    } catch (error) {
      console.error('AI insight error:', error);
      setAiInsight("Unable to generate AI insights at this time.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleOptimize = () => {
    setOptimizing(true);
    setAiInsight("");
    
    setTimeout(() => {
      try {
        const tireMultipliers = {
          soft: { speed: 1.05, wear: 1.8, grip: 1.2 },
          medium: { speed: 1.0, wear: 1.0, grip: 1.0 },
          hard: { speed: 0.97, wear: 0.6, grip: 0.85 }
        };
        const tireChar = tireMultipliers[tireType];

        const weatherMultipliers = {
          dry: { time: 0.0, risk: 0.1, wear: 1.0 },
          light_rain: { time: 2.5, risk: 0.3, wear: 0.8 },
          heavy_rain: { time: 8.0, risk: 0.6, wear: 0.6 }
        };
        const weatherChar = weatherMultipliers[weatherForecast];

        const trackData = trackDataMap.get(selectedTrack);
        let baseLapTime = trackData?.baseLapTime || 95.0;
        
        const driverMultipliers = {
          pro: { skill: 1.0, consistency: 0.95 },
          amateur: { skill: 1.08, consistency: 1.15 },
          aggressive: { skill: 0.98, consistency: 1.25 },
          conservative: { skill: 1.02, consistency: 0.90 }
        };
        const driverChar = driverMultipliers[driverType];
        
        baseLapTime *= driverChar.skill;
        baseLapTime -= (enginePower - 100) * 0.05;
        baseLapTime -= (downforceLevel - 50) * 0.03;
        baseLapTime += (trackTemp - 40) * 0.02;
        baseLapTime += (airTemp - 25) * 0.015;
        baseLapTime += windSpeed * 0.05;
        baseLapTime += (rainfall / 100) * 5.0;
        const lapTimeDelta = (
          (10 - aggressionLevel) * 0.3 + // Conservative = slower
          weatherChar.time + // Weather penalty
          -(tireChar.speed - 1.0) * 5 + // Tire grip benefit
          (fuelLoad - 50) * 0.02 // Fuel weight penalty
        );

        const optimalLapTime = baseLapTime + lapTimeDelta;

        const totalLaps = lapCount;

        const tireLifeLaps = Math.floor(25 / tireChar.wear);
        const fuelLifeLaps = Math.floor(fuelLoad / 2.1);

        let optimalPitLap = Math.min(
          Math.floor(tireLifeLaps * 0.7),
          fuelLifeLaps - 3,
          pitStopTiming
        );
        optimalPitLap = Math.max(5, Math.min(optimalPitLap, 30));

        const tireWearCurve: number[] = [];
        for (let lap = 5; lap <= totalLaps; lap += 5) {
          let wear: number;
          if (lap <= optimalPitLap) {
            wear = (lap / tireLifeLaps) * 100 * tireChar.wear;
          } else {
            const lapsSincePit = lap - optimalPitLap;
            wear = (lapsSincePit / tireLifeLaps) * 100 * tireChar.wear;
          }
          tireWearCurve.push(Math.min(100, wear));
        }

        const riskScore = Math.min(
          100,
          aggressionLevel * 5 +
          weatherChar.risk * 100 +
          Math.abs(pitStopTiming - optimalPitLap) * 2 +
          tireChar.wear * 15
        );

        const riskLevel = riskScore < 30 ? "LOW" : riskScore < 70 ? "MEDIUM" : "HIGH";

        const pitStopTime = 18.5;
        const fastestRaceTime = optimalLapTime * totalLaps + pitStopTime;

        const baselineConsumption = 2.1;
        const actualConsumption = baselineConsumption * (1 + (aggressionLevel - 5) * 0.02);
        const fuelDelta = (actualConsumption - baselineConsumption) * totalLaps;

        const fuelEfficiency = Math.max(0, Math.min(100, 100 - (Math.abs(fuelDelta) / fuelLoad * 100)));

        const tireDegradationRate = (100 / tireLifeLaps) * tireChar.wear;

        const timeAdvantage = (baseLapTime - optimalLapTime) * totalLaps;
        const estimatedFinishPosition = Math.max(1, Math.min(20, Math.floor(10 - (timeAdvantage / 10))));

        const strategyConfidence = Math.max(0, Math.min(100, 100 - (riskScore * 0.5) - (Math.abs(fuelDelta) * 2)));

        const trackLength = trackData?.trackLength || 5.5;
        const avgSpeedKmh = (trackLength / (optimalLapTime / 3600));
        
        const sector1Time = optimalLapTime * 0.33;
        const sector2Time = optimalLapTime * 0.35;
        const sector3Time = optimalLapTime * 0.32;
        
        const maxSpeedBase = speed;
        const maxSpeed = maxSpeedBase + 
          (enginePower - 100) * 0.8 - 
          (downforceLevel - 50) * 0.3 + 
          (tireChar.grip - 1.0) * 15 - 
          weatherChar.time * 3 - 
          (rainfall / 100) * 20 +
          (driverChar.skill < 1.0 ? 10 : driverChar.skill > 1.0 ? -10 : 0);
        
        const minSpeed = 80 + (downforceLevel * 0.3) - weatherChar.time * 5;
        
        const topSpeedSector = downforceLevel < 40 ? "Sector 1 (Long Straight)" : 
                               downforceLevel > 70 ? "Sector 2 (Technical)" : 
                               "Sector 3 (High Speed)";
        
        const acceleration = 100 - (fuelLoad - 20) * 0.5 + (enginePower - 100) * 0.3 - (downforceLevel - 50) * 0.2;
        const brakingEfficiency = 100 + (downforceLevel - 50) * 0.4 - weatherChar.time * 2;

        const resultData = {
          fastest_race_time: parseFloat(fastestRaceTime.toFixed(2)),
          optimal_pit_lap: optimalPitLap,
          risk_level: riskLevel,
          risk_score: parseFloat(riskScore.toFixed(1)),
          tire_wear_curve: tireWearCurve.map(w => parseFloat(w.toFixed(1))),
          fuel_delta: parseFloat(fuelDelta.toFixed(2)),
          lap_time_delta: parseFloat(lapTimeDelta.toFixed(2)),
          total_laps: totalLaps,
          estimated_finish_position: estimatedFinishPosition,
          tire_degradation_rate: parseFloat(tireDegradationRate.toFixed(2)),
          fuel_efficiency: parseFloat(fuelEfficiency.toFixed(1)),
          strategy_confidence: parseFloat(strategyConfidence.toFixed(1)),
          expected_lap_time: parseFloat(optimalLapTime.toFixed(3)),
          sector_1_time: parseFloat(sector1Time.toFixed(3)),
          sector_2_time: parseFloat(sector2Time.toFixed(3)),
          sector_3_time: parseFloat(sector3Time.toFixed(3)),
          max_speed: parseFloat(maxSpeed.toFixed(1)),
          avg_speed: parseFloat(avgSpeedKmh.toFixed(1)),
          min_speed: parseFloat(minSpeed.toFixed(1)),
          top_speed_sector: topSpeedSector,
          acceleration: parseFloat(Math.max(70, Math.min(100, acceleration)).toFixed(1)),
          braking_efficiency: parseFloat(Math.max(70, Math.min(100, brakingEfficiency)).toFixed(1))
        };
        
        setResult(resultData);
        getAIInsight(resultData);
      } catch (error) {
        console.error("Error optimizing strategy:", error);
      } finally {
        setOptimizing(false);
      }
    }, 800);
  };

  // Redirect to login if no user
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return <LoadingScreen message="Loading strategy optimizer..." />;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b border-zinc-800 pb-3 mb-6"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              RACE STRATEGY OPTIMIZER
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              Professional-grade what-if strategy analysis engine
            </p>
          </motion.div>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-zinc-800 rounded-lg bg-zinc-950 p-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                  <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-zinc-100">
                  Strategy Parameters
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-3 block">
                      Race Track
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['COTA', 'VIR', 'Sebring', 'Sonoma', 'Road America', 'Barber'] as TrackName[]).map((track) => (
                        <button
                          key={track}
                          onClick={() => setSelectedTrack(track)}
                          className={`p-2 rounded-lg border transition-all text-xs font-semibold ${
                            selectedTrack === track
                              ? "border-orange-600 bg-orange-600/10 text-orange-500"
                              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <Flag className="w-4 h-4 mx-auto mb-1" />
                          {track}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-3 block">
                      Tire Compound
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["soft", "medium", "hard"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setTireType(type)}
                          className={`p-3 rounded-lg border transition-all ${
                            tireType === type
                              ? "border-orange-600 bg-orange-600/10 text-orange-500"
                              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <Target className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs font-semibold uppercase">
                            {type}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Fuel Load
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {fuelLoad}L
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={fuelLoad}
                      onChange={(e) => setFuelLoad(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>0L</span>
                      <span>50L</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-3 block">
                      Weather Forecast
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "dry", icon: ThermometerSun, label: "Dry" },
                        {
                          value: "light_rain",
                          icon: Droplet,
                          label: "Light Rain",
                        },
                        {
                          value: "heavy_rain",
                          icon: Wind,
                          label: "Heavy Rain",
                        },
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() =>
                            setWeatherForecast(
                              value as "dry" | "light_rain" | "heavy_rain"
                            )
                          }
                          className={`p-3 rounded-lg border transition-all ${
                            weatherForecast === value
                              ? "border-orange-600 bg-orange-600/10 text-orange-500"
                              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs font-semibold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Aggression Level
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {aggressionLevel}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={aggressionLevel}
                      onChange={(e) =>
                        setAggressionLevel(Number(e.target.value))
                      }
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>Conservative</span>
                      <span>Aggressive</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Target Pit Lap
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        Lap {pitStopTiming}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      value={pitStopTiming}
                      onChange={(e) => setPitStopTiming(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>Lap 5</span>
                      <span>Lap 30</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Total Race Laps
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {lapCount} Laps
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={lapCount}
                      onChange={(e) => setLapCount(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>1 Lap</span>
                      <span>50 Laps</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Engine Power
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {enginePower}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="120"
                      value={enginePower}
                      onChange={(e) => setEnginePower(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>80%</span>
                      <span>120%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Downforce Level
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {downforceLevel}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={downforceLevel}
                      onChange={(e) => setDownforceLevel(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>Low (0%)</span>
                      <span>High (100%)</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Air Temperature
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {airTemp}°C
                      </span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="45"
                      value={airTemp}
                      onChange={(e) => setAirTemp(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>10°C</span>
                      <span>45°C</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Track Temperature
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {trackTemp}°C
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="60"
                      value={trackTemp}
                      onChange={(e) => setTrackTemp(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>20°C</span>
                      <span>60°C</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Humidity
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {humidity}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="100"
                      value={humidity}
                      onChange={(e) => setHumidity(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>20%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Wind Speed
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {windSpeed} km/h
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={windSpeed}
                      onChange={(e) => setWindSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>0 km/h</span>
                      <span>50 km/h</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Rainfall
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {rainfall}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={rainfall}
                      onChange={(e) => setRainfall(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-3 block">
                      Lap Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "single", icon: Flag, label: "Single" },
                        { value: "multi", icon: TrendingUp, label: "Multi" },
                        { value: "continuous", icon: Activity, label: "Continuous" },
                      ].map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() =>
                            setLapMode(
                              value as "single" | "multi" | "continuous"
                            )
                          }
                          className={`p-3 rounded-lg border transition-all ${
                            lapMode === value
                              ? "border-orange-600 bg-orange-600/10 text-orange-500"
                              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs font-semibold">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                        Target Speed
                      </label>
                      <span className="text-lg font-bold text-orange-500">
                        {speed} km/h
                      </span>
                    </div>
                    <input
                      type="range"
                      min="45"
                      max="225"
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-xs text-zinc-600 mt-1">
                      <span>45 km/h</span>
                      <span>225 km/h</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-3 block">
                      Driver Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: "pro", label: "Pro" },
                        { value: "amateur", label: "Amateur" },
                        { value: "aggressive", label: "Aggressive" },
                        { value: "conservative", label: "Conservative" },
                      ].map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() =>
                            setDriverType(
                              value as "pro" | "amateur" | "aggressive" | "conservative"
                            )
                          }
                          className={`p-3 rounded-lg border transition-all ${
                            driverType === value
                              ? "border-orange-600 bg-orange-600/10 text-orange-500"
                              : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                          }`}
                        >
                          <span className="text-xs font-semibold uppercase">{label}</span>
                        </button>
                      ))}
                    </div>
                </div>
              </div>

              <button
                onClick={handleOptimize}
                disabled={optimizing}
                className="w-full mt-6 px-6 py-4 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-lg font-bold transition-all hover:scale-105 active:scale-95 disabled:scale-100 flex items-center justify-center gap-3"
              >
                {optimizing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    OPTIMIZING...
                  </>
                ) : (
                  <>
                    <Calculator className="w-5 h-5" />
                    OPTIMIZE STRATEGY
                  </>
                )}
              </button>

              <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 mt-6">
                <h3 className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-3">
                  Current Setup
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500 block">Track:</span>
                    <span className="text-zinc-100 font-semibold">{selectedTrack}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Distance:</span>
                    <span className="text-zinc-100 font-semibold">{lapCount} Laps</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Tire:</span>
                    <span className="text-zinc-100 font-semibold uppercase">{tireType}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Fuel:</span>
                    <span className="text-zinc-100 font-semibold">{fuelLoad}L</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Engine:</span>
                    <span className="text-zinc-100 font-semibold">{enginePower}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Downforce:</span>
                    <span className="text-zinc-100 font-semibold">{downforceLevel}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Weather:</span>
                    <span className="text-zinc-100 font-semibold capitalize">{weatherForecast.replace("_", " ")}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Track Temp:</span>
                    <span className="text-zinc-100 font-semibold">{trackTemp}°C</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Rainfall:</span>
                    <span className="text-zinc-100 font-semibold">{rainfall}%</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Driver:</span>
                    <span className="text-zinc-100 font-semibold capitalize">{driverType}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Lap Mode:</span>
                    <span className="text-zinc-100 font-semibold capitalize">{lapMode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Target Speed:</span>
                    <span className="text-zinc-100 font-semibold">{speed} km/h</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded border text-purple-500 bg-purple-600/10 border-purple-600/30">
                      <Zap className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-zinc-100">AI Strategy Insight</h2>
                  </div>
                  {loadingAI ? (
                    <div className="flex items-center gap-3 text-zinc-400">
                      <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Generating AI insights...</span>
                    </div>
                  ) : aiInsight ? (
                    <p className="text-zinc-300 leading-relaxed">{aiInsight}</p>
                  ) : (
                    <p className="text-zinc-500 italic">AI insights unavailable</p>
                  )}
                </div>

                <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Zap className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-zinc-100">
                        Optimization Results
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                            <Clock className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">
                          Race Time
                        </div>
                        <div className="text-2xl font-bold text-orange-500">
                          {Math.floor(result.fastest_race_time / 60)}:
                          {(result.fastest_race_time % 60)
                            .toFixed(0)
                            .padStart(2, "0")}
                        </div>
                        <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50">
                          {result.fastest_race_time.toFixed(1)}s total
                        </div>
                      </div>

                      <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                            <Flag className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">
                          Optimal Pit
                        </div>
                        <div className="text-2xl font-bold text-orange-500">
                          Lap {result.optimal_pit_lap}
                        </div>
                        <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50">
                          Best timing
                        </div>
                      </div>

                      <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={`p-1 rounded border ${
                              result.risk_score < 30
                                ? "text-green-500 bg-green-600/10 border-green-600/30"
                                : result.risk_score < 70
                                ? "text-orange-500 bg-orange-600/10 border-orange-600/30"
                                : "text-red-500 bg-red-600/10 border-red-600/30"
                            }`}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">
                          Risk Level
                        </div>
                        <div
                          className={`text-2xl font-bold ${
                            result.risk_score < 30
                              ? "text-green-500"
                              : result.risk_score < 70
                              ? "text-orange-500"
                              : "text-red-500"
                          }`}
                        >
                          {result.risk_level}
                        </div>
                        <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50">
                          {result.risk_score}% risk score
                        </div>
                      </div>

                      <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-1">
                          Confidence
                        </div>
                        <div className="text-2xl font-bold text-orange-500">
                          {result.strategy_confidence.toFixed(0)}%
                        </div>
                        <div className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-800/50">
                          Strategy reliability
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Activity className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-zinc-100">
                        Performance Analysis
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                            <Fuel className="w-4 h-4" />
                          </div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            Fuel Delta
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-orange-500 mb-2">
                          {result.fuel_delta > 0 ? "+" : ""}
                          {result.fuel_delta.toFixed(2)}L
                        </div>
                        <p className="text-xs text-zinc-500">
                          vs baseline consumption
                        </p>
                      </div>

                      <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                            <Gauge className="w-4 h-4" />
                          </div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            Lap Time Delta
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-orange-500 mb-2">
                          {result.lap_time_delta > 0 ? "+" : ""}
                          {result.lap_time_delta.toFixed(3)}s
                        </div>
                        <p className="text-xs text-zinc-500">
                          per lap vs baseline
                        </p>
                      </div>

                      <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-4 hover:border-orange-600/30 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1 rounded border text-green-500 bg-green-600/10 border-green-600/30">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                          <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold">
                            Efficiency
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-500 mb-2">
                          {result.fuel_efficiency.toFixed(1)}%
                        </div>
                        <p className="text-xs text-zinc-500">
                          fuel efficiency rating
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Target className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-zinc-100">
                        Tire Wear Projection
                      </h2>
                    </div>

                    <div className="space-y-3">
                      {result.tire_wear_curve.map((wear, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <span className="text-xs text-zinc-500 font-semibold min-w-[60px]">
                            Lap {(index + 1) * 5}
                          </span>
                          <div className="flex-1 bg-zinc-800/50 rounded-full h-3 overflow-hidden border border-zinc-800">
                            <div
                              className={`h-full transition-all ${
                                wear < 30
                                  ? "bg-green-500"
                                  : wear < 60
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                              }`}
                              style={{ width: `${wear}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-zinc-100 min-w-[50px] text-right">
                            {wear.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-800/50">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Degradation Rate:</span>
                        <span className="text-orange-500 font-bold">
                          {result.tire_degradation_rate.toFixed(2)}%/lap
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Flag className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-zinc-100">
                        Race Summary
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500">Total Laps:</span>
                        <p className="text-zinc-100 font-bold">
                          {result.total_laps}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Estimated Finish:</span>
                        <p className="text-zinc-100 font-bold">
                          P{result.estimated_finish_position}
                        </p>
                      </div>
                      <div>
                        <span className="text-zinc-500">Strategy:</span>
                        <p className="text-zinc-100 font-bold capitalize">
                          {tireType} → Pit Lap {result.optimal_pit_lap}
                        </p>
                      </div>
                    </div>
                  </div>

                  {result.expected_lap_time && result.sector_1_time && (
                  <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="p-1.5 rounded border text-orange-500 bg-orange-600/10 border-orange-600/30">
                        <Gauge className="w-5 h-5" />
                      </div>
                      <h2 className="text-xl font-bold text-zinc-100">
                        Lap Performance Metrics
                      </h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left py-3 px-4 text-zinc-500 font-semibold uppercase tracking-wide text-xs">Metric</th>
                            <th className="text-right py-3 px-4 text-zinc-500 font-semibold uppercase tracking-wide text-xs">Value</th>
                            <th className="text-left py-3 px-4 text-zinc-500 font-semibold uppercase tracking-wide text-xs">Impact</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Expected Lap Time</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-orange-500 font-bold text-base">{result.expected_lap_time?.toFixed(3) || '0.000'}s</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">
                              {result.lap_time_delta > 0 ? '+' : ''}{result.lap_time_delta?.toFixed(3) || '0.000'}s vs baseline
                            </td>
                          </tr>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Sector 1 Time</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-zinc-100 font-bold">{result.sector_1_time?.toFixed(3) || '0.000'}s</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">33% of lap • Long straight</td>
                          </tr>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Sector 2 Time</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-zinc-100 font-bold">{result.sector_2_time?.toFixed(3) || '0.000'}s</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">35% of lap • Technical section</td>
                          </tr>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Sector 3 Time</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-zinc-100 font-bold">{result.sector_3_time?.toFixed(3) || '0.000'}s</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">32% of lap • High-speed curves</td>
                          </tr>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Max Speed</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-green-500 font-bold text-base">{result.max_speed?.toFixed(1) || '0.0'} km/h</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">{result.top_speed_sector || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Average Speed</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-orange-500 font-bold text-base">{result.avg_speed?.toFixed(1) || '0.0'} km/h</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">Overall lap average</td>
                          </tr>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Minimum Speed</td>
                            <td className="py-3 px-4 text-right">
                              <span className="text-zinc-100 font-bold">{result.min_speed?.toFixed(1) || '0.0'} km/h</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">Slowest corner speed</td>
                          </tr>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Acceleration Rating</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-bold text-base ${
                                (result.acceleration || 0) >= 90 ? 'text-green-500' :
                                (result.acceleration || 0) >= 80 ? 'text-orange-500' :
                                'text-yellow-500'
                              }`}>{result.acceleration?.toFixed(1) || '0.0'}%</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">Engine power × fuel load</td>
                          </tr>
                          <tr className="hover:bg-zinc-900/30 transition-colors">
                            <td className="py-3 px-4 text-zinc-300 font-medium">Braking Efficiency</td>
                            <td className="py-3 px-4 text-right">
                              <span className={`font-bold text-base ${
                                (result.braking_efficiency || 0) >= 90 ? 'text-green-500' :
                                (result.braking_efficiency || 0) >= 80 ? 'text-orange-500' :
                                'text-yellow-500'
                              }`}>{result.braking_efficiency?.toFixed(1) || '0.0'}%</span>
                            </td>
                            <td className="py-3 px-4 text-zinc-400 text-xs">Downforce × weather impact</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-800/50 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-zinc-900/30 rounded-lg p-4">
                        <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-2">Speed Delta</div>
                        <div className="text-xl font-bold text-orange-500">
                          {((result.max_speed || 0) - (result.min_speed || 0)).toFixed(1)} km/h
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">Max - Min speed range</div>
                      </div>
                      <div className="bg-zinc-900/30 rounded-lg p-4">
                        <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-2">Fastest Sector</div>
                        <div className="text-xl font-bold text-green-500">
                          {Math.min(result.sector_1_time || 0, result.sector_2_time || 0, result.sector_3_time || 0).toFixed(3)}s
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">
                          Sector {(result.sector_1_time || 0) < (result.sector_2_time || 0) && (result.sector_1_time || 0) < (result.sector_3_time || 0) ? '1' :
                                  (result.sector_2_time || 0) < (result.sector_3_time || 0) ? '2' : '3'}
                        </div>
                      </div>
                      <div className="bg-zinc-900/30 rounded-lg p-4">
                        <div className="text-xs text-zinc-500 uppercase tracking-wide font-semibold mb-2">Consistency Index</div>
                        <div className="text-xl font-bold text-purple-500">
                          {(100 - ((result.tire_degradation_rate || 0) * 2) - (Math.abs(result.fuel_delta || 0) / 2)).toFixed(1)}%
                        </div>
                        <div className="text-xs text-zinc-400 mt-1">Performance stability</div>
                      </div>
                    </div>
                  </div>
                  )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="border border-zinc-800 rounded-lg bg-zinc-950 p-12">
                  <div className="text-center text-zinc-500">
                    <Calculator className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
                    <h3 className="text-xl font-bold text-zinc-400 mb-2">
                      Ready to Optimize
                    </h3>
                    <p className="text-sm">
                      Configure your strategy parameters and click
                      &quot;Optimize Strategy&quot; to begin analysis.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
