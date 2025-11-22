"""
Position Predictor - Testing Pipeline
Test position classification model with comprehensive metrics
"""

import os
import sys
from pathlib import Path

# Add backend to path
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir / "backend"))

import pandas as pd
import numpy as np
import pickle
import json

from sklearn.metrics import (
    accuracy_score, f1_score, classification_report,
    confusion_matrix, cohen_kappa_score
)
from sklearn.preprocessing import StandardScaler


class PositionTester:
    """Test position classification model"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.model_dir = self.root_dir / "backend" / "model"
        self.output_dir = self.root_dir / "outputs" / "position_predictor"
        self.model_artifacts = None
        
    def load_model(self):
        """Load trained model"""
        print("\n" + "=" * 80)
        print("📥 LOADING MODEL")
        print("=" * 80)
        
        model_path = self.model_dir / "position_predictor.pkl"
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}")
        
        with open(model_path, 'rb') as f:
            self.model_artifacts = pickle.load(f)
        
        print(f"\n✅ Model loaded from: {model_path}")
        print(f"🤖 Models available: {list(self.model_artifacts['models'].keys())}")
        print(f"📊 Features: {len(self.model_artifacts['feature_names'])}")
        print(f"🎯 Positions: {len(self.model_artifacts['reverse_mapping'])}")
    
    def load_data(self):
        """Load test data"""
        print("\n" + "=" * 80)
        print("📊 LOADING TEST DATA")
        print("=" * 80)
        
        data_path = self.output_dir / "engineered_dataset.csv"
        df = pd.read_csv(data_path)
        
        print(f"\n✅ Loaded {len(df)} samples")
        
        return df
    
    def prepare_features(self, df: pd.DataFrame) -> tuple:
        """Prepare features for prediction"""
        class_mapping = self.model_artifacts['class_mapping']
        reverse_mapping = self.model_artifacts['reverse_mapping']
        scaler = self.model_artifacts['scaler']
        feature_names = self.model_artifacts['feature_names']
        
        # Map position values to indices
        y_true = df['FINAL_POSITION'].map(class_mapping)
        
        # Get features
        X = df[feature_names].copy()
        
        # Convert to numeric
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        
        # Fill NaN with median
        for col in X.columns:
            if X[col].isna().any():
                X[col] = X[col].fillna(X[col].median())
        
        # Scale features
        X_scaled = scaler.transform(X)
        X = pd.DataFrame(X_scaled, columns=feature_names, index=X.index)
        
        return X, y_true
    
    def predict(self, X):
        """Make predictions using voting ensemble"""
        model = self.model_artifacts['models']['voting_ensemble']
        y_pred = model.predict(X)
        y_pred_proba = model.predict_proba(X)
        return y_pred, y_pred_proba
    
    def evaluate_overall(self, y_true, y_pred, y_pred_proba):
        """Evaluate overall performance"""
        print("\n" + "=" * 80)
        print("📈 OVERALL PERFORMANCE")
        print("=" * 80)
        
        # Calculate metrics
        accuracy = accuracy_score(y_true, y_pred)
        f1_macro = f1_score(y_true, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        kappa = cohen_kappa_score(y_true, y_pred)
        
        print(f"\n🎯 Accuracy:           {accuracy:.4f}")
        print(f"📊 F1-Score (Macro):   {f1_macro:.4f}")
        print(f"📊 F1-Score (Weighted): {f1_weighted:.4f}")
        print(f"🤝 Cohen's Kappa:      {kappa:.4f}")
        
        # Classification report
        reverse_mapping = self.model_artifacts['reverse_mapping']
        class_names = [str(int(reverse_mapping[i])) for i in sorted(reverse_mapping.keys())]
        
        print("\n" + "=" * 80)
        print("📊 CLASSIFICATION REPORT")
        print("=" * 80)
        print()
        print(classification_report(y_true, y_pred, target_names=class_names, zero_division=0))
        
        # Confusion matrix
        print("\n" + "=" * 80)
        print("📊 CONFUSION MATRIX")
        print("=" * 80)
        
        cm = confusion_matrix(y_true, y_pred)
        
        # Print header
        print("\n              Predicted")
        header = "              " + "".join(f"{name:6s}" for name in class_names[:min(10, len(class_names))])
        print(header)
        print("   Actual")
        
        # Print matrix (first 10 positions for readability)
        for i, class_name in enumerate(class_names[:min(10, len(class_names))]):
            row_values = "".join(f"{cm[i][j]:6d}" for j in range(min(10, len(class_names))))
            print(f"   {class_name:6s}   {row_values}")
        
        if len(class_names) > 10:
            print(f"\n   (Showing first 10 of {len(class_names)} positions)")
    
    def evaluate_by_track(self, df, X, y_true, y_pred, y_pred_proba):
        """Evaluate performance by track"""
        print("\n" + "=" * 80)
        print("🏁 PERFORMANCE BY TRACK")
        print("=" * 80)
        
        reverse_mapping = self.model_artifacts['reverse_mapping']
        
        # Reconstruct TRACK column from one-hot encoded columns
        track_cols = [col for col in df.columns if col.startswith('TRACK_')]
        if track_cols:
            # Create TRACK column from one-hot encoding
            df['TRACK'] = df[track_cols].idxmax(axis=1).str.replace('TRACK_', '')
        
        if 'TRACK' not in df.columns:
            print("⚠️  TRACK column not available, skipping track-wise evaluation")
            return
        
        for track in sorted(df['TRACK'].unique()):
            print("\n" + "-" * 80)
            print(f"🏁 Track: {track}")
            print("-" * 80)
            
            # Filter by track
            track_mask = df['TRACK'] == track
            track_indices = df[track_mask].index
            
            X_track = X.loc[track_indices]
            y_true_track = y_true.loc[track_indices]
            y_pred_track = y_pred[track_indices]
            y_pred_proba_track = y_pred_proba[track_indices]
            
            # Calculate metrics
            accuracy_track = accuracy_score(y_true_track, y_pred_track)
            f1_track = f1_score(y_true_track, y_pred_track, average='weighted', zero_division=0)
            kappa_track = cohen_kappa_score(y_true_track, y_pred_track)
            
            print(f"\n📊 Samples: {len(y_true_track)}")
            print(f"🎯 Accuracy:       {accuracy_track:.4f}")
            print(f"📊 F1-Weighted:    {f1_track:.4f}")
            print(f"🤝 Cohen's Kappa:  {kappa_track:.4f}")
            
            # Position distribution
            print(f"\n📊 Position Distribution:")
            position_dist = pd.Series(y_true_track).map(reverse_mapping).value_counts().sort_index()
            for pos, count in position_dist.items():
                pct = (count / len(y_true_track)) * 100
                print(f"   P{int(pos):2d}: {count:3d} ({pct:.1f}%)")
            
            # Sample predictions
            print(f"\n🔍 Sample Predictions (Random 5):")
            
            sample_size = min(5, len(y_true_track))
            sample_indices = np.random.choice(len(y_true_track), sample_size, replace=False)
            
            # Get number of classes and create dynamic header
            num_classes = len(reverse_mapping)
            class_names_sorted = [str(int(reverse_mapping[i])) for i in sorted(reverse_mapping.keys())]
            
            # Create header with position columns (show first 10 positions max for readability)
            positions_to_show = class_names_sorted[:min(10, num_classes)]
            header_parts = ['', 'Actual', 'Predicted', 'Confidence'] + positions_to_show + ['Correct']
            
            print(f"\n   {'':3s} {'Actual':8s} {'Predicted':10s} {'Confidence':11s} ", end='')
            print(' '.join(f"{p:6s}" for p in positions_to_show), end='')
            print(f"  {'Correct':7s}")
            print("   " + "-" * (30 + 7 * len(positions_to_show)))
            
            # Convert track indices to list positions (track data is already filtered)
            for i, idx in enumerate(sample_indices):
                # Use positional indexing since arrays are already filtered
                actual_idx = y_true_track.iloc[idx]
                pred_idx = y_pred_track[idx]  # y_pred_track is numpy array
                
                actual_pos = int(reverse_mapping[actual_idx])
                pred_pos = int(reverse_mapping[pred_idx])
                
                confidence = y_pred_proba_track[idx][pred_idx]
                
                # Get probabilities for first 10 positions
                probas = []
                for j in range(min(10, num_classes)):
                    probas.append(y_pred_proba_track[idx][j])
                
                correct = "✓" if actual_pos == pred_pos else "✗"
                
                print(f"   {i+1:2d}. P{actual_pos:2d}      P{pred_pos:2d}         {confidence*100:5.1f}%      ", end='')
                print(' '.join(f"{p*100:5.1f}%" for p in probas), end='')
                print(f"  {correct}")
    
    def print_summary(self, y_true, y_pred):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📋 TEST SUMMARY")
        print("=" * 80)
        
        reverse_mapping = self.model_artifacts['reverse_mapping']
        
        accuracy = accuracy_score(y_true, y_pred)
        
        print(f"\n🎯 Overall Accuracy: {accuracy:.4f}")
        print(f"📊 Total Samples:    {len(y_true)}")
        print(f"🏁 Positions:        {len(reverse_mapping)}")
        
        # Position-wise accuracy
        print(f"\n📊 Accuracy by Position (Top 10):")
        
        position_accuracy = []
        for pos_idx in sorted(reverse_mapping.keys())[:10]:
            mask = y_true == pos_idx
            if mask.sum() > 0:
                acc = accuracy_score(y_true[mask], y_pred[mask])
                position_accuracy.append({
                    'position': int(reverse_mapping[pos_idx]),
                    'accuracy': acc,
                    'count': mask.sum()
                })
        
        for item in position_accuracy:
            bar_length = int(item['accuracy'] * 20)
            bar = "█" * bar_length + "░" * (20 - bar_length)
            print(f"   P{item['position']:2d}: {bar} {item['accuracy']:.3f} (n={item['count']})")
        
        print("\n✅ TESTING COMPLETE!")


def main():
    """Main testing pipeline"""
    tester = PositionTester()
    
    # Load model
    tester.load_model()
    
    # Load data
    df = tester.load_data()
    
    # Prepare features
    X, y_true = tester.prepare_features(df)
    
    # Make predictions
    print("\n🔮 Making predictions...")
    y_pred, y_pred_proba = tester.predict(X)
    
    # Evaluate overall
    tester.evaluate_overall(y_true, y_pred, y_pred_proba)
    
    # Evaluate by track
    tester.evaluate_by_track(df, X, y_true, y_pred, y_pred_proba)
    
    # Print summary
    tester.print_summary(y_true, y_pred)


if __name__ == "__main__":
    main()
