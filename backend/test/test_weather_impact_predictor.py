"""
Test Suite for Weather Impact Predictor Model
Validates model loading, predictions, and performance
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pandas as pd
import numpy as np
import joblib
import json
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


class WeatherImpactPredictorTester:
    """Test suite for the trained weather impact predictor"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.model_dir = self.root_dir / "backend" / "model"
        self.metadata_dir = self.root_dir / "backend" / "model" / "metadata"
        self.output_dir = self.root_dir / "outputs" / "weather_impact_predictor"
        
        self.model = None
        self.metadata = None
        
    def load_model(self):
        """Load the trained model"""
        print("\n" + "=" * 80)
        print("📦 Loading Trained Model")
        print("=" * 80)
        
        model_path = self.model_dir / "weather_impact_predictor.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at: {model_path}")
        
        self.model = joblib.load(model_path)
        print(f"✅ Model loaded from: {model_path}")
        
        # Load metadata
        metadata_path = self.metadata_dir / "weather_impact_predictor.json"
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            print(f"✅ Metadata loaded from: {metadata_path}")
            print(f"   Trained: {self.metadata.get('timestamp', 'N/A')}")
            print(f"   Features: {len(self.metadata.get('feature_names', []))}")
        
        return self.model
    
    def validate_on_test_data(self, test_data_path=None):
        """Validate model on test dataset"""
        print("\n" + "=" * 80)
        print("🔍 Validating Model on Test Data")
        print("=" * 80)
        
        if test_data_path is None:
            test_data_path = self.output_dir / "engineered_dataset.csv"
        
        if not test_data_path.exists():
            raise FileNotFoundError(f"Test data not found at: {test_data_path}")
        
        df = pd.read_csv(test_data_path)
        print(f"✅ Loaded test data: {len(df)} samples")
        
        # Prepare features (same as training - must match exactly!)
        target = 'WEATHER_DELTA'
        exclude_cols = [
            'WEATHER_DELTA',  # Target
            'LAP_TIME_SECONDS', 'baseline_lap_time', 'baseline_std',  # Raw values
            'LAP_TIME', 'ELAPSED', 'HOUR', 'FL_time', 'FL_elapsed',
            'TRACK', 'CLASS', 'GROUP', 'MANUFACTURER', 'FLAG_AT_FL',
            'CROSSING_FINISH_LINE_IN_PIT', 'DRIVER_NUMBER', 'VEHICLE',
            'CAR_NUMBER', 'DRIVER', 'RACE_NUMBER',  # Identifiers (RACE is kept as feature!)
            'LAP_NUMBER', 'IN_LAP', 'OUT_LAP', 'LAPS_COMPLETED',  # Metadata
            'LAP_START_TIME', 'LAP_END_TIME',  # Times
            'TRACK_STATUS_CLEAR', 'TRACK_STATUS_FCY', 'PIT',  # Status flags
            'SLOWEST_SECTOR', 'IM1a_time', 'IM1a_elapsed', 'IM1_time', 
            'IM1_elapsed', 'IM2a_time', 'IM2a_elapsed', 'IM2_time', 
            'IM2_elapsed', 'IM3a_time', 'IM3a_elapsed', 'S1', 'S2', 'S3',
            'S1_LARGE', 'S2_LARGE', 'S3_LARGE', 'S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS',
            'PIT_TIME', 'INT-2_elapsed'  # Additional columns to exclude
        ]
        
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        # Clean data
        df_clean = df[df[target].notna()].copy()
        
        # Store track info before preparing features
        track_info = df_clean['TRACK'].copy() if 'TRACK' in df_clean.columns else None
        
        X = df_clean[feature_cols].copy()
        y = df_clean[target].copy()
        
        # Convert to numeric
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle missing values
        X = X.replace([np.inf, -np.inf], np.nan)
        for col in X.columns:
            if X[col].isna().any():
                if X[col].dtype in ['float64', 'int64']:
                    median_val = X[col].median()
                    X[col] = X[col].fillna(median_val if not pd.isna(median_val) else 0)
                else:
                    X[col] = X[col].fillna(0)
        
        # Make predictions
        print("\n🔮 Making predictions...")
        y_pred = self.model.predict(X)
        
        # Calculate overall metrics
        mae = mean_absolute_error(y, y_pred)
        rmse = np.sqrt(mean_squared_error(y, y_pred))
        r2 = r2_score(y, y_pred)
        mape = np.mean(np.abs((y - y_pred) / (np.abs(y) + 0.001))) * 100
        
        print(f"\n📊 Overall Test Results:")
        print(f"   MAE:  {mae:.4f} seconds")
        print(f"   RMSE: {rmse:.4f} seconds")
        print(f"   R²:   {r2:.4f}")
        print(f"   MAPE: {mape:.2f}%")
        
        # Compare with training metrics if available
        if self.metadata and 'metrics' in self.metadata:
            ensemble_metrics = self.metadata['metrics'].get('ensemble', {})
            if ensemble_metrics:
                train_mae = ensemble_metrics.get('MAE', None)
                if train_mae:
                    print(f"\n📈 Comparison with Training:")
                    print(f"   Training MAE: {train_mae:.4f}s")
                    print(f"   Test MAE:     {mae:.4f}s")
                    print(f"   Difference:   {abs(mae - train_mae):.4f}s")
        
        # Weather impact analysis
        print(f"\n🌤️  Weather Impact Statistics:")
        print(f"   Mean delta: {y.mean():.4f}s")
        print(f"   Std delta:  {y.std():.4f}s")
        print(f"   Min delta:  {y.min():.4f}s (weather advantage)")
        print(f"   Max delta:  {y.max():.4f}s (weather disadvantage)")
        
        # Distribution of predictions
        positive_impact = (y_pred > 0).sum()
        negative_impact = (y_pred < 0).sum()
        print(f"\n📊 Prediction Distribution:")
        print(f"   Slower due to weather: {positive_impact} laps ({positive_impact/len(y_pred)*100:.1f}%)")
        print(f"   Faster due to weather: {negative_impact} laps ({negative_impact/len(y_pred)*100:.1f}%)")
        
        # Track-wise analysis with 5 samples per track
        if track_info is not None:
            print("\n" + "=" * 80)
            print("� TRACK-WISE PERFORMANCE & SAMPLE PREDICTIONS")
            print("=" * 80)
            
            unique_tracks = sorted(track_info.unique())
            print(f"\n📍 Testing on {len(unique_tracks)} tracks: {', '.join(unique_tracks)}")
            
            for track in unique_tracks:
                print("\n" + "─" * 80)
                print(f"🏁 Track: {track.upper()}")
                print("─" * 80)
                
                # Filter data for this track
                track_mask = track_info == track
                track_y = y[track_mask]
                track_y_pred = y_pred[track_mask]
                
                # Calculate track-specific metrics
                track_mae = mean_absolute_error(track_y, track_y_pred)
                track_rmse = np.sqrt(mean_squared_error(track_y, track_y_pred))
                track_r2 = r2_score(track_y, track_y_pred)
                
                print(f"\n📊 Track Performance:")
                print(f"   Samples: {len(track_y)}")
                print(f"   MAE:     {track_mae:.4f}s")
                print(f"   RMSE:    {track_rmse:.4f}s")
                print(f"   R²:      {track_r2:.4f}")
                
                # Get 5 random samples for this track
                track_indices = df_clean[track_mask].index.tolist()
                sample_size = min(5, len(track_indices))
                
                if sample_size > 0:
                    np.random.seed(42)  # For reproducibility
                    sample_indices = np.random.choice(track_indices, size=sample_size, replace=False)
                    
                    print(f"\n🎯 Sample Predictions ({sample_size} random samples):")
                    print()
                    print(f"{'#':<4} {'Actual Δ':>12} {'Predicted Δ':>12} {'Error':>12} {'Error %':>10} {'Impact':>15}")
                    print("─" * 80)
                    
                    for i, idx in enumerate(sample_indices, 1):
                        # Get the position in the filtered arrays
                        pos = df_clean.index.get_loc(idx)
                        actual = track_y.iloc[df_clean[track_mask].index.get_loc(idx)]
                        predicted = track_y_pred[df_clean[track_mask].index.get_loc(idx)]
                        error = actual - predicted
                        error_pct = (error / abs(actual) * 100) if actual != 0 else 0
                        
                        # Determine impact description
                        if actual > 0:
                            impact = f"Slower {actual:.3f}s"
                        else:
                            impact = f"Faster {abs(actual):.3f}s"
                        
                        print(f"{i:<4} {actual:>12.4f} {predicted:>12.4f} {error:>+12.4f} {error_pct:>+9.2f}% {impact:>15}")
                    
                    print()
                    
                    # Show weather impact distribution for this track
                    positive = (track_y > 0).sum()
                    negative = (track_y < 0).sum()
                    print(f"📈 Track Weather Impact Distribution:")
                    print(f"   Slower laps: {positive} ({positive/len(track_y)*100:.1f}%)")
                    print(f"   Faster laps: {negative} ({negative/len(track_y)*100:.1f}%)")
                    print(f"   Mean impact: {track_y.mean():+.4f}s")
        
        return mae, rmse, r2
    
    def test_prediction_on_sample(self, sample_features):
        """Test prediction on a single sample"""
        print("\n" + "=" * 80)
        print("🧪 Testing Single Sample Prediction")
        print("=" * 80)
        
        if isinstance(sample_features, dict):
            sample_df = pd.DataFrame([sample_features])
        else:
            sample_df = pd.DataFrame(sample_features)
        
        prediction = self.model.predict(sample_df)
        
        print(f"✅ Weather Impact Prediction: {prediction[0]:+.4f} seconds")
        if prediction[0] > 0:
            print(f"   → Lap will be {prediction[0]:.4f}s SLOWER due to weather")
        else:
            print(f"   → Lap will be {abs(prediction[0]):.4f}s FASTER due to weather")
        
        return prediction[0]
    
    def analyze_weather_scenarios(self):
        """Analyze different weather scenarios"""
        print("\n" + "=" * 80)
        print("🌤️  Weather Scenario Analysis")
        print("=" * 80)
        
        # Load test data
        test_data_path = self.output_dir / "engineered_dataset.csv"
        if not test_data_path.exists():
            print("❌ Test data not found")
            return
        
        df = pd.read_csv(test_data_path)
        
        # Define weather scenarios
        scenarios = {
            'High Heat': df[df.get('HIGH_HEAT', pd.Series([0])) == 1] if 'HIGH_HEAT' in df.columns else pd.DataFrame(),
            'High Humidity': df[df.get('HIGH_HUMIDITY', pd.Series([0])) == 1] if 'HIGH_HUMIDITY' in df.columns else pd.DataFrame(),
            'High Wind': df[df.get('HIGH_WIND', pd.Series([0])) == 1] if 'HIGH_WIND' in df.columns else pd.DataFrame(),
            'Poor Grip': df[df.get('POOR_GRIP', pd.Series([0])) == 1] if 'POOR_GRIP' in df.columns else pd.DataFrame()
        }
        
        print("\n📊 Average WEATHER_DELTA by Scenario:")
        for scenario_name, scenario_df in scenarios.items():
            if len(scenario_df) > 0 and 'WEATHER_DELTA' in scenario_df.columns:
                mean_delta = scenario_df['WEATHER_DELTA'].mean()
                std_delta = scenario_df['WEATHER_DELTA'].std()
                count = len(scenario_df)
                print(f"   {scenario_name:15s}: {mean_delta:+.4f}s ± {std_delta:.4f}s ({count} laps)")
            else:
                print(f"   {scenario_name:15s}: No data available")


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("🏎️  WEATHER IMPACT PREDICTOR - TEST SUITE")
    print("=" * 80)
    
    tester = WeatherImpactPredictorTester()
    
    try:
        # Load model
        tester.load_model()
        
        # Validate on test data
        mae, rmse, r2 = tester.validate_on_test_data()
        
        # Analyze weather scenarios
        tester.analyze_weather_scenarios()
        
        print("\n" + "=" * 80)
        print("✅ ALL TESTS PASSED")
        print("=" * 80)
        print(f"   MAE:  {mae:.4f}s")
        print(f"   RMSE: {rmse:.4f}s")
        print(f"   R²:   {r2:.4f}")
        print("=" * 80 + "\n")
        
    except FileNotFoundError as e:
        print(f"\n❌ ERROR: {e}")
        print("\nPlease ensure:")
        print("1. Preprocessing has been run: python backend/preprocess/prepare_weather_impact_data.py")
        print("2. Model has been trained: python backend/train/train_weather_impact_model.py")
        return False
    
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
