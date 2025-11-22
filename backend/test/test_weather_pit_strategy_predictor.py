"""
Weather Pit Strategy Predictor - Testing & Validation
Binary classification: Evaluates pit stop predictions based on weather
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
import pickle

from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    cohen_kappa_score, classification_report, confusion_matrix, roc_auc_score
)

import warnings
warnings.filterwarnings('ignore')

# Add paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))


class WeatherPitStrategyTester:
    """Test weather pit strategy predictor"""
    
    def __init__(self):
        self.model_dir = root_dir / "backend" / "model"
        self.output_dir = root_dir / "outputs" / "weather_pit_strategy_predictor"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.model = None
        self.scaler = None
        self.feature_names = []
    
    def load_model(self):
        """Load trained model"""
        print("\n" + "=" * 80)
        print("📂 Loading Trained Model")
        print("=" * 80)
        
        model_file = self.model_dir / "weather_pit_strategy_predictor.pkl"
        
        if not model_file.exists():
            raise FileNotFoundError(f"Model not found: {model_file}")
        
        with open(model_file, 'rb') as f:
            checkpoint = pickle.load(f)
            self.model = checkpoint['models']['voting_ensemble']
            self.scaler = checkpoint['scaler']
            self.feature_names = checkpoint['feature_names']
        
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
        
        # Separate features and target
        exclude_cols = ['PIT_DECISION', 'TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER']
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        X = df[feature_cols].copy()
        y = df['PIT_DECISION'].copy()
        
        # Convert to numeric
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        X = X.replace([np.inf, -np.inf], np.nan)
        
        for col in X.columns:
            if X[col].isna().any():
                X[col] = X[col].fillna(X[col].median())
        
        # Scale features
        X_scaled = pd.DataFrame(
            self.scaler.transform(X),
            columns=self.feature_names,
            index=X.index
        )
        
        print(f"\n📊 Dataset Statistics:")
        print(f"   Samples: {len(df)}")
        print(f"   Features: {len(self.feature_names)}")
        print(f"   No Pit  (0): {(y==0).sum():5d} samples ({(y==0).sum()/len(y)*100:5.1f}%)")
        print(f"   Pit     (1): {(y==1).sum():5d} samples ({(y==1).sum()/len(y)*100:5.1f}%)")
        
        return X_scaled, y, df
    
    def predict(self, X):
        """Make predictions"""
        print("\n" + "=" * 80)
        print("🔮 Making Predictions")
        print("=" * 80)
        
        y_pred = self.model.predict(X)
        y_pred_proba = self.model.predict_proba(X)
        
        print(f"✅ Predicted {len(y_pred)} samples")
        print(f"   No Pit: {(y_pred==0).sum()}")
        print(f"   Pit:    {(y_pred==1).sum()}")
        
        return y_pred, y_pred_proba
    
    def evaluate_overall(self, y_true, y_pred, y_pred_proba):
        """Overall performance evaluation"""
        print("\n" + "=" * 80)
        print("📈 Overall Performance")
        print("=" * 80)
        
        accuracy = accuracy_score(y_true, y_pred)
        f1_macro = f1_score(y_true, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        precision = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        kappa = cohen_kappa_score(y_true, y_pred)
        
        if len(np.unique(y_true)) == 2:
            auc = roc_auc_score(y_true, y_pred_proba[:, 1])
        else:
            auc = 0.0
        
        print(f"\n🎯 Test Set Metrics:")
        print(f"   Accuracy:         {accuracy:.4f}")
        print(f"   Precision:        {precision:.4f}")
        print(f"   Recall:           {recall:.4f}")
        print(f"   F1-Score (Macro): {f1_macro:.4f}")
        print(f"   F1-Score (Weighted): {f1_weighted:.4f}")
        print(f"   Cohen's Kappa:    {kappa:.4f}")
        if auc > 0:
            print(f"   ROC-AUC:          {auc:.4f}")
        
        # Classification report
        print(f"\n📋 Detailed Classification Report:")
        class_names = ['No Pit', 'Pit']
        print(classification_report(y_true, y_pred, target_names=class_names, zero_division=0))
        
        # Confusion matrix
        print(f"\n🎯 Confusion Matrix:")
        cm = confusion_matrix(y_true, y_pred)
        print(f"              Predicted")
        print(f"              No Pit  Pit")
        print(f"   Actual")
        print(f"   No Pit   {cm[0][0]:7d}  {cm[0][1]:5d}")
        if len(cm) > 1:
            print(f"   Pit      {cm[1][0]:7d}  {cm[1][1]:5d}")
        
        # Per-class metrics
        if len(np.unique(y_true)) == 2:
            print(f"\n📊 Per-Class Analysis:")
            precision_per_class = precision_score(y_true, y_pred, average=None, zero_division=0)
            recall_per_class = recall_score(y_true, y_pred, average=None, zero_division=0)
            f1_per_class = f1_score(y_true, y_pred, average=None, zero_division=0)
            
            print(f"\n   Class 0 (No Pit):")
            print(f"      Precision: {precision_per_class[0]:.4f}")
            print(f"      Recall:    {recall_per_class[0]:.4f}")
            print(f"      F1-Score:  {f1_per_class[0]:.4f}")
            
            if len(precision_per_class) > 1:
                print(f"\n   Class 1 (Pit):")
                print(f"      Precision: {precision_per_class[1]:.4f}")
                print(f"      Recall:    {recall_per_class[1]:.4f}")
                print(f"      F1-Score:  {f1_per_class[1]:.4f}")
        
        return {
            'accuracy': accuracy,
            'f1_macro': f1_macro,
            'f1_weighted': f1_weighted,
            'precision': precision,
            'recall': recall,
            'kappa': kappa,
            'auc': auc
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
            
            accuracy = accuracy_score(y_true_track, y_pred_track)
            f1 = f1_score(y_true_track, y_pred_track, average='weighted', zero_division=0)
            
            no_pit_count = (y_true_track == 0).sum()
            pit_count = (y_true_track == 1).sum()
            
            print(f"\n📍 {track}:")
            print(f"   Samples: {len(y_true_track):4d} (No Pit: {no_pit_count:4d}, Pit: {pit_count:4d})")
            print(f"   Accuracy: {accuracy:.4f}")
            print(f"   F1-Score: {f1:.4f}")
    
    def show_sample_predictions(self, df, y_true, y_pred, y_pred_proba, n_samples=10):
        """Show sample predictions"""
        print("\n" + "=" * 80)
        print("🔍 Sample Predictions")
        print("=" * 80)
        
        # Reconstruct TRACK
        track_cols = [col for col in df.columns if col.startswith('TRACK_')]
        if track_cols:
            df['TRACK'] = df[track_cols].idxmax(axis=1).str.replace('TRACK_', '')
        
        # Show pit predictions (if any)
        pit_mask = (y_pred == 1)
        if pit_mask.sum() > 0:
            print(f"\n🚩 PIT Predictions (showing up to {n_samples}):")
            pit_indices = np.where(pit_mask)[0][:n_samples]
            
            for i, idx in enumerate(pit_indices):
                actual_class = "PIT" if y_true.iloc[idx] == 1 else "NO_PIT"
                pred_class = "PIT"
                confidence = y_pred_proba[idx][1] * 100
                
                track = df.iloc[idx].get('TRACK', 'Unknown')
                lap_num = df.iloc[idx].get('LAP_NUMBER', 'N/A')
                tire_age = df.iloc[idx].get('TIRE_AGE', 'N/A')
                rain = df.iloc[idx].get('RAIN', 0)
                
                status = "✓" if actual_class == pred_class else "✗"
                
                print(f"   {i+1:2d}. Track: {track:12s} | Lap: {lap_num:3.0f} | Tire Age: {tire_age:3.0f}")
                print(f"       Actual: {actual_class:6s} → Predicted: {pred_class:6s} ({confidence:5.1f}% confidence) {status}")
                print(f"       Rain: {rain:.0f}")
        else:
            print(f"\n⚠️  No pit stops predicted")
        
        # Show some no-pit predictions
        no_pit_mask = (y_pred == 0)
        if no_pit_mask.sum() > 0:
            print(f"\n✅ NO PIT Predictions (random {min(n_samples, no_pit_mask.sum())}):")
            no_pit_indices = np.where(no_pit_mask)[0]
            np.random.seed(42)
            sample_indices = np.random.choice(no_pit_indices, min(n_samples, len(no_pit_indices)), replace=False)
            
            for i, idx in enumerate(sample_indices[:5]):
                actual_class = "PIT" if y_true.iloc[idx] == 1 else "NO_PIT"
                pred_class = "NO_PIT"
                confidence = y_pred_proba[idx][0] * 100
                
                track = df.iloc[idx].get('TRACK', 'Unknown')
                lap_num = df.iloc[idx].get('LAP_NUMBER', 'N/A')
                tire_age = df.iloc[idx].get('TIRE_AGE', 'N/A')
                
                status = "✓" if actual_class == pred_class else "✗"
                
                print(f"   {i+1:2d}. Track: {track:12s} | Lap: {lap_num:3.0f} | Tire Age: {tire_age:3.0f}")
                print(f"       Actual: {actual_class:6s} → Predicted: {pred_class:6s} ({confidence:5.1f}% confidence) {status}")
    
    def save_results(self, df, y_pred, y_pred_proba, metrics):
        """Save test results"""
        print("\n" + "=" * 80)
        print("💾 Saving Results")
        print("=" * 80)
        
        # Add predictions to dataframe
        results_df = df.copy()
        results_df['PREDICTED_PIT'] = y_pred
        results_df['PIT_PROBABILITY'] = y_pred_proba[:, 1]
        results_df['NO_PIT_PROBABILITY'] = y_pred_proba[:, 0]
        
        # Save predictions
        results_file = self.output_dir / "test_predictions.csv"
        results_df.to_csv(results_file, index=False)
        print(f"✅ Predictions saved: {results_file}")
        
        # Save metrics
        metrics_file = self.output_dir / "test_metrics.txt"
        with open(metrics_file, 'w') as f:
            f.write("WEATHER PIT STRATEGY PREDICTOR - TEST METRICS\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"Accuracy:         {metrics['accuracy']:.4f}\n")
            f.write(f"Precision:        {metrics['precision']:.4f}\n")
            f.write(f"Recall:           {metrics['recall']:.4f}\n")
            f.write(f"F1-Score (Macro): {metrics['f1_macro']:.4f}\n")
            f.write(f"F1-Score (Weighted): {metrics['f1_weighted']:.4f}\n")
            f.write(f"Cohen's Kappa:    {metrics['kappa']:.4f}\n")
            if metrics['auc'] > 0:
                f.write(f"ROC-AUC:          {metrics['auc']:.4f}\n")
        print(f"✅ Metrics saved: {metrics_file}")


def main():
    print("=" * 80)
    print("🏎️  WEATHER PIT STRATEGY PREDICTOR - TESTING PIPELINE")
    print("=" * 80)
    
    try:
        # Initialize tester
        tester = WeatherPitStrategyTester()
        
        # Load model and data
        tester.load_model()
        X, y_true, df = tester.load_data()
        
        # Make predictions
        y_pred, y_pred_proba = tester.predict(X)
        
        # Evaluate
        metrics = tester.evaluate_overall(y_true, y_pred, y_pred_proba)
        tester.evaluate_by_track(df, y_true, y_pred)
        tester.show_sample_predictions(df, y_true, y_pred, y_pred_proba)
        
        # Save results
        tester.save_results(df, y_pred, y_pred_proba, metrics)
        
        print("\n" + "=" * 80)
        print("✅ TESTING COMPLETE!")
        print("=" * 80)
        print(f"\n📊 Summary:")
        print(f"   Overall Accuracy: {metrics['accuracy']:.4f}")
        print(f"   F1-Score (Weighted): {metrics['f1_weighted']:.4f}")
        print(f"   Cohen's Kappa: {metrics['kappa']:.4f}")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
