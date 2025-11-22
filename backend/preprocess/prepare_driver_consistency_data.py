"""
Driver Consistency Predictor - Preprocessing Pipeline
Creates consistency classes based on driver lap time variability
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

# Import common data loading and feature engineering
from load_data import GRPitIQDataLoader
from feature_engineering import RacingFeatureEngineer


class DriverConsistencyPreprocessor:
    """Preprocess data for driver consistency classification"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.output_dir = self.root_dir / "outputs" / "driver_consistency_predictor"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def calculate_consistency_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate driver consistency metrics based on lap time variability
        """
        print("\n" + "=" * 80)
        print("📊 Calculating Driver Consistency Metrics")
        print("=" * 80)
        
        # Group by driver, track, and race to calculate consistency
        consistency_metrics = []
        
        grouped = df.groupby(['DRIVER_NUMBER', 'TRACK', 'RACE'])
        
        for (driver, track, race), group in grouped:
            # Need at least 5 laps to assess consistency
            if len(group) < 5:
                continue
            
            lap_times = group['LAP_TIME_SECONDS'].values
            
            # Calculate metrics
            mean_time = np.mean(lap_times)
            std_time = np.std(lap_times)
            cv = (std_time / mean_time) * 100  # Coefficient of variation
            
            # Calculate consistency index (0-100, higher = more consistent)
            # Based on inverse of coefficient of variation
            consistency_index = max(0, 100 - (cv * 10))
            
            # Classify consistency
            if consistency_index >= 80:
                consistency_class = 'High'
            elif consistency_index >= 60:
                consistency_class = 'Medium'
            else:
                consistency_class = 'Low'
            
            # Add metrics to each lap in this group
            for idx in group.index:
                consistency_metrics.append({
                    'index': idx,
                    'CONSISTENCY_INDEX': consistency_index,
                    'CONSISTENCY_CLASS': consistency_class,
                    'DRIVER_MEAN_LAP_TIME': mean_time,
                    'DRIVER_STD_LAP_TIME': std_time,
                    'DRIVER_CV': cv,
                    'DRIVER_LAP_COUNT': len(group)
                })
        
        # Convert to DataFrame
        metrics_df = pd.DataFrame(consistency_metrics).set_index('index')
        
        # Merge back with original data
        df_with_consistency = df.copy()
        df_with_consistency = df_with_consistency.join(metrics_df, how='inner')
        
        print(f"\n✅ Calculated consistency for {len(df_with_consistency)} laps")
        print(f"\nConsistency Class Distribution:")
        class_dist = df_with_consistency['CONSISTENCY_CLASS'].value_counts()
        for cls, count in class_dist.items():
            print(f"   {cls}: {count} laps ({count/len(df_with_consistency)*100:.1f}%)")
        
        return df_with_consistency
    
    def add_consistency_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add consistency-specific features"""
        print("\n🔧 Adding Consistency-Specific Features...")
        
        # Lap-to-lap variation
        if 'LAP_TIME_SECONDS' in df.columns:
            df['LAP_TIME_DELTA'] = df.groupby(['DRIVER_NUMBER', 'TRACK', 'RACE'])['LAP_TIME_SECONDS'].diff()
            df['LAP_TIME_DELTA_ABS'] = df['LAP_TIME_DELTA'].abs()
        
        # Rolling consistency over last 5 laps
        for window in [3, 5]:
            df[f'ROLLING_STD_{window}'] = df.groupby(['DRIVER_NUMBER', 'TRACK', 'RACE'])['LAP_TIME_SECONDS'].transform(
                lambda x: x.rolling(window, min_periods=1).std()
            )
            df[f'ROLLING_CV_{window}'] = df.groupby(['DRIVER_NUMBER', 'TRACK', 'RACE'])['LAP_TIME_SECONDS'].transform(
                lambda x: (x.rolling(window, min_periods=1).std() / x.rolling(window, min_periods=1).mean()) * 100
            )
        
        # Deviation from personal best
        df['DEVIATION_FROM_BEST'] = df.groupby(['DRIVER_NUMBER', 'TRACK', 'RACE'])['LAP_TIME_SECONDS'].transform(
            lambda x: x - x.min()
        )
        
        # Deviation from personal mean
        df['DEVIATION_FROM_MEAN'] = df.groupby(['DRIVER_NUMBER', 'TRACK', 'RACE'])['LAP_TIME_SECONDS'].transform(
            lambda x: x - x.mean()
        )
        
        print(f"✅ Added consistency features")
        
        return df
    
    def run_preprocessing(self, input_data_path: str = None):
        """Run complete preprocessing pipeline"""
        print("\n" + "=" * 80)
        print("🏎️  DRIVER CONSISTENCY PREDICTOR - PREPROCESSING PIPELINE")
        print("=" * 80)
        
        # Step 1: Load raw data
        print("\n" + "=" * 80)
        print("STEP 1: Loading Raw Racing Data")
        print("=" * 80)
        
        if input_data_path is None:
            # Use the common data loader
            loader = GRPitIQDataLoader()
            df = loader.load_all_data()
        else:
            df = pd.read_csv(input_data_path)
            print(f"✅ Loaded {len(df)} laps from {input_data_path}")
        
        # Save raw data
        raw_data_path = self.output_dir / "raw_data.csv"
        df.to_csv(raw_data_path, index=False)
        print(f"\n💾 Saved raw data: {raw_data_path}")
        print(f"   Total laps: {len(df)}")
        print(f"   Tracks: {df['TRACK'].unique().tolist()}")
        print(f"   Raw features: {len(df.columns)}")
        
        # Step 2: Calculate consistency metrics
        print("\n" + "=" * 80)
        print("STEP 2: Calculating Consistency Metrics")
        print("=" * 80)
        
        df = self.calculate_consistency_metrics(df)
        
        # Step 3: Engineer racing features
        print("\n" + "=" * 80)
        print("STEP 3: Engineering Racing Features")
        print("=" * 80)
        
        engineer = RacingFeatureEngineer()
        df = engineer.engineer_features(df)
        
        # Step 4: Add consistency-specific features
        print("\n" + "=" * 80)
        print("STEP 4: Engineering Consistency-Specific Features")
        print("=" * 80)
        
        df = self.add_consistency_features(df)
        
        # Save engineered dataset
        engineered_path = self.output_dir / "engineered_dataset.csv"
        df.to_csv(engineered_path, index=False)
        
        print("\n💾 Saved engineered data: " + str(engineered_path))
        print(f"   Total laps after cleaning: {len(df)}")
        print(f"   Total features: {len(df.columns)}")
        print(f"   Has CONSISTENCY_CLASS target: {('CONSISTENCY_CLASS' in df.columns)}")
        
        # Save preprocessing metadata
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'total_laps': len(df),
            'total_features': len(df.columns),
            'consistency_classes': df['CONSISTENCY_CLASS'].value_counts().to_dict(),
            'tracks': df['TRACK'].unique().tolist()
        }
        
        metadata_path = self.output_dir / "preprocessing_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("\n" + "=" * 80)
        print("📊 PREPROCESSING COMPLETE - SUMMARY")
        print("=" * 80)
        
        print(f"\n✅ Raw Data:")
        print(f"   Location: {raw_data_path}")
        print(f"   Size: {raw_data_path.stat().st_size / 1024 / 1024:.2f} MB")
        print(f"   Laps: {len(df)}")
        
        print(f"\n✅ Engineered Data:")
        print(f"   Location: {engineered_path}")
        print(f"   Size: {engineered_path.stat().st_size / 1024 / 1024:.2f} MB")
        print(f"   Laps: {len(df)}")
        print(f"   Features: {len(df.columns)}")
        print(f"   Target: CONSISTENCY_CLASS")
        
        print(f"\n✅ Class Distribution:")
        for cls, count in df['CONSISTENCY_CLASS'].value_counts().items():
            print(f"   {cls}: {count} laps ({count/len(df)*100:.1f}%)")
        
        print(f"\n🎯 Next Step:")
        print(f"   Run: python backend/train/train_driver_consistency.py")
        print("=" * 80 + "\n")
        
        return df


def main():
    """Run preprocessing"""
    preprocessor = DriverConsistencyPreprocessor()
    preprocessor.run_preprocessing()


if __name__ == "__main__":
    main()
