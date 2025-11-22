"""
Position Predictor - Preprocessing Pipeline
Creates position classification dataset based on race performance metrics
"""

import os
import sys
from pathlib import Path

# Add paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir / "backend" / "utils"))
sys.path.insert(0, str(root_dir / "backend" / "preprocess"))

import pandas as pd
import numpy as np
import json
from datetime import datetime

# Import common data loading
from load_data import GRPitIQDataLoader


class PositionPreprocessor:
    """Preprocess data for position classification"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.output_dir = self.root_dir / "outputs" / "position_predictor"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def convert_laptime_to_seconds(self, laptime_str):
        """Convert lap time from 'M:SS.mmm' format to seconds"""
        try:
            if pd.isna(laptime_str) or laptime_str == '':
                return np.nan
            
            # Handle if already a number
            if isinstance(laptime_str, (int, float)):
                return float(laptime_str)
            
            # Convert string format M:SS.mmm to seconds
            laptime_str = str(laptime_str).strip()
            
            if ':' in laptime_str:
                parts = laptime_str.split(':')
                minutes = int(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
            else:
                # Already in seconds format
                return float(laptime_str)
        except:
            return np.nan
    
    def calculate_position_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate features for position prediction based on race performance
        """
        print("\n" + "=" * 80)
        print("📊 Calculating Position Features")
        print("=" * 80)
        
        # First, calculate positions for each lap based on cumulative time
        print("\n🔢 Calculating positions from lap times...")
        
        # Convert LAP_TIME to seconds
        print("   Converting lap times to seconds...")
        df['LAP_TIME'] = df['LAP_TIME'].apply(self.convert_laptime_to_seconds)
        
        # Check data before filtering
        print(f"   Total laps before filtering: {len(df)}")
        print(f"   Valid lap times: {df['LAP_TIME'].notna().sum()}")
        print(f"   Positive lap times: {(df['LAP_TIME'] > 0).sum()}")
        
        # Remove rows with invalid lap times
        df = df[df['LAP_TIME'].notna() & (df['LAP_TIME'] > 0)].copy()
        
        print(f"   Laps after filtering: {len(df)}")
        
        if len(df) == 0:
            print("❌ No valid lap time data found!")
            return pd.DataFrame()
        
        # Calculate cumulative time for each driver
        df['CUMULATIVE_TIME'] = df.groupby(['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER'])['LAP_TIME'].cumsum()
        
        # Calculate position for each lap
        position_data = []
        grouped = df.groupby(['TRACK', 'RACE_SESSION', 'LAP_NUMBER'])
        
        print(f"   Processing {len(grouped)} lap-groups...")
        
        for (track, race, lap_num), lap_group in grouped:
            # Sort by cumulative time to get positions
            lap_group = lap_group.sort_values('CUMULATIVE_TIME')
            lap_group['POSITION'] = range(1, len(lap_group) + 1)
            position_data.append(lap_group)
        
        if len(position_data) == 0:
            print("❌ No position data created!")
            return pd.DataFrame()
        
        df = pd.concat(position_data, ignore_index=True)
        print(f"✅ Positions calculated for all laps")
        
        position_features = []
        
        # Create features for EACH LAP (not per driver-race)
        # This gives us enough samples for training
        print(f"\n🔍 Creating features for each lap...")
        
        processed_count = 0
        for idx, row in df.iterrows():
            processed_count += 1
            if processed_count % 1000 == 0:
                print(f"   Processed {processed_count}/{len(df)} laps...")
            
            driver = row['DRIVER_NUMBER']
            track = row['TRACK']
            race = row['RACE_SESSION']
            lap_num = row['LAP_NUMBER']
            
            # Get current position
            current_position = row['POSITION']
            
            # Skip if position is invalid
            if pd.isna(current_position) or current_position <= 0:
                continue
            
            # Get lap time and sector times
            lap_time = row['LAP_TIME']
            s1_time = row.get('S1_SECONDS', 0)
            s2_time = row.get('S2_SECONDS', 0)
            s3_time = row.get('S3_SECONDS', 0)
            kph = row.get('KPH', 0)
            top_speed = row.get('TOP_SPEED', 0)
            
            # Get driver's previous laps for rolling statistics
            driver_laps = df[
                (df['TRACK'] == track) & 
                (df['RACE_SESSION'] == race) & 
                (df['DRIVER_NUMBER'] == driver) &
                (df['LAP_NUMBER'] <= lap_num)
            ].sort_values('LAP_NUMBER')
            
            # Need at least 2 laps for statistics
            if len(driver_laps) < 2:
                continue
            
            # Calculate rolling statistics from driver's laps up to this point
            driver_lap_times = driver_laps['LAP_TIME'].dropna()
            avg_lap_time = driver_lap_times.mean()
            std_lap_time = driver_lap_times.std() if len(driver_lap_times) > 1 else 0
            min_lap_time = driver_lap_times.min()
            
            # Consistency
            lap_time_consistency = std_lap_time / avg_lap_time if avg_lap_time > 0 else 0
            
            # Sector averages
            avg_s1 = driver_laps['S1_SECONDS'].mean() if 'S1_SECONDS' in driver_laps.columns else 0
            avg_s2 = driver_laps['S2_SECONDS'].mean() if 'S2_SECONDS' in driver_laps.columns else 0
            avg_s3 = driver_laps['S3_SECONDS'].mean() if 'S3_SECONDS' in driver_laps.columns else 0
            
            # Speed metrics
            avg_kph = driver_laps['KPH'].mean() if 'KPH' in driver_laps.columns else 0
            avg_top_speed = driver_laps['TOP_SPEED'].mean() if 'TOP_SPEED' in driver_laps.columns else 0
            
            # Tire degradation (first 2 laps vs last 2 laps)
            if len(driver_lap_times) >= 4:
                first_2_avg = driver_lap_times.iloc[:2].mean()
                last_2_avg = driver_lap_times.iloc[-2:].mean()
                tire_degradation = last_2_avg - first_2_avg
            else:
                tire_degradation = 0
            
            # Starting position (position in lap 1)
            starting_position = driver_laps.iloc[0]['POSITION'] if len(driver_laps) > 0 else current_position
            position_gain = starting_position - current_position  # Positive = gained positions
            
            # Lap completion
            total_laps = len(driver_laps)
            
            # Best lap gap (compared to fastest in race)
            fastest_lap_in_race = df[
                (df['TRACK'] == track) & 
                (df['RACE_SESSION'] == race)
            ]['LAP_TIME'].min()
            
            best_lap_gap = min_lap_time - fastest_lap_in_race if pd.notna(fastest_lap_in_race) else 0
            
            # Pit stops
            num_pit_stops = driver_laps['CROSSING_FINISH_LINE_IN_PIT'].fillna(0).sum() if 'CROSSING_FINISH_LINE_IN_PIT' in driver_laps.columns else 0
            
            # Fuel-adjusted pace (last 2 laps)
            if len(driver_lap_times) >= 2:
                fuel_adjusted_pace = driver_lap_times.iloc[-2:].mean()
            else:
                fuel_adjusted_pace = avg_lap_time
            
            position_features.append({
                'TRACK': track,
                'RACE_SESSION': race,
                'DRIVER_NUMBER': driver,
                'LAP_NUMBER': lap_num,
                'FINAL_POSITION': int(current_position),
                'STARTING_POSITION': int(starting_position) if pd.notna(starting_position) else int(current_position),
                'POSITION_GAIN': int(position_gain) if pd.notna(starting_position) else 0,
                'AVG_LAP_TIME': avg_lap_time,
                'STD_LAP_TIME': std_lap_time,
                'MIN_LAP_TIME': min_lap_time,
                'LAP_TIME_CONSISTENCY': lap_time_consistency,
                'AVG_SECTOR_1': avg_s1,
                'AVG_SECTOR_2': avg_s2,
                'AVG_SECTOR_3': avg_s3,
                'AVG_KPH': avg_kph,
                'AVG_TOP_SPEED': avg_top_speed,
                'TIRE_DEGRADATION': tire_degradation,
                'COMPLETION_RATE': 1.0,  # All laps we process are completed
                'BEST_LAP_GAP': best_lap_gap,
                'NUM_PIT_STOPS': num_pit_stops,
                'FUEL_ADJUSTED_PACE': fuel_adjusted_pace,
                'TOTAL_LAPS': total_laps
            })
        
        print(f"\n✅ Created {len(position_features)} position records")
        
        return pd.DataFrame(position_features)
    
    def prepare_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepare final feature set for training
        """
        print("\n" + "=" * 80)
        print("🔧 Preparing Features")
        print("=" * 80)
        
        feature_df = df.copy()
        
        # Engineer additional features
        print("\n📐 Engineering additional features...")
        
        # Tire degradation rate (normalized by laps)
        feature_df['TIRE_DEG_RATE'] = feature_df['TIRE_DEGRADATION'] / feature_df['TOTAL_LAPS']
        
        # Pace advantage (compared to fuel-adjusted pace)
        feature_df['PACE_ADVANTAGE'] = feature_df['FUEL_ADJUSTED_PACE'] - feature_df['AVG_LAP_TIME']
        
        # Sector balance (how balanced are sector times)
        feature_df['SECTOR_BALANCE'] = (
            feature_df[['AVG_SECTOR_1', 'AVG_SECTOR_2', 'AVG_SECTOR_3']].std(axis=1)
        )
        
        # One-hot encode track
        print("🏁 Encoding TRACK variable...")
        feature_df = pd.get_dummies(feature_df, columns=['TRACK'], prefix='TRACK')
        
        print(f"\n✅ Final feature count: {len(feature_df.columns) - 4}")  # Exclude RACE_SESSION, DRIVER_NUMBER, FINAL_POSITION, STARTING_POSITION
        print(f"✅ Total samples: {len(feature_df)}")
        
        # Print position distribution
        print("\n📊 Position Distribution:")
        position_counts = feature_df['FINAL_POSITION'].value_counts().sort_index()
        for pos, count in position_counts.items():
            pct = (count / len(feature_df)) * 100
            print(f"   Position {int(pos):2d}: {count:3d} ({pct:.1f}%)")
        
        return feature_df
    
    def run(self):
        """Execute preprocessing pipeline"""
        print("\n" + "=" * 80)
        print("🏎️  POSITION PREDICTOR - DATA PREPARATION")
        print("=" * 80)
        
        # Load data
        print("\n📂 Loading Race Data...")
        loader = GRPitIQDataLoader()
        df = loader.load_all_data()
        
        print(f"\n✅ Loaded {len(df)} total laps")
        print(f"   Tracks: {df['TRACK'].nunique()}")
        print(f"   Races: {df['RACE_SESSION'].nunique() if 'RACE_SESSION' in df.columns else df['RACE'].nunique()}")
        
        # Ensure RACE_SESSION column exists
        if 'RACE_SESSION' not in df.columns and 'RACE' in df.columns:
            df['RACE_SESSION'] = df['RACE']
        
        # Calculate position features
        position_df = self.calculate_position_features(df)
        
        # Prepare features
        final_df = self.prepare_features(position_df)
        
        # Save to CSV
        output_path = self.output_dir / "engineered_dataset.csv"
        final_df.to_csv(output_path, index=False)
        
        print("\n" + "=" * 80)
        print(f"✅ PREPROCESSING COMPLETE")
        print("=" * 80)
        print(f"\n💾 Dataset saved to: {output_path}")
        print(f"📊 Total samples: {len(final_df)}")
        print(f"🎯 Number of positions: {final_df['FINAL_POSITION'].nunique()}")
        print(f"📈 Features: {len(final_df.columns) - 4}")
        

if __name__ == "__main__":
    preparator = PositionPreprocessor()
    preparator.run()
