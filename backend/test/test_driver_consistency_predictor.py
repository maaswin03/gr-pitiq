"""
Driver Consistency Predictor - Testing Suite
Tests classification model with 5 samples per track
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pandas as pd
import numpy as np
import pickle
from sklearn.metrics import (
    accuracy_score, f1_score, cohen_kappa_score,
    confusion_matrix, classification_report
)


class DriverConsistencyTester:
    """Test driver consistency classification model"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.model_dir = self.root_dir / "backend" / "model"
        self.data_dir = self.root_dir / "outputs" / "driver_consistency_predictor"
        
        self.model_artifacts = None
        self.test_results = {}
        
    def load_model(self):
        """Load trained model and artifacts"""
        print("\n" + "=" * 80)
        print("📂 Loading Trained Model")
        print("=" * 80)
        
        model_path = self.model_dir / "driver_consistency_predictor.pkl"
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}\n"
                f"Please run: python backend/train/train_driver_consistency.py"
            )
        
        with open(model_path, 'rb') as f:
            self.model_artifacts = pickle.load(f)
        
        print(f"✅ Model loaded from: {model_path}")
        print(f"   Size: {model_path.stat().st_size / 1024 / 1024:.2f} MB")
        print(f"   Base Models: {list(self.model_artifacts['models'].keys())}")
        print(f"   Features: {len(self.model_artifacts['feature_names'])}")
        print(f"   Classes: {list(self.model_artifacts['class_mapping'].keys())}")
        
    def load_test_data(self) -> pd.DataFrame:
        """Load engineered dataset for testing"""
        print("\n" + "=" * 80)
        print("📂 Loading Test Dataset")
        print("=" * 80)
        
        data_path = self.data_dir / "engineered_dataset.csv"
        if not data_path.exists():
            raise FileNotFoundError(
                f"Test data not found at {data_path}\n"
                f"Please run: python backend/preprocess/prepare_driver_consistency_data.py"
            )
        
        df = pd.read_csv(data_path)
        print(f"✅ Loaded {len(df)} laps from {data_path}")
        print(f"   Tracks: {sorted(df['TRACK'].unique().tolist())}")
        print(f"   Features: {len(df.columns)}")
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> tuple:
        """Prepare features for prediction"""
        feature_names = self.model_artifacts['feature_names']
        exclude_cols = self.model_artifacts['exclude_cols']
        scaler = self.model_artifacts['scaler']
        class_mapping = self.model_artifacts['class_mapping']
        
        # Get target
        y_true = df['CONSISTENCY_CLASS'].map(class_mapping)
        
        # Get features
        X = df[feature_names].copy()
        
        # Convert all columns to numeric, coercing errors to NaN
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        
        # Fill NaN values with median
        for col in X.columns:
            if X[col].isna().any():
                X[col].fillna(X[col].median(), inplace=True)
        
        # Scale features
        X_scaled = scaler.transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=feature_names, index=X.index)
        
        return X_scaled, y_true
    
    def predict(self, X: pd.DataFrame) -> tuple:
        """Make predictions"""
        model = self.model_artifacts['models']['voting_ensemble']
        
        y_pred = model.predict(X)
        y_pred_proba = model.predict_proba(X)
        
        return y_pred, y_pred_proba
    
    def evaluate_overall(self, y_true, y_pred, y_pred_proba):
        """Evaluate overall performance"""
        print("\n" + "=" * 80)
        print("📊 OVERALL PERFORMANCE")
        print("=" * 80)
        
        accuracy = accuracy_score(y_true, y_pred)
        f1_macro = f1_score(y_true, y_pred, average='macro')
        f1_weighted = f1_score(y_true, y_pred, average='weighted')
        kappa = cohen_kappa_score(y_true, y_pred)
        
        print(f"\n🎯 Classification Metrics:")
        print(f"   Accuracy:            {accuracy:.4f}")
        print(f"   F1-Score (Macro):    {f1_macro:.4f}")
        print(f"   F1-Score (Weighted): {f1_weighted:.4f}")
        print(f"   Cohen's Kappa:       {kappa:.4f}")
        
        # Get class names
        reverse_mapping = self.model_artifacts['reverse_mapping']
        class_names = [reverse_mapping[i] for i in sorted(reverse_mapping.keys())]
        
        # Classification report
        print(f"\n📋 Classification Report:")
        print(classification_report(y_true, y_pred, target_names=class_names))
        
        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        print(f"\n🔢 Confusion Matrix:")
        print(f"              Predicted")
        
        # Dynamic header based on number of classes
        header = "              " + "".join(f"{name:8s}" for name in class_names)
        print(header)
        
        # Dynamic rows based on number of classes
        for i, class_name in enumerate(class_names):
            row_values = "".join(f"{cm[i][j]:8d}" for j in range(len(class_names)))
            print(f"   {class_name:8s}   {row_values}")
        
        self.test_results['overall'] = {
            'accuracy': accuracy,
            'f1_macro': f1_macro,
            'f1_weighted': f1_weighted,
            'kappa': kappa,
            'confusion_matrix': cm.tolist()
        }
    
    def evaluate_by_track(self, df: pd.DataFrame, X: pd.DataFrame, y_true, y_pred, y_pred_proba):
        """Evaluate performance by track with sample predictions"""
        print("\n" + "=" * 80)
        print("🏁 TRACK-WISE PERFORMANCE WITH SAMPLE PREDICTIONS")
        print("=" * 80)
        
        reverse_mapping = self.model_artifacts['reverse_mapping']
        tracks = sorted(df['TRACK'].unique())
        
        # Get number of classes in the model
        num_classes = len(reverse_mapping)
        
        for track in tracks:
            print(f"\n{'=' * 80}")
            print(f"🏎️  TRACK: {track}")
            print('=' * 80)
            
            # Get track data
            track_mask = df['TRACK'] == track
            track_indices = df[track_mask].index
            
            y_true_track = y_true[track_mask]
            y_pred_track = y_pred[track_mask]
            y_pred_proba_track = y_pred_proba[track_mask]
            
            # Calculate metrics
            accuracy = accuracy_score(y_true_track, y_pred_track)
            f1_weighted = f1_score(y_true_track, y_pred_track, average='weighted')
            kappa = cohen_kappa_score(y_true_track, y_pred_track)
            
            print(f"\n📊 {track} Metrics:")
            print(f"   Samples:             {len(y_true_track)}")
            print(f"   Accuracy:            {accuracy:.4f} ({accuracy*100:.1f}%)")
            print(f"   F1-Score (Weighted): {f1_weighted:.4f}")
            print(f"   Cohen's Kappa:       {kappa:.4f}")
            
            # Class distribution
            print(f"\n📈 Class Distribution:")
            for class_idx, class_name in sorted(reverse_mapping.items()):
                count = (y_true_track == class_idx).sum()
                pct = count / len(y_true_track) * 100 if len(y_true_track) > 0 else 0
                print(f"   {class_name:8s}: {count:4d} samples ({pct:5.1f}%)")
            
            # Sample predictions (5 random samples)
            print(f"\n🔍 Sample Predictions (5 random samples):")
            
            # Build header dynamically based on number of classes
            class_names_sorted = [reverse_mapping[i] for i in sorted(reverse_mapping.keys())]
            header_parts = ['', 'Actual', 'Predicted', 'Confidence'] + class_names_sorted + ['Correct']
            widths = [4, 10, 12, 12] + [10]*num_classes + [8]
            
            header = ""
            for part, width in zip(header_parts, widths):
                header += f"{part:^{width}s}"
            print(header)
            print("-" * 80)
            
            # Get 5 random samples
            num_samples = min(5, len(track_indices))
            if num_samples > 0:
                sample_indices = np.random.choice(track_indices, num_samples, replace=False)
                
                for i, idx in enumerate(sample_indices, 1):
                    # Get position in track arrays
                    track_pos = np.where(track_indices == idx)[0][0]
                    
                    actual_class = reverse_mapping[y_true_track.iloc[track_pos]]
                    pred_class = reverse_mapping[y_pred_track[track_pos]]
                    confidence = y_pred_proba_track[track_pos].max()
                    
                    # Get probabilities for each class
                    probas = [y_pred_proba_track[track_pos][j] for j in range(num_classes)]
                    
                    correct = "✓" if actual_class == pred_class else "✗"
                    
                    # Build row
                    row = f"{i:4d} {actual_class:^10s} {pred_class:^12s} {confidence:^11.1%}"
                    for prob in probas:
                        row += f" {prob:^9.1%}"
                    row += f" {correct:^8s}"
                    print(row)
            
            # Store results
            self.test_results[track] = {
                'samples': len(y_true_track),
                'accuracy': accuracy,
                'f1_weighted': f1_weighted,
                'kappa': kappa
            }
    
    def run_testing(self):
        """Run complete testing pipeline"""
        print("\n" + "=" * 80)
        print("🏎️  DRIVER CONSISTENCY PREDICTOR - TESTING SUITE")
        print("=" * 80)
        
        # Load model
        self.load_model()
        
        # Load test data
        df = self.load_test_data()
        
        # Prepare features
        print("\n" + "=" * 80)
        print("⚙️  Preparing Features")
        print("=" * 80)
        X, y_true = self.prepare_features(df)
        print(f"✅ Prepared {len(X)} samples with {len(X.columns)} features")
        
        # Make predictions
        print("\n" + "=" * 80)
        print("🔮 Making Predictions")
        print("=" * 80)
        y_pred, y_pred_proba = self.predict(X)
        print(f"✅ Generated predictions for {len(y_pred)} samples")
        
        # Evaluate overall
        self.evaluate_overall(y_true, y_pred, y_pred_proba)
        
        # Evaluate by track
        self.evaluate_by_track(df, X, y_true, y_pred, y_pred_proba)
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 TESTING SUMMARY")
        print("=" * 80)
        
        print(f"\n✅ Overall Performance:")
        print(f"   Accuracy:       {self.test_results['overall']['accuracy']:.4f}")
        print(f"   F1-Score (Weighted): {self.test_results['overall']['f1_weighted']:.4f}")
        print(f"   Cohen's Kappa:  {self.test_results['overall']['kappa']:.4f}")
        
        print(f"\n✅ Track-wise Performance:")
        for track, metrics in self.test_results.items():
            if track == 'overall':
                continue
            print(f"   {track:15s}: Accuracy={metrics['accuracy']:.4f}, "
                  f"F1={metrics['f1_weighted']:.4f}, Samples={metrics['samples']}")
        
        print("\n" + "=" * 80)
        print("✅ TESTING COMPLETE")
        print("=" * 80 + "\n")


def main():
    """Run testing suite"""
    tester = DriverConsistencyTester()
    tester.run_testing()


if __name__ == "__main__":
    main()
