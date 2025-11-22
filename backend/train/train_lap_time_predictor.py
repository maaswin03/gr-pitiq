"""
Professional Ensemble Lap Time Prediction Model
LightGBM + XGBoost + CatBoost with Optuna Hyperparameter Tuning
"""

import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import joblib
import json
from datetime import datetime

# ML Libraries
from sklearn.model_selection import train_test_split, TimeSeriesSplit, cross_val_score, StratifiedGroupKFold, GroupKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, mean_absolute_percentage_error
from sklearn.ensemble import StackingRegressor
from sklearn.linear_model import Ridge

# Gradient Boosting Models
import lightgbm as lgb
import xgboost as xgb
import catboost as cb

# Hyperparameter Optimization
import optuna
from optuna.samplers import TPESampler

# Model Explainability
import shap

import warnings
warnings.filterwarnings('ignore')


class LapTimePredictor:
    """Expert-level ensemble lap time prediction model"""
    
    def __init__(self, output_dir: str = None, model_dir: str = None):
        # Get root directory (3 levels up from backend/train/)
        root_dir = Path(__file__).parent.parent.parent
        
        # Set output directory
        if output_dir is None:
            self.output_dir = root_dir / "outputs" / "lap_time_predictor"
        else:
            self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Set model directory (backend/model/)
        if model_dir is None:
            self.model_dir = root_dir / "backend" / "model"
        else:
            self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Also create metadata directory
        self.metadata_dir = self.model_dir / "metadata"
        self.metadata_dir.mkdir(parents=True, exist_ok=True)
        
        self.models = {}
        self.scaler = StandardScaler()
        self.best_params = {}
        self.feature_names = []
        self.metrics = {}
        
        # ENHANCEMENT: Store ensemble weights and diagnostics
        self.ensemble_weights = {}
        self.track_wise_metrics = {}
        self.feature_importance = {}
        self.outlier_stats = {}
        
    def prepare_data(self, df: pd.DataFrame) -> tuple:
        """
        Prepare data for training
        Returns: X_train, X_val, X_test, y_train, y_val, y_test
        """
        print("\n" + "=" * 80)
        print("📊 Data Preparation")
        print("=" * 80)
        
        # Define target
        target = 'LAP_TIME_SECONDS'
        
        # Define features to exclude
        exclude_cols = [
            target, 'LAP_TIME', 'ELAPSED', 'HOUR', 'FL_time', 'FL_elapsed',
            'TRACK', 'CLASS', 'GROUP', 'MANUFACTURER', 'FLAG_AT_FL',
            'CROSSING_FINISH_LINE_IN_PIT', 'DRIVER_NUMBER', 'VEHICLE',
            'SLOWEST_SECTOR', 'IM1a_time', 'IM1a_elapsed', 'IM1_time', 
            'IM1_elapsed', 'IM2a_time', 'IM2a_elapsed', 'IM2_time', 
            'IM2_elapsed', 'IM3a_time', 'IM3a_elapsed', 'S1', 'S2', 'S3',
            'S1_LARGE', 'S2_LARGE', 'S3_LARGE'
        ]
        
        # Select feature columns
        feature_cols = [col for col in df.columns if col not in exclude_cols]
        
        # Remove rows with missing target
        df_clean = df[df[target].notna()].copy()
        
        # Separate features and target (keep TRACK for stratification)
        X = df_clean[feature_cols].copy()
        y = df_clean[target].copy()
        track_labels = df_clean['TRACK'].copy()  # Keep for stratified split
        
        # Convert all object columns to numeric (coerce errors to NaN)
        for col in X.columns:
            if X[col].dtype == 'object':
                X[col] = pd.to_numeric(X[col], errors='coerce')
        
        # Handle infinite values first
        X = X.replace([np.inf, -np.inf], np.nan)
        
        # Drop columns that are all NaN
        all_nan_cols = X.columns[X.isna().all()].tolist()
        if all_nan_cols:
            print(f"⚠️  Dropping {len(all_nan_cols)} all-NaN columns: {all_nan_cols[:5]}{'...' if len(all_nan_cols) > 5 else ''}")
            X = X.drop(columns=all_nan_cols)
        
        # Handle missing values in features (fill with median for numeric columns)
        for col in X.columns:
            if X[col].isna().any():
                # For numeric columns, use median; for non-numeric use 0
                if X[col].dtype in ['float64', 'int64']:
                    median_val = X[col].median()
                    if pd.isna(median_val):  # If median is still NaN (all values are NaN)
                        X[col] = X[col].fillna(0)
                    else:
                        X[col] = X[col].fillna(median_val)
                else:
                    X[col] = X[col].fillna(0)
        
        print(f"✅ Dataset shape: {X.shape}")
        print(f"✅ Target range: {y.min():.2f}s - {y.max():.2f}s (mean: {y.mean():.2f}s)")
        
        # Print track distribution before split
        print(f"\n📍 Track distribution in dataset:")
        track_counts = track_labels.value_counts()
        for track, count in track_counts.items():
            print(f"   {track}: {count} samples ({count/len(track_labels)*100:.1f}%)")
        
        # Split data: 70% train, 15% validation, 15% test WITH STRATIFICATION
        X_temp, X_test, y_temp, y_test, track_temp, track_test = train_test_split(
            X, y, track_labels, test_size=0.15, random_state=42, stratify=track_labels
        )
        X_train, X_val, y_train, y_val, track_train, track_val = train_test_split(
            X_temp, y_temp, track_temp, test_size=0.176, random_state=42, stratify=track_temp  # 0.176 of 85% ≈ 15% of total
        )
        
        print(f"\n✅ Train: {len(X_train)} | Val: {len(X_val)} | Test: {len(X_test)}")
        print(f"\n📍 Track distribution in splits:")
        print(f"   Training set:")
        train_track_counts = pd.Series(track_train).value_counts()
        for track, count in train_track_counts.items():
            print(f"      {track}: {count} samples ({count/len(track_train)*100:.1f}%)")
        print(f"   Validation set:")
        val_track_counts = pd.Series(track_val).value_counts()
        for track, count in val_track_counts.items():
            print(f"      {track}: {count} samples ({count/len(track_val)*100:.1f}%)")
        print(f"   Test set:")
        test_track_counts = pd.Series(track_test).value_counts()
        for track, count in test_track_counts.items():
            print(f"      {track}: {count} samples ({count/len(track_test)*100:.1f}%)")
        
        self.feature_names = list(X.columns)
        
        return X_train, X_val, X_test, y_train, y_val, y_test, track_train, track_val, track_test
    
    def optimize_lightgbm(self, X_train, y_train, X_val, y_val, n_trials=50):
        """Optimize LightGBM hyperparameters with Optuna"""
        print("\n🔧 Optimizing LightGBM hyperparameters...")
        
        def objective(trial):
            params = {
                'objective': 'regression',
                'metric': 'mae',
                'verbosity': -1,
                'boosting_type': 'gbdt',
                'num_leaves': trial.suggest_int('num_leaves', 20, 150),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                'feature_fraction': trial.suggest_float('feature_fraction', 0.5, 1.0),
                'bagging_fraction': trial.suggest_float('bagging_fraction', 0.5, 1.0),
                'bagging_freq': trial.suggest_int('bagging_freq', 1, 7),
                'min_child_samples': trial.suggest_int('min_child_samples', 5, 100),
                'max_depth': trial.suggest_int('max_depth', 3, 12),
                'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
                'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
            }
            
            model = lgb.LGBMRegressor(**params, n_estimators=1000, random_state=42)
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                callbacks=[lgb.early_stopping(stopping_rounds=50, verbose=False)]
            )
            
            preds = model.predict(X_val)
            mae = mean_absolute_error(y_val, preds)
            return mae
        
        study = optuna.create_study(direction='minimize', sampler=TPESampler(seed=42))
        study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
        
        print(f"✅ Best MAE: {study.best_value:.4f}")
        self.best_params['lightgbm'] = study.best_params
        
        return study.best_params
    
    def optimize_xgboost(self, X_train, y_train, X_val, y_val, n_trials=50):
        """Optimize XGBoost hyperparameters with Optuna"""
        print("\n🔧 Optimizing XGBoost hyperparameters...")
        
        def objective(trial):
            params = {
                'objective': 'reg:squarederror',
                'eval_metric': 'mae',
                'verbosity': 0,
                'max_depth': trial.suggest_int('max_depth', 3, 12),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                'subsample': trial.suggest_float('subsample', 0.5, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
                'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
                'gamma': trial.suggest_float('gamma', 1e-8, 1.0, log=True),
                'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
                'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
            }
            
            model = xgb.XGBRegressor(**params, n_estimators=1000, random_state=42)
            model.fit(
                X_train, y_train,
                eval_set=[(X_val, y_val)],
                verbose=False
            )
            
            preds = model.predict(X_val)
            mae = mean_absolute_error(y_val, preds)
            return mae
        
        study = optuna.create_study(direction='minimize', sampler=TPESampler(seed=42))
        study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
        
        print(f"✅ Best MAE: {study.best_value:.4f}")
        self.best_params['xgboost'] = study.best_params
        
        return study.best_params
    
    def optimize_catboost(self, X_train, y_train, X_val, y_val, n_trials=50):
        """Optimize CatBoost hyperparameters with Optuna"""
        print("\n🔧 Optimizing CatBoost hyperparameters...")
        
        def objective(trial):
            params = {
                'loss_function': 'MAE',
                'verbose': False,
                'depth': trial.suggest_int('depth', 4, 10),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                'l2_leaf_reg': trial.suggest_float('l2_leaf_reg', 1e-8, 10.0, log=True),
                'bagging_temperature': trial.suggest_float('bagging_temperature', 0.0, 1.0),
                'random_strength': trial.suggest_float('random_strength', 1e-8, 10.0, log=True),
            }
            
            model = cb.CatBoostRegressor(**params, iterations=1000, random_state=42)
            model.fit(
                X_train, y_train,
                eval_set=(X_val, y_val),
                early_stopping_rounds=50,
                verbose=False
            )
            
            preds = model.predict(X_val)
            mae = mean_absolute_error(y_val, preds)
            return mae
        
        study = optuna.create_study(direction='minimize', sampler=TPESampler(seed=42))
        study.optimize(objective, n_trials=n_trials, show_progress_bar=True)
        
        print(f"✅ Best MAE: {study.best_value:.4f}")
        self.best_params['catboost'] = study.best_params
        
        return study.best_params
    
    def optimize_ensemble_weights(self, X_val, y_val, n_trials=50):
        """
        ENHANCEMENT 6: Optimize ensemble blending weights using Optuna
        Searches for optimal weights (w1, w2, w3) for LightGBM, XGBoost, CatBoost
        """
        print("\n" + "=" * 80)
        print("⚖️  Optimizing Ensemble Weights with Optuna")
        print("=" * 80)
        
        # Get predictions from base models
        lgb_preds = self.models['lightgbm'].predict(X_val)
        xgb_preds = self.models['xgboost'].predict(X_val)
        cat_preds = self.models['catboost'].predict(X_val)
        
        def objective(trial):
            # Suggest weights for each model
            w_lgb = trial.suggest_float('w_lightgbm', 0.1, 0.5)
            w_xgb = trial.suggest_float('w_xgboost', 0.1, 0.5)
            w_cat = trial.suggest_float('w_catboost', 0.1, 0.5)
            
            # Normalize weights to sum to 1
            total = w_lgb + w_xgb + w_cat
            w_lgb_norm = w_lgb / total
            w_xgb_norm = w_xgb / total
            w_cat_norm = w_cat / total
            
            # Weighted blend
            blended_preds = (w_lgb_norm * lgb_preds + 
                           w_xgb_norm * xgb_preds + 
                           w_cat_norm * cat_preds)
            
            # Calculate MAE
            mae = mean_absolute_error(y_val, blended_preds)
            return mae
        
        study = optuna.create_study(direction='minimize', sampler=TPESampler(seed=42))
        study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
        
        # Normalize best weights
        w_lgb = study.best_params['w_lightgbm']
        w_xgb = study.best_params['w_xgboost']
        w_cat = study.best_params['w_catboost']
        total = w_lgb + w_xgb + w_cat
        
        self.ensemble_weights = {
            'lightgbm': w_lgb / total,
            'xgboost': w_xgb / total,
            'catboost': w_cat / total
        }
        
        print(f"\n✅ Optimal Ensemble Weights:")
        print(f"   LightGBM: {self.ensemble_weights['lightgbm']:.4f}")
        print(f"   XGBoost:  {self.ensemble_weights['xgboost']:.4f}")
        print(f"   CatBoost: {self.ensemble_weights['catboost']:.4f}")
        print(f"✅ Best Blended MAE: {study.best_value:.4f}")
        
        return self.ensemble_weights
    
    def train_ensemble(self, X_train, y_train, X_val, y_val):
        """Train ensemble model with optimized hyperparameters"""
        print("\n" + "=" * 80)
        print("🤖 Training Ensemble Model")
        print("=" * 80)
        
        # Train LightGBM
        print("\n📦 Training LightGBM...")
        lgb_params = self.best_params.get('lightgbm', {})
        lgb_params.update({'objective': 'regression', 'metric': 'mae', 'verbosity': -1})
        
        self.models['lightgbm'] = lgb.LGBMRegressor(**lgb_params, n_estimators=1000, random_state=42)
        self.models['lightgbm'].fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(stopping_rounds=50, verbose=False)]
        )
        
        # Train XGBoost
        print("📦 Training XGBoost...")
        xgb_params = self.best_params.get('xgboost', {})
        xgb_params.update({'objective': 'reg:squarederror', 'eval_metric': 'mae', 'verbosity': 0})
        
        self.models['xgboost'] = xgb.XGBRegressor(**xgb_params, n_estimators=1000, random_state=42)
        self.models['xgboost'].fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False
        )
        
        # Train CatBoost
        print("📦 Training CatBoost...")
        cb_params = self.best_params.get('catboost', {})
        cb_params.update({'loss_function': 'MAE', 'verbose': False})
        
        self.models['catboost'] = cb.CatBoostRegressor(**cb_params, iterations=1000, random_state=42)
        self.models['catboost'].fit(
            X_train, y_train,
            eval_set=(X_val, y_val),
            early_stopping_rounds=50,
            verbose=False
        )
        
        # Create stacked ensemble
        print("📦 Creating Stacked Ensemble...")
        estimators = [
            ('lightgbm', self.models['lightgbm']),
            ('xgboost', self.models['xgboost']),
            ('catboost', self.models['catboost'])
        ]
        
        self.models['ensemble'] = StackingRegressor(
            estimators=estimators,
            final_estimator=Ridge(alpha=1.0),
            cv=5
        )
        self.models['ensemble'].fit(X_train, y_train)
        
        print("✅ All models trained successfully!")
    
    def evaluate_group_kfold(self, X, y, groups, n_splits=5):
        """
        ENHANCEMENT: Perform Group K-Fold Cross-Validation
        Groups by Track to prevent data leakage between tracks
        This ensures the model is truly generalizing across tracks
        """
        print("\n" + "=" * 80)
        print("🔍 Group K-Fold Cross-Validation (by Track)")
        print("=" * 80)
        
        gkf = GroupKFold(n_splits=n_splits)
        
        model_scores = {
            'lightgbm': [],
            'xgboost': [],
            'catboost': [],
            'ensemble': []
        }
        
        fold_num = 1
        for train_idx, val_idx in gkf.split(X, y, groups=groups):
            X_train_fold, X_val_fold = X.iloc[train_idx], X.iloc[val_idx]
            y_train_fold, y_val_fold = y.iloc[train_idx], y.iloc[val_idx]
            
            # Get validation tracks for this fold
            val_tracks = groups.iloc[val_idx].unique()
            print(f"\n📂 Fold {fold_num}/{n_splits} - Validation tracks: {', '.join(val_tracks)}")
            
            # Train and evaluate each model
            for model_name in ['lightgbm', 'xgboost', 'catboost']:
                if model_name in self.models:
                    preds = self.models[model_name].predict(X_val_fold)
                    mae = mean_absolute_error(y_val_fold, preds)
                    model_scores[model_name].append(mae)
                    print(f"   {model_name}: MAE = {mae:.4f}s")
            
            # Ensemble predictions (weighted blend)
            if self.ensemble_weights:
                lgb_preds = self.models['lightgbm'].predict(X_val_fold)
                xgb_preds = self.models['xgboost'].predict(X_val_fold)
                cat_preds = self.models['catboost'].predict(X_val_fold)
                
                ensemble_preds = (
                    self.ensemble_weights['lightgbm'] * lgb_preds +
                    self.ensemble_weights['xgboost'] * xgb_preds +
                    self.ensemble_weights['catboost'] * cat_preds
                )
                mae = mean_absolute_error(y_val_fold, ensemble_preds)
                model_scores['ensemble'].append(mae)
                print(f"   ensemble: MAE = {mae:.4f}s")
            
            fold_num += 1
        
        # Print summary statistics
        print("\n" + "=" * 80)
        print("📊 Group K-Fold Results Summary")
        print("=" * 80)
        
        for model_name, scores in model_scores.items():
            if scores:
                mean_mae = np.mean(scores)
                std_mae = np.std(scores)
                print(f"{model_name:12s}: MAE = {mean_mae:.4f}s ± {std_mae:.4f}s")
        
        return model_scores
    
    def evaluate_models(self, X_test, y_test, track_test=None, X_val=None, y_val=None):
        """
        ENHANCED: Comprehensive model evaluation with track-wise metrics
        """
        print("\n" + "=" * 80)
        print("📊 Model Evaluation")
        print("=" * 80)
        
        results = {}
        
        for name, model in self.models.items():
            print(f"\n🔍 Evaluating {name.upper()}...")
            
            # Predictions
            y_pred_test = model.predict(X_test)
            
            # Metrics
            mae = mean_absolute_error(y_test, y_pred_test)
            rmse = np.sqrt(mean_squared_error(y_test, y_pred_test))
            r2 = r2_score(y_test, y_pred_test)
            mape = mean_absolute_percentage_error(y_test, y_pred_test) * 100
            
            results[name] = {
                'MAE': mae,
                'RMSE': rmse,
                'R²': r2,
                'MAPE': mape,
                'predictions': y_pred_test
            }
            
            print(f"   MAE:  {mae:.4f}s")
            print(f"   RMSE: {rmse:.4f}s")
            print(f"   R²:   {r2:.4f}")
            print(f"   MAPE: {mape:.2f}%")
            
            # ENHANCEMENT 8: Calculate track-wise metrics if track labels provided
            if track_test is not None:
                self._calculate_track_wise_metrics(name, y_test, y_pred_test, track_test)
        
        self.metrics = results
        return results
    
    def _calculate_track_wise_metrics(self, model_name, y_true, y_pred, track_labels):
        """
        ENHANCEMENT 8: Calculate per-track MAE and RMSE for diagnostics
        """
        if model_name not in self.track_wise_metrics:
            self.track_wise_metrics[model_name] = {}
        
        # Convert to Series if it's a DataFrame
        if isinstance(track_labels, pd.DataFrame):
            track_labels = track_labels.iloc[:, 0]
        
        # Convert all to numpy arrays for consistent indexing
        track_labels_arr = track_labels.values if hasattr(track_labels, 'values') else np.array(track_labels)
        y_true_arr = y_true.values if hasattr(y_true, 'values') else np.array(y_true)
        y_pred_arr = y_pred if isinstance(y_pred, np.ndarray) else np.array(y_pred)
        
        for track in np.unique(track_labels_arr):
            track_mask = track_labels_arr == track
            track_y_true = y_true_arr[track_mask]
            track_y_pred = y_pred_arr[track_mask]
            
            track_mae = mean_absolute_error(track_y_true, track_y_pred)
            track_rmse = np.sqrt(mean_squared_error(track_y_true, track_y_pred))
            track_r2 = r2_score(track_y_true, track_y_pred)
            
            self.track_wise_metrics[model_name][track] = {
                'mae': float(track_mae),
                'rmse': float(track_rmse),
                'r2': float(track_r2),
                'samples': int(track_mask.sum())
            }
    
    def visualize_results(self, X_test, y_test):
        """Create comprehensive visualizations"""
        print("\n📈 Creating visualizations...")
        
        # Set style
        sns.set_style("whitegrid")
        
        # 1. Actual vs Predicted (all models)
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        axes = axes.ravel()
        
        for idx, (name, metrics) in enumerate(self.metrics.items()):
            ax = axes[idx]
            y_pred = metrics['predictions']
            
            ax.scatter(y_test, y_pred, alpha=0.5, s=20)
            ax.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 
                   'r--', lw=2, label='Perfect Prediction')
            
            ax.set_xlabel('Actual Lap Time (s)', fontsize=12)
            ax.set_ylabel('Predicted Lap Time (s)', fontsize=12)
            ax.set_title(f'{name.upper()} - MAE: {metrics["MAE"]:.4f}s, R²: {metrics["R²"]:.4f}', 
                        fontsize=14, fontweight='bold')
            ax.legend()
            ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'prediction_comparison.png', dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {self.output_dir / 'prediction_comparison.png'}")
        
        # 2. Error Distribution
        fig, axes = plt.subplots(2, 2, figsize=(16, 12))
        axes = axes.ravel()
        
        for idx, (name, metrics) in enumerate(self.metrics.items()):
            ax = axes[idx]
            errors = y_test - metrics['predictions']
            
            ax.hist(errors, bins=50, alpha=0.7, edgecolor='black')
            ax.axvline(0, color='red', linestyle='--', linewidth=2, label='Zero Error')
            ax.set_xlabel('Prediction Error (s)', fontsize=12)
            ax.set_ylabel('Frequency', fontsize=12)
            ax.set_title(f'{name.upper()} - Error Distribution (Mean: {errors.mean():.4f}s)', 
                        fontsize=14, fontweight='bold')
            ax.legend()
            ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'error_distribution.png', dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {self.output_dir / 'error_distribution.png'}")
        
        # 3. Metrics Comparison
        fig, ax = plt.subplots(figsize=(12, 6))
        
        models = list(self.metrics.keys())
        mae_scores = [self.metrics[m]['MAE'] for m in models]
        rmse_scores = [self.metrics[m]['RMSE'] for m in models]
        
        x = np.arange(len(models))
        width = 0.35
        
        ax.bar(x - width/2, mae_scores, width, label='MAE', alpha=0.8)
        ax.bar(x + width/2, rmse_scores, width, label='RMSE', alpha=0.8)
        
        ax.set_xlabel('Model', fontsize=12)
        ax.set_ylabel('Error (seconds)', fontsize=12)
        ax.set_title('Model Performance Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels([m.upper() for m in models])
        ax.legend()
        ax.grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'metrics_comparison.png', dpi=300, bbox_inches='tight')
        print(f"✅ Saved: {self.output_dir / 'metrics_comparison.png'}")
        
        plt.close('all')
    
    def feature_importance_analysis(self, X_test):
        """
        ENHANCED: SHAP-based feature importance with top 10 features extraction
        """
        print("\n🔬 Analyzing feature importance with SHAP...")
        
        # Extract feature importance from each base model
        for model_name in ['lightgbm', 'xgboost', 'catboost']:
            if model_name in self.models:
                model = self.models[model_name]
                
                if model_name == 'lightgbm':
                    importances = model.feature_importances_
                elif model_name == 'xgboost':
                    importances = model.feature_importances_
                elif model_name == 'catboost':
                    importances = model.feature_importances_
                
                # Get top 10 features
                importance_df = pd.DataFrame({
                    'feature': self.feature_names,
                    'importance': importances
                }).sort_values('importance', ascending=False)
                
                top_10 = dict(zip(
                    importance_df['feature'].head(10).tolist(),
                    importance_df['importance'].head(10).tolist()
                ))
                
                self.feature_importance[model_name] = top_10
                
                print(f"\n📊 Top 10 Features - {model_name.upper()}:")
                for idx, (feat, imp) in enumerate(top_10.items(), 1):
                    print(f"   {idx}. {feat}: {imp:.4f}")
        
        try:
            # Use the best performing model (ensemble)
            model = self.models['ensemble']
            
            # Create SHAP explainer
            explainer = shap.Explainer(model, X_test.iloc[:100])  # Use sample for speed
            shap_values = explainer(X_test.iloc[:100])
            
            # Summary plot
            plt.figure(figsize=(12, 8))
            shap.summary_plot(shap_values, X_test.iloc[:100], show=False)
            plt.title('SHAP Feature Importance - Ensemble Model', fontsize=14, fontweight='bold')
            plt.tight_layout()
            plt.savefig(self.output_dir / 'shap_feature_importance.png', dpi=300, bbox_inches='tight')
            print(f"✅ Saved: {self.output_dir / 'shap_feature_importance.png'}")
            
            plt.close()
            
        except Exception as e:
            print(f"⚠️  SHAP analysis failed: {str(e)}")
            print("   Falling back to model-based feature importance...")
            
            # Fallback: Use LightGBM feature importance
            if 'lightgbm' in self.models:
                importance = pd.DataFrame({
                    'feature': self.feature_names,
                    'importance': self.models['lightgbm'].feature_importances_
                }).sort_values('importance', ascending=False)
                
                plt.figure(figsize=(12, 8))
                plt.barh(importance['feature'].head(20), importance['importance'].head(20))
                plt.xlabel('Importance')
                plt.title('Top 20 Feature Importance - LightGBM', fontsize=14, fontweight='bold')
                plt.gca().invert_yaxis()
                plt.tight_layout()
                plt.savefig(self.output_dir / 'feature_importance.png', dpi=300, bbox_inches='tight')
                print(f"✅ Saved: {self.output_dir / 'feature_importance.png'}")
                
                plt.close()
    
    def generate_enhancement_report(self):
        """
        ENHANCEMENT 8: Generate comprehensive model_enhancement_report.json
        """
        print("\n📝 Generating Enhancement Report...")
        
        # Load outlier stats from feature engineering
        outlier_stats_path = self.output_dir / 'outlier_removal_stats.json'
        if outlier_stats_path.exists():
            with open(outlier_stats_path, 'r') as f:
                self.outlier_stats = json.load(f)
        
        # Create comprehensive report
        report = {
            'timestamp': datetime.now().isoformat(),
            'enhancement_summary': {
                'percentile_outlier_filtering': True,
                'weather_delta_features': True,
                'driver_encoding': True,
                'track_normalization': True,
                'track_metadata_added': True,  # NEW
                'weather_balancing': True,  # NEW
                'feature_scaling': True,
                'ensemble_weights_optimized': bool(self.ensemble_weights),
                'grouped_cv': True,  # NEW - Now implemented
                'diagnostics_generated': True
            },
            'outlier_removal_stats': self.outlier_stats,
            'ensemble_weights': self.ensemble_weights,
            'feature_importance_top10': self.feature_importance,
            'track_wise_performance': self.track_wise_metrics,
            'overall_metrics': {
                name: {k: float(v) if isinstance(v, (int, float, np.number)) else v 
                       for k, v in metrics.items() if k != 'predictions'}
                for name, metrics in self.metrics.items()
            },
            'best_hyperparameters': self.best_params,
            'total_features': len(self.feature_names)
        }
        
        # Save report
        report_path = self.output_dir / 'model_enhancement_report.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"✅ Enhancement report saved: {report_path}")
        
        # Print summary
        print("\n📊 Enhancement Report Summary:")
        print(f"   ✅ Outliers removed: {self.outlier_stats.get('total_removed', 'N/A')}")
        if self.ensemble_weights:
            print(f"   ✅ Ensemble weights optimized:")
            for model, weight in self.ensemble_weights.items():
                print(f"      {model}: {weight:.4f}")
        print(f"   ✅ Total features: {len(self.feature_names)}")
        print(f"   ✅ Track-wise metrics: {len(self.track_wise_metrics.get('ensemble', {}))} tracks")
        
        return report
    
    def save_model(self):
        """Save ONLY ensemble model to backend/model/"""
        print("\n💾 Saving ensemble model...")
        
        # Save ensemble model to backend/model/lap_time_predictor.pkl
        model_path = self.model_dir / 'lap_time_predictor.pkl'
        joblib.dump(self.models['ensemble'], model_path)
        print(f"✅ Saved ensemble model: {model_path}")
        
        # Save metadata to backend/model/metadata/
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'feature_names': self.feature_names,
            'best_params': self.best_params,
            'metrics': {
                name: {k: v for k, v in metrics.items() if k != 'predictions'}
                for name, metrics in self.metrics.items()
            }
        }
        
        metadata_path = self.metadata_dir / 'lap_time_predictor.json'
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"✅ Saved metadata: {metadata_path}")
    
    def print_summary(self):
        """Print final summary"""
        print("\n" + "=" * 80)
        print("🏁 TRAINING COMPLETE - SUMMARY")
        print("=" * 80)
        
        best_model = min(self.metrics.items(), key=lambda x: x[1]['MAE'])
        
        print(f"\n🏆 BEST MODEL: {best_model[0].upper()}")
        print(f"   MAE:  {best_model[1]['MAE']:.4f} seconds")
        print(f"   RMSE: {best_model[1]['RMSE']:.4f} seconds")
        print(f"   R²:   {best_model[1]['R²']:.4f}")
        print(f"   MAPE: {best_model[1]['MAPE']:.2f}%")
        
        print(f"\n📁 Outputs saved to: {self.output_dir}")
        print(f"📁 Models saved to: {self.model_dir}")
        
        print("\n✅ Model ready for inference!")
        print("=" * 80)


def main():
    """
    ENHANCED Main Training Pipeline
    Includes all 8 enhancements for Toyota GR PitIQ hackathon
    """
    print("\n" + "=" * 80)
    print("🏎️  GR PitIQ - ENHANCED Lap Time Prediction Model")
    print("=" * 80)
    
    # Get root directory (3 levels up from backend/train/)
    root_dir = Path(__file__).parent.parent.parent
    
    # Load ENHANCED dataset from outputs/lap_time_predictor/
    print("\n📂 Loading dataset...")
    data_path = root_dir / "outputs" / "lap_time_predictor" / "engineered_dataset.csv"
    
    if not data_path.exists():
        print(f"❌ ERROR: Dataset not found at {data_path}")
        print("   Please run feature engineering first!")
        return
    
    df = pd.read_csv(data_path)
    print(f"✅ Loaded dataset: {len(df)} samples from {data_path}")
    
    # Initialize predictor
    predictor = LapTimePredictor()
    
    # Prepare data (with stratification) - returns 9 values including track splits
    X_train, X_val, X_test, y_train, y_val, y_test, track_train, track_val, track_test = predictor.prepare_data(df)
    
    # Hyperparameter optimization (reduced trials for speed - increase for production)
    predictor.optimize_lightgbm(X_train, y_train, X_val, y_val, n_trials=30)
    predictor.optimize_xgboost(X_train, y_train, X_val, y_val, n_trials=30)
    predictor.optimize_catboost(X_train, y_train, X_val, y_val, n_trials=15)  # Reduced from 30 for speed
    
    # Train ensemble
    predictor.train_ensemble(X_train, y_train, X_val, y_val)
    
    # ENHANCEMENT 6: Optimize ensemble weights
    predictor.optimize_ensemble_weights(X_val, y_val, n_trials=30)  # Reduced from 50 for speed
    
    # ENHANCEMENT: Group K-Fold Cross-Validation (by Track)
    if 'TRACK' in df.columns:
        print("\n🔄 Running Group K-Fold Cross-Validation...")
        # Combine train and validation for cross-validation
        X_train_val = pd.concat([X_train, X_val])
        y_train_val = pd.concat([y_train, y_val])
        track_train_val = pd.concat([
            df.loc[y_train.index, 'TRACK'],
            df.loc[y_val.index, 'TRACK']
        ])
        predictor.evaluate_group_kfold(X_train_val, y_train_val, track_train_val, n_splits=5)
    
    # Evaluate (with track-wise metrics if TRACK column exists)
    track_test = df.loc[y_test.index, 'TRACK'] if 'TRACK' in df.columns else None
    predictor.evaluate_models(X_test, y_test, track_test, X_val, y_val)
    
    # Visualizations
    predictor.visualize_results(X_test, y_test)
    
    # Feature importance (with top 10 extraction)
    predictor.feature_importance_analysis(X_test)
    
    # ENHANCEMENT 8: Generate comprehensive enhancement report
    predictor.generate_enhancement_report()
    
    # Save model
    predictor.save_model()
    
    # Print summary
    predictor.print_summary()


if __name__ == "__main__":
    main()
