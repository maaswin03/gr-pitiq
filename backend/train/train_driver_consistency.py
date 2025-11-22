"""
Driver Consistency Predictor - Training Pipeline
Multi-class classification model (High/Medium/Low consistency)
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pandas as pd
import numpy as np
import json
import pickle
import warnings
from datetime import datetime
from typing import Dict, List, Tuple

# ML libraries
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, f1_score, cohen_kappa_score,
    confusion_matrix, classification_report, roc_auc_score
)
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
import optuna

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns

warnings.filterwarnings('ignore')


class DriverConsistencyClassifier:
    """Multi-class classification model for driver consistency"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.data_dir = self.root_dir / "outputs" / "driver_consistency_predictor"
        self.model_dir = self.root_dir / "backend" / "model"
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        self.target = 'CONSISTENCY_CLASS'
        self.class_mapping = {'High': 0, 'Medium': 1, 'Low': 2}
        self.reverse_mapping = {0: 'High', 1: 'Medium', 2: 'Low'}
        
        # Columns to exclude from features
        self.exclude_cols = [
            # Target and derived metrics
            'CONSISTENCY_CLASS', 'CONSISTENCY_INDEX',
            'DRIVER_MEAN_LAP_TIME', 'DRIVER_STD_LAP_TIME', 'DRIVER_CV', 'DRIVER_LAP_COUNT',
            
            # Identifiers
            'CAR_NUMBER', 'DRIVER_NUMBER', 'TRACK', 'RACE',
            
            # Target-related
            'LAP_TIME_SECONDS', 'LAP_TIME_MINUTES',
            
            # All-NaN columns
            'PIT_TIME', 'INT-2_elapsed',
            
            # Time columns
            'TIME_OF_DAY',
            
            # Position columns (can leak future info)
            'POSITION', 'POSITION_IN_CLASS',
            
            # Crossing finish line indicator
            'CROSSING_FINISH_LINE_IN_PIT'
        ]
        
        self.models = {}
        self.scaler = None
        self.feature_names = None
        self.cv_scores = {}
        
    def load_data(self) -> Tuple[pd.DataFrame, pd.Series]:
        """Load engineered dataset"""
        print("\n" + "=" * 80)
        print("📂 Loading Engineered Dataset")
        print("=" * 80)
        
        data_path = self.data_dir / "engineered_dataset.csv"
        if not data_path.exists():
            raise FileNotFoundError(
                f"Engineered dataset not found at {data_path}\n"
                f"Please run: python backend/preprocess/prepare_driver_consistency_data.py"
            )
        
        df = pd.read_csv(data_path)
        print(f"✅ Loaded {len(df)} laps from {data_path}")
        print(f"   Total features: {len(df.columns)}")
        print(f"   Target column: {self.target}")
        
        # Encode target
        y = df[self.target].map(self.class_mapping)
        
        # Get unique classes present in the data
        unique_classes = sorted(y.unique())
        print(f"\n🔍 Unique classes in data: {unique_classes}")
        
        # Remap to consecutive integers for sklearn/xgboost compatibility
        if unique_classes != list(range(len(unique_classes))):
            print(f"   ⚠️  Remapping classes to consecutive integers...")
            class_remap = {old_idx: new_idx for new_idx, old_idx in enumerate(unique_classes)}
            y_remapped = y.map(class_remap)
            
            # Update reverse mapping for the remapped classes
            self.reverse_mapping_remapped = {new_idx: self.reverse_mapping[old_idx] 
                                             for old_idx, new_idx in class_remap.items()}
            print(f"   ✅ Remapping: {class_remap}")
            print(f"   ✅ New mapping: {self.reverse_mapping_remapped}")
            y = y_remapped
        else:
            self.reverse_mapping_remapped = self.reverse_mapping
        
        # Get feature columns
        feature_cols = [col for col in df.columns if col not in self.exclude_cols]
        X = df[feature_cols].copy()
        
        # Convert all columns to numeric, coercing errors to NaN
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        
        # Fill NaN values with median
        for col in X.columns:
            if X[col].isna().any():
                X[col].fillna(X[col].median(), inplace=True)
        
        self.feature_names = X.columns.tolist()
        
        print(f"\n📊 Dataset Statistics:")
        print(f"   Samples: {len(X)}")
        print(f"   Features: {len(self.feature_names)}")
        print(f"   Classes: {sorted(y.unique())}")
        
        print(f"\n📈 Class Distribution:")
        class_counts = y.value_counts().sort_index()
        for class_idx, count in class_counts.items():
            class_name = self.reverse_mapping_remapped[class_idx]
            pct = count / len(y) * 100
            print(f"   {class_name} ({class_idx}): {count} samples ({pct:.1f}%)")
        
        return X, y
    
    def optimize_hyperparameters(self, X: pd.DataFrame, y: pd.Series) -> Dict:
        """Optimize hyperparameters using Optuna"""
        print("\n" + "=" * 80)
        print("🔧 Hyperparameter Optimization with Optuna")
        print("=" * 80)
        
        def objective(trial):
            # Random Forest params
            rf_params = {
                'n_estimators': trial.suggest_int('rf_n_estimators', 100, 300),
                'max_depth': trial.suggest_int('rf_max_depth', 10, 30),
                'min_samples_split': trial.suggest_int('rf_min_samples_split', 2, 10),
                'min_samples_leaf': trial.suggest_int('rf_min_samples_leaf', 1, 5),
                'random_state': 42
            }
            
            # XGBoost params
            xgb_params = {
                'n_estimators': trial.suggest_int('xgb_n_estimators', 100, 300),
                'max_depth': trial.suggest_int('xgb_max_depth', 5, 15),
                'learning_rate': trial.suggest_float('xgb_learning_rate', 0.01, 0.3),
                'subsample': trial.suggest_float('xgb_subsample', 0.6, 1.0),
                'random_state': 42
            }
            
            # LightGBM params
            lgbm_params = {
                'n_estimators': trial.suggest_int('lgbm_n_estimators', 100, 300),
                'max_depth': trial.suggest_int('lgbm_max_depth', 5, 15),
                'learning_rate': trial.suggest_float('lgbm_learning_rate', 0.01, 0.3),
                'num_leaves': trial.suggest_int('lgbm_num_leaves', 20, 100),
                'random_state': 42,
                'verbose': -1
            }
            
            # Create ensemble
            rf = RandomForestClassifier(**rf_params)
            xgb = XGBClassifier(**xgb_params, eval_metric='mlogloss', verbosity=0)
            lgbm = LGBMClassifier(**lgbm_params)
            
            voting_clf = VotingClassifier(
                estimators=[('rf', rf), ('xgb', xgb), ('lgbm', lgbm)],
                voting='soft'
            )
            
            # Cross-validation
            cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
            scores = cross_val_score(voting_clf, X, y, cv=cv, scoring='f1_weighted', n_jobs=-1)
            
            return scores.mean()
        
        study = optuna.create_study(direction='maximize', study_name='driver_consistency')
        study.optimize(objective, n_trials=30, show_progress_bar=True)
        
        print(f"\n✅ Best F1 Score: {study.best_value:.4f}")
        print(f"\n🏆 Best Hyperparameters:")
        for key, value in study.best_params.items():
            print(f"   {key}: {value}")
        
        return study.best_params
    
    def train_models(self, X: pd.DataFrame, y: pd.Series, best_params: Dict = None):
        """Train ensemble classification models"""
        print("\n" + "=" * 80)
        print("🤖 Training Classification Models")
        print("=" * 80)
        
        # Scale features
        print("\n🔄 Scaling features...")
        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, columns=self.feature_names)
        
        if best_params is None:
            # Use default params
            rf_params = {'n_estimators': 200, 'max_depth': 20, 'random_state': 42}
            xgb_params = {'n_estimators': 200, 'max_depth': 10, 'learning_rate': 0.1, 'random_state': 42}
            lgbm_params = {'n_estimators': 200, 'max_depth': 10, 'learning_rate': 0.1, 'random_state': 42, 'verbose': -1}
        else:
            # Extract params for each model
            rf_params = {k.replace('rf_', ''): v for k, v in best_params.items() if k.startswith('rf_')}
            rf_params['random_state'] = 42
            
            xgb_params = {k.replace('xgb_', ''): v for k, v in best_params.items() if k.startswith('xgb_')}
            xgb_params['random_state'] = 42
            
            lgbm_params = {k.replace('lgbm_', ''): v for k, v in best_params.items() if k.startswith('lgbm_')}
            lgbm_params.update({'random_state': 42, 'verbose': -1})
        
        # Create individual models
        print("\n📦 Training base models...")
        rf_clf = RandomForestClassifier(**rf_params)
        xgb_clf = XGBClassifier(**xgb_params, eval_metric='mlogloss', verbosity=0)
        lgbm_clf = LGBMClassifier(**lgbm_params)
        
        # Train individual models
        rf_clf.fit(X_scaled, y)
        xgb_clf.fit(X_scaled, y)
        lgbm_clf.fit(X_scaled, y)
        
        self.models['random_forest'] = rf_clf
        self.models['xgboost'] = xgb_clf
        self.models['lightgbm'] = lgbm_clf
        
        print("   ✅ Random Forest trained")
        print("   ✅ XGBoost trained")
        print("   ✅ LightGBM trained")
        
        # Create voting classifier
        print("\n🗳️  Creating voting ensemble...")
        voting_clf = VotingClassifier(
            estimators=[
                ('rf', rf_clf),
                ('xgb', xgb_clf),
                ('lgbm', lgbm_clf)
            ],
            voting='soft'
        )
        
        voting_clf.fit(X_scaled, y)
        self.models['voting_ensemble'] = voting_clf
        print("   ✅ Voting ensemble trained")
        
        # Evaluate with cross-validation
        print("\n" + "=" * 80)
        print("📊 Cross-Validation Evaluation")
        print("=" * 80)
        
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        
        for name, model in self.models.items():
            scores = cross_val_score(model, X_scaled, y, cv=cv, scoring='f1_weighted', n_jobs=-1)
            self.cv_scores[name] = {
                'f1_mean': scores.mean(),
                'f1_std': scores.std()
            }
            print(f"\n{name.upper()}:")
            print(f"   F1 Score: {scores.mean():.4f} ± {scores.std():.4f}")
        
        # Make predictions for confusion matrix
        print("\n" + "=" * 80)
        print("📈 Full Dataset Evaluation")
        print("=" * 80)
        
        y_pred = voting_clf.predict(X_scaled)
        y_pred_proba = voting_clf.predict_proba(X_scaled)
        
        # Calculate metrics
        accuracy = accuracy_score(y, y_pred)
        f1_macro = f1_score(y, y_pred, average='macro')
        f1_weighted = f1_score(y, y_pred, average='weighted')
        kappa = cohen_kappa_score(y, y_pred)
        
        print(f"\n🎯 VOTING ENSEMBLE Performance:")
        print(f"   Accuracy:       {accuracy:.4f}")
        print(f"   F1-Score (Macro):    {f1_macro:.4f}")
        print(f"   F1-Score (Weighted): {f1_weighted:.4f}")
        print(f"   Cohen's Kappa: {kappa:.4f}")
        
        # ROC-AUC for multi-class
        try:
            roc_auc = roc_auc_score(y, y_pred_proba, multi_class='ovr', average='weighted')
            print(f"   ROC-AUC (Weighted):  {roc_auc:.4f}")
        except:
            print(f"   ROC-AUC: Not available")
        
        # Classification report
        print(f"\n📋 Classification Report:")
        class_names_ordered = [self.reverse_mapping_remapped[i] for i in sorted(self.reverse_mapping_remapped.keys())]
        print(classification_report(y, y_pred, target_names=class_names_ordered))
        
        # Confusion matrix
        cm = confusion_matrix(y, y_pred)
        
        # Visualizations
        self.create_visualizations(X_scaled, y, y_pred, y_pred_proba, cm)
        
        return X_scaled, y, y_pred, y_pred_proba
    
    def create_visualizations(self, X, y, y_pred, y_pred_proba, cm):
        """Create visualization plots"""
        print("\n" + "=" * 80)
        print("📊 Creating Visualizations")
        print("=" * 80)
        
        vis_dir = self.data_dir / "visualizations"
        vis_dir.mkdir(exist_ok=True)
        
        # 1. Confusion Matrix
        plt.figure(figsize=(10, 8))
        class_names_ordered = [self.reverse_mapping_remapped[i] for i in sorted(self.reverse_mapping_remapped.keys())]
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                   xticklabels=class_names_ordered,
                   yticklabels=class_names_ordered)
        plt.title('Confusion Matrix - Driver Consistency Classification', fontsize=14, fontweight='bold')
        plt.ylabel('True Class')
        plt.xlabel('Predicted Class')
        plt.tight_layout()
        plt.savefig(vis_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Confusion matrix saved")
        
        # 2. Feature Importance (from Random Forest)
        rf_model = self.models['random_forest']
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': rf_model.feature_importances_
        }).sort_values('importance', ascending=False).head(20)
        
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(feature_importance)), feature_importance['importance'])
        plt.yticks(range(len(feature_importance)), feature_importance['feature'])
        plt.xlabel('Importance Score')
        plt.title('Top 20 Feature Importances (Random Forest)', fontsize=14, fontweight='bold')
        plt.gca().invert_yaxis()
        plt.tight_layout()
        plt.savefig(vis_dir / 'feature_importance.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Feature importance plot saved")
        
        # 3. Prediction Confidence Distribution
        max_proba = y_pred_proba.max(axis=1)
        
        fig, axes = plt.subplots(1, 2, figsize=(15, 5))
        
        # Overall confidence
        axes[0].hist(max_proba, bins=50, alpha=0.7, edgecolor='black')
        axes[0].set_xlabel('Prediction Confidence')
        axes[0].set_ylabel('Frequency')
        axes[0].set_title('Prediction Confidence Distribution')
        axes[0].axvline(max_proba.mean(), color='red', linestyle='--', label=f'Mean: {max_proba.mean():.3f}')
        axes[0].legend()
        
        # Confidence by class
        for i, class_name in self.reverse_mapping_remapped.items():
            class_mask = (y == i)
            class_confidence = max_proba[class_mask]
            axes[1].hist(class_confidence, bins=30, alpha=0.5, label=class_name)
        
        axes[1].set_xlabel('Prediction Confidence')
        axes[1].set_ylabel('Frequency')
        axes[1].set_title('Prediction Confidence by True Class')
        axes[1].legend()
        
        plt.tight_layout()
        plt.savefig(vis_dir / 'prediction_confidence.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Prediction confidence plots saved")
        
        # 4. Class-wise accuracy
        class_accuracies = []
        class_names_ordered = []
        for i in sorted(self.reverse_mapping_remapped.keys()):
            class_name = self.reverse_mapping_remapped[i]
            class_mask = (y == i)
            if class_mask.sum() > 0:  # Only if class exists
                class_acc = accuracy_score(y[class_mask], y_pred[class_mask])
                class_accuracies.append(class_acc)
                class_names_ordered.append(class_name)
        
        plt.figure(figsize=(10, 6))
        plt.bar(class_names_ordered, class_accuracies, alpha=0.7, edgecolor='black')
        plt.ylabel('Accuracy')
        plt.title('Class-wise Accuracy', fontsize=14, fontweight='bold')
        plt.ylim(0, 1)
        for i, acc in enumerate(class_accuracies):
            plt.text(i, acc + 0.02, f'{acc:.3f}', ha='center', fontweight='bold')
        plt.tight_layout()
        plt.savefig(vis_dir / 'class_accuracy.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Class-wise accuracy plot saved")
        
        print(f"\n📁 All visualizations saved to: {vis_dir}")
    
    def save_model(self):
        """Save trained model and artifacts"""
        print("\n" + "=" * 80)
        print("💾 Saving Model and Artifacts")
        print("=" * 80)
        
        # Create remapped class_mapping to match the remapped reverse_mapping
        class_mapping_remapped = {class_name: idx for idx, class_name in self.reverse_mapping_remapped.items()}
        
        model_artifacts = {
            'models': self.models,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'class_mapping': class_mapping_remapped,  # Use remapped version
            'reverse_mapping': self.reverse_mapping_remapped,  # Use remapped version
            'cv_scores': self.cv_scores,
            'exclude_cols': self.exclude_cols
        }
        
        model_path = self.model_dir / "driver_consistency_predictor.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump(model_artifacts, f)
        
        print(f"✅ Model saved: {model_path}")
        print(f"   Size: {model_path.stat().st_size / 1024 / 1024:.2f} MB")
        
        # Save metadata
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'model_type': 'VotingClassifier',
            'base_models': ['RandomForest', 'XGBoost', 'LightGBM'],
            'num_features': len(self.feature_names),
            'num_classes': len(self.class_mapping),
            'classes': list(self.class_mapping.keys()),
            'cv_scores': self.cv_scores
        }
        
        metadata_path = self.model_dir / "driver_consistency_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"✅ Metadata saved: {metadata_path}")
    
    def run_training(self, optimize: bool = False):
        """Run complete training pipeline"""
        print("\n" + "=" * 80)
        print("🏎️  DRIVER CONSISTENCY PREDICTOR - TRAINING PIPELINE")
        print("=" * 80)
        
        # Load data
        X, y = self.load_data()
        
        # Optimize hyperparameters (optional)
        best_params = None
        if optimize:
            best_params = self.optimize_hyperparameters(X, y)
        
        # Train models
        X_scaled, y_true, y_pred, y_pred_proba = self.train_models(X, y, best_params)
        
        # Save model
        self.save_model()
        
        print("\n" + "=" * 80)
        print("✅ TRAINING COMPLETE")
        print("=" * 80)
        print(f"\n🎯 Next Step:")
        print(f"   Run: python backend/test/test_driver_consistency_predictor.py")
        print("=" * 80 + "\n")


def main():
    """Run training pipeline"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Train Driver Consistency Predictor')
    parser.add_argument('--optimize', action='store_true', help='Run hyperparameter optimization')
    args = parser.parse_args()
    
    classifier = DriverConsistencyClassifier()
    classifier.run_training(optimize=args.optimize)


if __name__ == "__main__":
    main()
