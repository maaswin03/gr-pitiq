"""
Position Predictor - Training Pipeline
Multi-class classification to predict finishing position (1-24)
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
from datetime import datetime

# Scikit-learn
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import (
    accuracy_score, f1_score, classification_report, 
    confusion_matrix, cohen_kappa_score
)

# XGBoost and LightGBM
import xgboost as xgb
import lightgbm as lgb

# Visualization
import matplotlib.pyplot as plt
import seaborn as sns


class PositionPredictor:
    """Position classification using ensemble methods"""
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.model_dir = self.root_dir / "backend" / "model"
        self.viz_dir = self.root_dir / "backend" / "visualizations" / "position_predictor"
        self.output_dir = self.root_dir / "outputs" / "position_predictor"
        
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.viz_dir.mkdir(parents=True, exist_ok=True)
        
        self.models = {}
        self.scaler = StandardScaler()
        self.feature_names = []
        self.class_mapping = {}
        self.reverse_mapping = {}
        self.cv_scores = {}
        
    def load_data(self):
        """Load and split preprocessed data"""
        print("\n" + "=" * 80)
        print("📊 LOADING DATA")
        print("=" * 80)
        
        data_path = self.output_dir / "engineered_dataset.csv"
        df = pd.read_csv(data_path)
        
        print(f"\n✅ Loaded {len(df)} samples")
        print(f"📊 Features: {len(df.columns)}")
        
        # Separate features and target
        exclude_cols = ['RACE_SESSION', 'DRIVER_NUMBER', 'FINAL_POSITION', 'STARTING_POSITION']
        X = df.drop(columns=exclude_cols, errors='ignore')
        y = df['FINAL_POSITION']
        
        print(f"\n🎯 Target: FINAL_POSITION")
        print(f"   Positions: {sorted(y.unique())}")
        print(f"   Min Position: {y.min()}")
        print(f"   Max Position: {y.max()}")
        
        # Map position values to consecutive integers for XGBoost
        unique_positions = sorted(y.unique())
        self.class_mapping = {pos: idx for idx, pos in enumerate(unique_positions)}
        self.reverse_mapping = {idx: pos for pos, idx in self.class_mapping.items()}
        
        print(f"\n🔄 Mapping {len(unique_positions)} positions to indices 0-{len(unique_positions)-1}")
        
        y = y.map(self.class_mapping)
        
        # Additional remapping if classes are not consecutive
        unique_classes = sorted(y.unique())
        if unique_classes != list(range(len(unique_classes))):
            print(f"⚠️  Non-consecutive classes detected: {unique_classes}")
            print(f"   Remapping to consecutive integers...")
            
            class_remap = {old_idx: new_idx for new_idx, old_idx in enumerate(sorted(y.unique()))}
            y_remapped = y.map(class_remap)
            
            # Update reverse mapping
            self.reverse_mapping_remapped = {
                new_idx: self.reverse_mapping[old_idx] 
                for old_idx, new_idx in class_remap.items()
            }
            self.reverse_mapping = self.reverse_mapping_remapped
            y = y_remapped
            
            print(f"✅ Remapped to: {sorted(y.unique())}")
        
        self.feature_names = X.columns.tolist()
        print(f"\n📋 Feature count: {len(self.feature_names)}")
        
        # Convert all features to numeric
        print("\n🔢 Converting features to numeric...")
        for col in X.columns:
            X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle infinite values
        X = X.replace([np.inf, -np.inf], np.nan)
        
        # Fill NaN with median
        for col in X.columns:
            if X[col].isna().any():
                median_val = X[col].median()
                X[col] = X[col].fillna(median_val)
                print(f"   Filled NaN in {col} with median: {median_val:.2f}")
        
        # Split data: 70% train, 15% val, 15% test (stratified)
        print("\n✂️  Splitting data (70% train, 15% val, 15% test)...")
        X_train, X_temp, y_train, y_temp = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, random_state=42, stratify=y_temp
        )
        
        print(f"   Train: {len(X_train)} samples")
        print(f"   Val:   {len(X_val)} samples")
        print(f"   Test:  {len(X_test)} samples")
        
        # Scale features
        print("\n📏 Scaling features...")
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled = self.scaler.transform(X_val)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Convert back to DataFrames
        X_train = pd.DataFrame(X_train_scaled, columns=self.feature_names, index=X_train.index)
        X_val = pd.DataFrame(X_val_scaled, columns=self.feature_names, index=X_val.index)
        X_test = pd.DataFrame(X_test_scaled, columns=self.feature_names, index=X_test.index)
        
        return X_train, X_val, X_test, y_train, y_val, y_test, df
    
    def train_models(self, X_train, y_train):
        """Train individual models"""
        print("\n" + "=" * 80)
        print("🤖 TRAINING MODELS")
        print("=" * 80)
        
        num_classes = len(self.reverse_mapping)
        print(f"\n📊 Training for {num_classes} position classes")
        
        # Random Forest
        print("\n🌲 Training Random Forest...")
        rf = RandomForestClassifier(
            n_estimators=200,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)
        self.models['rf'] = rf
        print("   ✅ Random Forest trained")
        
        # XGBoost
        print("\n⚡ Training XGBoost...")
        xgb_model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=10,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            eval_metric='mlogloss'
        )
        xgb_model.fit(X_train, y_train)
        self.models['xgb'] = xgb_model
        print("   ✅ XGBoost trained")
        
        # LightGBM
        print("\n💡 Training LightGBM...")
        lgb_model = lgb.LGBMClassifier(
            n_estimators=200,
            max_depth=10,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            verbose=-1
        )
        lgb_model.fit(X_train, y_train)
        self.models['lgb'] = lgb_model
        print("   ✅ LightGBM trained")
        
        # Voting Ensemble
        print("\n🗳️  Creating Voting Ensemble...")
        voting_clf = VotingClassifier(
            estimators=[
                ('rf', rf),
                ('xgb', xgb_model),
                ('lgb', lgb_model)
            ],
            voting='soft',
            n_jobs=-1
        )
        voting_clf.fit(X_train, y_train)
        self.models['voting_ensemble'] = voting_clf
        print("   ✅ Voting Ensemble created")
    
    def cross_validate(self, X_train, y_train):
        """Perform cross-validation"""
        print("\n" + "=" * 80)
        print("🔄 CROSS-VALIDATION (3-Fold Stratified)")
        print("=" * 80)
        
        cv = StratifiedKFold(n_splits=3, shuffle=True, random_state=42)
        
        for name, model in self.models.items():
            print(f"\n📊 {name}...")
            scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='f1_weighted', n_jobs=-1)
            self.cv_scores[name] = {
                'mean': scores.mean(),
                'std': scores.std(),
                'scores': scores.tolist()
            }
            print(f"   F1-Weighted: {scores.mean():.4f} (+/- {scores.std():.4f})")
    
    def evaluate(self, X_test, y_test):
        """Evaluate models on test set"""
        print("\n" + "=" * 80)
        print("📈 TEST SET EVALUATION")
        print("=" * 80)
        
        results = {}
        
        for name, model in self.models.items():
            y_pred = model.predict(X_test)
            
            accuracy = accuracy_score(y_test, y_pred)
            f1_macro = f1_score(y_test, y_pred, average='macro', zero_division=0)
            f1_weighted = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            kappa = cohen_kappa_score(y_test, y_pred)
            
            results[name] = {
                'accuracy': accuracy,
                'f1_macro': f1_macro,
                'f1_weighted': f1_weighted,
                'kappa': kappa
            }
            
            print(f"\n🤖 {name}")
            print(f"   Accuracy:      {accuracy:.4f}")
            print(f"   F1-Macro:      {f1_macro:.4f}")
            print(f"   F1-Weighted:   {f1_weighted:.4f}")
            print(f"   Cohen's Kappa: {kappa:.4f}")
        
        return results
    
    def create_visualizations(self, X_test, y_test):
        """Create visualization plots"""
        print("\n" + "=" * 80)
        print("📊 CREATING VISUALIZATIONS")
        print("=" * 80)
        
        # Use voting ensemble for visualizations
        model = self.models['voting_ensemble']
        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)
        
        # 1. Confusion Matrix
        print("\n📊 Creating confusion matrix...")
        cm = confusion_matrix(y_test, y_pred)
        
        plt.figure(figsize=(12, 10))
        
        # Get position labels
        position_labels = [str(int(self.reverse_mapping[i])) for i in sorted(self.reverse_mapping.keys())]
        
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=position_labels, 
                    yticklabels=position_labels)
        plt.title('Position Prediction - Confusion Matrix', fontsize=14, fontweight='bold')
        plt.xlabel('Predicted Position', fontsize=12)
        plt.ylabel('Actual Position', fontsize=12)
        plt.tight_layout()
        plt.savefig(self.viz_dir / 'confusion_matrix.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Saved confusion_matrix.png")
        
        # 2. Feature Importance (Random Forest)
        print("\n📊 Creating feature importance plot...")
        rf_model = self.models['rf']
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': rf_model.feature_importances_
        }).sort_values('importance', ascending=False).head(20)
        
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(feature_importance)), feature_importance['importance'])
        plt.yticks(range(len(feature_importance)), feature_importance['feature'])
        plt.xlabel('Importance', fontsize=12)
        plt.title('Top 20 Feature Importances (Random Forest)', fontsize=14, fontweight='bold')
        plt.gca().invert_yaxis()
        plt.tight_layout()
        plt.savefig(self.viz_dir / 'feature_importance.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Saved feature_importance.png")
        
        # 3. Prediction Confidence Distribution
        print("\n📊 Creating confidence distribution plot...")
        confidence = np.max(y_pred_proba, axis=1)
        
        plt.figure(figsize=(10, 6))
        plt.hist(confidence, bins=50, edgecolor='black', alpha=0.7)
        plt.xlabel('Prediction Confidence', fontsize=12)
        plt.ylabel('Frequency', fontsize=12)
        plt.title('Prediction Confidence Distribution', fontsize=14, fontweight='bold')
        plt.axvline(confidence.mean(), color='red', linestyle='--', 
                    label=f'Mean: {confidence.mean():.3f}')
        plt.legend()
        plt.tight_layout()
        plt.savefig(self.viz_dir / 'confidence_distribution.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Saved confidence_distribution.png")
        
        # 4. Position-wise Accuracy
        print("\n📊 Creating position-wise accuracy plot...")
        position_accuracy = []
        for pos_idx in sorted(self.reverse_mapping.keys()):
            mask = y_test == pos_idx
            if mask.sum() > 0:
                acc = accuracy_score(y_test[mask], y_pred[mask])
                position_accuracy.append({
                    'position': int(self.reverse_mapping[pos_idx]),
                    'accuracy': acc,
                    'count': mask.sum()
                })
        
        acc_df = pd.DataFrame(position_accuracy)
        
        plt.figure(figsize=(14, 6))
        bars = plt.bar(range(len(acc_df)), acc_df['accuracy'])
        plt.xticks(range(len(acc_df)), acc_df['position'])
        plt.xlabel('Position', fontsize=12)
        plt.ylabel('Accuracy', fontsize=12)
        plt.title('Accuracy by Position', fontsize=14, fontweight='bold')
        plt.ylim(0, 1.1)
        
        # Color bars by accuracy
        for i, bar in enumerate(bars):
            if acc_df.iloc[i]['accuracy'] > 0.8:
                bar.set_color('green')
            elif acc_df.iloc[i]['accuracy'] > 0.6:
                bar.set_color('orange')
            else:
                bar.set_color('red')
        
        plt.tight_layout()
        plt.savefig(self.viz_dir / 'position_wise_accuracy.png', dpi=300, bbox_inches='tight')
        plt.close()
        print("   ✅ Saved position_wise_accuracy.png")
    
    def save_model(self):
        """Save model artifacts"""
        print("\n" + "=" * 80)
        print("💾 SAVING MODEL")
        print("=" * 80)
        
        # Use remapped class_mapping for consistency
        class_mapping_to_save = {int(self.reverse_mapping[idx]): idx 
                                 for idx in self.reverse_mapping.keys()}
        reverse_mapping_to_save = {idx: int(pos) 
                                   for idx, pos in self.reverse_mapping.items()}
        
        model_artifacts = {
            'models': self.models,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'class_mapping': class_mapping_to_save,
            'reverse_mapping': reverse_mapping_to_save,
            'cv_scores': self.cv_scores,
            'exclude_cols': ['RACE_SESSION', 'DRIVER_NUMBER', 'FINAL_POSITION', 'STARTING_POSITION']
        }
        
        model_path = self.model_dir / "position_predictor.pkl"
        with open(model_path, 'wb') as f:
            pickle.dump(model_artifacts, f)
        print(f"\n✅ Model saved to: {model_path}")
        
        # Save metadata
        metadata = {
            'created_at': datetime.now().isoformat(),
            'model_type': 'position_classification',
            'base_models': list(self.models.keys()),
            'num_features': len(self.feature_names),
            'num_positions': len(self.reverse_mapping),
            'positions': sorted([int(pos) for pos in self.reverse_mapping.values()]),
            'cv_scores': self.cv_scores
        }
        
        metadata_path = self.model_dir / "position_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✅ Metadata saved to: {metadata_path}")
    
    def print_summary(self):
        """Print training summary"""
        print("\n" + "=" * 80)
        print("📋 TRAINING SUMMARY")
        print("=" * 80)
        
        print(f"\n🎯 Task: Position Classification")
        print(f"📊 Positions: {len(self.reverse_mapping)}")
        print(f"📈 Features: {len(self.feature_names)}")
        print(f"🤖 Models: {', '.join(self.models.keys())}")
        
        print("\n✅ TRAINING COMPLETE!")


def main():
    """Main training pipeline"""
    predictor = PositionPredictor()
    
    # Load data
    X_train, X_val, X_test, y_train, y_val, y_test, df = predictor.load_data()
    
    # Train models
    predictor.train_models(X_train, y_train)
    
    # Cross-validation
    predictor.cross_validate(X_train, y_train)
    
    # Evaluate on test set
    predictor.evaluate(X_test, y_test)
    
    # Create visualizations
    predictor.create_visualizations(X_test, y_test)
    
    # Save model
    predictor.save_model()
    
    # Print summary
    predictor.print_summary()


if __name__ == "__main__":
    main()
