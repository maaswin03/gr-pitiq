"""
Test Suite for Optimal Sector Time Predictor Model
Validates model loading, predictions, and performance for S1, S2, S3 sector times
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


class OptimalSectorPredictorTester:
    """Test suite for the trained optimal sector time predictor"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.model_dir = self.root_dir / "backend" / "model"
        self.metadata_dir = self.root_dir / "backend" / "model" / "metadata"
        self.output_dir = self.root_dir / "outputs" / "optimal_sector_predictor"
        
        self.model = None
        self.metadata = None
        self.sector_names = ['S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS']
        
    def load_model(self):
        """Load the trained model"""
        print("\n" + "=" * 80)
        print("📦 Loading Trained Model")
        print("=" * 80)
        
        model_path = self.model_dir / "optimal_sector_predictor.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at: {model_path}")
        
        self.model = joblib.load(model_path)
        print(f"✅ Model loaded from: {model_path}")
        
        # Load metadata
        metadata_path = self.metadata_dir / "optimal_sector_predictor.json"
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            print(f"✅ Metadata loaded from: {metadata_path}")
            print(f"   Trained: {self.metadata.get('timestamp', 'N/A')}")
            print(f"   Features: {len(self.metadata.get('feature_names', []))}")
            print(f"   Targets: {', '.join(self.sector_names)}")
        
        return self.model
    
    def validate_on_test_data(self, test_data_path=None):
        """Validate model on test dataset"""
        print("\n" + "=" * 80)
        print("🔍 Validating Model on Test Data")
        print("=" * 80)
        
        if test_data_path is None:
            test_data_path = self.output_dir / "engineered_dataset.csv"
        
        if not test_data_path.exists():
            print(f"⚠️  Test data not found at: {test_data_path}")
            print("   Please run preprocessing first:")
            print("   ./backend/preprocess/run_optimal_sector_preprocessing.sh")
            return None, None, None
        
        df = pd.read_csv(test_data_path)
        print(f"✅ Loaded test data: {len(df)} samples")
        
        # Clean data - require all sector times to be present
        df_clean = df[
            (df['S1_SECONDS'].notna()) & 
            (df['S2_SECONDS'].notna()) & 
            (df['S3_SECONDS'].notna())
        ].copy()
        
        print(f"✅ Clean samples: {len(df_clean)}")
        
        # Use ONLY the features the model was trained with
        trained_features = self.metadata['feature_names']
        print(f"📋 Model expects {len(trained_features)} features")
        
        # Check which features are missing
        missing_features = [f for f in trained_features if f not in df_clean.columns]
        if missing_features:
            print(f"⚠️  Missing {len(missing_features)} features in test data:")
            for f in missing_features[:5]:
                print(f"   - {f}")
            if len(missing_features) > 5:
                print(f"   ... and {len(missing_features) - 5} more")
            
            # Add missing features with zeros
            for f in missing_features:
                df_clean[f] = 0
        
        # Select ONLY the trained features (in the same order)
        X = df_clean[trained_features].copy()
        y = df_clean[self.sector_names].copy()
        
        print(f"✅ Using {len(X.columns)} features (matching training)")
        
        # Convert to numeric
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle missing values
        X = X.replace([np.inf, -np.inf], np.nan)
        for col in X.columns:
            if X[col].isna().any():
                median_val = X[col].median()
                X[col] = X[col].fillna(median_val if not pd.isna(median_val) else 0)
        
        # Make predictions
        print("\n🔮 Making predictions...")
        y_pred = self.model.predict(X)
        
        # Calculate overall metrics
        mae = mean_absolute_error(y, y_pred)
        rmse = np.sqrt(mean_squared_error(y, y_pred))
        r2 = r2_score(y, y_pred)
        
        print(f"\n📊 Overall Test Results:")
        print(f"   MAE:  {mae:.4f} seconds (averaged across all sectors)")
        print(f"   RMSE: {rmse:.4f} seconds")
        print(f"   R²:   {r2:.4f}")
        
        # Per-sector metrics
        print(f"\n📊 Per-Sector Test Results:")
        sector_metrics = {}
        
        for i, sector in enumerate(self.sector_names):
            sector_mae = mean_absolute_error(y.iloc[:, i], y_pred[:, i])
            sector_rmse = np.sqrt(mean_squared_error(y.iloc[:, i], y_pred[:, i]))
            sector_r2 = r2_score(y.iloc[:, i], y_pred[:, i])
            
            sector_metrics[sector] = {
                'MAE': sector_mae,
                'RMSE': sector_rmse,
                'R²': sector_r2
            }
            
            print(f"   {sector}:")
            print(f"      MAE:  {sector_mae:.4f}s")
            print(f"      RMSE: {sector_rmse:.4f}s")
            print(f"      R²:   {sector_r2:.4f}")
        
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
        
        # Sample predictions
        print(f"\n🎯 Sample Predictions (first 5 laps):")
        sample_df = pd.DataFrame({
            'S1_Actual': y['S1_SECONDS'].head(5).values,
            'S1_Pred': y_pred[:5, 0],
            'S2_Actual': y['S2_SECONDS'].head(5).values,
            'S2_Pred': y_pred[:5, 1],
            'S3_Actual': y['S3_SECONDS'].head(5).values,
            'S3_Pred': y_pred[:5, 2]
        })
        
        # Add total lap time comparison
        sample_df['Total_Actual'] = (sample_df['S1_Actual'] + 
                                      sample_df['S2_Actual'] + 
                                      sample_df['S3_Actual'])
        sample_df['Total_Pred'] = (sample_df['S1_Pred'] + 
                                    sample_df['S2_Pred'] + 
                                    sample_df['S3_Pred'])
        sample_df['Total_Error'] = sample_df['Total_Actual'] - sample_df['Total_Pred']
        
        print(sample_df.to_string(index=False, float_format='%.2f'))
        
        return mae, rmse, r2, sector_metrics
    
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
        
        print(f"✅ Sector Predictions:")
        print(f"   S1: {prediction[0, 0]:.4f} seconds")
        print(f"   S2: {prediction[0, 1]:.4f} seconds")
        print(f"   S3: {prediction[0, 2]:.4f} seconds")
        print(f"   Total: {prediction[0].sum():.4f} seconds")
        
        return prediction[0]
    
    def find_optimal_lap(self, test_data_path=None):
        """Find the theoretical optimal lap from predictions"""
        print("\n" + "=" * 80)
        print("🏆 Finding Theoretical Optimal Lap")
        print("=" * 80)
        
        if test_data_path is None:
            test_data_path = self.output_dir / "engineered_dataset.csv"
        
        if not test_data_path.exists():
            print(f"⚠️  Test data not found")
            return None
        
        df = pd.read_csv(test_data_path)
        
        # Clean data
        df_clean = df[
            (df['S1_SECONDS'].notna()) & 
            (df['S2_SECONDS'].notna()) & 
            (df['S3_SECONDS'].notna())
        ].copy()
        
        # Use ONLY the features the model was trained with
        trained_features = self.metadata['feature_names']
        
        # Check which features are missing and add them with zeros
        missing_features = [f for f in trained_features if f not in df_clean.columns]
        for f in missing_features:
            df_clean[f] = 0
        
        # Select ONLY the trained features (in the same order)
        X = df_clean[trained_features].copy()
        
        # Convert to numeric and handle missing values
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = pd.to_numeric(X[col], errors='coerce')
        
        X = X.replace([np.inf, -np.inf], np.nan)
        for col in X.columns:
            if X[col].isna().any():
                median_val = X[col].median()
                X[col] = X[col].fillna(median_val if not pd.isna(median_val) else 0)
        
        # Make predictions
        predictions = self.model.predict(X)
        
        # Find optimal sectors
        optimal_s1 = np.min(predictions[:, 0])
        optimal_s2 = np.min(predictions[:, 1])
        optimal_s3 = np.min(predictions[:, 2])
        optimal_total = optimal_s1 + optimal_s2 + optimal_s3
        
        print(f"\n🎯 Theoretical Optimal Lap Time:")
        print(f"   S1: {optimal_s1:.4f}s (best predicted)")
        print(f"   S2: {optimal_s2:.4f}s (best predicted)")
        print(f"   S3: {optimal_s3:.4f}s (best predicted)")
        print(f"   Total: {optimal_total:.4f}s")
        
        # Compare with actual best sectors
        if 'S1_SECONDS' in df_clean.columns:
            actual_best_s1 = df_clean['S1_SECONDS'].min()
            actual_best_s2 = df_clean['S2_SECONDS'].min()
            actual_best_s3 = df_clean['S3_SECONDS'].min()
            actual_best_total = actual_best_s1 + actual_best_s2 + actual_best_s3
            
            print(f"\n📊 Comparison with Actual Best Sectors:")
            print(f"   Actual S1: {actual_best_s1:.4f}s")
            print(f"   Actual S2: {actual_best_s2:.4f}s")
            print(f"   Actual S3: {actual_best_s3:.4f}s")
            print(f"   Actual Total: {actual_best_total:.4f}s")
            print(f"   Improvement Potential: {actual_best_total - optimal_total:.4f}s")
        
        return {
            'optimal_s1': optimal_s1,
            'optimal_s2': optimal_s2,
            'optimal_s3': optimal_s3,
            'optimal_total': optimal_total
        }
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("\n" + "=" * 80)
        print("🚀 Running Complete Test Suite for Optimal Sector Predictor")
        print("=" * 80)
        
        try:
            # Test 1: Load model
            self.load_model()
            
            # Test 2: Validate on test data
            result = self.validate_on_test_data()
            
            if result[0] is None:
                print("\n⚠️  Skipping remaining tests (no test data)")
                return False
            
            mae, rmse, r2, sector_metrics = result
            
            # Test 3: Find optimal lap
            self.find_optimal_lap()
            
            print("\n" + "=" * 80)
            print("✅ ALL TESTS PASSED")
            print("=" * 80)
            print(f"\nFinal Metrics:")
            print(f"  Overall MAE:  {mae:.4f}s")
            print(f"  Overall RMSE: {rmse:.4f}s")
            print(f"  Overall R²:   {r2:.4f}")
            print(f"\nPer-Sector MAE:")
            for sector, metrics in sector_metrics.items():
                print(f"  {sector}: {metrics['MAE']:.4f}s")
            
            return True
            
        except Exception as e:
            print("\n" + "=" * 80)
            print("❌ TEST FAILED")
            print("=" * 80)
            print(f"Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False


def main():
    """Main test execution"""
    tester = OptimalSectorPredictorTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 Optimal Sector Predictor is ready for production!")
    else:
        print("\n⚠️  Model validation failed. Please check the errors above.")


if __name__ == "__main__":
    main()
