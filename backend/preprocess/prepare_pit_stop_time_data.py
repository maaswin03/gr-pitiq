"""
Pit Stop Time Estimator - Data Preparation
Regression model to predict pit stop duration
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Add paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.preprocess.load_data import GRPitIQDataLoader


class PitStopTimeDataPreparator:
    """Prepare pit stop time regression dataset"""
    
    def __init__(self):
        self.output_dir = root_dir / "outputs" / "pit_stop_time_predictor"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def convert_laptime_to_seconds(self, laptime_str):
        """Convert lap time from 'M:SS.mmm' format to seconds"""
        if isinstance(laptime_str, (int, float)):
            return float(laptime_str)
        
        if pd.isna(laptime_str) or laptime_str == '':
            return np.nan
        
        laptime_str = str(laptime_str)
        
        if ':' in laptime_str:
            parts = laptime_str.split(':')
            minutes = int(parts[0])
            seconds = float(parts[1])
            return minutes * 60 + seconds
        
        return float(laptime_str)
    
    def calculate_pit_stop_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate pit stop time features
        Target: Predict pit stop duration in seconds (regression)
        """
        print("\n" + "=" * 80)
        print("🔧 Calculating Pit Stop Time Features")
        print("=" * 80)
        
        df_pit = df.copy()
        
        # Convert LAP_TIME to seconds
        print("🔄 Converting LAP_TIME to seconds...")
        df_pit['LAP_TIME'] = df_pit['LAP_TIME'].apply(self.convert_laptime_to_seconds)
        print(f"✅ Converted {df_pit['LAP_TIME'].notna().sum()} lap times")
        
        # Ensure required columns
        if 'RACE_SESSION' not in df_pit.columns and 'RACE' in df_pit.columns:
            df_pit['RACE_SESSION'] = df_pit['RACE']
        
        # Identify pit laps ('B' = Box = Pit)
        print("🏁 Identifying pit stops...")
        df_pit['IS_PIT'] = df_pit['CROSSING_FINISH_LINE_IN_PIT'].apply(
            lambda x: 1 if x == 'B' else 0
        )
        
        pit_laps = df_pit[df_pit['IS_PIT'] == 1].copy()
        print(f"✅ Found {len(pit_laps)} pit stop laps")
        
        if len(pit_laps) == 0:
            print("❌ No pit stops found in dataset!")
            return pd.DataFrame()
        
        # Sort data
        pit_laps = pit_laps.sort_values(['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER'])
        
        # Calculate pit stop duration (synthetic - real data would come from timing)
        print("⏱️  Estimating pit stop duration...")
        
        # Typical pit stop: 10-25 seconds
        # Base time: 15 seconds
        # Add variability based on:
        # - Track (pit lane length varies)
        # - Position in race (early/late)
        # - Driver experience
        
        base_pit_time = 15.0  # seconds
        
        # Track factor (some tracks have longer pit lanes)
        track_factors = {
            'COTA': 1.1,
            'Road America': 1.15,
            'Sebring': 1.0,
            'Sonoma': 1.05,
            'VIR': 1.0,
            'barber': 1.08
        }
        
        pit_laps['TRACK_FACTOR'] = pit_laps['TRACK'].map(track_factors).fillna(1.0)
        
        # Lap number factor (crew gets faster/tired)
        max_laps = pit_laps.groupby(['TRACK', 'RACE_SESSION'])['LAP_NUMBER'].transform('max')
        pit_laps['LAP_PROGRESS'] = pit_laps['LAP_NUMBER'] / max_laps
        
        # Early stops might be slower (cold tires), late stops faster (practice)
        lap_factor = 1.0 + (pit_laps['LAP_PROGRESS'] - 0.5) * 0.1
        
        # Add realistic noise
        np.random.seed(42)
        noise = np.random.normal(0, 1.5, len(pit_laps))
        
        pit_laps['PIT_STOP_TIME'] = (base_pit_time * pit_laps['TRACK_FACTOR'] * lap_factor + noise).clip(8.0, 30.0)
        
        # Get context from previous laps
        print("📊 Extracting contextual features...")
        
        # For each pit stop, get stats from laps before it
        pit_features_list = []
        
        for idx, pit_row in pit_laps.iterrows():
            driver = pit_row['DRIVER_NUMBER']
            track = pit_row['TRACK']
            race = pit_row['RACE_SESSION']
            lap_num = pit_row['LAP_NUMBER']
            
            # Get driver's laps before this pit
            prev_laps = df_pit[
                (df_pit['TRACK'] == track) &
                (df_pit['RACE_SESSION'] == race) &
                (df_pit['DRIVER_NUMBER'] == driver) &
                (df_pit['LAP_NUMBER'] < lap_num)
            ]
            
            if len(prev_laps) < 2:
                continue
            
            features = {
                'TRACK': track,
                'RACE_SESSION': race,
                'DRIVER_NUMBER': driver,
                'LAP_NUMBER': lap_num,
                'PIT_STOP_TIME': pit_row['PIT_STOP_TIME'],  # Target
                
                # Context features
                'LAPS_BEFORE_PIT': len(prev_laps),
                'AVG_LAP_TIME_BEFORE': prev_laps['LAP_TIME'].mean(),
                'STD_LAP_TIME_BEFORE': prev_laps['LAP_TIME'].std(),
                'LAST_LAP_TIME': prev_laps['LAP_TIME'].iloc[-1],
                
                # Track and weather
                'TRACK_FACTOR': pit_row['TRACK_FACTOR'],
                'LAP_PROGRESS': pit_row['LAP_PROGRESS'],
                'AIR_TEMP': pit_row.get('AIR_TEMP', 25.0),
                'TRACK_TEMP': pit_row.get('TRACK_TEMP', 30.0),
                'RAIN': pit_row.get('RAIN', 0),
            }
            
            # Speed metrics if available
            if 'KPH' in prev_laps.columns:
                features['AVG_SPEED_BEFORE'] = prev_laps['KPH'].mean()
            else:
                features['AVG_SPEED_BEFORE'] = 0.0
            
            if 'TOP_SPEED' in prev_laps.columns:
                features['AVG_TOP_SPEED_BEFORE'] = prev_laps['TOP_SPEED'].mean()
            else:
                features['AVG_TOP_SPEED_BEFORE'] = 0.0
            
            pit_features_list.append(features)
        
        print(f"✅ Extracted features for {len(pit_features_list)} pit stops")
        
        if len(pit_features_list) == 0:
            print("❌ No pit stop features extracted!")
            return pd.DataFrame()
        
        # Create DataFrame
        pit_features_df = pd.DataFrame(pit_features_list)
        
        # Fill missing values
        weather_cols = ['AIR_TEMP', 'TRACK_TEMP', 'RAIN']
        for col in weather_cols:
            if col in pit_features_df.columns:
                pit_features_df[col] = pit_features_df[col].fillna(
                    {'AIR_TEMP': 25.0, 'TRACK_TEMP': 30.0, 'RAIN': 0}.get(col, 0)
                )
        
        # Save TRACK column before one-hot encoding (for stratification in training)
        track_column = pit_features_df['TRACK'].copy()
        
        # One-hot encode TRACK
        print("   One-hot encoding TRACK...")
        pit_features_df = pd.get_dummies(pit_features_df, columns=['TRACK'], prefix='TRACK')
        
        # Re-add original TRACK column at the end (for training stratification)
        pit_features_df['TRACK'] = track_column
        
        print(f"✅ Final feature set ready: {len(pit_features_df)} samples, {len(pit_features_df.columns)} features")
        
        print(f"\n📊 Pit Stop Time Statistics:")
        print(f"   Mean: {pit_features_df['PIT_STOP_TIME'].mean():.2f} seconds")
        print(f"   Min:  {pit_features_df['PIT_STOP_TIME'].min():.2f} seconds")
        print(f"   Max:  {pit_features_df['PIT_STOP_TIME'].max():.2f} seconds")
        print(f"   Std:  {pit_features_df['PIT_STOP_TIME'].std():.2f} seconds")
        
        return pit_features_df
    
    def save_dataset(self, df: pd.DataFrame):
        """Save engineered dataset"""
        print("\n" + "=" * 80)
        print("💾 Saving Dataset")
        print("=" * 80)
        
        output_file = self.output_dir / "engineered_dataset.csv"
        df.to_csv(output_file, index=False)
        
        print(f"✅ Saved to: {output_file}")
        print(f"   Samples: {len(df)}")
        print(f"   Features: {len(df.columns)}")
    
    def run(self):
        """Run complete data preparation pipeline"""
        print("=" * 80)
        print("🔧 PIT STOP TIME ESTIMATOR - DATA PREPARATION")
        print("=" * 80)
        
        # Load data (include pit laps!)
        print("\n📂 Loading Race Data...")
        loader = GRPitIQDataLoader(include_pit_laps=True)
        df = loader.load_all_data()
        print(f"✅ Loaded {len(df)} laps from {df['TRACK'].nunique()} tracks")
        
        # Calculate features
        feature_df = self.calculate_pit_stop_features(df)
        
        if len(feature_df) == 0:
            print("\n❌ Error: No pit stop data available")
            return
        
        # Save
        self.save_dataset(feature_df)
        
        print("\n" + "=" * 80)
        print("✅ DATA PREPARATION COMPLETE")
        print("=" * 80)


if __name__ == "__main__":
    preparator = PitStopTimeDataPreparator()
    preparator.run()
