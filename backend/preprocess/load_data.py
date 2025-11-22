"""
Professional Data Loading Pipeline for GR PitIQ Lap Time Prediction
Loads and merges 23-series (endurance), 26-series (weather), 99-series (best laps) data
Backend standalone version
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings('ignore')


class GRPitIQDataLoader:
    """Expert-level data loader for racing datasets"""
    
    def __init__(self, dataset_path: str = None, include_pit_laps: bool = False):
        if dataset_path is None:
            # Get root directory (3 levels up from backend/preprocess/)
            root_dir = Path(__file__).parent.parent.parent
            self.dataset_path = root_dir / "dataset"
        else:
            self.dataset_path = Path(dataset_path)
        
        self.tracks = ["barber", "COTA", "Road America", "Sebring", "Sonoma", "VIR"]
        self.races = [1, 2]
        self.include_pit_laps = include_pit_laps  # Option to keep pit laps for pit strategy predictor
        
    def load_all_data(self) -> pd.DataFrame:
        """
        Load and merge all datasets across all tracks and races
        Returns: Merged DataFrame with lap-level features
        """
        print("=" * 80)
        print("🏎️  GR PitIQ Data Loading Pipeline")
        print("=" * 80)
        print(f"📂 Dataset path: {self.dataset_path}")
        
        all_data = []
        
        for track in self.tracks:
            for race in self.races:
                print(f"\n📂 Loading {track} - Race {race}...")
                
                try:
                    # Load endurance analysis (23-series) - PRIMARY DATA
                    endurance_df = self._load_endurance_data(track, race)
                    
                    # Load weather data (26-series)
                    weather_df = self._load_weather_data(track, race)
                    
                    # Load best laps (99-series)
                    best_laps_df = self._load_best_laps(track, race)
                    
                    # Merge datasets
                    merged_df = self._merge_datasets(
                        endurance_df, weather_df, best_laps_df, track, race
                    )
                    
                    all_data.append(merged_df)
                    print(f"✅ Loaded {len(merged_df)} laps from {track} Race {race}")
                    
                except Exception as e:
                    print(f"❌ Error loading {track} Race {race}: {str(e)}")
                    continue
        
        # Combine all data
        final_df = pd.concat(all_data, ignore_index=True)
        
        print("\n" + "=" * 80)
        print(f"✅ TOTAL LOADED: {len(final_df)} laps from {len(all_data)} race sessions")
        print("=" * 80)
        
        return final_df
    
    def _load_endurance_data(self, track: str, race: int) -> pd.DataFrame:
        """Load 23-series endurance analysis files"""
        
        # Handle different folder structures
        if track == "barber":
            file_path = self.dataset_path / track / f"23_AnalysisEnduranceWithSections_Race {race}_Anonymized.CSV"
        else:
            file_path = self.dataset_path / track / f"Race {race}" / f"23_AnalysisEnduranceWithSections_Race {race}_Anonymized.CSV"
            # Alternative naming
            if not file_path.exists():
                file_path = self.dataset_path / track / f"Race {race}" / f"23_AnalysisEnduranceWithSections_ Race {race}_Anonymized.CSV"
        
        if not file_path.exists():
            raise FileNotFoundError(f"Endurance file not found: {file_path}")
        
        df = pd.read_csv(file_path, delimiter=';')
        
        # Clean column names
        df.columns = df.columns.str.strip()
        
        # Parse lap time from MM:SS.mmm to seconds
        df['LAP_TIME_SECONDS'] = df['LAP_TIME'].apply(self._parse_lap_time)
        df['S1_SECONDS'] = pd.to_numeric(df['S1_SECONDS'], errors='coerce')
        df['S2_SECONDS'] = pd.to_numeric(df['S2_SECONDS'], errors='coerce')
        df['S3_SECONDS'] = pd.to_numeric(df['S3_SECONDS'], errors='coerce')
        
        # Convert numeric columns
        numeric_cols = ['LAP_NUMBER', 'KPH', 'TOP_SPEED', 'PIT_TIME', 
                       'LAP_IMPROVEMENT', 'S1_IMPROVEMENT', 'S2_IMPROVEMENT', 'S3_IMPROVEMENT']
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Remove invalid laps and optionally filter out pit laps
        if self.include_pit_laps:
            # Keep all laps including pit laps (for pit strategy predictor)
            df = df[
                (df['LAP_TIME_SECONDS'] > 0) &
                (df['LAP_TIME_SECONDS'] < 300)  # Remove outliers > 5 minutes
            ].copy()
        else:
            # Remove pit laps (for other predictors)
            df = df[
                (df['LAP_TIME_SECONDS'] > 0) &
                (df['LAP_TIME_SECONDS'] < 300) &  # Remove outliers > 5 minutes
                (df['CROSSING_FINISH_LINE_IN_PIT'].isna() | (df['CROSSING_FINISH_LINE_IN_PIT'] == ''))
            ].copy()
        
        return df
    
    def _load_weather_data(self, track: str, race: int) -> pd.DataFrame:
        """Load 26-series weather files"""
        
        if track == "barber":
            file_path = self.dataset_path / track / f"26_Weather_Race {race}_Anonymized.CSV"
        else:
            file_path = self.dataset_path / track / f"Race {race}" / f"26_Weather_Race {race}_Anonymized.CSV"
            # Alternative naming
            if not file_path.exists():
                file_path = self.dataset_path / track / f"Race {race}" / f"26_Weather_ Race {race}_Anonymized.CSV"
        
        if not file_path.exists():
            # Return default weather if not available
            return pd.DataFrame({
                'AIR_TEMP': [25.0],
                'TRACK_TEMP': [30.0],
                'HUMIDITY': [60.0],
                'RAIN': [0]
            })
        
        df = pd.read_csv(file_path, delimiter=';')
        df.columns = df.columns.str.strip()
        
        # Use mean values (weather is relatively stable during race)
        weather_summary = {
            'AIR_TEMP': df['AIR_TEMP'].mean(),
            'TRACK_TEMP': df['TRACK_TEMP'].fillna(df['AIR_TEMP'] * 1.2).mean(),  # Estimate if missing
            'HUMIDITY': df['HUMIDITY'].mean(),
            'RAIN': df['RAIN'].max(),  # 1 if it rained at any point
            'WIND_SPEED': df['WIND_SPEED'].mean() if 'WIND_SPEED' in df.columns else 0,
        }
        
        return pd.DataFrame([weather_summary])
    
    def _load_best_laps(self, track: str, race: int) -> pd.DataFrame:
        """Load 99-series best laps by driver"""
        
        if track == "barber":
            file_path = self.dataset_path / track / f"99_Best 10 Laps By Driver_Race {race}_Anonymized.CSV"
        else:
            file_path = self.dataset_path / track / f"Race {race}" / f"99_Best 10 Laps By Driver_Race {race}_Anonymized.CSV"
            # Alternative naming
            if not file_path.exists():
                file_path = self.dataset_path / track / f"Race {race}" / f"99_Best 10 Laps By Driver_ Race {race}_Anonymized.CSV"
        
        if not file_path.exists():
            return pd.DataFrame()
        
        df = pd.read_csv(file_path, delimiter=';')
        df.columns = df.columns.str.strip()
        
        # Parse best lap times
        df['BEST_LAP_SECONDS'] = df['BESTLAP_1'].apply(self._parse_lap_time)
        df['AVG_TOP10_SECONDS'] = df['AVERAGE'].apply(self._parse_lap_time)
        
        # Keep only relevant columns
        df = df[['NUMBER', 'BEST_LAP_SECONDS', 'AVG_TOP10_SECONDS', 'TOTAL_DRIVER_LAPS']].copy()
        
        return df
    
    def _merge_datasets(self, endurance_df: pd.DataFrame, weather_df: pd.DataFrame, 
                       best_laps_df: pd.DataFrame, track: str, race: int) -> pd.DataFrame:
        """Merge all datasets into single DataFrame"""
        
        # Add track and race identifiers
        endurance_df['TRACK'] = track
        endurance_df['RACE'] = race
        
        # Merge weather (broadcast to all laps)
        for col in weather_df.columns:
            endurance_df[col] = weather_df[col].iloc[0]
        
        # Merge best laps by driver number
        if not best_laps_df.empty:
            endurance_df = endurance_df.merge(
                best_laps_df,
                on='NUMBER',
                how='left'
            )
        
        return endurance_df
    
    @staticmethod
    def _parse_lap_time(time_str: str) -> float:
        """Convert lap time from MM:SS.mmm to seconds"""
        if pd.isna(time_str) or time_str == '':
            return np.nan
        
        try:
            if ':' in str(time_str):
                parts = str(time_str).split(':')
                minutes = int(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
            else:
                return float(time_str)
        except:
            return np.nan


if __name__ == "__main__":
    """Test the data loader"""
    loader = GRPitIQDataLoader()
    df = loader.load_all_data()
    
    print("\n📊 Dataset Summary:")
    print(f"   Total Laps: {len(df)}")
    print(f"   Unique Drivers: {df['NUMBER'].nunique()}")
    print(f"   Tracks: {df['TRACK'].nunique()}")
    print(f"   Features: {len(df.columns)}")
    
    print("\n📈 Sample Data:")
    print(df[['TRACK', 'RACE', 'NUMBER', 'LAP_NUMBER', 'LAP_TIME_SECONDS', 
             'S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS', 'KPH', 'AIR_TEMP']].head(10))
