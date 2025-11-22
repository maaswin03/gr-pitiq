"""
Pit Stop Time Estimator - Testing & Validation
Regression model evaluation
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import json

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

import warnings
warnings.filterwarnings('ignore')

# Add paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))


class PitStopTimeTester:
    """Test pit stop time predictor"""
    
    def __init__(self):
        self.model_dir = root_dir / "backend" / "model"
        self.output_dir = root_dir / "outputs" / "pit_stop_time_predictor"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.model = None
        self.scaler = None
        self.feature_names = []
    
    def load_model(self):
        """Load trained model"""
        print("\n" + "=" * 80)
        print("📂 Loading Trained Model")
        print("=" * 80)
        
        model_file = self.model_dir / "pit_stop_time_predictor.pkl"
        metadata_file = self.model_dir / "metadata" / "pit_stop_time_predictor.json"
        
        if not model_file.exists():
            raise FileNotFoundError(f"Model not found: {model_file}")
        
        if not metadata_file.exists():
            raise FileNotFoundError(f"Metadata not found: {metadata_file}")
        
        # Load model using joblib
        self.model = joblib.load(model_file)
        
        # Load metadata
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
            self.feature_names = metadata['feature_names']
        
        print(f"✅ Model loaded: {model_file}")
        print(f"   Features: {len(self.feature_names)}")
    
    def load_data(self):
        """Load test data"""
        print("\n" + "=" * 80)
        print("📂 Loading Test Data")
        print("=" * 80)
        
        data_file = self.output_dir / "engineered_dataset.csv"
        
        if not data_file.exists():
            raise FileNotFoundError(f"Data not found: {data_file}")
        
        df = pd.read_csv(data_file)
        print(f"✅ Loaded {len(df)} samples")
        
        # Use only the features that were used in training (from metadata)
        missing_features = [f for f in self.feature_names if f not in df.columns]
        if missing_features:
            print(f"⚠️  Warning: Missing features in test data: {missing_features}")
            # Add missing features with zeros
            for feat in missing_features:
                df[feat] = 0
        
        X = df[self.feature_names].copy()
        y = df['PIT_STOP_TIME'].copy()
        
        # Convert to numeric
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        X = X.replace([np.inf, -np.inf], np.nan)
        
        for col in X.columns:
            if X[col].isna().any():
                X[col] = X[col].fillna(X[col].median())
        
        print(f"\n📊 Dataset Statistics:")
        print(f"   Samples: {len(df)}")
        print(f"   Features: {len(self.feature_names)}")
        print(f"   Target Range: {y.min():.2f} - {y.max():.2f} seconds")
        print(f"   Target Mean: {y.mean():.2f} seconds")
        
        return X, y, df
    
    def predict(self, X):
        """Make predictions"""
        print("\n" + "=" * 80)
        print("🔮 Making Predictions")
        print("=" * 80)
        
        y_pred = self.model.predict(X)
        
        print(f"✅ Predicted {len(y_pred)} samples")
        print(f"   Predicted Range: {y_pred.min():.2f} - {y_pred.max():.2f} seconds")
        print(f"   Predicted Mean: {y_pred.mean():.2f} seconds")
        
        return y_pred
    
    def evaluate_overall(self, y_true, y_pred):
        """Overall performance evaluation"""
        print("\n" + "=" * 80)
        print("📈 Overall Performance")
        print("=" * 80)
        
        r2 = r2_score(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_true, y_pred)
        
        print(f"\n🎯 Test Set Metrics:")
        print(f"   R² Score:  {r2:.4f}")
        print(f"   RMSE:      {rmse:.4f} seconds")
        print(f"   MAE:       {mae:.4f} seconds")
        print(f"   MSE:       {mse:.4f}")
        
        # Error analysis
        errors = y_pred - y_true
        print(f"\n📊 Error Analysis:")
        print(f"   Mean Error:     {errors.mean():.4f} seconds")
        print(f"   Std Error:      {errors.std():.4f} seconds")
        print(f"   Max Error:      {errors.abs().max():.4f} seconds")
        print(f"   Median Error:   {np.median(errors):.4f} seconds")
        
        # Percentage errors
        pct_errors = (errors / y_true * 100).abs()
        print(f"\n📊 Percentage Error Analysis:")
        print(f"   Mean:   {pct_errors.mean():.2f}%")
        print(f"   Median: {pct_errors.median():.2f}%")
        print(f"   Max:    {pct_errors.max():.2f}%")
        
        return {
            'r2': r2,
            'rmse': rmse,
            'mae': mae,
            'mse': mse
        }
    
    def evaluate_by_track(self, df, y_true, y_pred):
        """Track-wise performance"""
        print("\n" + "=" * 80)
        print("🏁 Track-Wise Performance")
        print("=" * 80)
        
        # Reconstruct TRACK column
        track_cols = [col for col in df.columns if col.startswith('TRACK_')]
        if track_cols:
            df['TRACK'] = df[track_cols].idxmax(axis=1).str.replace('TRACK_', '')
        else:
            print("⚠️  No track columns found, skipping track analysis")
            return
        
        tracks = df['TRACK'].unique()
        
        for track in sorted(tracks):
            track_mask = df['TRACK'] == track
            y_true_track = y_true[track_mask]
            y_pred_track = y_pred[track_mask]
            
            if len(y_true_track) == 0:
                continue
            
            r2 = r2_score(y_true_track, y_pred_track)
            mae = mean_absolute_error(y_true_track, y_pred_track)
            rmse = np.sqrt(mean_squared_error(y_true_track, y_pred_track))
            
            print(f"\n📍 {track}:")
            print(f"   Samples: {len(y_true_track):4d}")
            print(f"   R²:      {r2:.4f}")
            print(f"   MAE:     {mae:.4f} seconds")
            print(f"   RMSE:    {rmse:.4f} seconds")
    
    def show_sample_predictions(self, df, y_true, y_pred, n_samples=10):
        """Show sample predictions"""
        print("\n" + "=" * 80)
        print("🔍 Sample Predictions")
        print("=" * 80)
        
        # Reconstruct TRACK
        track_cols = [col for col in df.columns if col.startswith('TRACK_')]
        if track_cols:
            df['TRACK'] = df[track_cols].idxmax(axis=1).str.replace('TRACK_', '')
        
        # Random samples
        np.random.seed(42)
        sample_indices = np.random.choice(len(df), min(n_samples, len(df)), replace=False)
        
        print(f"\n🎲 Random {len(sample_indices)} Pit Stop Predictions:\n")
        
        for i, idx in enumerate(sample_indices):
            actual = y_true.iloc[idx]
            predicted = y_pred[idx]
            error = predicted - actual
            pct_error = (error / actual * 100)
            
            track = df.iloc[idx].get('TRACK', 'Unknown')
            lap_num = df.iloc[idx].get('LAP_NUMBER', 'N/A')
            laps_before = df.iloc[idx].get('LAPS_BEFORE_PIT', 0)
            
            print(f"   {i+1:2d}. Track: {track:12s} | Lap: {lap_num:3.0f} | Laps Before Pit: {laps_before:3.0f}")
            print(f"       Actual: {actual:.2f}s → Predicted: {predicted:.2f}s")
            print(f"       Error: {error:+.2f}s ({pct_error:+.1f}%)")
    
    def save_results(self, df, y_pred, metrics):
        """Save test results"""
        print("\n" + "=" * 80)
        print("💾 Saving Results")
        print("=" * 80)
        
        # Add predictions to dataframe
        results_df = df.copy()
        results_df['PREDICTED_PIT_TIME'] = y_pred
        results_df['PREDICTION_ERROR'] = y_pred - results_df['PIT_STOP_TIME']
        results_df['PERCENTAGE_ERROR'] = (results_df['PREDICTION_ERROR'] / results_df['PIT_STOP_TIME'] * 100).abs()
        
        # Save predictions
        results_file = self.output_dir / "test_predictions.csv"
        results_df.to_csv(results_file, index=False)
        print(f"✅ Predictions saved: {results_file}")
        
        # Save metrics
        metrics_file = self.output_dir / "test_metrics.txt"
        with open(metrics_file, 'w') as f:
            f.write("PIT STOP TIME ESTIMATOR - TEST METRICS\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"R² Score:  {metrics['r2']:.4f}\n")
            f.write(f"RMSE:      {metrics['rmse']:.4f} seconds\n")
            f.write(f"MAE:       {metrics['mae']:.4f} seconds\n")
            f.write(f"MSE:       {metrics['mse']:.4f}\n")
        print(f"✅ Metrics saved: {metrics_file}")


def main():
    print("=" * 80)
    print("🔧 PIT STOP TIME ESTIMATOR - TESTING PIPELINE")
    print("=" * 80)
    
    try:
        # Initialize tester
        tester = PitStopTimeTester()
        
        # Load model and data
        tester.load_model()
        X, y_true, df = tester.load_data()
        
        # Make predictions
        y_pred = tester.predict(X)
        
        # Evaluate
        metrics = tester.evaluate_overall(y_true, y_pred)
        tester.evaluate_by_track(df, y_true, y_pred)
        tester.show_sample_predictions(df, y_true, y_pred)
        
        # Save results
        tester.save_results(df, y_pred, metrics)
        
        print("\n" + "=" * 80)
        print("✅ TESTING COMPLETE!")
        print("=" * 80)
        print(f"\n📊 Summary:")
        print(f"   R² Score: {metrics['r2']:.4f}")
        print(f"   MAE:      {metrics['mae']:.4f} seconds")
        print(f"   RMSE:     {metrics['rmse']:.4f} seconds")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
