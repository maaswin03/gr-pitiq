'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Clock, Zap, Flag, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import LoadingScreen from '@/components/ui/loading-screen';
import * as Papa from 'papaparse';

interface LapData {
  NUMBER: string;
  DRIVER_NUMBER: string;
  LAP_NUMBER: string;
  LAP_TIME: string;
  LAP_TIME_SECONDS: number;
  S1_SECONDS: number;
  S2_SECONDS: number;
  S3_SECONDS: number;
  TOP_SPEED: number;
  KPH: number;
  CLASS: string;
  MANUFACTURER: string;
  TRACK: string;
  BEST_LAP_SECONDS: number;
  AVG_TOP10_SECONDS: number;
  TOTAL_DRIVER_LAPS: number;
}

interface DriverStats {
  carNumber: string;
  bestLap: number;
  avgLap: number;
  totalLaps: number;
  topSpeed: number;
  avgSpeed: number;
  manufacturer: string;
  class: string;
  consistency: number;
  track: string;
}

type SortField = 'bestLap' | 'avgLap' | 'topSpeed' | 'avgSpeed' | 'totalLaps' | 'consistency';
type SortOrder = 'asc' | 'desc';

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drivers, setDrivers] = useState<DriverStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('bestLap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterTrack, setFilterTrack] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadCSVData = async () => {
      try {
        const response = await fetch('/raw_data.csv');
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          complete: (results: Papa.ParseResult<LapData>) => {
            const data = results.data as LapData[];
            
            const carMap = new Map<string, LapData[]>();
            data.forEach(lap => {
              const carNum = String(lap.NUMBER);
              if (!carNum || carNum === 'undefined') return;
              
              if (!carMap.has(carNum)) {
                carMap.set(carNum, []);
              }
              carMap.get(carNum)?.push(lap);
            });

            const driverStats: DriverStats[] = [];
            carMap.forEach((laps, carNumber) => {
              const validLaps = laps.filter(l => {
                const lapTime = Number(l.LAP_TIME_SECONDS);
                return !isNaN(lapTime) && lapTime > 0;
              });
              
              if (validLaps.length === 0) return;

              const lapTimes = validLaps.map(l => Number(l.LAP_TIME_SECONDS));
              const bestLap = Math.min(...lapTimes);
              const avgLap = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
              
              const speeds = validLaps.map(l => Number(l.TOP_SPEED)).filter(s => !isNaN(s) && s > 0);
              const topSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
              
              const kphValues = validLaps.map(l => Number(l.KPH)).filter(k => !isNaN(k) && k > 0);
              const avgSpeed = kphValues.length > 0 ? kphValues.reduce((a, b) => a + b, 0) / kphValues.length : 0;
              
              const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - avgLap, 2), 0) / lapTimes.length;
              const consistency = Math.sqrt(variance);

              driverStats.push({
                carNumber,
                bestLap,
                avgLap,
                totalLaps: validLaps.length,
                topSpeed,
                avgSpeed,
                manufacturer: validLaps[0].MANUFACTURER || 'Unknown',
                class: validLaps[0].CLASS || 'Unknown',
                consistency,
                track: validLaps[0].TRACK || 'Unknown'
              });
            });

            setDrivers(driverStats);
            setLoading(false);
          },
          error: (error: Error) => {
            console.error('Error parsing CSV:', error);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
        setLoading(false);
      }
    };

    loadCSVData();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, '0')}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortedDrivers = () => {
    let filtered = drivers;
    
    if (filterClass !== 'all') {
      filtered = filtered.filter(d => d.class === filterClass);
    }
    
    if (filterTrack !== 'all') {
      filtered = filtered.filter(d => d.track === filterTrack);
    }

    return [...filtered].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const sortedDrivers = getSortedDrivers();
  const classes = ['all', ...new Set(drivers.map(d => d.class))];
  const tracks = ['all', ...new Set(drivers.map(d => d.track))];

  if (authLoading) {
    return <LoadingScreen message="Loading leaderboard..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-400 font-rajdhani">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:ml-72 min-h-screen p-4 md:p-6">
        <div className="max-w-full mx-auto space-y-4">
          {/* Header */}
          <div className="border-b border-zinc-800 pb-3">
            <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-wider mb-1 font-rajdhani">
              LEADERBOARD
            </h1>
            <p className="text-xs md:text-sm text-zinc-500 font-rajdhani">
              Car rankings and performance statistics
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-zinc-400">Loading leaderboard data...</div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-orange-400 uppercase tracking-wider">Total Cars</span>
                    <Trophy className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-orange-100">{drivers.length}</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-orange-400 uppercase tracking-wider">Fastest Lap</span>
                    <Zap className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-orange-100">
                    {drivers.length > 0 ? formatTime(Math.min(...drivers.map(d => d.bestLap))) : '-'}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-orange-400 uppercase tracking-wider">Top Speed</span>
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-orange-100">
                    {drivers.length > 0 ? `${Math.max(...drivers.map(d => d.topSpeed)).toFixed(1)} MPH` : '-'}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-linear-to-br from-orange-900 to-orange-950 border border-orange-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-orange-400 uppercase tracking-wider">Total Laps</span>
                    <Flag className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-orange-100">
                    {drivers.reduce((sum, d) => sum + d.totalLaps, 0)}
                  </div>
                </motion.div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 uppercase tracking-wider">Class:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {classes.map((cls) => (
                      <button
                        key={cls}
                        onClick={() => setFilterClass(cls)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          filterClass === cls
                            ? 'bg-orange-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500 uppercase tracking-wider">Track:</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {tracks.map((track) => (
                      <button
                        key={track}
                        onClick={() => setFilterTrack(track)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          filterTrack === track
                            ? 'bg-orange-600 text-white'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sorting Info */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                  <span>Currently sorted by <span className="text-orange-600 font-bold">{sortField === 'bestLap' ? 'Best Lap' : sortField === 'avgLap' ? 'Average Lap' : sortField === 'topSpeed' ? 'Top Speed' : sortField === 'avgSpeed' ? 'Average Speed' : sortField === 'totalLaps' ? 'Total Laps' : 'Consistency'}</span> ({sortOrder === 'asc' ? 'Fastest to Slowest' : 'Slowest to Fastest'})</span>
                </div>
              </div>

              {/* Leaderboard Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-lg overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-950 border-b border-zinc-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Car
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Manufacturer
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleSort('bestLap')}
                        >
                          <div className="flex items-center gap-1">
                            Best Lap
                            {sortField === 'bestLap' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleSort('avgLap')}
                        >
                          <div className="flex items-center gap-1">
                            Avg Lap
                            {sortField === 'avgLap' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleSort('topSpeed')}
                        >
                          <div className="flex items-center gap-1">
                            Top Speed
                            {sortField === 'topSpeed' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleSort('avgSpeed')}
                        >
                          <div className="flex items-center gap-1">
                            Avg Speed
                            {sortField === 'avgSpeed' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Track
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleSort('totalLaps')}
                        >
                          <div className="flex items-center gap-1">
                            Total Laps
                            {sortField === 'totalLaps' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-orange-600 transition-colors"
                          onClick={() => handleSort('consistency')}
                        >
                          <div className="flex items-center gap-1">
                            Consistency
                            {sortField === 'consistency' && (
                              sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {sortedDrivers.map((driver, index) => {
                        const position = index + 1;
                        let rankColor = 'text-zinc-400';
                        let rankBg = 'bg-zinc-800';
                        let rankIcon = null;

                        if (position === 1) {
                          rankColor = 'text-yellow-400';
                          rankBg = 'bg-yellow-950/30 border border-yellow-600';
                          rankIcon = <Trophy className="w-5 h-5" />;
                        } else if (position === 2) {
                          rankColor = 'text-zinc-400';
                          rankBg = 'bg-zinc-800/50 border border-zinc-400';
                          rankIcon = <Trophy className="w-5 h-5" />;
                        } else if (position === 3) {
                          rankColor = 'text-orange-500';
                          rankBg = 'bg-orange-950/30 border border-orange-600';
                          rankIcon = <Trophy className="w-5 h-5" />;
                        }

                        return (
                          <motion.tr
                            key={driver.carNumber}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-zinc-800/50 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${rankBg} ${rankColor} font-bold`}>
                                {rankIcon || position}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  driver.class === 'Am' ? 'bg-green-500' :
                                  driver.class === 'Pro' ? 'bg-red-500' :
                                  'bg-zinc-500'
                                }`} />
                                <div>
                                  <div className="text-zinc-100 font-bold">Car #{driver.carNumber}</div>
                                  <div className="text-xs text-zinc-500">{driver.class} Class</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-zinc-300">{driver.manufacturer}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <span className="text-zinc-100 font-bold">{formatTime(driver.bestLap)}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-zinc-100">{formatTime(driver.avgLap)}</span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-green-600" />
                                <span className="text-zinc-100 font-bold">{driver.topSpeed.toFixed(1)} MPH</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-zinc-100">{driver.avgSpeed.toFixed(1)} MPH</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-bold px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                                {driver.track}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-zinc-300">{driver.totalLaps}</td>
                            <td className="px-4 py-4">
                              <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${
                                driver.consistency < 1 ? 'bg-green-950/30 text-green-400' :
                                driver.consistency < 2 ? 'bg-yellow-950/30 text-yellow-400' :
                                'bg-red-950/30 text-red-400'
                              }`}>
                                {driver.consistency.toFixed(3)}s
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
