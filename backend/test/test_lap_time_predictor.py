"""
Test Suite for Lap Time Predictor Model
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pandas as pd
import numpy as np
import joblib
import json
from tqdm import tqdm


class LapTimePredictorTester:
    
    def __init__(self):
        self.root_dir = Path(__file__).parent.parent.parent
        self.model_dir = self.root_dir / "backend" / "model"
        self.metadata_dir = self.root_dir / "backend" / "model" / "metadata"
        self.output_dir = self.root_dir / "outputs" / "lap_time_predictor"
        self.model = None
        self.metadata = None
        
    def load_model(self):
        print("\n" + "=" * 80)
        print("📦 Loading Model")
        print("=" * 80)
        
        model_path = self.model_dir / "lap_time_predictor.pkl"
        self.model = joblib.load(model_path)
        print(f"✅ Model loaded")
        
        metadata_path = self.metadata_dir / "lap_time_predictor.json"
        if metadata_path.exists():
            with open(metadata_path, 'r') as f:
                self.metadata = json.load(f)
            print(f"✅ Metadata loaded | Features: {len(self.metadata.get('feature_names', []))}")
        
    def test_all_cases(self):
        """TEST 1: Test all valid samples"""
        print("\n" + "=" * 80)
        print("📊 TEST 1: ALL CASES")
        print("=" * 80)
        
        data_path = self.output_dir / "engineered_dataset.csv"
        df = pd.read_csv(data_path, low_memory=False)
        print(f"Loaded {len(df)} rows")
        
        # Filter valid samples
        df_valid = df[(df['LAP_TIME_SECONDS'] >= 60) & (df['LAP_TIME_SECONDS'] <= 300)].copy()
        if 'CROSSING_FINISH_LINE_IN_PIT' in df_valid.columns and df_valid['CROSSING_FINISH_LINE_IN_PIT'].notna().any():
            df_valid = df_valid[df_valid['CROSSING_FINISH_LINE_IN_PIT'] == 0]
        
        # Calculate next lap time
        df_valid = df_valid.sort_values(['TRACK', 'RACE', 'DRIVER_NUMBER', 'LAP_NUMBER'])
        df_valid['NEXT_LAP_TIME'] = df_valid.groupby(['TRACK', 'RACE', 'DRIVER_NUMBER'])['LAP_TIME_SECONDS'].shift(-1)
        df_valid = df_valid.dropna(subset=['NEXT_LAP_TIME'])
        
        # Test split
        test_size = int(len(df_valid) * 0.15)
        df_test = df_valid.iloc[-test_size:].copy()
        print(f"Test samples: {len(df_test)}")
        
        # Prepare features
        if self.metadata and 'feature_names' in self.metadata:
            feature_cols = self.metadata['feature_names']
        else:
            exclude_cols = ['TRACK', 'RACE', 'DRIVER_NUMBER', 'LAP_NUMBER', 'LAP_TIME_SECONDS', 'NEXT_LAP_TIME']
            feature_cols = [col for col in df_test.columns if col not in exclude_cols]
        
        available_features = [col for col in feature_cols if col in df_test.columns]
        X_test = df_test[available_features].copy()
        y_actual = df_test['NEXT_LAP_TIME'].values
        
        # Convert object columns to numeric
        for col in X_test.columns:
            if X_test[col].dtype == 'object':
                X_test[col] = pd.to_numeric(X_test[col], errors='coerce')
        
        # Fill missing values
        for col in X_test.columns:
            if X_test[col].isnull().any():
                X_test.loc[:, col] = X_test[col].fillna(X_test[col].median() if pd.notna(X_test[col].median()) else 0)
        
        # Predict
        print("Making predictions...")
        predictions = []
        for i in tqdm(range(0, len(X_test), 1000)):
            batch = X_test.iloc[i:i+1000]
            predictions.extend(self.model.predict(batch))
        
        predictions = np.array(predictions)
        errors = np.abs(predictions - y_actual)
        
        # Results
        print("\n" + "=" * 80)
        print("📈 RESULTS:")
        print(f"   Samples:       {len(predictions)}")
        print(f"   Avg Error:     {np.mean(errors):.3f}s")
        print(f"   Median Error:  {np.median(errors):.3f}s")
        print(f"   Min/Max:       {np.min(errors):.3f}s / {np.max(errors):.3f}s")
        
        # Per track
        print("\n🏁 Per-Track Performance:")
        results_df = df_test[['TRACK', 'RACE', 'LAP_NUMBER', 'DRIVER_NUMBER']].copy()
        results_df['ACTUAL'] = y_actual
        results_df['PREDICTED'] = predictions
        results_df['ERROR'] = errors
        
        for track in sorted(results_df['TRACK'].unique()):
            track_data = results_df[results_df['TRACK'] == track]
            print(f"   {track}: {track_data['ERROR'].mean():.3f}s ({len(track_data)} samples)")
        
        # Save
        output_path = self.output_dir / 'test_all_results.csv'
        results_df.to_csv(output_path, index=False)
        print(f"\n💾 Saved: {output_path}")
        print("=" * 80)
        
        return results_df
    
    def test_5_samples_per_track(self):
        """TEST 2: 5 samples per track with detailed output"""
        print("\n" + "=" * 80)
        print("🎯 TEST 2: 5 SAMPLES PER TRACK")
        print("=" * 80)
        
        data_path = self.output_dir / "engineered_dataset.csv"
        df = pd.read_csv(data_path, low_memory=False)
        
        # Filter valid samples
        df_valid = df[(df['LAP_TIME_SECONDS'] >= 60) & (df['LAP_TIME_SECONDS'] <= 300)].copy()
        if 'CROSSING_FINISH_LINE_IN_PIT' in df_valid.columns and df_valid['CROSSING_FINISH_LINE_IN_PIT'].notna().any():
            df_valid = df_valid[df_valid['CROSSING_FINISH_LINE_IN_PIT'] == 0]
        
        df_valid = df_valid.sort_values(['TRACK', 'RACE', 'DRIVER_NUMBER', 'LAP_NUMBER'])
        df_valid['NEXT_LAP_TIME'] = df_valid.groupby(['TRACK', 'RACE', 'DRIVER_NUMBER'])['LAP_TIME_SECONDS'].shift(-1)
        df_valid = df_valid.dropna(subset=['NEXT_LAP_TIME'])
        
        # Prepare features
        if self.metadata and 'feature_names' in self.metadata:
            feature_cols = self.metadata['feature_names']
        else:
            exclude_cols = ['TRACK', 'RACE', 'DRIVER_NUMBER', 'LAP_NUMBER', 'LAP_TIME_SECONDS', 'NEXT_LAP_TIME']
            feature_cols = [col for col in df_valid.columns if col not in exclude_cols]
        
        available_features = [col for col in feature_cols if col in df_valid.columns]
        all_results = []
        
        # Process each track
        tracks = sorted(df_valid['TRACK'].unique())
        print(f"Testing {len(tracks)} tracks...")
        
        for track in tracks:
            print(f"\n{'=' * 80}")
            print(f"📍 {track}")
            print(f"{'=' * 80}")
            
            track_data = df_valid[df_valid['TRACK'] == track]
            n_samples = min(5, len(track_data))
            samples = track_data.sample(n=n_samples, random_state=42)
            
            for idx, row in samples.iterrows():
                X = row[available_features].to_frame().T
                
                # Convert object columns to numeric
                for col in X.columns:
                    if X[col].dtype == 'object':
                        X[col] = pd.to_numeric(X[col], errors='coerce')
                
                # Fill missing
                for col in X.columns:
                    if X[col].isnull().any():
                        # Get median from df_valid, converting to numeric if needed
                        col_data = df_valid[col]
                        if col_data.dtype == 'object':
                            col_data = pd.to_numeric(col_data, errors='coerce')
                        median_val = col_data.median() if col_data.notna().any() else 0
                        X[col] = X[col].fillna(median_val if pd.notna(median_val) else 0)
                
                prediction = self.model.predict(X)[0]
                actual = row['NEXT_LAP_TIME']
                error = abs(prediction - actual)
                
                all_results.append({
                    'TRACK': track,
                    'RACE': int(row['RACE']),
                    'DRIVER': int(row['DRIVER_NUMBER']),
                    'LAP': int(row['LAP_NUMBER']),
                    'CURRENT': row['LAP_TIME_SECONDS'],
                    'PREDICTED': prediction,
                    'ACTUAL': actual,
                    'ERROR': error
                })
                
                status = "✅" if error < 0.5 else "⚠️" if error < 2.0 else "❌"
                print(f"  Lap {int(row['LAP_NUMBER'])} | R{int(row['RACE'])} | D{int(row['DRIVER_NUMBER'])}")
                print(f"  Current: {row['LAP_TIME_SECONDS']:.3f}s")
                print(f"  Predicted: {prediction:.3f}s | Actual: {actual:.3f}s | Error: {error:.3f}s {status}")
        
        # Overall stats
        results_df = pd.DataFrame(all_results)
        print(f"\n{'=' * 80}")
        print("📊 OVERALL:")
        print(f"   Samples: {len(results_df)}")
        print(f"   Avg Error: {results_df['ERROR'].mean():.3f}s")
        print(f"   Median: {results_df['ERROR'].median():.3f}s")
        print(f"   Min/Max: {results_df['ERROR'].min():.3f}s / {results_df['ERROR'].max():.3f}s")
        
        # Save
        output_path = self.output_dir / 'test_5_samples_results.csv'
        results_df.to_csv(output_path, index=False)
        print(f"\n💾 Saved: {output_path}")
        print("=" * 80)
        
        return results_df
    
    def run_all_tests(self):
        self.load_model()
        self.test_all_cases()
        self.test_5_samples_per_track()
        print("\n✅ All tests completed!")


def main():
    tester = LapTimePredictorTester()
    tester.run_all_tests()


if __name__ == "__main__":
    main()
