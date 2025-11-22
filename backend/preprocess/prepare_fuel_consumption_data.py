"""
Fuel Consumption Predictor - Data Preparation
Regression model to predict fuel consumption per lap
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

# Add paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

from backend.preprocess.load_data import GRPitIQDataLoader


class FuelConsumptionDataPreparator:
    """Prepare fuel consumption regression dataset"""
    
    def __init__(self):
        self.output_dir = root_dir / "outputs" / "fuel_consumption_predictor"
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
    
    def calculate_fuel_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate fuel consumption features per lap
        Target: Predict fuel used per lap (regression)
        """
        print("\n" + "=" * 80)
        print("⛽ Calculating Fuel Consumption Features")
        print("=" * 80)
        
        df_fuel = df.copy()
        
        # Convert LAP_TIME to seconds
        print("🔄 Converting LAP_TIME to seconds...")
        df_fuel['LAP_TIME'] = df_fuel['LAP_TIME'].apply(self.convert_laptime_to_seconds)
        print(f"✅ Converted {df_fuel['LAP_TIME'].notna().sum()} lap times")
        
        # Ensure required columns
        if 'RACE_SESSION' not in df_fuel.columns and 'RACE' in df_fuel.columns:
            df_fuel['RACE_SESSION'] = df_fuel['RACE']
        
        # Sort data
        df_fuel = df_fuel.sort_values(['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER'])
        
        # Calculate rolling statistics per driver
        print("🔧 Extracting per-lap features...")
        group_cols = ['TRACK', 'RACE_SESSION', 'DRIVER_NUMBER']
        
        # Rolling averages for performance metrics
        df_fuel['AVG_LAP_TIME'] = df_fuel.groupby(group_cols)['LAP_TIME'].transform(lambda x: x.expanding().mean())
        df_fuel['STD_LAP_TIME'] = df_fuel.groupby(group_cols)['LAP_TIME'].transform(lambda x: x.expanding().std().fillna(0))
        df_fuel['MIN_LAP_TIME'] = df_fuel.groupby(group_cols)['LAP_TIME'].transform(lambda x: x.expanding().min())
        
        # Sector times
        if 'S1_SECONDS' in df_fuel.columns:
            df_fuel['AVG_S1'] = df_fuel.groupby(group_cols)['S1_SECONDS'].transform(lambda x: x.expanding().mean())
            df_fuel['AVG_S2'] = df_fuel.groupby(group_cols)['S2_SECONDS'].transform(lambda x: x.expanding().mean())
            df_fuel['AVG_S3'] = df_fuel.groupby(group_cols)['S3_SECONDS'].transform(lambda x: x.expanding().mean())
        else:
            df_fuel['AVG_S1'] = 0.0
            df_fuel['AVG_S2'] = 0.0
            df_fuel['AVG_S3'] = 0.0
        
        # Speed metrics
        if 'KPH' in df_fuel.columns:
            df_fuel['AVG_KPH'] = df_fuel.groupby(group_cols)['KPH'].transform(lambda x: x.expanding().mean())
        else:
            df_fuel['AVG_KPH'] = 0.0
        
        if 'TOP_SPEED' in df_fuel.columns:
            df_fuel['AVG_TOP_SPEED'] = df_fuel.groupby(group_cols)['TOP_SPEED'].transform(lambda x: x.expanding().mean())
        else:
            df_fuel['AVG_TOP_SPEED'] = 0.0
        
        # Weather features
        weather_cols = {
            'AIR_TEMP': 25.0,
            'TRACK_TEMP': 30.0,
            'HUMIDITY': 50.0,
            'WIND_SPEED': 0.0,
            'RAIN': 0
        }
        
        for col, default_val in weather_cols.items():
            if col not in df_fuel.columns:
                df_fuel[col] = default_val
            else:
                df_fuel[col] = df_fuel[col].fillna(default_val)
        
        # Lap count
        df_fuel['LAP_COUNT'] = df_fuel.groupby(group_cols).cumcount() + 1
        
        # Fuel consumption estimate (simplified model)
        # Higher speed, longer lap time, aggressive driving = more fuel
        print("⛽ Estimating fuel consumption...")
        
        # Base fuel consumption (liters per lap) - typical range 1.5-3.5L
        # This is a synthetic target based on performance metrics
        base_fuel = 2.0
        
        # Speed impact: Higher speed = more fuel
        speed_factor = (df_fuel['AVG_KPH'] / 150.0) if 'KPH' in df_fuel.columns else 1.0
        
        # Lap time impact: Longer lap = more fuel
        time_factor = (df_fuel['LAP_TIME'] / 90.0)  # Normalized to ~90s lap
        
        # Weather impact: Rain, heat = more fuel
        weather_factor = 1.0 + (df_fuel['RAIN'] * 0.1) + ((df_fuel['TRACK_TEMP'] - 30) / 100)
        
        # Add some realistic noise
        np.random.seed(42)
        noise = np.random.normal(0, 0.15, len(df_fuel))
        
        df_fuel['FUEL_CONSUMPTION'] = base_fuel * speed_factor * time_factor * weather_factor + noise
        df_fuel['FUEL_CONSUMPTION'] = df_fuel['FUEL_CONSUMPTION'].clip(1.0, 4.0)  # Realistic range
        
        # Remove laps with insufficient history
        df_fuel = df_fuel[df_fuel['LAP_COUNT'] >= 3].copy()
        
        print(f"✅ Extracted features for {len(df_fuel)} laps")
        
        # Select final features
        feature_cols = [
            'TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER',
            'FUEL_CONSUMPTION',  # Target
            'LAP_TIME', 'AVG_LAP_TIME', 'STD_LAP_TIME', 'MIN_LAP_TIME',
            'AVG_S1', 'AVG_S2', 'AVG_S3',
            'AVG_KPH', 'AVG_TOP_SPEED',
            'AIR_TEMP', 'TRACK_TEMP', 'HUMIDITY', 'WIND_SPEED', 'RAIN',
            'LAP_COUNT'
        ]
        
        df_fuel = df_fuel[feature_cols].copy()
        
        # Save TRACK column before one-hot encoding (for stratification in training)
        track_column = df_fuel['TRACK'].copy()
        
        # One-hot encode TRACK
        print("   One-hot encoding TRACK...")
        df_fuel = pd.get_dummies(df_fuel, columns=['TRACK'], prefix='TRACK')
        
        # Re-add original TRACK column at the end (for training stratification)
        df_fuel['TRACK'] = track_column
        
        print(f"✅ Final feature set ready: {len(df_fuel)} samples, {len(df_fuel.columns)} features")
        
        print(f"\n📊 Fuel Consumption Statistics:")
        print(f"   Mean: {df_fuel['FUEL_CONSUMPTION'].mean():.2f} L/lap")
        print(f"   Min:  {df_fuel['FUEL_CONSUMPTION'].min():.2f} L/lap")
        print(f"   Max:  {df_fuel['FUEL_CONSUMPTION'].max():.2f} L/lap")
        print(f"   Std:  {df_fuel['FUEL_CONSUMPTION'].std():.2f} L/lap")
        
        return df_fuel
    
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
        print("⛽ FUEL CONSUMPTION PREDICTOR - DATA PREPARATION")
        print("=" * 80)
        
        # Load data
        print("\n📂 Loading Race Data...")
        loader = GRPitIQDataLoader(include_pit_laps=False)
        df = loader.load_all_data()
        print(f"✅ Loaded {len(df)} laps from {df['TRACK'].nunique()} tracks")
        
        # Calculate features
        feature_df = self.calculate_fuel_features(df)
        
        # Save
        self.save_dataset(feature_df)
        
        print("\n" + "=" * 80)
        print("✅ DATA PREPARATION COMPLETE")
        print("=" * 80)


if __name__ == "__main__":
    preparator = FuelConsumptionDataPreparator()
    preparator.run()
