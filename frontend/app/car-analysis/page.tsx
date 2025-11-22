'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  Loader2, 
  TrendingUp, 
  Gauge, 
  Zap, 
  Clock, 
  Activity,
  Award,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import CarStatsCard from '@/components/car-analysis/CarStatsCard';
import SectorAnalysis from '@/components/car-analysis/SectorAnalysis';
import CarComparison from '@/components/car-analysis/CarComparison';
import WeatherImpact from '@/components/car-analysis/WeatherImpact';
import SpeedAnalysis from '@/components/car-analysis/SpeedAnalysis';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  avgAirTemp: number;
  avgTrackTemp: number;
  avgHumidity: number;
  avgWindSpeed: number;
  tracks: string[];
  manufacturer: string;
  greenFlagLaps: number;
  cautionLaps: number;
  bestLapSeconds: number;
  avgTop10Seconds: number;
  class: string;
  rainLaps: number;
  dryLaps: number;
  avgLapImprovement: number;
  totalDriverLaps: number;
}

interface CarTrackData extends CarData {
  track: string;
}

export default function CarAnalysisPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carNumber, setCarNumber] = useState<number | null>(null);
  const [carData, setCarData] = useState<CarData | null>(null);
  const [allCarsData, setAllCarsData] = useState<CarData[]>([]);
  const [selectedCarNumber, setSelectedCarNumber] = useState<number | null>(null);
  const [availableTracks, setAvailableTracks] = useState<string[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [filteredUserCar, setFilteredUserCar] = useState<CarData | null>(null);
  const [filteredCompareCar, setFilteredCompareCar] = useState<CarData | null>(null);

  useEffect(() => {
    if (user) {
      checkCarNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (carNumber) {
      loadCarData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carNumber]);

  useEffect(() => {
    const updateFilteredData = async () => {
      if (!carNumber || !carData) return;
      
      const userFiltered = await getFilteredCarData(carNumber, selectedTrack);
      setFilteredUserCar(userFiltered);
      
      if (selectedCarNumber) {
        const compareFiltered = await getFilteredCarData(selectedCarNumber, selectedTrack);
        setFilteredCompareCar(compareFiltered);
      }
    };
    
    updateFilteredData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrack, selectedCarNumber, carData]);

  const checkCarNumber = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('car_number')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setCarNumber(data?.car_number || null);
    } catch (error) {
      console.error('Error checking car number:', error);
      setCarNumber(null);
    } finally {
      setLoading(false);
    }
  };

  const loadCarData = async () => {
    try {
      const response = await fetch('/raw_data.csv');
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.status}`);
      }
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      const carStats = new Map<number, any[]>();
      const trackSet = new Set<string>();
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = parseCSVLine(lines[i]);
        const carNum = parseInt(values[0]);
        const track = values[40]?.trim() || 'unknown';
        
        if (isNaN(carNum) || carNum <= 0) continue;
        
        trackSet.add(track);
        
        if (!carStats.has(carNum)) {
          carStats.set(carNum, []);
        }
        
        const lapTimeSeconds = parseFloat(values[39]);
        const s1Seconds = parseFloat(values[24]);
        const s2Seconds = parseFloat(values[25]);
        const s3Seconds = parseFloat(values[26]);
        const speedKph = parseFloat(values[12]);
        const topSpeedKph = parseFloat(values[18]);
        const manufacturer = values[22]?.trim() || 'Unknown';
        const flagCondition = values[23]?.trim() || '';
        const raceClass = values[20]?.trim() || 'Unknown';
        const rainCondition = parseInt(values[45]) || 0;
        const lapImprovement = parseFloat(values[4]) || 0;
        const totalDriverLaps = parseInt(values[49]) || 0;
        const airTemp = parseFloat(values[42]);
        const trackTemp = parseFloat(values[43]);
        const humidity = parseFloat(values[44]);
        const windSpeed = parseFloat(values[46]);
        const bestLapSec = parseFloat(values[47]);
        const avgTop10Sec = parseFloat(values[48]);
        
        if (isNaN(lapTimeSeconds) || lapTimeSeconds <= 0) continue;
        
        carStats.get(carNum)?.push({
          track,
          lapTime: lapTimeSeconds,
          s1: isNaN(s1Seconds) ? 0 : s1Seconds,
          s2: isNaN(s2Seconds) ? 0 : s2Seconds,
          s3: isNaN(s3Seconds) ? 0 : s3Seconds,
          speed: isNaN(speedKph) ? 0 : speedKph,
          topSpeed: isNaN(topSpeedKph) ? 0 : topSpeedKph,
          manufacturer,
          flagCondition,
          raceClass,
          rainCondition,
          lapImprovement,
          totalDriverLaps,
          airTemp: isNaN(airTemp) ? 0 : airTemp,
          trackTemp: isNaN(trackTemp) ? 0 : trackTemp,
          humidity: isNaN(humidity) ? 0 : humidity,
          windSpeed: isNaN(windSpeed) ? 0 : windSpeed,
          bestLapSec: isNaN(bestLapSec) ? 0 : bestLapSec,
          avgTop10Sec: isNaN(avgTop10Sec) ? 0 : avgTop10Sec,
        });
      }
      
      setAvailableTracks(Array.from(trackSet).sort());
      
      const allCars: CarData[] = [];
      
      carStats.forEach((laps, num) => {
        const validLaps = laps.filter(l => l.lapTime > 0);
        if (validLaps.length === 0) return;
        
        const lapTimes = validLaps.map(l => l.lapTime);
        const avgLapTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
        const stdDev = Math.sqrt(
          lapTimes.reduce((sum, time) => sum + Math.pow(time - avgLapTime, 2), 0) / lapTimes.length
        );
        const consistency = Math.max(0, 100 - (stdDev / avgLapTime) * 100);
        
        const carTracks = Array.from(new Set(validLaps.map(l => l.track)));
        const manufacturerName = validLaps[0]?.manufacturer || 'Unknown';
        const greenFlagCount = validLaps.filter(l => l.flagCondition === 'GF').length;
        const cautionCount = validLaps.filter(l => l.flagCondition === 'FCY').length;
        const bestLapValue = validLaps[0]?.bestLapSec || 0;
        const avgTop10Value = validLaps[0]?.avgTop10Sec || 0;
        const classType = validLaps[0]?.raceClass || 'Unknown';
        const rainLapCount = validLaps.filter(l => l.rainCondition === 1).length;
        const dryLapCount = validLaps.filter(l => l.rainCondition === 0).length;
        const avgImprovement = validLaps.reduce((a, b) => a + b.lapImprovement, 0) / validLaps.length;
        const driverTotalLaps = validLaps[0]?.totalDriverLaps || 0;
        
        const carAnalysis: CarData = {
          number: num,
          totalLaps: validLaps.length,
          avgLapTime: avgLapTime,
          bestLapTime: Math.min(...lapTimes),
          avgSpeed: validLaps.reduce((a, b) => a + b.speed, 0) / validLaps.length,
          topSpeed: Math.max(...validLaps.map(l => l.topSpeed)),
          avgS1: validLaps.reduce((a, b) => a + b.s1, 0) / validLaps.length,
          avgS2: validLaps.reduce((a, b) => a + b.s2, 0) / validLaps.length,
          avgS3: validLaps.reduce((a, b) => a + b.s3, 0) / validLaps.length,
          consistency: consistency,
          avgAirTemp: validLaps.reduce((a, b) => a + b.airTemp, 0) / validLaps.length,
          avgTrackTemp: validLaps.reduce((a, b) => a + b.trackTemp, 0) / validLaps.length,
          avgHumidity: validLaps.reduce((a, b) => a + b.humidity, 0) / validLaps.length,
          avgWindSpeed: validLaps.reduce((a, b) => a + b.windSpeed, 0) / validLaps.length,
          tracks: carTracks,
          manufacturer: manufacturerName,
          greenFlagLaps: greenFlagCount,
          cautionLaps: cautionCount,
          bestLapSeconds: bestLapValue,
          avgTop10Seconds: avgTop10Value,
          class: classType,
          rainLaps: rainLapCount,
          dryLaps: dryLapCount,
          avgLapImprovement: avgImprovement,
          totalDriverLaps: driverTotalLaps,
        };
        
        allCars.push(carAnalysis);
        
        if (num === carNumber) {
          setCarData(carAnalysis);
        }
      });
      
      setAllCarsData(allCars.sort((a, b) => a.number - b.number));
    } catch (error) {
      console.error('Error loading car data:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  const selectCar = (num: string) => {
    setSelectedCarNumber(num ? parseInt(num) : null);
  };

  const getCommonTracks = (): string[] => {
    if (!carData || !selectedCarNumber) return [];
    
    const userCarTracks = carData.tracks;
    const compareCarData = allCarsData.find(c => c.number === selectedCarNumber);
    
    if (!compareCarData) return [];
    
    return userCarTracks.filter(track => compareCarData.tracks.includes(track));
  };

  const getFilteredCarData = async (carNum: number, track: string): Promise<CarData | null> => {
    if (track === 'all') {
      return allCarsData.find(c => c.number === carNum) || null;
    }

    try {
      const response = await fetch('/raw_data.csv');
      if (!response.ok) return null;
      
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const laps: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = parseCSVLine(lines[i]);
        const csvCarNum = parseInt(values[0]);
        const csvTrack = values[40]?.trim();
        
        if (csvCarNum !== carNum || csvTrack !== track) continue;
        
        const lapTimeSeconds = parseFloat(values[39]);
        if (isNaN(lapTimeSeconds) || lapTimeSeconds <= 0) continue;
        
        laps.push({
          lapTime: lapTimeSeconds,
          s1: parseFloat(values[24]) || 0,
          s2: parseFloat(values[25]) || 0,
          s3: parseFloat(values[26]) || 0,
          speed: parseFloat(values[12]) || 0,
          topSpeed: parseFloat(values[18]) || 0,
          manufacturer: values[22]?.trim() || 'Unknown',
          flagCondition: values[23]?.trim() || '',
          raceClass: values[20]?.trim() || 'Unknown',
          rainCondition: parseInt(values[45]) || 0,
          lapImprovement: parseFloat(values[4]) || 0,
          totalDriverLaps: parseInt(values[49]) || 0,
          airTemp: parseFloat(values[42]) || 0,
          trackTemp: parseFloat(values[43]) || 0,
          humidity: parseFloat(values[44]) || 0,
          windSpeed: parseFloat(values[46]) || 0,
          bestLapSec: parseFloat(values[47]) || 0,
          avgTop10Sec: parseFloat(values[48]) || 0,
        });
      }
      
      if (laps.length === 0) return null;
      
      const lapTimes = laps.map(l => l.lapTime);
      const avgLapTime = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
      const stdDev = Math.sqrt(
        lapTimes.reduce((sum, time) => sum + Math.pow(time - avgLapTime, 2), 0) / lapTimes.length
      );
      const consistency = Math.max(0, 100 - (stdDev / avgLapTime) * 100);
      
      return {
        number: carNum,
        totalLaps: laps.length,
        avgLapTime: avgLapTime,
        bestLapTime: Math.min(...lapTimes),
        avgSpeed: laps.reduce((a, b) => a + b.speed, 0) / laps.length,
        topSpeed: Math.max(...laps.map(l => l.topSpeed)),
        avgS1: laps.reduce((a, b) => a + b.s1, 0) / laps.length,
        avgS2: laps.reduce((a, b) => a + b.s2, 0) / laps.length,
        avgS3: laps.reduce((a, b) => a + b.s3, 0) / laps.length,
        consistency: consistency,
        avgAirTemp: laps.reduce((a, b) => a + b.airTemp, 0) / laps.length,
        avgTrackTemp: laps.reduce((a, b) => a + b.trackTemp, 0) / laps.length,
        avgHumidity: laps.reduce((a, b) => a + b.humidity, 0) / laps.length,
        avgWindSpeed: laps.reduce((a, b) => a + b.windSpeed, 0) / laps.length,
        tracks: [track],
        manufacturer: laps[0]?.manufacturer || 'Unknown',
        greenFlagLaps: laps.filter(l => l.flagCondition === 'GF').length,
        cautionLaps: laps.filter(l => l.flagCondition === 'FCY').length,
        bestLapSeconds: laps[0]?.bestLapSec || 0,
        avgTop10Seconds: laps[0]?.avgTop10Sec || 0,
        class: laps[0]?.raceClass || 'Unknown',
        rainLaps: laps.filter(l => l.rainCondition === 1).length,
        dryLaps: laps.filter(l => l.rainCondition === 0).length,
        avgLapImprovement: laps.reduce((a, b) => a + b.lapImprovement, 0) / laps.length,
        totalDriverLaps: laps[0]?.totalDriverLaps || 0,
      };
    } catch (error) {
      console.error('Error filtering car data:', error);
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-zinc-400 font-rajdhani">Loading car analysis...</p>
        </div>
      </div>
    );
  }

  const selectedCompareCarData = selectedCarNumber 
    ? allCarsData.find(c => c.number === selectedCarNumber) || null
    : null;

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              CAR ANALYSIS
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              Performance insights for car #{carNumber || '---'}
            </p>
          </div>

          {!carNumber ? (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 max-w-md"
              >
                <div className="relative">
                  <div className="text-8xl mb-4 animate-pulse">🏎️</div>
                  <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full" />
                </div>
                <h2 className="text-3xl font-bold text-zinc-100 tracking-wider">
                  NO CAR NUMBER SET
                </h2>
                <p className="text-zinc-400 text-lg">
                  Select a car number in your profile to view analysis
                </p>
                <motion.button
                  onClick={() => router.push('/profile')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 mx-auto shadow-lg shadow-orange-600/30"
                >
                  <Car className="w-5 h-5" />
                  GO TO PROFILE
                </motion.button>
              </motion.div>
            </div>
          ) : carData ? (
            <>
              <div className="flex items-center justify-between mb-4 p-4 bg-zinc-950 border border-orange-600/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-orange-600/10 flex items-center justify-center">
                    <Car className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Your Car</p>
                    <p className="text-2xl font-black text-orange-600">#{carNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Total Laps</p>
                  <p className="text-2xl font-black text-white">{(filteredUserCar || carData).totalLaps}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CarStatsCard
                  icon={Clock}
                  label="Best Lap"
                  value={formatTime((filteredUserCar || carData).bestLapTime)}
                  subtitle="Fastest lap time"
                  delay={0}
                />
                <CarStatsCard
                  icon={TrendingUp}
                  label="Avg Lap"
                  value={formatTime((filteredUserCar || carData).avgLapTime)}
                  subtitle="Average lap time"
                  delay={0.1}
                />
                <CarStatsCard
                  icon={Gauge}
                  label="Avg Speed"
                  value={`${(filteredUserCar || carData).avgSpeed.toFixed(1)} KPH`}
                  subtitle={`Top: ${(filteredUserCar || carData).topSpeed.toFixed(1)} KPH`}
                  delay={0.2}
                />
                <CarStatsCard
                  icon={Award}
                  label="Consistency"
                  value={`${(filteredUserCar || carData).consistency.toFixed(1)}%`}
                  subtitle="Lap time variance"
                  delay={0.3}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <SectorAnalysis
                  avgS1={(filteredUserCar || carData).avgS1}
                  avgS2={(filteredUserCar || carData).avgS2}
                  avgS3={(filteredUserCar || carData).avgS3}
                />

                <SpeedAnalysis
                  avgSpeed={(filteredUserCar || carData).avgSpeed}
                  topSpeed={(filteredUserCar || carData).topSpeed}
                />
              </div>

              <WeatherImpact
                avgAirTemp={(filteredUserCar || carData).avgAirTemp}
                avgTrackTemp={(filteredUserCar || carData).avgTrackTemp}
                avgHumidity={(filteredUserCar || carData).avgHumidity}
                avgWindSpeed={(filteredUserCar || carData).avgWindSpeed}
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-zinc-950 border border-orange-600/20 rounded-lg overflow-hidden"
              >
                <div className="bg-linear-to-r from-orange-600/10 to-transparent p-6 border-b border-orange-600/20">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                    <div>
                      <h2 className="text-xl font-bold text-zinc-100 font-rajdhani">Performance Insights</h2>
                      <p className="text-sm text-zinc-500 mt-1">Detailed race metrics</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Manufacturer</span>
                    <span className="text-lg font-black text-orange-600">{(filteredUserCar || carData).manufacturer}</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Class</span>
                    <span className="text-lg font-black text-orange-600">{(filteredUserCar || carData).class}</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Driver Experience</span>
                    <span className="text-lg font-black text-orange-600">{(filteredUserCar || carData).totalDriverLaps} laps</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Green Flag</span>
                    <span className="text-lg font-black text-orange-600">{(filteredUserCar || carData).greenFlagLaps} laps</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Caution</span>
                    <span className="text-lg font-black text-orange-600">{(filteredUserCar || carData).cautionLaps} laps</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Rain Laps</span>
                    <span className="text-lg font-black text-orange-600">{(filteredUserCar || carData).rainLaps}</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Dry Laps</span>
                    <span className="text-lg font-black text-orange-600">{(filteredUserCar || carData).dryLaps}</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Avg Lap Improvement</span>
                    <span className={`text-lg font-black ${(filteredUserCar || carData).avgLapImprovement < 0 ? 'text-green-500' : 'text-orange-600'}`}>
                      {(filteredUserCar || carData).avgLapImprovement.toFixed(3)}s
                    </span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 rounded-lg">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold block mb-2">Gap to Top 10</span>
                    <span className={`text-lg font-black ${((filteredUserCar || carData).bestLapSeconds - (filteredUserCar || carData).avgTop10Seconds) <= 0 ? 'text-green-500' : 'text-orange-600'}`}>
                      {(filteredUserCar || carData).avgTop10Seconds > 0 ? `${((filteredUserCar || carData).bestLapSeconds - (filteredUserCar || carData).avgTop10Seconds).toFixed(3)}s` : 'N/A'}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-zinc-950 border border-orange-600/20 rounded-lg p-6"
              >
                <h3 className="text-lg font-bold text-zinc-100 mb-4 font-rajdhani">Compare with Another Car</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                      Select Car
                    </label>
                    <Select value={selectedCarNumber?.toString() || ''} onValueChange={selectCar}>
                      <SelectTrigger className="w-full h-11 font-rajdhani">
                        <SelectValue placeholder="Select a car to compare" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {allCarsData
                          .filter(car => car.number !== carNumber)
                          .map(car => (
                            <SelectItem key={car.number} value={car.number.toString()}>
                              Car #{car.number} - {car.totalLaps} laps
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedCarNumber && (
                    <div>
                      <label className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2 block">
                        Track Filter
                      </label>
                      <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                        <SelectTrigger className="w-full h-11 font-rajdhani">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tracks (Combined)</SelectItem>
                          {getCommonTracks().map(track => (
                            <SelectItem key={track} value={track}>
                              {track.charAt(0).toUpperCase() + track.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </motion.div>

              {filteredCompareCar && (
                <CarComparison
                  userCar={filteredUserCar || carData}
                  compareCar={filteredCompareCar}
                  formatTime={formatTime}
                />
              )}
            </>
          ) : (
            <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500 font-rajdhani text-lg">Loading car data...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
