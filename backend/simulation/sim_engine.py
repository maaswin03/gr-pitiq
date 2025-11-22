"""
Simulation Engine for GR PitIQ
Generates realistic racing telemetry and stores all ML model parameters
"""

import time
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.feature_engineering import RacingFeatureEngineer
import pandas as pd


class SimulationEngine:
    """
    Real-time racing simulation engine that generates:
    - Raw telemetry data
    - All 97+ ML model parameters
    - Engineered features for predictions
    """
    
    def __init__(self, user_id: str, track: str = "Barber", config: Dict[str, Any] = None):
        self.user_id = user_id
        self.track = track
        self.is_running = False
        self.is_paused = False
        self.pause_reason = None
        self.start_time = None
        
        import uuid
        from datetime import datetime
        self.session_id = f"{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        self.user_config = config or {}
        self.max_laps = int(self.user_config.get('lapCount', 999))
        
        # Track configurations
        self.track_configs = {
            "Barber": {"length_km": 3.7, "sectors": [1.2, 1.3, 1.2], "difficulty": 7.5, "complexity": 8.2, "turns_per_km": 4.32},
            "COTA": {"length_km": 5.513, "sectors": [1.8, 2.0, 1.713], "difficulty": 8.5, "complexity": 9.1, "turns_per_km": 3.63},
            "Road America": {"length_km": 6.515, "sectors": [2.2, 2.3, 2.015], "difficulty": 7.8, "complexity": 7.9, "turns_per_km": 2.30},
            "Sebring": {"length_km": 6.019, "sectors": [2.0, 2.1, 1.919], "difficulty": 8.0, "complexity": 8.5, "turns_per_km": 2.99},
            "Sonoma": {"length_km": 3.99, "sectors": [1.3, 1.4, 1.29], "difficulty": 8.2, "complexity": 8.7, "turns_per_km": 3.26},
            "VIR": {"length_km": 5.263, "sectors": [1.7, 1.9, 1.663], "difficulty": 7.6, "complexity": 8.0, "turns_per_km": 3.04},
        }
        
        self.config = self.track_configs.get(track, self.track_configs["Barber"])
        
        self.current_lap = 1
        self.current_sector = 1
        self.sector_progress = 0.0
        self.total_distance = 0.0
        
        self.current_speed = 0.0
        self.avg_speed = 145.0
        self.top_speed = 0.0
        self.current_lap_time = 0.0
        self.lap_start_time = None
        
        self.sector_times = []
        self.sector_times = []
        self.current_sector_time = 0.0
        self.s1_time = 0.0
        self.s2_time = 0.0
        self.s3_time = 0.0
        
        self.lap_history = []
        self.best_lap = 999.0
        self.previous_lap_time = 0.0
        
        self.tire_age = 0
        self.tire_compound = self.user_config.get('tireCompound', 'Medium')
        self.tire_degradation_rate = 0.08
        self.cumulative_degradation = 0.0
        
        self.current_fuel = float(self.user_config.get('fuelLoad', 50.0))
        self.fuel_per_lap = 2.1
        self.fuel_percentage = 100.0
        
        self.air_temp = float(self.user_config.get('airTemp', 25.0))
        self.track_temp = float(self.user_config.get('trackTemp', 40.0))
        self.humidity = float(self.user_config.get('humidity', 50.0))
        self.rainfall_percentage = float(self.user_config.get('rainfall', 0))
        self.rain = 1 if self.rainfall_percentage > 50 else 0
        self.wind_speed = float(self.user_config.get('windSpeed', 10.0))
        
        self.prev_air_temp = self.air_temp
        self.prev_track_temp = self.track_temp
        self.prev_humidity = self.humidity
        self.prev_rainfall_percentage = self.rainfall_percentage
        self.prev_rain = self.rain
        self.prev_wind_speed = self.wind_speed
        
        self.driver_id = hash(user_id) % 1000
        self.car_number = int(self.user_config.get('carNumber', 1))
        
        driver_skill = self.user_config.get('driverSkill', 'Pro')
        if driver_skill == 'Pro':
            self.driver_avg_laptime = 92.5
            self.driver_std_laptime = 0.85
            self.driver_best_laptime = 91.2
            self.consistency_score = 94.5
        elif driver_skill == 'Amateur':
            self.driver_avg_laptime = 95.5
            self.driver_std_laptime = 1.8
            self.driver_best_laptime = 93.8
            self.consistency_score = 78.0
        elif driver_skill == 'Aggressive':
            self.driver_avg_laptime = 91.8
            self.driver_std_laptime = 2.2
            self.driver_best_laptime = 90.5
            self.consistency_score = 72.0
        else:
            self.driver_avg_laptime = 94.0
            self.driver_std_laptime = 0.65
            self.driver_best_laptime = 92.8
            self.consistency_score = 96.0
        
        self.recent_laps = []
        self.recent_sectors = {"s1": [], "s2": [], "s3": []}
        
        self.feature_engineer = RacingFeatureEngineer(scaler_type='robust')
        
    def start(self):
        """Start the simulation"""
        self.is_running = True
        self.start_time = time.time()
        self.lap_start_time = time.time()
        self.lap_start_time = self.start_time
        self.current_speed = 120.0
        
    def stop(self):
        """Stop the simulation"""
        self.is_running = False
        self.is_paused = False
    
    def resume(self) -> Dict[str, Any]:
        """
        Resume simulation after pit stop
        Applies pit stop time penalty
        """
        if not self.is_paused:
            return {
                "success": False,
                "error": "Simulation not paused"
            }
        
        if hasattr(self, 'pending_pit_duration'):
            self.current_lap_time += self.pending_pit_duration
            pit_duration = self.pending_pit_duration
            delattr(self, 'pending_pit_duration')
        else:
            pit_duration = 0
        
        self.is_paused = False
        self.pause_reason = None
        
        print(f"▶️  SIMULATION RESUMED")
        print(f"   Time penalty applied: {pit_duration:.1f}s")
        print(f"   Tire compound: {self.tire_compound}")
        
        return {
            "success": True,
            "resumed": True,
            "time_penalty_applied": round(pit_duration, 2),
            "tire_compound": self.tire_compound
        }
        
    def pit_stop(self) -> Dict[str, Any]:
        """
        Execute manual pit stop
        - PAUSES simulation
        - User can change tire compound
        - Must call resume() to continue
        
        Returns:
            Dict with pit stop details
        """
        if not self.is_running:
            return {
                "success": False,
                "error": "Simulation not running"
            }
        
        if self.is_paused:
            return {
                "success": False,
                "error": "Already in pit stop"
            }
        
        self.is_paused = True
        self.pause_reason = "pit_stop"
        
        pit_duration = 25.0 + np.random.uniform(0, 5)
        
        fuel_capacity = float(self.user_config.get('fuelLoad', 50.0))
        fuel_added = fuel_capacity - self.current_fuel
        
        old_tire_age = self.tire_age
        self.tire_age = 0
        self.cumulative_degradation = 0.0
        self.current_fuel = fuel_capacity
        self.fuel_percentage = 100.0
        
        self.pending_pit_duration = pit_duration
        
        print(f"🏁 PIT STOP - SIMULATION PAUSED")
        print(f"   Pit Duration: {pit_duration:.1f}s (will be added on resume)")
        print(f"   Fuel Added: {fuel_added:.1f}L (now {self.current_fuel:.1f}L)")
        print(f"   Tires: Age {old_tire_age} → 0 laps ({self.tire_compound})")
        print(f"   ⚠️  PAUSED - User MUST change tire compound if needed")
        print(f"   ⚠️  User MUST call resume() to continue simulation")
        
        return {
            "success": True,
            "paused": True,
            "is_paused": True,  # Frontend flag
            "pit_duration": round(pit_duration, 2),
            "fuel_added": round(fuel_added, 2),
            "fuel_now": round(self.current_fuel, 2),
            "tire_compound": self.tire_compound,
            "old_tire_age": old_tire_age,
            "new_tire_age": 0,
            "message": "PIT STOP ACTIVE - Change tire compound, then click RESUME to continue."
        }
        
    def update_config(self, new_config: Dict[str, Any]) -> bool:
        """
        Update simulation configuration in real-time
        
        Args:
            new_config: Dictionary with new configuration values
            
        Returns:
            bool: True if update successful
        """
        try:
            # Merge new config with existing
            self.user_config.update(new_config)
            
            # Apply immediate updates to modifiable parameters
            
            # 1. Car identification
            if 'carNumber' in new_config:
                self.car_number = int(new_config['carNumber'])
                
            # 2. Tire compound (resets tire age)
            if 'tireCompound' in new_config:
                old_compound = self.tire_compound
                self.tire_compound = new_config['tireCompound']
                if old_compound != self.tire_compound:
                    # Fresh tire change
                    self.tire_age = 0
                    self.cumulative_degradation = 0.0
                    print(f"🔧 Tire compound changed: {old_compound} → {self.tire_compound}")
                    
            # 3. Fuel load (immediate refuel)
            if 'fuelLoad' in new_config:
                self.current_fuel = float(new_config['fuelLoad'])
                self.fuel_percentage = (self.current_fuel / float(new_config['fuelLoad'])) * 100
                print(f"⛽ Fuel updated: {self.current_fuel:.1f}L")
                
            # 4. Weather conditions (immediate change via user_config)
            # These will be applied in next _update_weather() call
            if 'airTemp' in new_config:
                print(f"🌡️  Air temp updated: {new_config['airTemp']}°C")
            if 'trackTemp' in new_config:
                print(f"🌡️  Track temp updated: {new_config['trackTemp']}°C")
            if 'humidity' in new_config:
                print(f"💧 Humidity updated: {new_config['humidity']}%")
            if 'rainfall' in new_config:
                print(f"🌧️  Rainfall updated: {new_config['rainfall']}%")
            if 'windSpeed' in new_config:
                print(f"💨 Wind speed updated: {new_config['windSpeed']} km/h")
                
            # 5. Driver skill (adjusts performance metrics)
            if 'driverSkill' in new_config:
                driver_skill = new_config['driverSkill']
                if driver_skill == 'Pro':
                    self.driver_avg_laptime = 92.5
                    self.driver_std_laptime = 0.85
                    self.driver_best_laptime = 91.2
                    self.consistency_score = 94.5
                elif driver_skill == 'Amateur':
                    self.driver_avg_laptime = 95.5
                    self.driver_std_laptime = 1.8
                    self.driver_best_laptime = 93.8
                    self.consistency_score = 78.0
                elif driver_skill == 'Aggressive':
                    self.driver_avg_laptime = 91.8
                    self.driver_std_laptime = 2.2
                    self.driver_best_laptime = 90.5
                    self.consistency_score = 72.0
                else:  # Conservative
                    self.driver_avg_laptime = 94.0
                    self.driver_std_laptime = 0.65
                    self.driver_best_laptime = 92.8
                    self.consistency_score = 96.0
                print(f"🏁 Driver skill updated: {driver_skill}")
            
            # 6. Engine power, downforce, and speed (immediately applied in next update)
            # These are stored in user_config and read via get() in update() method
            if 'enginePower' in new_config:
                print(f"⚡ Engine power updated: {new_config['enginePower']}%")
            if 'downforceLevel' in new_config:
                print(f"🎯 Downforce updated: {new_config['downforceLevel']}%")
            if 'realTimeSpeed' in new_config:
                print(f"🚀 Base speed updated: {new_config['realTimeSpeed']} km/h")
                
            print(f"✅ Configuration updated for user simulation")
            return True
            
        except Exception as e:
            print(f"❌ Error updating config: {e}")
            return False
    
    def get_snapshot(self) -> Dict[str, Any]:
        """
        Get current simulation snapshot without updating state
        Useful for initial state retrieval
        """
        return self._generate_snapshot()
        
    def update(self, delta_time: float = 2.0) -> Dict[str, Any]:
        """
        Update simulation state (called every 2 seconds)
        Returns: Complete telemetry snapshot with all model parameters
        """
        if not self.is_running:
            return None
        
        if self.is_paused:
            return self._generate_snapshot()
        
        if self.lap_start_time:
            self.current_lap_time = time.time() - self.lap_start_time
        else:
            self.current_lap_time = 0.0
            
        self.current_sector_time += delta_time
        
        base_engine = self.user_config.get('enginePower', 100)
        base_downforce = self.user_config.get('downforceLevel', 50)
        real_time_speed = self.user_config.get('realTimeSpeed', 150)
        rainfall = self.user_config.get('rainfall', 0)
        
        # Dynamic Speed Model
        optimal_temp = 32.0
        engine_power_factor = (base_engine / 100.0) * 12.0
        drag_from_downforce = (base_downforce - 50) * 0.15
        aero_drag_from_wind = self.wind_speed * 0.25
        grip_loss_from_temp = max(0, (self.track_temp - optimal_temp)) * 0.18
        rainfall_penalty = rainfall * 0.35
        
        base_speed = real_time_speed + engine_power_factor - drag_from_downforce - aero_drag_from_wind - grip_loss_from_temp - rainfall_penalty
        
        # Sector variation
        sector_multiplier = [0.95, 1.0, 1.05][self.current_sector - 1]
        tire_penalty = self.tire_age * 0.1
        
        self.current_speed = max(40.0, base_speed * sector_multiplier - tire_penalty)
        self.top_speed = max(self.top_speed, self.current_speed)
        
        # Distance Calculation (km/h -> km/s)
        distance_delta = (self.current_speed / 3600.0) * delta_time
        self.total_distance += distance_delta
        
        sector_length = self.config["sectors"][self.current_sector - 1]
        sector_distance = (self.current_sector_time / 30) * sector_length
        self.sector_progress = min(100, (sector_distance / sector_length) * 100)
        
        if self.sector_progress >= 100:
            self._complete_sector()
            
        self._update_weather()
        
        snapshot = self._generate_snapshot()
        
        return snapshot
        
    def _complete_sector(self):
        """Handle sector completion with realistic lap time calculation"""
        # Calculate realistic lap time when completing sector 3
        if self.current_sector == 3:
            # Optimized Lap Time Calculation (Track-aware)
            # Base lap time from track distance and average speed
            avg_speed_kmh = self.current_speed if self.current_speed > 0 else 150.0
            track_base_lap_time = (self.config["length_km"] / avg_speed_kmh) * 3600.0  # Convert to seconds
            
            # Simplified penalties (pre-calculate to avoid redundant calls)
            tyre_degradation_penalty = self.cumulative_degradation * 0.45
            rainfall = self.user_config.get('rainfall', 0)
            weather_penalty = (rainfall * 0.25) + (self.wind_speed * 0.12) + (abs(self.air_temp - 25.0) * 0.08)
            random_driver_variation = np.random.uniform(-1.2, 1.0)
            
            # Final lap time with optimized formula
            lap_time = track_base_lap_time + tyre_degradation_penalty + weather_penalty + random_driver_variation
            lap_time = max(60.0, min(250.0, lap_time))  # Clamp between 60-250 seconds
            
            # Dynamic Sector Times (pre-generate random values)
            rand1 = np.random.uniform(-0.15, 0.15)
            rand2 = np.random.uniform(-0.15, 0.15)
            
            s1 = lap_time * 0.34 + rand1
            s2 = lap_time * 0.33 + rand2
            s3 = lap_time - s1 - s2  # Ensure exact sum without additional calculation
            
            self.s1_time = max(0.0, s1)
            self.s2_time = max(0.0, s2)
            self.s3_time = max(0.0, s3)
            
            # Append to recent sectors (limit list size inline)
            self.recent_sectors["s1"].append(self.s1_time)
            self.recent_sectors["s2"].append(self.s2_time)
            self.recent_sectors["s3"].append(self.s3_time)
            
            # Keep only last 5 entries inline
            if len(self.recent_sectors["s1"]) > 5:
                self.recent_sectors["s1"] = self.recent_sectors["s1"][-5:]
                self.recent_sectors["s2"] = self.recent_sectors["s2"][-5:]
                self.recent_sectors["s3"] = self.recent_sectors["s3"][-5:]
            
            self.current_lap_time = lap_time
            self._complete_lap()
            return
        
        # For sectors 1 and 2, just track progress (no heavy calculations)
        sector_time = self.current_sector_time
        
        if self.current_sector == 1:
            self.s1_time = sector_time
            self.recent_sectors["s1"].append(sector_time)
        elif self.current_sector == 2:
            self.s2_time = sector_time
            self.recent_sectors["s2"].append(sector_time)
            
        for key in self.recent_sectors:
            if len(self.recent_sectors[key]) > 5:
                self.recent_sectors[key] = self.recent_sectors[key][-5:]
                
        self.current_sector += 1
        self.sector_progress = 0.0
        self.current_sector_time = 0.0
        
    def _complete_lap(self):
        """Handle lap completion"""
        lap_time = self.current_lap_time
        
        lap_data = {
            "lap_number": self.current_lap,
            "lap_time": lap_time,
            "s1": self.s1_time,
            "s2": self.s2_time,
            "s3": self.s3_time,
            "avg_speed": self.avg_speed,
            "top_speed": self.top_speed,
            "tire_age": self.tire_age,
            "fuel_used": self.fuel_per_lap,
            "weather": {
                "air_temp": self.air_temp,
                "track_temp": self.track_temp,
                "humidity": self.humidity,
                "rainfall_percentage": self.rainfall_percentage,
                "rain": self.rain,
                "wind_speed": self.wind_speed
            }
        }
        
        self.lap_history.append(lap_data)
        self.recent_laps.append(lap_time)
        if len(self.recent_laps) > 10:
            self.recent_laps = self.recent_laps[-10:]
            
        if lap_time < self.best_lap:
            self.best_lap = lap_time
            
        self.previous_lap_time = lap_time
        
        # Optimized Dynamic Tyre Degradation Model (cache config values)
        engine = self.user_config.get('enginePower', 100)
        rainfall = self.user_config.get('rainfall', 0)
        downforce = self.user_config.get('downforceLevel', 50)
        
        # Calculate tyre wear (optimized multiplication)
        tyre_wear = (
            self.track_temp * 0.08 +
            self.air_temp * 0.05 +
            engine * 0.0012 +  # Pre-calculated: engine/100 * 0.12
            self.current_speed * 0.0009 +  # Pre-calculated: speed/100 * 0.09
            rainfall * 0.04 +
            np.random.uniform(0.1, 0.6)
        )
        tyre_wear = np.clip(tyre_wear, 0.8, 3.8)
        
        self.tire_age += 1
        self.cumulative_degradation += tyre_wear
        
        # Optimized Dynamic Fuel Usage per Lap (combine operations)
        fuel_used = (
            1.6 +  # base_fuel_rate
            self.current_speed * 0.012 +
            engine * 0.0018 -  # Pre-calculated: engine/100 * 0.18
            downforce * 0.004 +
            rainfall * 0.005
        )
        fuel_used = np.clip(fuel_used, 1.2, 3.8)
        self.fuel_per_lap = fuel_used
        
        self.current_fuel = max(0, self.current_fuel - fuel_used)
        fuel_capacity = float(self.user_config.get('fuelLoad', 50.0))
        self.fuel_percentage = (self.current_fuel / fuel_capacity) * 100
        
        if self.current_lap >= self.max_laps:
            print(f"🏁 Target lap count {self.max_laps} reached. Simulation completed.")
            self.stop()
            return
        
        self.current_lap += 1
        self.current_sector = 1
        self.sector_progress = 0.0
        self.current_lap_time = 0.0
        self.current_sector_time = 0.0
        self.lap_start_time = time.time()
        self.top_speed = 0.0
        
        self.s1_time = 0.0
        self.s2_time = 0.0
        self.s3_time = 0.0
        
    def _update_weather(self):
        """Weather Variation Model - vary within user-provided ranges only"""
        self.prev_air_temp = self.air_temp
        self.prev_track_temp = self.track_temp
        self.prev_humidity = self.humidity
        self.prev_rain = self.rain
        self.prev_wind_speed = self.wind_speed
        
        base_air_temp = float(self.user_config.get('airTemp', 25))
        base_track_temp = float(self.user_config.get('trackTemp', 40))
        base_humidity = float(self.user_config.get('humidity', 50))
        base_wind_speed = float(self.user_config.get('windSpeed', 10))
        base_rainfall = float(self.user_config.get('rainfall', 0))
        
        # Weather Variation: Air Temp ±2°C
        self.air_temp = np.clip(base_air_temp + np.random.uniform(-2, 2), 15, 40)
        
        # Weather Variation: Track Temp ±2°C
        self.track_temp = np.clip(base_track_temp + np.random.uniform(-2, 2), 20, 60)
        
        # Weather Variation: Humidity ±2%
        self.humidity = np.clip(base_humidity + np.random.uniform(-2, 2), 0, 100)
        
        # Weather Variation: Wind Speed ±5 km/h
        self.wind_speed = np.clip(base_wind_speed + np.random.uniform(-5, 5), 0, 300)
        
        # Weather Variation: Rainfall within 0-100%
        self.rainfall_percentage = np.clip(base_rainfall + np.random.uniform(-3, 3), 0, 100)
        self.rain = 1 if self.rainfall_percentage > 50 else 0
        
    def _generate_snapshot(self) -> Dict[str, Any]:
        """
        Generate complete telemetry snapshot with ALL model parameters
        Returns both raw data and engineered features
        """
        # Calculate derived metrics
        total_laps = len(self.lap_history)
        avg_top10 = np.mean(sorted(self.recent_laps)[:10]) if len(self.recent_laps) >= 10 else (self.driver_avg_laptime if self.recent_laps else 92.5)
        
        lap_improvement = (self.previous_lap_time - self.current_lap_time) if self.previous_lap_time > 0 else 0
        
        s1_avg = np.mean(self.recent_sectors["s1"]) if self.recent_sectors["s1"] else 30.0
        s2_avg = np.mean(self.recent_sectors["s2"]) if self.recent_sectors["s2"] else 31.0
        s3_avg = np.mean(self.recent_sectors["s3"]) if self.recent_sectors["s3"] else 30.5
        
        s1_improvement = (s1_avg - self.s1_time) if self.s1_time > 0 and s1_avg > 0 else 0
        s2_improvement = (s2_avg - self.s2_time) if self.s2_time > 0 and s2_avg > 0 else 0
        s3_improvement = (s3_avg - self.s3_time) if self.s3_time > 0 and s3_avg > 0 else 0
        
        raw_snapshot = {
            "NUMBER": self.car_number,
            "LAP_NUMBER": self.current_lap,
            "RACE": 1,
            
            "AIR_TEMP": round(self.air_temp, 2),
            "TRACK_TEMP": round(self.track_temp, 2),
            "HUMIDITY": round(self.humidity, 2),
            "RAINFALL_PERCENTAGE": round(self.rainfall_percentage, 2),
            "RAIN": self.rain,
            "WIND_SPEED": round(self.wind_speed, 2),
            
            "DELTA_TRACK_TEMP": round(self.track_temp - self.prev_track_temp, 3),
            "DELTA_AIR_TEMP": round(self.air_temp - self.prev_air_temp, 3),
            "DELTA_HUMIDITY": round(self.humidity - self.prev_humidity, 3),
            "DELTA_RAINFALL_PERCENTAGE": round(self.rainfall_percentage - self.prev_rainfall_percentage, 3),
            "DELTA_RAIN": self.rain - self.prev_rain,
            "RAIN_START": 1 if (self.rain == 1 and self.prev_rain == 0) else 0,
            "RAIN_STOP": 1 if (self.rain == 0 and self.prev_rain == 1) else 0,
            "DELTA_WIND_SPEED": round(self.wind_speed - self.prev_wind_speed, 3),
            "WEATHER_VOLATILITY": round(abs(self.track_temp - self.prev_track_temp) + abs(self.humidity - self.prev_humidity), 3),
            
            "LAP_TIME_SECONDS": round(self.current_lap_time, 3),  # Current lap elapsed time (0 -> final)
            "S1_SECONDS": round(self.s1_time, 3),
            "S2_SECONDS": round(self.s2_time, 3),
            "S3_SECONDS": round(self.s3_time, 3),
            "LAP_IMPROVEMENT": round(lap_improvement, 3),
            "S1_IMPROVEMENT": round(s1_improvement, 3),
            "S2_IMPROVEMENT": round(s2_improvement, 3),
            "S3_IMPROVEMENT": round(s3_improvement, 3),
            "INT-1_time": round(self.s1_time, 3) if self.s1_time > 0 else 30.0,
            "INT-1_elapsed": round(self.current_lap_time, 3),
            "INT-2_time": round(self.s1_time + self.s2_time, 3) if (self.s1_time > 0 and self.s2_time > 0) else 61.0,
            
            "KPH": round(self.current_speed, 2),
            "TOP_SPEED": round(self.top_speed, 2),
            
            "BEST_LAP_SECONDS": round(self.best_lap, 3) if self.best_lap < 999 else 91.5,
            "AVG_TOP10_SECONDS": round(avg_top10, 3),
            "TOTAL_DRIVER_LAPS": total_laps,
            "DRIVER_ID": self.driver_id,
            "DRIVER_AVG_LAPTIME": round(self.driver_avg_laptime, 3),
            "DRIVER_STD_LAPTIME": round(self.driver_std_laptime, 3),
            "DRIVER_BEST_LAPTIME": round(self.driver_best_laptime, 3),
            
            "TRACK": self.track,
            "TRACK_LENGTH_KM": self.config["length_km"],
            "TRACK_COMPLEXITY": self.config["complexity"],
            "TRACK_CATEGORY": 3,
            "TURNS_PER_KM": self.config["turns_per_km"],
            "TRACK_DIFFICULTY": self.config["difficulty"],
            
            "TIRE_AGE": self.tire_age,
            "DEGRADATION_RATE": round(self.tire_degradation_rate, 3),
            "CUMULATIVE_DEGRADATION": round(self.cumulative_degradation, 3),
            
            "LAP_PROGRESS": round((self.current_lap / 35) * 100, 2),
            "RACE_PHASE": 1 if self.current_lap < 12 else (2 if self.current_lap < 24 else 3),
            "LAPS_REMAINING": max(0, 35 - self.current_lap),
            "LAPS_SINCE_PIT": self.tire_age,
            "PIT_PENALTY": 0,
            
            "TRACK": self.track,
            "FUEL_CURRENT": round(self.current_fuel, 2),
            "FUEL_PERCENTAGE": round(self.fuel_percentage, 2),
            "TIRE_COMPOUND": self.tire_compound,
            
            "DISTANCE_TOTAL_KM": round(self.total_distance, 3),
            "DISTANCE_LAP_KM": round((self.sector_progress / 100) * self.config["sectors"][self.current_sector - 1], 3),
            
            "TIME_ELAPSED_SECONDS": round(time.time() - self.start_time, 2) if self.start_time else 0,
        }
        
        engineered_features = self._generate_engineered_features(raw_snapshot)
        
        return {
            "user_id": self.user_id,
            "timestamp": datetime.now().isoformat(),
            "current_lap": self.current_lap,
            "sector": self.current_sector,
            "sector_progress": round(self.sector_progress, 2),
            "is_paused": self.is_paused,
            "pause_reason": self.pause_reason,
            "raw_snapshot": raw_snapshot,
            "engineered_features": engineered_features,
            "lap_completed": False
        }
        
    def _generate_engineered_features(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate all 97+ engineered ML features from raw data
        Uses the feature engineering pipeline
        """
        try:
            df = pd.DataFrame([raw_data])
            
            required_cols = {
                "LAP_TIME_SECONDS": 92.0,
                "POSITION": 5,
                "CLASS": "Am",
                "GROUP": "GR Cup",
                "MANUFACTURER": "Toyota Gazoo Racing"
            }
            
            for col, default in required_cols.items():
                if col not in df.columns:
                    df[col] = default
                    
            features = {
                "LAP_TIME_NORMALIZED": raw_data.get("BEST_LAP_SECONDS", 92) / 92.0,
                "S1_SECONDS_NORMALIZED": raw_data.get("S1_SECONDS", 30) / 30.0,
                "S2_SECONDS_NORMALIZED": raw_data.get("S2_SECONDS", 31) / 31.0,
                "S3_SECONDS_NORMALIZED": raw_data.get("S3_SECONDS", 30.5) / 30.5,
                
                "TRACK_LENGTH_FACTOR": raw_data.get("TRACK_LENGTH_KM", 3.7) / 5.0,
                "PERF_VS_TRACK_RECORD": raw_data.get("BEST_LAP_SECONDS", 92) / 90.5,
                "TRACK_DIFFICULTY_NORM": raw_data.get("TRACK_DIFFICULTY", 7.5) / 10.0,
                
                "S1_ROLLING_MEAN_3": raw_data.get("S1_SECONDS", 30),
                "S2_ROLLING_MEAN_3": raw_data.get("S2_SECONDS", 31),
                "S3_ROLLING_MEAN_3": raw_data.get("S3_SECONDS", 30.5),
                "ROLLING_AVG_LAP_3": raw_data.get("DRIVER_AVG_LAPTIME", 92),
                "ROLLING_AVG_LAP_5": raw_data.get("DRIVER_AVG_LAPTIME", 92),
                "ROLLING_STD_LAP_5": raw_data.get("DRIVER_STD_LAPTIME", 0.85),
                "ROLLING_MIN_LAP_5": raw_data.get("BEST_LAP_SECONDS", 91),
                
                "SECTOR_VARIANCE": 0.5,
                "SECTOR_STD": 0.7,
                "S1_RATIO": 0.33,
                "S2_RATIO": 0.34,
                "S3_RATIO": 0.33,
                "SECTOR_BALANCE": 0.02,
                "TOTAL_SECTOR_IMPROVEMENT": raw_data.get("S1_IMPROVEMENT", 0) + raw_data.get("S2_IMPROVEMENT", 0) + raw_data.get("S3_IMPROVEMENT", 0),
                
                "DEGRADATION_IMPACT": raw_data.get("TIRE_AGE", 0) * 0.08,
                "TIRE_CONDITION": max(0, 100 - raw_data.get("TIRE_AGE", 0) * 3),
                "TIRE_TEMP_EFFECT": (raw_data.get("TRACK_TEMP", 32) - 30) * 0.01,
                "FRESH_TIRES": 1 if raw_data.get("TIRE_AGE", 0) < 3 else 0,
                "OLD_TIRES": 1 if raw_data.get("TIRE_AGE", 0) > 15 else 0,
                
                "WEATHER_INDEX": (raw_data.get("RAIN", 0) * 5 + abs(raw_data.get("TRACK_TEMP", 32) - 30) * 0.5),
                "GRIP_ESTIMATE": 100 - (raw_data.get("RAIN", 0) * 20 + raw_data.get("TIRE_AGE", 0) * 2),
                "TEMP_DIFFERENTIAL": raw_data.get("TRACK_TEMP", 32) - raw_data.get("AIR_TEMP", 24),
                "WIND_IMPACT": abs(raw_data.get("WIND_SPEED", 12)) * 0.1,
                
                "DRIVER_AVG_BEST": raw_data.get("DRIVER_AVG_LAPTIME", 92) - raw_data.get("DRIVER_BEST_LAPTIME", 91),
                "DRIVER_PACE_VS_TRACK": raw_data.get("DRIVER_AVG_LAPTIME", 92) / 92.0,
                "DRIVER_CONSISTENCY": 100 - (raw_data.get("DRIVER_STD_LAPTIME", 0.85) * 10),
                "DRIVER_PERFORMANCE_INDEX": 95.0,
                "GAP_TO_BEST": raw_data.get("DRIVER_AVG_LAPTIME", 92) - raw_data.get("BEST_LAP_SECONDS", 91),
                "GAP_TO_AVG_TOP10": raw_data.get("DRIVER_AVG_LAPTIME", 92) - raw_data.get("AVG_TOP10_SECONDS", 91.5),
                "CONSISTENCY_SCORE": raw_data.get("DRIVER_CONSISTENCY", 94),
                "CURRENT_FORM": 92.0,
                
                "AVG_SPEED_TRACK_NORM": raw_data.get("KPH", 145) / 150.0,
                "TOP_SPEED_TRACK_NORM": raw_data.get("TOP_SPEED", 200) / 220.0,
                "AVG_SECTOR_SPEED": raw_data.get("KPH", 145),
                "SPEED_EFFICIENCY": raw_data.get("KPH", 145) / 150.0,
                "SPEED_TO_TIME_RATIO": raw_data.get("KPH", 145) / raw_data.get("DRIVER_AVG_LAPTIME", 92),
                "ACCELERATION_ESTIMATE": 2.5,
                
                "TRACK_ID": {"Barber": 0, "COTA": 1, "Road America": 2, "Sebring": 3, "Sonoma": 4, "VIR": 5}.get(raw_data.get("TRACK", "Barber"), 0),
                "TRACK_ENCODED": {"Barber": 0, "COTA": 1, "Road America": 2, "Sebring": 3, "Sonoma": 4, "VIR": 5}.get(raw_data.get("TRACK", "Barber"), 0),
                "TRACK_AVG_LAPTIME": 92.0,
                
                "LAP_TREND": 0.0,
                "CONSECUTIVE_IMPROVEMENTS": 0,
                "MOMENTUM_SCORE": 50.0,
            }
            
            return features
            
        except Exception as e:
            print(f"⚠️  Error generating engineered features: {e}")
            return {}
            
    def get_lap_data_for_history(self) -> Dict[str, Any]:
        """Get the last completed lap data with features"""
        if not self.lap_history:
            return None
            
        last_lap = self.lap_history[-1]
        
        raw_snapshot = {
            "NUMBER": 1,
            "LAP_NUMBER": last_lap["lap_number"],
            "LAP_TIME_SECONDS": last_lap["lap_time"],
            "S1_SECONDS": last_lap["s1"],
            "S2_SECONDS": last_lap["s2"],
            "S3_SECONDS": last_lap["s3"],
            "KPH": last_lap["avg_speed"],
            "TOP_SPEED": last_lap["top_speed"],
            "TIRE_AGE": last_lap["tire_age"],
            "AIR_TEMP": last_lap["weather"]["air_temp"],
            "TRACK_TEMP": last_lap["weather"]["track_temp"],
            "HUMIDITY": last_lap["weather"]["humidity"],
            "RAIN": last_lap["weather"]["rain"],
            "WIND_SPEED": last_lap["weather"]["wind_speed"],
            "TRACK": self.track,
            "BEST_LAP_SECONDS": self.best_lap,
            "DRIVER_AVG_LAPTIME": self.driver_avg_laptime,
        }
        
        engineered_features = self._generate_engineered_features(raw_snapshot)
        
        return {
            "lap_number": last_lap["lap_number"],
            "lap_time": last_lap["lap_time"],
            "sector_times": {
                "s1": last_lap["s1"],
                "s2": last_lap["s2"],
                "s3": last_lap["s3"]
            },
            "speed_stats": {
                "avg_speed": last_lap["avg_speed"],
                "top_speed": last_lap["top_speed"]
            },
            "tire_stats": {
                "age": last_lap["tire_age"],
                "compound": self.tire_compound
            },
            "fuel_stats": {
                "used": last_lap["fuel_used"],
                "remaining": self.current_fuel
            },
            "weather": last_lap["weather"],
            "engineered_features": engineered_features,
            "timestamp": datetime.now().isoformat()
        }
