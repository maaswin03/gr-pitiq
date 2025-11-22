"""
Standardized Test Runner for All 8 ML Models
Creates uniform test output with 5 samples per track (35 total)
Saves results to markdown files
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
import pickle
import json
from datetime import datetime
from sklearn.metrics import (
    mean_absolute_error, mean_squared_error, r2_score,
    accuracy_score, f1_score, precision_score, recall_score,
    cohen_kappa_score, classification_report, confusion_matrix
)

# Add paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))


class StandardizedModelTester:
    """Base class for standardized model testing"""
    
    def __init__(self, model_name, model_type='regression'):
        """
        Args:
            model_name: Name of the model (e.g., 'lap_time_predictor')
            model_type: 'regression' or 'classification'
        """
        self.model_name = model_name
        self.model_type = model_type
        self.model_dir = root_dir / "backend" / "model"
        self.metadata_dir = self.model_dir / "metadata"
        self.output_dir = root_dir / "outputs" / model_name
        self.test_dir = root_dir / "backend" / "test"
        self.ml_proof_dir = root_dir / "ml_proof"  # New output directory for markdown files
        
        self.model = None
        self.metadata = None
        self.feature_names = []
        self.results = []
        self.all_samples = []  # Store all sample results
        self.markdown_lines = []
        
        # Track names (6 tracks)
        self.tracks = ['COTA', 'VIR', 'Sebring', 'Sonoma', 'Road America', 'barber']
        
    def load_model(self):
        """Load trained model and metadata"""
        print("\n" + "=" * 80)
        print(f"📦 LOADING MODEL: {self.model_name.upper()}")
        print("=" * 80)
        
        model_path = self.model_dir / f"{self.model_name}.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")
        
        # Try loading with joblib first, then pickle
        try:
            self.model = joblib.load(model_path)
            print(f"✅ Model loaded (joblib): {model_path}")
        except:
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            print(f"✅ Model loaded (pickle): {model_path}")
        
        # Load metadata - try multiple naming patterns
        metadata_paths = [
            self.metadata_dir / f"{self.model_name}.json",
            self.metadata_dir / f"{self.model_name.replace('_predictor', '_metadata')}.json"
        ]
        
        metadata_loaded = False
        for metadata_path in metadata_paths:
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    self.metadata = json.load(f)
                self.feature_names = self.metadata.get('feature_names', [])
                print(f"✅ Metadata loaded from: {metadata_path.name}")
                print(f"   Features: {len(self.feature_names)}")
                print(f"   Type: {self.model_type}")
                metadata_loaded = True
                break
        
        if not metadata_loaded:
            print(f"⚠️  Warning: No metadata found, will attempt to infer features")
        
        # Add to markdown
        self.markdown_lines.append(f"# {self.model_name.replace('_', ' ').title()} - Test Results\n")
        self.markdown_lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        self.markdown_lines.append(f"**Model Type:** {self.model_type.title()}\n")
        self.markdown_lines.append(f"**Features:** {len(self.feature_names)}\n")
        self.markdown_lines.append("\n---\n")
        
    def load_test_data(self):
        """Load test dataset"""
        print("\n" + "=" * 80)
        print("📊 LOADING TEST DATA")
        print("=" * 80)
        
        data_path = self.output_dir / "engineered_dataset.csv"
        
        if not data_path.exists():
            raise FileNotFoundError(f"Test data not found: {data_path}")
        
        df = pd.read_csv(data_path)
        print(f"✅ Loaded {len(df)} total samples")
        
        # Add to markdown
        self.markdown_lines.append(f"## 1. Model Loading\n")
        self.markdown_lines.append(f"- **Model Path:** `{self.model_dir / self.model_name}.pkl`\n")
        self.markdown_lines.append(f"- **Total Training Samples:** {len(df)}\n")
        self.markdown_lines.append(f"- **Features Count:** {len(self.feature_names)}\n\n")
        
        return df
    
    def select_test_samples(self, df, target_col, track_col='TRACK', samples_per_track=5):
        """Select 5 random samples per track"""
        print("\n" + "=" * 80)
        print("🎯 SELECTING TEST SAMPLES (5 per track)")
        print("=" * 80)
        
        # Clean data
        df_clean = df[df[target_col].notna()].copy()
        
        # Select samples per track
        test_samples = []
        track_counts = {}
        
        for track in self.tracks:
            track_data = df_clean[df_clean[track_col] == track]
            
            if len(track_data) == 0:
                print(f"⚠️  {track}: No samples available")
                track_counts[track] = 0
                continue
            
            # Random sample
            n_samples = min(samples_per_track, len(track_data))
            samples = track_data.sample(n=n_samples, random_state=42)
            test_samples.append(samples)
            track_counts[track] = n_samples
            print(f"✅ {track:20s}: {n_samples} samples selected")
        
        if not test_samples:
            raise ValueError("No test samples found!")
        
        df_test = pd.concat(test_samples, ignore_index=True)
        print(f"\n📊 Total test samples: {len(df_test)}")
        
        # Add to markdown
        self.markdown_lines.append(f"## 2. Test Sample Selection\n")
        self.markdown_lines.append(f"**Strategy:** 5 random samples per track\n\n")
        self.markdown_lines.append("| Track | Samples |\n")
        self.markdown_lines.append("|-------|--------:|\n")
        for track in self.tracks:
            count = track_counts.get(track, 0)
            self.markdown_lines.append(f"| {track} | {count} |\n")
        self.markdown_lines.append(f"| **Total** | **{len(df_test)}** |\n\n")
        
        return df_test
    
    def prepare_features(self, df):
        """Prepare features for prediction"""
        # Get features that exist in both
        available_features = [f for f in self.feature_names if f in df.columns]
        missing_features = [f for f in self.feature_names if f not in df.columns]
        
        if missing_features:
            print(f"⚠️  Warning: {len(missing_features)} features missing, filling with 0")
            for feat in missing_features:
                df[feat] = 0
        
        X = df[self.feature_names].copy()
        
        # Convert to numeric
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle inf and nan
        X = X.replace([np.inf, -np.inf], np.nan)
        
        for col in X.columns:
            if X[col].isna().any():
                X[col] = X[col].fillna(X[col].median() if pd.notna(X[col].median()) else 0)
        
        return X
    
    def predict(self, X):
        """Make predictions"""
        if isinstance(self.model, dict):
            # Model artifacts format
            if 'models' in self.model:
                model = self.model['models'].get('voting_ensemble') or self.model['models'].get('best_model')
            else:
                model = self.model['model']
            
            # Apply scaler if exists and X is not empty
            if 'scaler' in self.model and X.shape[1] > 0:
                try:
                    X = self.model['scaler'].transform(X)
                except Exception as e:
                    print(f"⚠️  Warning: Scaler transform failed: {e}")
                    print(f"   X shape: {X.shape}, dtypes: {X.dtypes.unique()}")
        else:
            model = self.model
        
        predictions = model.predict(X)
        
        # Convert numeric predictions to string labels for classification
        if self.model_type == 'classification':
            # Check if model has reverse_mapping for label decoding
            if isinstance(self.model, dict) and 'reverse_mapping' in self.model:
                reverse_map = self.model['reverse_mapping']
                predictions = np.array([reverse_map.get(int(p), p) for p in predictions])
            
            try:
                proba = model.predict_proba(X)
                return predictions, proba
            except:
                return predictions, None
        
        return predictions, None
    
    def test_samples_by_track(self, df_test, X, predictions, actual, track_col='TRACK'):
        """Test and display results by track"""
        print("\n" + "=" * 80)
        print("🧪 TESTING SAMPLES BY TRACK")
        print("=" * 80)
        
        self.markdown_lines.append("## 3. Test Results by Track\n\n")
        
        for track in self.tracks:
            track_mask = df_test[track_col] == track
            track_samples = df_test[track_mask]
            
            if len(track_samples) == 0:
                continue
            
            track_pred = predictions[track_mask]
            track_actual = actual[track_mask]
            
            print(f"\n### {track}")
            print("-" * 80)
            
            self.markdown_lines.append(f"### {track}\n\n")
            
            if self.model_type == 'regression':
                self.markdown_lines.append("| Sample | Predicted | Actual | Error | Error % |\n")
                self.markdown_lines.append("|--------|----------:|-------:|------:|--------:|\n")
            else:
                self.markdown_lines.append("| Sample | Predicted | Actual | Correct |\n")
                self.markdown_lines.append("|--------|----------:|-------:|--------:|\n")
            
            # Show each sample
            for i, (pred, act) in enumerate(zip(track_pred, track_actual), 1):
                if self.model_type == 'regression':
                    error = abs(pred - act)
                    error_pct = (error / act * 100) if act != 0 else 0
                    print(f"  Sample {i}: Predicted={pred:8.3f}  Actual={act:8.3f}  Error={error:7.3f}  ({error_pct:5.2f}%)")
                    self.markdown_lines.append(f"| {i} | {pred:.3f} | {act:.3f} | {error:.3f} | {error_pct:.2f}% |\n")
                    self.all_samples.append({'track': track, 'sample': i, 'predicted': pred, 'actual': act, 'error': error, 'error_pct': error_pct})
                else:
                    correct = "✅" if pred == act else "❌"
                    correct_bool = pred == act
                    print(f"  Sample {i}: Predicted={pred}  Actual={act}  {correct}")
                    self.markdown_lines.append(f"| {i} | {pred} | {act} | {correct} |\n")
                    self.all_samples.append({'track': track, 'sample': i, 'predicted': pred, 'actual': act, 'correct': correct_bool})
            
            # Track metrics
            if self.model_type == 'regression':
                mae = mean_absolute_error(track_actual, track_pred)
                rmse = np.sqrt(mean_squared_error(track_actual, track_pred))
                r2 = r2_score(track_actual, track_pred)
                
                print(f"\n  Track Metrics:")
                print(f"    MAE:  {mae:8.3f}")
                print(f"    RMSE: {rmse:8.3f}")
                print(f"    R²:   {r2:8.3f}")
                
                self.markdown_lines.append(f"\n**Track Metrics:**\n")
                self.markdown_lines.append(f"- MAE: {mae:.3f}\n")
                self.markdown_lines.append(f"- RMSE: {rmse:.3f}\n")
                self.markdown_lines.append(f"- R²: {r2:.3f}\n\n")
                
                self.results.append({
                    'track': track,
                    'samples': len(track_samples),
                    'mae': mae,
                    'rmse': rmse,
                    'r2': r2
                })
            else:
                acc = accuracy_score(track_actual, track_pred)
                f1 = f1_score(track_actual, track_pred, average='weighted', zero_division=0)
                
                print(f"\n  Track Metrics:")
                print(f"    Accuracy: {acc:6.3f}")
                print(f"    F1-Score: {f1:6.3f}")
                
                self.markdown_lines.append(f"\n**Track Metrics:**\n")
                self.markdown_lines.append(f"- Accuracy: {acc:.3f}\n")
                self.markdown_lines.append(f"- F1-Score: {f1:.3f}\n\n")
                
                self.results.append({
                    'track': track,
                    'samples': len(track_samples),
                    'accuracy': acc,
                    'f1': f1
                })
    
    def show_all_test_samples(self):
        """Display all test samples in a single table"""
        print("\n" + "=" * 80)
        print("📋 ALL TEST SAMPLES")
        print("=" * 80)
        
        self.markdown_lines.append("## 4. All Test Samples\n\n")
        
        if self.model_type == 'regression':
            self.markdown_lines.append("| # | Track | Sample | Predicted | Actual | Error | Error % |\n")
            self.markdown_lines.append("|---|-------|--------|----------:|-------:|------:|--------:|\n")
            
            for idx, sample in enumerate(self.all_samples, 1):
                print(f"  {idx:2d}. {sample['track']:15s} Sample {sample['sample']}: Pred={sample['predicted']:8.3f}  Act={sample['actual']:8.3f}  Err={sample['error']:7.3f}  ({sample['error_pct']:5.2f}%)")
                self.markdown_lines.append(f"| {idx} | {sample['track']} | {sample['sample']} | {sample['predicted']:.3f} | {sample['actual']:.3f} | {sample['error']:.3f} | {sample['error_pct']:.2f}% |\n")
        else:
            self.markdown_lines.append("| # | Track | Sample | Predicted | Actual | Correct |\n")
            self.markdown_lines.append("|---|-------|--------|-----------|--------|:-------:|\n")
            
            for idx, sample in enumerate(self.all_samples, 1):
                correct = "✅" if sample['correct'] else "❌"
                print(f"  {idx:2d}. {sample['track']:15s} Sample {sample['sample']}: Pred={sample['predicted']}  Act={sample['actual']}  {correct}")
                self.markdown_lines.append(f"| {idx} | {sample['track']} | {sample['sample']} | {sample['predicted']} | {sample['actual']} | {correct} |\n")
        
        print(f"\n📊 Total test samples shown: {len(self.all_samples)}")
        self.markdown_lines.append(f"\n**Total Samples:** {len(self.all_samples)}\n\n")
    
    def evaluate_overall(self, predictions, actual):
        """Overall model evaluation"""
        print("\n" + "=" * 80)
        print("📈 OVERALL MODEL EVALUATION")
        print("=" * 80)
        
        self.markdown_lines.append("## 5. Overall Model Evaluation\n\n")
        
        if self.model_type == 'regression':
            mae = mean_absolute_error(actual, predictions)
            rmse = np.sqrt(mean_squared_error(actual, predictions))
            r2 = r2_score(actual, predictions)
            mape = np.mean(np.abs((actual - predictions) / actual)) * 100
            
            print(f"\n📊 Regression Metrics:")
            print(f"   MAE:        {mae:10.3f}")
            print(f"   RMSE:       {rmse:10.3f}")
            print(f"   R² Score:   {r2:10.3f}")
            print(f"   MAPE:       {mape:10.2f}%")
            
            self.markdown_lines.append("### Regression Metrics\n\n")
            self.markdown_lines.append(f"| Metric | Value |\n")
            self.markdown_lines.append(f"|--------|------:|\n")
            self.markdown_lines.append(f"| MAE | {mae:.3f} |\n")
            self.markdown_lines.append(f"| RMSE | {rmse:.3f} |\n")
            self.markdown_lines.append(f"| R² Score | {r2:.3f} |\n")
            self.markdown_lines.append(f"| MAPE | {mape:.2f}% |\n")
            self.markdown_lines.append(f"| Total Samples | {len(actual)} |\n\n")
            
        else:
            acc = accuracy_score(actual, predictions)
            f1_macro = f1_score(actual, predictions, average='macro', zero_division=0)
            f1_weighted = f1_score(actual, predictions, average='weighted', zero_division=0)
            precision = precision_score(actual, predictions, average='weighted', zero_division=0)
            recall = recall_score(actual, predictions, average='weighted', zero_division=0)
            kappa = cohen_kappa_score(actual, predictions)
            
            print(f"\n📊 Classification Metrics:")
            print(f"   Accuracy:         {acc:8.3f}")
            print(f"   F1-Score (Macro): {f1_macro:8.3f}")
            print(f"   F1-Score (Weighted): {f1_weighted:8.3f}")
            print(f"   Precision:        {precision:8.3f}")
            print(f"   Recall:           {recall:8.3f}")
            print(f"   Cohen's Kappa:    {kappa:8.3f}")
            
            self.markdown_lines.append("### Classification Metrics\n\n")
            self.markdown_lines.append(f"| Metric | Value |\n")
            self.markdown_lines.append(f"|--------|------:|\n")
            self.markdown_lines.append(f"| Accuracy | {acc:.3f} |\n")
            self.markdown_lines.append(f"| F1-Score (Macro) | {f1_macro:.3f} |\n")
            self.markdown_lines.append(f"| F1-Score (Weighted) | {f1_weighted:.3f} |\n")
            self.markdown_lines.append(f"| Precision | {precision:.3f} |\n")
            self.markdown_lines.append(f"| Recall | {recall:.3f} |\n")
            self.markdown_lines.append(f"| Cohen's Kappa | {kappa:.3f} |\n")
            self.markdown_lines.append(f"| Total Samples | {len(actual)} |\n\n")
    
    def save_markdown(self):
        """Save results to markdown file"""
        # Ensure ml_proof directory exists
        self.ml_proof_dir.mkdir(parents=True, exist_ok=True)
        
        output_file = self.ml_proof_dir / f"{self.model_name}_test_results.md"
        
        with open(output_file, 'w') as f:
            f.write(''.join(self.markdown_lines))
        
        print(f"\n✅ Results saved to: {output_file}")
        
    def run_full_test(self, target_col, track_col='TRACK'):
        """Run complete test pipeline"""
        try:
            # Load model
            self.load_model()
            
            # Load data
            df = self.load_test_data()
            
            # Select test samples
            df_test = self.select_test_samples(df, target_col, track_col)
            
            # Prepare features
            X = self.prepare_features(df_test)
            
            # Get actual values
            actual = df_test[target_col].values
            
            # Predict
            print("\n🔮 Making predictions...")
            predictions, proba = self.predict(X)
            
            # Test by track
            self.test_samples_by_track(df_test, X, predictions, actual, track_col)
            
            # Show all test samples
            self.show_all_test_samples()
            
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
    print("Standardized Model Tester")
    print("Use this as a base class for specific model tests")
