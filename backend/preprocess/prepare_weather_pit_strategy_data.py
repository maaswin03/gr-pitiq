"""
Weather Pit Strategy Data Preparation for Classification
Prepares dataset for predicting pit stop decisions based on weather conditions
Uses per-lap approach like position predictor
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Add parent directories to path for imports
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir / "backend" / "preprocess"))

from load_data import GRPitIQDataLoader


class WeatherPitStrategyDataPreparator:
    """Prepare weather-based pit stop strategy classification dataset"""
    
    def __init__(self):
        self.output_dir = root_dir / "outputs" / "weather_pit_strategy_predictor"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def convert_laptime_to_seconds(self, laptime_str):
        """Convert lap time from 'M:SS.mmm' format to seconds"""
        try:
            if pd.isna(laptime_str) or laptime_str == '':
                return np.nan
            
            if isinstance(laptime_str, (int, float)):
                return float(laptime_str)
            
            laptime_str = str(laptime_str).strip()
            
            if ':' in laptime_str:
                parts = laptime_str.split(':')
                minutes = int(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
            else:
                return float(laptime_str)
        except:
            return np.nan
    
    def calculate_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate weather-based features for each lap
        Target: Predict if driver should pit based on weather conditions
        """
        print("\n" + "=" * 80)
        print("🌤️  Calculating Weather-Based Pit Strategy Features")
        print("=" * 80)
        
        df_weather = df.copy()
        
        # Convert LAP_TIME to seconds
        print("🔄 Converting LAP_TIME to seconds...")
        df_weather['LAP_TIME'] = df_weather['LAP_TIME'].apply(self.convert_laptime_to_seconds)
        print(f"✅ Converted {df_weather['LAP_TIME'].notna().sum()} lap times")
        
        # Ensure required columns exist
        if 'RACE_SESSION' not in df_weather.columns and 'RACE' in df_weather.columns:
            df_weather['RACE_SESSION'] = df_weather['RACE']
        
        # Detect pit stops (CROSSING_FINISH_LINE_IN_PIT = 'B' means pitted)
        df_weather['PIT_DECISION'] = df_weather['CROSSING_FINISH_LINE_IN_PIT'].apply(
            lambda x: 1 if x == 'B' else 0
        )
        
        # Calculate tire age (laps since last pit)
        df_weather = df_weather.sort_values(['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER'])
        
        def calculate_tire_age(group):
            tire_age = []
            current_age = 0
            for pit in group['PIT_DECISION']:
                tire_age.append(current_age)
                if pit == 1:
                    current_age = 0  # Reset after pit
                else:
                    current_age += 1
            return tire_age
        
        df_weather['TIRE_AGE'] = df_weather.groupby(
            ['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER']
        ).apply(lambda g: pd.Series(calculate_tire_age(g), index=g.index)).reset_index(level=[0,1,2], drop=True)
        
        # Per-lap feature extraction (optimized - use groupby instead of iterrows)
        print("🔧 Extracting per-lap features...")
        
        # Add rolling averages using groupby + expanding
        df_weather = df_weather.sort_values(['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER'])
        
        # Calculate rolling statistics per driver
        group_cols = ['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER']
        
        print("   Calculating rolling statistics...")
        df_weather['AVG_LAP_TIME'] = df_weather.groupby(group_cols)['LAP_TIME'].transform(lambda x: x.expanding().mean())
        df_weather['STD_LAP_TIME'] = df_weather.groupby(group_cols)['LAP_TIME'].transform(lambda x: x.expanding().std().fillna(0))
        df_weather['MIN_LAP_TIME'] = df_weather.groupby(group_cols)['LAP_TIME'].transform(lambda x: x.expanding().min())
        
        # Sector times
        if 'S1_SECONDS' in df_weather.columns:
            df_weather['AVG_S1'] = df_weather.groupby(group_cols)['S1_SECONDS'].transform(lambda x: x.expanding().mean())
            df_weather['AVG_S2'] = df_weather.groupby(group_cols)['S2_SECONDS'].transform(lambda x: x.expanding().mean())
            df_weather['AVG_S3'] = df_weather.groupby(group_cols)['S3_SECONDS'].transform(lambda x: x.expanding().mean())
        else:
            df_weather['AVG_S1'] = 0.0
            df_weather['AVG_S2'] = 0.0
            df_weather['AVG_S3'] = 0.0
        
        # Speed metrics
        if 'KPH' in df_weather.columns:
            df_weather['AVG_KPH'] = df_weather.groupby(group_cols)['KPH'].transform(lambda x: x.expanding().mean())
        else:
            df_weather['AVG_KPH'] = 0.0
        
        if 'TOP_SPEED' in df_weather.columns:
            df_weather['AVG_TOP_SPEED'] = df_weather.groupby(group_cols)['TOP_SPEED'].transform(lambda x: x.expanding().mean())
        else:
            df_weather['AVG_TOP_SPEED'] = 0.0
        
        # Calculate tire degradation (pace drop over last few laps)
        print("   Calculating tire degradation...")
        
        def calc_degradation(group):
            if len(group) < 6:
                return pd.Series([0.0] * len(group), index=group.index)
            
            deg_values = []
            for i in range(len(group)):
                if i < 6:
                    deg_values.append(0.0)
                else:
                    first_3 = group.iloc[i-5:i-2]['LAP_TIME'].mean()
                    last_3 = group.iloc[i-2:i+1]['LAP_TIME'].mean()
                    deg = last_3 - first_3
                    deg_values.append(deg)
            return pd.Series(deg_values, index=group.index)
        
        df_weather['TIRE_DEGRADATION'] = df_weather.groupby(group_cols).apply(
            lambda g: calc_degradation(g)
        ).reset_index(level=[0,1,2], drop=True)
        
        df_weather['PACE_DROP'] = df_weather.apply(
            lambda row: (row['TIRE_DEGRADATION'] / row['MIN_LAP_TIME']) if row['MIN_LAP_TIME'] > 0 else 0.0,
            axis=1
        )
        
        # Fill missing weather columns with defaults
        print("   Filling missing weather data...")
        weather_cols = {
            'AIR_TEMP': 25.0,
            'TRACK_TEMP': 30.0,
            'HUMIDITY': 50.0,
            'WIND_SPEED': 0.0,
            'RAIN': 0
        }
        
        for col, default_val in weather_cols.items():
            if col not in df_weather.columns:
                df_weather[col] = default_val
            else:
                df_weather[col] = df_weather[col].fillna(default_val)
        
        # Remove laps with insufficient history (< 3 laps)
        print("   Filtering valid laps...")
        df_weather['LAP_COUNT'] = df_weather.groupby(group_cols).cumcount() + 1
        df_weather = df_weather[df_weather['LAP_COUNT'] >= 3].copy()
        
        print(f"✅ Extracted features for {len(df_weather)} laps")
        
        # Select final features
        feature_cols = [
            'TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER',
            'PIT_DECISION', 'TIRE_AGE',
            'AIR_TEMP', 'TRACK_TEMP', 'HUMIDITY', 'WIND_SPEED', 'RAIN',
            'TIRE_DEGRADATION', 'PACE_DROP',
            'AVG_LAP_TIME', 'STD_LAP_TIME', 'MIN_LAP_TIME',
            'AVG_S1', 'AVG_S2', 'AVG_S3',
            'AVG_KPH', 'AVG_TOP_SPEED'
        ]
        
        df_weather = df_weather[feature_cols].copy()
        
        # Calculate additional weather features (SKIPPED - we have the basics)
        # Weather transition features could be added here later
        
        # One-hot encode TRACK
        print("   One-hot encoding TRACK...")
        df_weather = pd.get_dummies(df_weather, columns=['TRACK'], prefix='TRACK')
        
        print(f"✅ Final feature set ready: {len(df_weather)} samples, {len(df_weather.columns)} features")
        
        print(f"\n📊 Feature Summary:")
        print(f"   Total samples: {len(df_weather)}")
        print(f"   Pit decisions (YES): {df_weather['PIT_DECISION'].sum()} ({df_weather['PIT_DECISION'].sum()/len(df_weather)*100:.1f}%)")
        print(f"   Pit decisions (NO): {(df_weather['PIT_DECISION']==0).sum()} ({(df_weather['PIT_DECISION']==0).sum()/len(df_weather)*100:.1f}%)")
        print(f"   Total features: {len(df_weather.columns)}")
        
        return df_weather
    
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
        print("🏎️  WEATHER PIT STRATEGY PREDICTOR - DATA PREPARATION")
        print("=" * 80)
        
        # Load data (include pit laps)
        print("\n📂 Loading Race Data...")
        loader = GRPitIQDataLoader(include_pit_laps=True)
        df = loader.load_all_data()
        print(f"✅ Loaded {len(df)} laps from {df['TRACK'].nunique()} tracks")
        
        # Calculate weather-based features
        feature_df = self.calculate_weather_features(df)
        
        # Save
        self.save_dataset(feature_df)
        
        print("\n" + "=" * 80)
        print("✅ DATA PREPARATION COMPLETE")
        print("=" * 80)


if __name__ == "__main__":
    preparator = WeatherPitStrategyDataPreparator()
    preparator.run()
