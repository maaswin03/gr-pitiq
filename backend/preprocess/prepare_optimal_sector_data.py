"""
Complete Preprocessing Pipeline for Optimal Sector Predictor
Loads raw data → Engineers features → Saves to outputs/optimal_sector_predictor/

Run this BEFORE training the model!
"""

import sys
from pathlib import Path
import pandas as pd

# Add backend/utils to path for feature_engineering
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir / "backend" / "utils"))
sys.path.insert(0, str(root_dir / "backend" / "preprocess"))

from load_optimal_sector_data import OptimalSectorDataLoader
from feature_engineering import RacingFeatureEngineer


def main():
    """
    Complete preprocessing pipeline:
    1. Load raw racing data from dataset/
    2. Engineer 130+ features
    3. Save to outputs/optimal_sector_predictor/
    """
    
    print("\n" + "=" * 80)
    print("🏎️  OPTIMAL SECTOR PREDICTOR - PREPROCESSING PIPELINE")
    print("=" * 80)
    
    # Setup paths
    root_dir = Path(__file__).parent.parent.parent
    output_dir = root_dir / "outputs" / "optimal_sector_predictor"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Step 1: Load raw data
    print("\n" + "=" * 80)
    print("STEP 1: Loading Raw Racing Data")
    print("=" * 80)
    
    loader = OptimalSectorDataLoader()
    raw_df = loader.load_all_data()
    
    # Save raw data
    raw_data_path = output_dir / "raw_data.csv"
    raw_df.to_csv(raw_data_path, index=False)
    print(f"\n💾 Saved raw data: {raw_data_path}")
    print(f"   Total laps: {len(raw_df)}")
    print(f"   Tracks: {raw_df['TRACK'].unique()}")
    print(f"   Raw features: {len(raw_df.columns)}")
    
    # Step 2: Feature Engineering
    print("\n" + "=" * 80)
    print("STEP 2: Engineering Features")
    print("=" * 80)
    
    engineer = RacingFeatureEngineer(scaler_type='robust')
    engineered_df = engineer.engineer_features(raw_df)
    
    # Save engineered data
    engineered_data_path = output_dir / "engineered_dataset.csv"
    engineered_df.to_csv(engineered_data_path, index=False)
    print(f"\n💾 Saved engineered data: {engineered_data_path}")
    print(f"   Total laps after cleaning: {len(engineered_df)}")
    print(f"   Engineered features: {len(engineered_df.columns)}")
    
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
    print(f"   Laps: {len(engineered_df)}")
    print(f"   Features: {len(engineered_df.columns)}")
    
    print(f"\n✅ Outlier Removal Stats:")
    if hasattr(engineer, 'outlier_stats') and engineer.outlier_stats:
        print(f"   Total removed: {engineer.outlier_stats.get('total_removed', 0)}")
        print(f"   Percentage: {engineer.outlier_stats.get('removal_percentage', 0):.2f}%")
    
    print("\n🎯 Next Step:")
    print("   Run: python3 backend/train/train_optimal_sector_time.py")
    print("=" * 80 + "\n")
    
    return engineered_df


if __name__ == "__main__":
    main()
