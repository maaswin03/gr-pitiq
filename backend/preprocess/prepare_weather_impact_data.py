"""
Complete Preprocessing Pipeline for Weather Impact Predictor
Loads raw data → Engineers features → Calculates WEATHER_DELTA → Saves to outputs/weather_impact_predictor/

Run this BEFORE training the model!
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Add backend/utils to path for feature_engineering
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir / "backend" / "utils"))
sys.path.insert(0, str(root_dir / "backend" / "preprocess"))

from load_data import GRPitIQDataLoader
from feature_engineering import RacingFeatureEngineer


class WeatherImpactFeatureEngineer:
    """Calculate weather impact features and WEATHER_DELTA target"""
    
    def __init__(self):
        self.baseline_stats = {}
    
    def calculate_weather_delta(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate WEATHER_DELTA: difference between actual lap time and baseline
        Baseline = average lap time for each driver-track-class combo under ideal conditions
        """
        print("\n🌤️  Calculating Weather Impact (WEATHER_DELTA)...")
        
        # Define ideal weather conditions (adjust thresholds as needed)
        # Note: Pit laps are already filtered out in load_data.py using CROSSING_FINISH_LINE_IN_PIT
        ideal_conditions = (
            (df['TRACK_TEMP'].notna()) &
            (df['AIR_TEMP'].notna()) &
            (df['TRACK_TEMP'] >= 20) &  # Min track temp
            (df['TRACK_TEMP'] <= 40) &  # Max track temp
            (df['HUMIDITY'] < 70)  # Low humidity
        )
        
        # Calculate baseline lap times per driver-track-class
        baseline_df = df[ideal_conditions].copy()
        
        if len(baseline_df) < 100:
            print(f"⚠️  Warning: Only {len(baseline_df)} laps under ideal conditions")
            print("   Using relaxed weather criteria...")
            # Relax conditions - just require valid weather data
            ideal_conditions = (
                (df['TRACK_TEMP'].notna()) &
                (df['AIR_TEMP'].notna())
            )
            baseline_df = df[ideal_conditions].copy()
        
        # Group by DRIVER_NUMBER, TRACK, CLASS to get baseline
        baseline_stats = baseline_df.groupby(['DRIVER_NUMBER', 'TRACK', 'CLASS'])['LAP_TIME_SECONDS'].agg([
            ('baseline_lap_time', 'median'),
            ('baseline_std', 'std')
        ]).reset_index()
        
        # Merge baseline back to original df
        df = df.merge(baseline_stats, on=['DRIVER_NUMBER', 'TRACK', 'CLASS'], how='left')
        
        # Calculate WEATHER_DELTA (positive = slower due to weather)
        df['WEATHER_DELTA'] = df['LAP_TIME_SECONDS'] - df['baseline_lap_time']
        
        # Filter out laps without baseline (drivers with no ideal laps)
        df_clean = df[df['baseline_lap_time'].notna()].copy()
        
        print(f"✅ Baseline calculated from {len(baseline_df)} ideal laps")
        print(f"✅ WEATHER_DELTA computed for {len(df_clean)} laps")
        print(f"   Mean delta: {df_clean['WEATHER_DELTA'].mean():.4f}s")
        print(f"   Std delta: {df_clean['WEATHER_DELTA'].std():.4f}s")
        print(f"   Min delta: {df_clean['WEATHER_DELTA'].min():.4f}s")
        print(f"   Max delta: {df_clean['WEATHER_DELTA'].max():.4f}s")
        
        # Store baseline stats
        self.baseline_stats = {
            'ideal_laps_count': len(baseline_df),
            'total_laps_with_delta': len(df_clean),
            'mean_delta': float(df_clean['WEATHER_DELTA'].mean()),
            'std_delta': float(df_clean['WEATHER_DELTA'].std()),
            'min_delta': float(df_clean['WEATHER_DELTA'].min()),
            'max_delta': float(df_clean['WEATHER_DELTA'].max())
        }
        
        return df_clean
    
    def add_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add weather-specific engineered features"""
        print("\n🌡️  Engineering weather-specific features...")
        
        # Temperature features
        if 'AIR_TEMP' in df.columns and 'TRACK_TEMP' in df.columns:
            df['TEMP_DIFFERENTIAL'] = df['TRACK_TEMP'] - df['AIR_TEMP']
            df['TEMP_RATIO'] = df['TRACK_TEMP'] / (df['AIR_TEMP'] + 0.1)
            df['AVG_TEMP'] = (df['AIR_TEMP'] + df['TRACK_TEMP']) / 2
        
        # Heat stress indicators
        if 'TRACK_TEMP' in df.columns:
            df['HIGH_HEAT'] = (df['TRACK_TEMP'] > df['TRACK_TEMP'].quantile(0.75)).astype(int)
            df['LOW_HEAT'] = (df['TRACK_TEMP'] < df['TRACK_TEMP'].quantile(0.25)).astype(int)
            df['EXTREME_HEAT'] = (df['TRACK_TEMP'] > df['TRACK_TEMP'].quantile(0.90)).astype(int)
        
        # Humidity impact
        if 'HUMIDITY' in df.columns:
            df['HIGH_HUMIDITY'] = (df['HUMIDITY'] > 70).astype(int)
            df['LOW_HUMIDITY'] = (df['HUMIDITY'] < 30).astype(int)
            df['EXTREME_HUMIDITY'] = (df['HUMIDITY'] > 85).astype(int)
        
        # Wind impact
        if 'WIND_SPEED' in df.columns:
            df['HIGH_WIND'] = (df['WIND_SPEED'] > df['WIND_SPEED'].quantile(0.75)).astype(int)
            df['EXTREME_WIND'] = (df['WIND_SPEED'] > df['WIND_SPEED'].quantile(0.90)).astype(int)
        
        # Grip estimate (combination of track temp and humidity)
        if 'TRACK_TEMP' in df.columns and 'HUMIDITY' in df.columns:
            # Normalized grip score (higher is better grip)
            temp_norm = (df['TRACK_TEMP'] - df['TRACK_TEMP'].min()) / (df['TRACK_TEMP'].max() - df['TRACK_TEMP'].min() + 0.01)
            humidity_norm = (df['HUMIDITY'] - df['HUMIDITY'].min()) / (df['HUMIDITY'].max() - df['HUMIDITY'].min() + 0.01)
            df['GRIP_ESTIMATE'] = temp_norm * (1 - humidity_norm)  # High temp, low humidity = better grip
            df['POOR_GRIP'] = (df['GRIP_ESTIMATE'] < df['GRIP_ESTIMATE'].quantile(0.25)).astype(int)
        
        # Weather combinations
        if 'TRACK_TEMP' in df.columns and 'HUMIDITY' in df.columns and 'WIND_SPEED' in df.columns:
            df['WEATHER_CHALLENGE_SCORE'] = (
                df['HIGH_HEAT'] + 
                df['HIGH_HUMIDITY'] + 
                df['HIGH_WIND']
            )
        
        # Time-based weather changes (if multiple laps)
        if 'LAP_NUMBER' in df.columns:
            for col in ['AIR_TEMP', 'TRACK_TEMP', 'HUMIDITY', 'WIND_SPEED']:
                if col in df.columns:
                    df[f'{col}_CHANGE'] = df.groupby(['TRACK', 'RACE'])[col].diff()
                    df[f'{col}_ROLLING_MEAN_5'] = df.groupby(['TRACK', 'RACE'])[col].transform(
                        lambda x: x.rolling(5, min_periods=1).mean()
                    )
        
        print(f"✅ Added {len([c for c in df.columns if c not in ['WEATHER_DELTA', 'LAP_TIME_SECONDS']])} weather features")
        
        return df


def main():
    """
    Complete preprocessing pipeline:
    1. Load raw racing data from dataset/
    2. Engineer racing features (130+)
    3. Calculate WEATHER_DELTA target
    4. Add weather-specific features
    5. Save to outputs/weather_impact_predictor/
    """
    
    print("\n" + "=" * 80)
    print("🏎️  WEATHER IMPACT PREDICTOR - PREPROCESSING PIPELINE")
    print("=" * 80)
    
    # Setup paths
    root_dir = Path(__file__).parent.parent.parent
    output_dir = root_dir / "outputs" / "weather_impact_predictor"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Load raw data
    print("\n" + "=" * 80)
    print("STEP 1: Loading Raw Racing Data")
    print("=" * 80)
    
    loader = GRPitIQDataLoader()
    raw_df = loader.load_all_data()
    
    # Save raw data
    raw_data_path = output_dir / "raw_data.csv"
    raw_df.to_csv(raw_data_path, index=False)
    print(f"\n💾 Saved raw data: {raw_data_path}")
    print(f"   Total laps: {len(raw_df)}")
    print(f"   Tracks: {raw_df['TRACK'].unique()}")
    print(f"   Raw features: {len(raw_df.columns)}")
    
    # Step 2: Calculate WEATHER_DELTA (before feature engineering to preserve column names)
    print("\n" + "=" * 80)
    print("STEP 2: Calculating Weather Impact (WEATHER_DELTA)")
    print("=" * 80)
    
    weather_engineer = WeatherImpactFeatureEngineer()
    weather_df = weather_engineer.calculate_weather_delta(raw_df)
    
    # Step 3: Engineer racing features
    print("\n" + "=" * 80)
    print("STEP 3: Engineering Racing Features")
    print("=" * 80)
    
    engineer = RacingFeatureEngineer(scaler_type='robust')
    engineered_df = engineer.engineer_features(weather_df)
    
    print(f"✅ Engineered {len(engineered_df.columns)} racing features")
    
    # Step 4: Add weather-specific features (enhancing the engineered data)
    print("\n" + "=" * 80)
    print("STEP 4: Engineering Weather-Specific Features")
    print("=" * 80)
    
    final_df = weather_engineer.add_weather_features(engineered_df)
    
    # Step 5: Save engineered data
    engineered_data_path = output_dir / "engineered_dataset.csv"
    final_df.to_csv(engineered_data_path, index=False)
    print(f"\n💾 Saved engineered data: {engineered_data_path}")
    print(f"   Total laps after cleaning: {len(final_df)}")
    print(f"   Total features: {len(final_df.columns)}")
    print(f"   Has WEATHER_DELTA target: {'WEATHER_DELTA' in final_df.columns}")
    
    # Save baseline stats
    import json
    baseline_stats_path = output_dir / "baseline_stats.json"
    with open(baseline_stats_path, 'w') as f:
        json.dump(weather_engineer.baseline_stats, f, indent=2)
    print(f"💾 Saved baseline stats: {baseline_stats_path}")
    
    # Print feature summary
    print("\n" + "=" * 80)
    print("📊 PREPROCESSING COMPLETE - SUMMARY")
    print("=" * 80)
    print(f"\n✅ Raw Data:")
    print(f"   Location: {raw_data_path}")
    print(f"   Size: {raw_data_path.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"   Laps: {len(raw_df)}")
    
    print(f"\n✅ Engineered Data:")
    print(f"   Location: {engineered_data_path}")
    print(f"   Size: {engineered_data_path.stat().st_size / 1024 / 1024:.2f} MB")
    print(f"   Laps: {len(final_df)}")
    print(f"   Features: {len(final_df.columns)}")
    print(f"   Target: WEATHER_DELTA")
    
    print(f"\n✅ Weather Impact Stats:")
    print(f"   Baseline from: {weather_engineer.baseline_stats['ideal_laps_count']} ideal laps")
    print(f"   Mean delta: {weather_engineer.baseline_stats['mean_delta']:.4f}s")
    print(f"   Std delta: {weather_engineer.baseline_stats['std_delta']:.4f}s")
    print(f"   Range: {weather_engineer.baseline_stats['min_delta']:.4f}s to {weather_engineer.baseline_stats['max_delta']:.4f}s")
    
    print(f"\n✅ Outlier Removal Stats:")
    if hasattr(engineer, 'outlier_stats') and engineer.outlier_stats:
        print(f"   Total removed: {engineer.outlier_stats.get('total_removed', 0)}")
        print(f"   Percentage: {engineer.outlier_stats.get('removal_percentage', 0):.2f}%")
    
    print("\n🎯 Next Step:")
    print("   Run: python backend/train/train_weather_impact_model.py")
    print("=" * 80 + "\n")
    
    return final_df


if __name__ == "__main__":
    main()
