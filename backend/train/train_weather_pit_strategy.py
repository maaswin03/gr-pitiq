"""
Weather Pit Strategy Predictor - Training Pipeline
Binary classification: Pit (1) vs No Pit (0) based on weather conditions
Uses same approach as position predictor
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np
import pickle
import json

from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    cohen_kappa_score, classification_report, confusion_matrix, roc_auc_score
)

import warnings
warnings.filterwarnings('ignore')

# Add paths
root_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(root_dir))

try:
    import xgboost as xgb
    XGBOOST_AVAILABLE = True
except ImportError:
    XGBOOST_AVAILABLE = False
    print("⚠️  XGBoost not available")

try:
    import lightgbm as lgb
    LIGHTGBM_AVAILABLE = True
except ImportError:
    LIGHTGBM_AVAILABLE = False
    print("⚠️  LightGBM not available")


class WeatherPitStrategyPredictor:
    """Binary classifier for pit stop decisions based on weather"""
    
    def __init__(self):
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_names = []
        self.cv_scores = {}
        
        self.output_dir = root_dir / "backend" / "model"
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def load_data(self, df):
        """Load and prepare data"""
        print("\n" + "=" * 80)
        print("📂 Loading Training Data")
        print("=" * 80)
        
        print(f"✅ Loaded {len(df)} samples")
        
        # Separate features and target
        exclude_cols = ['PIT_DECISION', 'TRACK', 'RACE_SESSION', 'DRIVER_NUMBER', 'LAP_NUMBER']
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        X = df[feature_cols].copy()
        y = df['PIT_DECISION'].copy()
        
        # Store feature names
        self.feature_names = X.columns.tolist()
        
        # Convert to numeric and handle missing values
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        X = X.replace([np.inf, -np.inf], np.nan)
        
        for col in X.columns:
            if X[col].isna().any():
                X[col] = X[col].fillna(X[col].median())
        
        # Check class balance
        class_counts = y.value_counts()
        print(f"\n📊 Dataset Statistics:")
        print(f"   Samples: {len(df)}")
        print(f"   Features: {len(self.feature_names)}")
        print(f"   Classes: {y.nunique()}")
        print(f"\n📈 Class Distribution:")
        print(f"   No Pit  (0): {(y==0).sum():5d} samples ({(y==0).sum()/len(y)*100:5.1f}%)")
        print(f"   Pit     (1): {(y==1).sum():5d} samples ({(y==1).sum()/len(y)*100:5.1f}%)")
        
        # Split data
        if (y==1).sum() >= 2:  # Need at least 2 samples per class for stratification
            X_train, X_temp, y_train, y_temp = train_test_split(
                X, y, test_size=0.3, random_state=42, stratify=y
            )
            X_val, X_test, y_val, y_test = train_test_split(
                X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
            )
        else:
            print("⚠️  Using regular split (minority class has <2 samples)")
            X_train, X_temp, y_train, y_temp = train_test_split(
                X, y, test_size=0.3, random_state=42
            )
            X_val, X_test, y_val, y_test = train_test_split(
                X_temp, y_temp, test_size=0.5, random_state=42
            )
        
        # Scale features
        X_train = pd.DataFrame(
            self.scaler.fit_transform(X_train),
            columns=self.feature_names,
            index=X_train.index
        )
        X_val = pd.DataFrame(
            self.scaler.transform(X_val),
            columns=self.feature_names,
            index=X_val.index
        )
        X_test = pd.DataFrame(
            self.scaler.transform(X_test),
            columns=self.feature_names,
            index=X_test.index
        )
        
        print(f"\n✅ Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def train_models(self, X_train, y_train):
        """Train ensemble of models"""
        print("\n" + "=" * 80)
        print("🤖 Training Classification Models")
        print("=" * 80)
        
        print("\n📦 Training base models...")
        
        # Random Forest
        self.models['rf'] = RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        self.models['rf'].fit(X_train, y_train)
        print("   ✅ Random Forest trained")
        
        # XGBoost
        if XGBOOST_AVAILABLE:
            self.models['xgb'] = xgb.XGBClassifier(
                n_estimators=200,
                max_depth=10,
                learning_rate=0.1,
                random_state=42,
                n_jobs=-1,
                eval_metric='logloss'
            )
            self.models['xgb'].fit(X_train, y_train)
            print("   ✅ XGBoost trained")
        
        # LightGBM
        if LIGHTGBM_AVAILABLE:
            self.models['lgb'] = lgb.LGBMClassifier(
                n_estimators=200,
                max_depth=10,
                learning_rate=0.1,
                random_state=42,
                n_jobs=-1,
                verbose=-1
            )
            self.models['lgb'].fit(X_train, y_train)
            print("   ✅ LightGBM trained")
        
        # Voting Ensemble
        print("\n🗳️  Creating voting ensemble...")
        estimators = [(name, model) for name, model in self.models.items()]
        self.models['voting_ensemble'] = VotingClassifier(
            estimators=estimators,
            voting='soft',
            n_jobs=-1
        )
        self.models['voting_ensemble'].fit(X_train, y_train)
        print("   ✅ Voting ensemble trained")
    
    def cross_validate(self, X_train, y_train):
        """Perform cross-validation"""
        print("\n" + "=" * 80)
        print("📊 Cross-Validation Evaluation")
        print("=" * 80)
        
        # Determine number of folds based on minority class size
        min_class_size = min(y_train.value_counts())
        n_splits = min(3, min_class_size)
        
        if n_splits < 2:
            print("⚠️  Dataset too small for cross-validation, skipping...")
            return
        
        print(f"⚠️  Using {n_splits}-fold CV")
        
        cv = KFold(n_splits=n_splits, shuffle=True, random_state=42)
        
        for name, model in self.models.items():
            try:
                scores = cross_val_score(
                    model, X_train, y_train,
                    cv=cv, scoring='f1', n_jobs=-1
                )
                self.cv_scores[name] = {
                    'mean': scores.mean(),
                    'std': scores.std(),
                    'scores': scores.tolist()
                }
                print(f"\n{name.upper().replace('_', ' ')}:")
                print(f"   F1 Score: {scores.mean():.4f} ± {scores.std():.4f}")
            except Exception as e:
                print(f"\n{name.upper().replace('_', ' ')}:")
                print(f"   ⚠️  CV failed: {str(e)}")
                self.cv_scores[name] = {'mean': 0.0, 'std': 0.0, 'scores': []}
    
    def evaluate(self, X_test, y_test):
        """Evaluate on test set"""
        print("\n" + "=" * 80)
        print("📈 Test Set Evaluation")
        print("=" * 80)
        
        # Get predictions
        y_pred = self.models['voting_ensemble'].predict(X_test)
        y_pred_proba = self.models['voting_ensemble'].predict_proba(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
        f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        kappa = cohen_kappa_score(y_test, y_pred)
        
        if len(np.unique(y_test)) == 2:
            auc = roc_auc_score(y_test, y_pred_proba[:, 1])
        else:
            auc = 0.0
        
        print(f"\n🎯 VOTING ENSEMBLE Performance:")
        print(f"   Accuracy:         {accuracy:.4f}")
        print(f"   Precision:        {precision:.4f}")
        print(f"   Recall:           {recall:.4f}")
        print(f"   F1-Score (Macro): {f1_macro:.4f}")
        print(f"   F1-Score (Weighted): {f1_weighted:.4f}")
        print(f"   Cohen's Kappa:    {kappa:.4f}")
        if auc > 0:
            print(f"   ROC-AUC:          {auc:.4f}")
        
        # Classification report
        print(f"\n📋 Classification Report:")
        class_names = ['No Pit', 'Pit']
        print(classification_report(y_test, y_pred, target_names=class_names, zero_division=0))
        
        # Confusion matrix
        print(f"\n🎯 Confusion Matrix:")
        cm = confusion_matrix(y_test, y_pred)
        print(f"              Predicted")
        print(f"              No Pit  Pit")
        print(f"   Actual")
        print(f"   No Pit   {cm[0][0]:7d}  {cm[0][1]:5d}")
        if len(cm) > 1:
            print(f"   Pit      {cm[1][0]:7d}  {cm[1][1]:5d}")
        
        return y_pred
    
    def save_model(self):
        """Save model and metadata"""
        print("\n" + "=" * 80)
        print("💾 Saving Model")
        print("=" * 80)
        
        # Save model
        model_file = self.output_dir / "weather_pit_strategy_predictor.pkl"
        with open(model_file, 'wb') as f:
            pickle.dump({
                'models': self.models,
                'scaler': self.scaler,
                'feature_names': self.feature_names,
            }, f)
        print(f"✅ Model saved: {model_file}")
        
        # Save metadata
        metadata_file = self.output_dir / "weather_pit_strategy_metadata.json"
        metadata = {
            'model_type': 'binary_classification',
            'target': 'PIT_DECISION',
            'classes': ['No Pit', 'Pit'],
            'num_features': len(self.feature_names),
            'feature_names': self.feature_names,
            'models': list(self.models.keys()),
            'cv_scores': self.cv_scores,
        }
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✅ Metadata saved: {metadata_file}")


def main():
    print("=" * 80)
    print("🏎️  WEATHER PIT STRATEGY PREDICTOR - TRAINING PIPELINE")
    print("=" * 80)
    
    # Load data
    data_file = root_dir / "outputs" / "weather_pit_strategy_predictor" / "engineered_dataset.csv"
    
    if not data_file.exists():
        print(f"\n❌ Error: Data file not found: {data_file}")
        print("   Please run preprocessing first:")
        print("   python backend/preprocess/prepare_weather_pit_strategy_data.py")
        return
    
    df = pd.read_csv(data_file)
    print(f"✅ Loaded {len(df)} samples from engineered_dataset.csv")
    
    # Train
    predictor = WeatherPitStrategyPredictor()
    X_train, X_val, X_test, y_train, y_val, y_test = predictor.load_data(df)
    predictor.train_models(X_train, y_train)
    predictor.cross_validate(X_train, y_train)
    y_pred = predictor.evaluate(X_test, y_test)
    predictor.save_model()
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()
