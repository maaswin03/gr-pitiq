"""
Standardized Test for Position Predictor
Tests model with 5 samples per track and generates markdown report
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from standardized_test_runner import StandardizedModelTester


class PositionTest(StandardizedModelTester):
    def __init__(self):
        super().__init__(
            model_name='position_predictor',
            model_type='classification'
        )


    def run_full_test(self, target_col=None, track_col=None):
        """Override to handle dataset without track information"""
        try:
            # Load model
            self.load_model()
            
            # Load data
            df = self.load_test_data()
            
            # Select 30 random samples (no track grouping)
            print("\n" + "=" * 80)
            print("🎯 SELECTING TEST SAMPLES (30 random samples)")
            print("=" * 80)
            
            df_clean = df[df[target_col].notna()].copy()
            df_test = df_clean.sample(n=min(30, len(df_clean)), random_state=42)
            print(f"✅ Selected {len(df_test)} random samples")
            
            self.markdown_lines.append(f"## 2. Test Sample Selection\n")
            self.markdown_lines.append(f"**Strategy:** 30 random samples (no track grouping available)\n")
            self.markdown_lines.append(f"**Total Samples:** {len(df_test)}\n\n")
            
            # Prepare features
            X = self.prepare_features(df_test)
            
            # Get actual values
            actual = df_test[target_col].values
            
            # Predict
            print("\n🔮 Making predictions...")
            predictions, proba = self.predict(X)
            
            # Show all samples
            self.markdown_lines.append("## 3. All Test Samples\n\n")
            
            if self.model_type == 'regression':
                self.markdown_lines.append("| # | Predicted | Actual | Error | Error % |\n")
                self.markdown_lines.append("|---|----------:|-------:|------:|--------:|\n")
                
                for idx, (pred, act) in enumerate(zip(predictions, actual), 1):
                    error = abs(pred - act)
                    error_pct = (error / act * 100) if act != 0 else 0
                    self.markdown_lines.append(f"| {idx} | {pred:.3f} | {act:.3f} | {error:.3f} | {error_pct:.2f}% |\n")
                    self.all_samples.append({'sample': idx, 'predicted': pred, 'actual': act, 'error': error, 'error_pct': error_pct})
            else:
                self.markdown_lines.append("| # | Predicted | Actual | Correct |\n")
                self.markdown_lines.append("|---|----------:|-------:|:-------:|\n")
                
                for idx, (pred, act) in enumerate(zip(predictions, actual), 1):
                    correct = "✅" if pred == act else "❌"
                    correct_bool = pred == act
                    self.markdown_lines.append(f"| {idx} | {pred:.0f} | {act:.0f} | {correct} |\n")
                    self.all_samples.append({'sample': idx, 'predicted': pred, 'actual': act, 'correct': correct_bool})
            
            self.markdown_lines.append(f"\n**Total Samples:** {len(predictions)}\n\n")
            
            # Overall evaluation
            self.evaluate_overall(predictions, actual)
            
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
    tester = PositionTest()
    tester.run_full_test(target_col='FINAL_POSITION')
