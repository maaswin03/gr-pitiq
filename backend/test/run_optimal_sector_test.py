"""
Standardized Test for Optimal Sector Predictor
Tests model with 5 samples per track and generates markdown report
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from standardized_test_runner import StandardizedModelTester
import pandas as pd
import numpy as np


class OptimalSectorTest(StandardizedModelTester):
    def __init__(self):
        super().__init__(
            model_name='optimal_sector_predictor',
            model_type='regression'
        )
    
    def run_full_test(self, target_col=None, track_col='TRACK'):
        """Override to handle multi-output prediction (S1, S2, S3)"""
        try:
            # Load model
            self.load_model()
            
            # Load data
            df = self.load_test_data()
            
            # For optimal sector, we test all 3 sectors
            # Use S1_SECONDS as representative for sample selection
            df_test = self.select_test_samples(df, 'S1_SECONDS', track_col)
            
            # Prepare features
            X = self.prepare_features(df_test)
            
            # Get actual values for all sectors
            actual_s1 = df_test['S1_SECONDS'].values
            actual_s2 = df_test['S2_SECONDS'].values
            actual_s3 = df_test['S3_SECONDS'].values
            
            # Predict (multi-output)
            print("\n🔮 Making predictions for S1, S2, S3...")
            predictions = self.predict(X)[0]
            
            # If multi-output, split predictions
            if predictions.ndim == 2 and predictions.shape[1] == 3:
                pred_s1 = predictions[:, 0]
                pred_s2 = predictions[:, 1]
                pred_s3 = predictions[:, 2]
            else:
                # Single output fallback
                pred_s1 = predictions
                pred_s2 = predictions
                pred_s3 = predictions
            
            # Test each sector
            print("\n" + "=" * 80)
            print("🧪 SECTOR 1 RESULTS")
            print("=" * 80)
            self.markdown_lines.append("## 3. Sector 1 Results\n\n")
            self.test_samples_by_track(df_test, X, pred_s1, actual_s1, track_col)
            
            print("\n" + "=" * 80)
            print("🧪 SECTOR 2 RESULTS")
            print("=" * 80)
            self.markdown_lines.append("\n## 4. Sector 2 Results\n\n")
            self.test_samples_by_track(df_test, X, pred_s2, actual_s2, track_col)
            
            print("\n" + "=" * 80)
            print("🧪 SECTOR 3 RESULTS")
            print("=" * 80)
            self.markdown_lines.append("\n## 5. Sector 3 Results\n\n")
            self.test_samples_by_track(df_test, X, pred_s3, actual_s3, track_col)
            
            # Show all test samples (from all 3 sectors)
            self.markdown_lines.append("\n## 6. All Test Samples (All Sectors)\n\n")
            self.show_all_test_samples()
            
            # Overall evaluation for all sectors
            self.markdown_lines.append("\n## 7. Overall Evaluation (All Sectors)\n\n")
            
            # Combine all predictions and actuals
            all_predictions = np.concatenate([pred_s1, pred_s2, pred_s3])
            all_actuals = np.concatenate([actual_s1, actual_s2, actual_s3])
            
            self.evaluate_overall(all_predictions, all_actuals)
            
            # Save markdown
            self.save_markdown()
            
            print("\n" + "=" * 80)
            print("✨ TEST COMPLETE!")
            print("=" * 80)
            
        except Exception as e:
            print(f"\n❌ Error during testing: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    tester = OptimalSectorTest()
    tester.run_full_test(track_col='TRACK')
