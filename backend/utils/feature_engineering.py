"""
Expert-Level Feature Engineering for Lap Time Prediction
Creates 40+ engineered features from racing data
Enhanced with: Percentile outlier filtering, weather deltas, driver encoding,
track normalization, and feature scaling
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, RobustScaler, StandardScaler
import warnings
warnings.filterwarnings('ignore')


class RacingFeatureEngineer:
    """Advanced feature engineering for motorsport data with enhancements"""
    
    def __init__(self, scaler_type='robust'):
        """
        Initialize feature engineer
        
        Args:
            scaler_type (str): 'robust' (default, outlier-resistant) or 'standard' (traditional)
        """
        self.label_encoders = {}
        
        # Choose scaler type
        if scaler_type == 'standard':
            self.scaler = StandardScaler()
            print("⚙️  Using StandardScaler for feature scaling")
        else:
            self.scaler = RobustScaler()  # More robust to outliers (default)
            print("⚙️  Using RobustScaler for feature scaling")
        
        self.scaler_type = scaler_type
        self.outlier_stats = {}
        self.track_avg_laptimes = {}  # For track normalization
        
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Create comprehensive feature set with ENHANCED outlier handling,
        weather deltas, driver encoding, track normalization, and feature scaling
        Returns: DataFrame with 50+ engineered features
        """
        print("\n" + "=" * 80)
        print("⚙️  ENHANCED Feature Engineering Pipeline")
        print("=" * 80)
        
        df = df.copy()
        original_count = len(df)
        
        # 0. ENHANCED OUTLIER FILTERING (2nd-98th percentile per track)
        df = self._filter_outliers_enhanced(df, original_count)
        
        # 1. WEATHER DELTA FEATURES (NEW)
        df = self._create_weather_delta_features(df)
        print("✅ Created weather delta features (ΔTemp, ΔHumidity, etc.)")
        
        # 2. DRIVER ENCODING (NEW)
        df = self._create_driver_encoding(df)
        print("✅ Created driver embedding features")
        
        # 3. TRACK NORMALIZATION (NEW)
        df = self._create_track_normalization(df)
        print("✅ Created track-normalized lap time features")
        
        # 3b. TRACK METADATA (NEW) - Add static track characteristics
        df = self._add_track_metadata(df)
        print("✅ Added track metadata (length, complexity, category)")
        
        # 4. Sector-based features with rolling smoothing
        df = self._create_sector_features(df)
        print("✅ Created sector-based features with rolling smoothing")
        
        # 5. Tire degradation features (with absolute tire age)
        df = self._create_tire_features(df)
        print("✅ Created tire degradation features (absolute tire age)")
        
        # 6. Weather interaction features
        df = self._create_weather_features(df)
        print("✅ Created weather interaction features")
        
        # 7. Driver performance features
        df = self._create_driver_features(df)
        print("✅ Created driver performance features")
        
        # 8. Lap progression features
        df = self._create_lap_progression_features(df)
        print("✅ Created lap progression features")
        
        # 9. Speed-based features (with track-normalized speeds)
        df = self._create_speed_features(df)
        print("✅ Created speed-based features (track-normalized)")
        
        # 10. Track and race features (with track encoding)
        df = self._create_track_features(df)
        print("✅ Created track/race encoding features (TrackID encoded)")
        
        # 11. Rolling statistics (enhanced)
        df = self._create_rolling_features(df)
        print("✅ Created rolling statistics features")
        
        # 12. Improvement momentum features
        df = self._create_momentum_features(df)
        print("✅ Created improvement momentum features")
        
        # 13. Pit stop features
        df = self._create_pit_features(df)
        print("✅ Created pit stop features")
        
        # 13b. WEATHER BALANCING (NEW) - Oversample rare weather conditions
        df = self._balance_weather_conditions(df)
        print("✅ Balanced weather conditions (oversampled wet laps)")
        
        # 14. FEATURE SCALING (NEW) - Apply RobustScaler to numeric features
        df = self._apply_feature_scaling(df)
        print("✅ Applied RobustScaler to numeric features")
        
        print("\n" + "=" * 80)
        print(f"✅ TOTAL FEATURES: {len(df.columns)}")
        print(f"✅ Outlier removal stats: {self.outlier_stats}")
        print("=" * 80)
        
        return df
    
    def _filter_outliers_enhanced(self, df: pd.DataFrame, original_count: int) -> pd.DataFrame:
        """
        ENHANCED: Remove outliers using 2nd-98th percentile per track
        More robust than mean+3*std approach
        """
        
        # Filter 1: Remove pit laps
        pit_filter_count = len(df)
        if 'CROSSING_FINISH_LINE_IN_PIT' in df.columns:
            df = df[df['CROSSING_FINISH_LINE_IN_PIT'] != 1].copy()
        
        if 'PIT_TIME' in df.columns:
            df = df[(df['PIT_TIME'].isna()) | (df['PIT_TIME'] == 0)].copy()
        
        pit_removed = pit_filter_count - len(df)
        
        # Filter 2: Per-track 2nd-98th percentile filtering
        percentile_removed = 0
        filtered_dfs = []
        
        for track in df['TRACK'].unique():
            track_df = df[df['TRACK'] == track].copy()
            track_count_before = len(track_df)
            
            # Calculate 2nd and 98th percentiles for this track
            p2 = track_df['LAP_TIME_SECONDS'].quantile(0.02)
            p98 = track_df['LAP_TIME_SECONDS'].quantile(0.98)
            
            # Filter outliers
            track_df = track_df[
                (track_df['LAP_TIME_SECONDS'] >= p2) &
                (track_df['LAP_TIME_SECONDS'] <= p98)
            ].copy()
            
            percentile_removed += (track_count_before - len(track_df))
            filtered_dfs.append(track_df)
        
        df = pd.concat(filtered_dfs, ignore_index=True)
        
        # Filter 3: Remove unrealistic lap times (safety bounds)
        safety_count = len(df)
        df = df[df['LAP_TIME_SECONDS'] > 60].copy()  # Minimum 60s
        df = df[df['LAP_TIME_SECONDS'] < 300].copy()  # Maximum 300s (5 min)
        safety_removed = safety_count - len(df)
        
        # Store stats
        self.outlier_stats = {
            'original': original_count,
            'pit_laps_removed': pit_removed,
            'percentile_outliers_removed': percentile_removed,
            'safety_bounds_removed': safety_removed,
            'final': len(df),
            'total_removed': original_count - len(df),
            'removal_percentage': ((original_count - len(df)) / original_count) * 100
        }
        
        print(f"✅ Enhanced outlier filtering:")
        print(f"   - Pit laps removed: {pit_removed}")
        print(f"   - 2nd-98th percentile outliers: {percentile_removed}")
        print(f"   - Safety bounds removed: {safety_removed}")
        print(f"   - Total: {original_count} → {len(df)} ({self.outlier_stats['removal_percentage']:.2f}% removed)")
        
        return df
    
    def _create_weather_delta_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        NEW: Create weather change features (ΔTemp, ΔHumidity, etc.)
        Captures environmental transitions between laps
        """
        
        # Sort by track, race, and lap number
        df = df.sort_values(['TRACK', 'RACE', 'NUMBER', 'LAP_NUMBER'])
        
        # Calculate deltas (differences from previous lap)
        weather_cols = ['TRACK_TEMP', 'AIR_TEMP', 'HUMIDITY']
        
        for col in weather_cols:
            if col in df.columns:
                delta_col = f'DELTA_{col}'
                df[delta_col] = df.groupby(['TRACK', 'RACE', 'NUMBER'])[col].diff().fillna(0)
        
        # Add rain change indicator
        if 'RAIN' in df.columns:
            df['DELTA_RAIN'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['RAIN'].diff().fillna(0)
            df['RAIN_START'] = (df['DELTA_RAIN'] > 0).astype(int)
            df['RAIN_STOP'] = (df['DELTA_RAIN'] < 0).astype(int)
        
        # Wind speed change
        if 'WIND_SPEED' in df.columns:
            df['DELTA_WIND_SPEED'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['WIND_SPEED'].diff().fillna(0)
        
        # Combined weather volatility index
        delta_cols = [c for c in df.columns if c.startswith('DELTA_')]
        if delta_cols:
            df['WEATHER_VOLATILITY'] = df[delta_cols].abs().sum(axis=1)
        
        return df
    
    def _create_driver_encoding(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        NEW: Encode driver ID to capture driver-specific pace and consistency
        Uses label encoding for numerical representation with fallback for unseen labels
        """
        
        if 'NUMBER' in df.columns:
            # Create driver ID encoding with unseen label handling
            if 'DRIVER' not in self.label_encoders:
                self.label_encoders['DRIVER'] = LabelEncoder()
                df['DRIVER_ID'] = self.label_encoders['DRIVER'].fit_transform(df['NUMBER'].astype(str))
            else:
                # Handle unseen labels gracefully
                driver_numbers = df['NUMBER'].astype(str)
                known_labels = set(self.label_encoders['DRIVER'].classes_)
                
                # Map known labels, use -1 for unseen
                df['DRIVER_ID'] = driver_numbers.apply(
                    lambda x: self.label_encoders['DRIVER'].transform([x])[0] if x in known_labels else -1
                )
            
            # Driver performance statistics (target encoding)
            driver_stats = df.groupby('NUMBER').agg({
                'LAP_TIME_SECONDS': ['mean', 'std', 'min'],
                'BEST_LAP_SECONDS': 'mean'
            }).reset_index()
            
            driver_stats.columns = ['NUMBER', 'DRIVER_AVG_LAPTIME', 'DRIVER_STD_LAPTIME', 
                                    'DRIVER_BEST_LAPTIME', 'DRIVER_AVG_BEST']
            
            df = df.merge(driver_stats, on='NUMBER', how='left')
            
            # Driver pace relative to track average
            track_avg = df.groupby('TRACK')['LAP_TIME_SECONDS'].transform('mean')
            df['DRIVER_PACE_VS_TRACK'] = df['DRIVER_AVG_LAPTIME'] / track_avg
            
            # Driver consistency score (inverse of std dev)
            df['DRIVER_CONSISTENCY'] = 1.0 / (df['DRIVER_STD_LAPTIME'] + 0.1)
        
        return df
    
    def _create_track_normalization(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        NEW: Create track-normalized lap time features
        Formula: LapTimeNorm = LapTime / TrackAvgLapTime
        Helps model learn relative performance across different track lengths
        """
        
        # Calculate average lap time per track (proxy for track length)
        if not self.track_avg_laptimes:
            self.track_avg_laptimes = df.groupby('TRACK')['LAP_TIME_SECONDS'].mean().to_dict()
        
        df['TRACK_AVG_LAPTIME'] = df['TRACK'].map(self.track_avg_laptimes)
        
        # Normalized lap time (relative to track average)
        df['LAP_TIME_NORMALIZED'] = df['LAP_TIME_SECONDS'] / df['TRACK_AVG_LAPTIME']
        
        # Normalized sector times
        for sector in ['S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS']:
            if sector in df.columns:
                sector_avg = df.groupby('TRACK')[sector].transform('mean')
                df[f'{sector}_NORMALIZED'] = df[sector] / sector_avg
        
        # Track length factor (for de-normalization during prediction)
        df['TRACK_LENGTH_FACTOR'] = df['TRACK_AVG_LAPTIME']
        
        # Performance relative to track record
        df['PERF_VS_TRACK_RECORD'] = df['LAP_TIME_SECONDS'] / df.groupby('TRACK')['LAP_TIME_SECONDS'].transform('min')
        
        return df
    
    def _add_track_metadata(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Add static track metadata features
        - Track length in kilometers
        - Complexity score (1-5, based on turn count and elevation)
        - Track category (Short/Medium/Long)
        """
        
        # Track metadata dictionary with accurate information
        track_metadata = {
            "COTA": {
                "TrackLengthKm": 5.513,
                "TrackComplexity": 5,  # 20 turns, significant elevation
                "TrackCategory": "Long"
            },
            "Road America": {
                "TrackLengthKm": 6.515,
                "TrackComplexity": 4,  # 14 turns, some elevation
                "TrackCategory": "Long"
            },
            "Sebring": {
                "TrackLengthKm": 6.02,
                "TrackComplexity": 4,  # 17 turns, bumpy surface
                "TrackCategory": "Long"
            },
            "Sonoma": {
                "TrackLengthKm": 3.22,
                "TrackComplexity": 3,  # 12 turns, hilly
                "TrackCategory": "Short"
            },
            "VIR": {
                "TrackLengthKm": 5.26,
                "TrackComplexity": 4,  # 17 turns, elevation changes
                "TrackCategory": "Medium"
            },
            "barber": {
                "TrackLengthKm": 3.83,
                "TrackComplexity": 3,  # 17 turns, technical
                "TrackCategory": "Short"
            }
        }
        
        # Map metadata to dataframe
        df['TRACK_LENGTH_KM'] = df['TRACK'].map(lambda x: track_metadata.get(x, {}).get('TrackLengthKm', 5.0))
        df['TRACK_COMPLEXITY'] = df['TRACK'].map(lambda x: track_metadata.get(x, {}).get('TrackComplexity', 3))
        
        # Encode track category
        category_map = {'Short': 1, 'Medium': 2, 'Long': 3}
        df['TRACK_CATEGORY'] = df['TRACK'].map(
            lambda x: category_map.get(track_metadata.get(x, {}).get('TrackCategory', 'Medium'), 2)
        )
        
        # Additional derived features
        df['TURNS_PER_KM'] = df['TRACK_COMPLEXITY'] / df['TRACK_LENGTH_KM']  # Turn density
        df['TRACK_DIFFICULTY'] = df['TRACK_COMPLEXITY'] * df['TRACK_LENGTH_KM']  # Overall difficulty
        
        return df
    
    def _create_sector_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Sector time analysis features with rolling smoothing"""
        
        # Rolling mean of sectors over last 3 laps (for smoothing)
        df['S1_ROLLING_MEAN_3'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['S1_SECONDS'].transform(
            lambda x: x.rolling(window=3, min_periods=1).mean()
        )
        df['S2_ROLLING_MEAN_3'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['S2_SECONDS'].transform(
            lambda x: x.rolling(window=3, min_periods=1).mean()
        )
        df['S3_ROLLING_MEAN_3'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['S3_SECONDS'].transform(
            lambda x: x.rolling(window=3, min_periods=1).mean()
        )
        
        # Sector variance (consistency)
        df['SECTOR_VARIANCE'] = df[['S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS']].var(axis=1)
        df['SECTOR_STD'] = df[['S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS']].std(axis=1)
        
        # Sector ratios
        df['S1_RATIO'] = df['S1_SECONDS'] / df['LAP_TIME_SECONDS']
        df['S2_RATIO'] = df['S2_SECONDS'] / df['LAP_TIME_SECONDS']
        df['S3_RATIO'] = df['S3_SECONDS'] / df['LAP_TIME_SECONDS']
        
        # Dominant sector (which sector is slowest)
        df['SLOWEST_SECTOR'] = df[['S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS']].idxmax(axis=1)
        # Extract sector number: 'S1_SECONDS' -> 1, 'S2_SECONDS' -> 2, 'S3_SECONDS' -> 3
        df['SLOWEST_SECTOR'] = df['SLOWEST_SECTOR'].str.extract(r'S(\d)')[0]
        # Convert to int, filling NaN with 0
        df['SLOWEST_SECTOR'] = pd.to_numeric(df['SLOWEST_SECTOR'], errors='coerce').fillna(0).astype(int)
        
        # Sector balance (ideal is even distribution)
        ideal_ratio = 1/3
        df['SECTOR_BALANCE'] = (
            abs(df['S1_RATIO'] - ideal_ratio) +
            abs(df['S2_RATIO'] - ideal_ratio) +
            abs(df['S3_RATIO'] - ideal_ratio)
        )
        
        # Combined sector improvements
        df['TOTAL_SECTOR_IMPROVEMENT'] = (
            df['S1_IMPROVEMENT'].fillna(0) +
            df['S2_IMPROVEMENT'].fillna(0) +
            df['S3_IMPROVEMENT'].fillna(0)
        )
        
        return df
    
    def _create_tire_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Tire wear and degradation simulation with absolute tire age"""
        
        # Simulate tire age (absolute laps since last pit)
        # Reset counter on pit stops or when LAP_NUMBER resets
        df['TIRE_AGE'] = 0
        for (track, race, number), group in df.groupby(['TRACK', 'RACE', 'NUMBER']):
            # Calculate tire age as cumulative laps
            tire_age = []
            current_age = 0
            prev_lap = 0
            
            for idx, row in group.iterrows():
                lap_num = row['LAP_NUMBER']
                # Reset if lap number went backwards (new stint)
                if lap_num < prev_lap:
                    current_age = 0
                
                current_age += 1
                tire_age.append(current_age)
                prev_lap = lap_num
            
            df.loc[group.index, 'TIRE_AGE'] = tire_age
        
        # Ensure TIRE_AGE is always positive
        df['TIRE_AGE'] = df['TIRE_AGE'].abs()
        
        # Degradation rate (lap time increase per lap)
        df['DEGRADATION_RATE'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_TIME_SECONDS'].transform(
            lambda x: x.diff().fillna(0)
        )
        
        # Cumulative degradation
        df['CUMULATIVE_DEGRADATION'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['DEGRADATION_RATE'].cumsum()
        
        # Degradation impact (tire age * degradation rate)
        df['DEGRADATION_IMPACT'] = df['TIRE_AGE'] * df['DEGRADATION_RATE'].abs()
        
        # Tire condition estimate (normalized)
        max_tire_age = df['TIRE_AGE'].max()
        if max_tire_age > 0:
            df['TIRE_CONDITION'] = 1.0 - (df['TIRE_AGE'] / max_tire_age)
        else:
            df['TIRE_CONDITION'] = 1.0
        
        return df
    
    def _create_weather_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Weather interaction features"""
        
        # Tire-temp effect (track temp vs air temp)
        df['TIRE_TEMP_EFFECT'] = df['TRACK_TEMP'] - df['AIR_TEMP']
        
        # Weather index (combined weather impact)
        df['WEATHER_INDEX'] = (df['HUMIDITY'] * 0.3 + df['RAIN'] * 70.0)
        
        # Grip estimate (lower is better grip)
        df['GRIP_ESTIMATE'] = (
            df['TRACK_TEMP'] * 0.01 +  # Higher temp = more grip
            df['RAIN'] * 5.0 -  # Rain = less grip
            df['HUMIDITY'] * 0.01  # High humidity = slightly less grip
        )
        
        # Temperature differential impact on lap time
        df['TEMP_DIFFERENTIAL'] = abs(df['AIR_TEMP'] - 25.0)  # Deviation from ideal 25°C
        
        # Wind impact (if available)
        if 'WIND_SPEED' in df.columns:
            df['WIND_IMPACT'] = df['WIND_SPEED'] * (1 + df['RAIN'])
        else:
            df['WIND_IMPACT'] = 0
        
        return df
    
    def _create_driver_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Driver skill and consistency metrics"""
        
        # Driver performance index (best lap vs current lap)
        df['DRIVER_PERFORMANCE_INDEX'] = df['BEST_LAP_SECONDS'] / df['LAP_TIME_SECONDS']
        
        # Gap to best lap (how far from optimal)
        df['GAP_TO_BEST'] = df['LAP_TIME_SECONDS'] - df['BEST_LAP_SECONDS']
        
        # Gap to average top 10
        df['GAP_TO_AVG_TOP10'] = df['LAP_TIME_SECONDS'] - df['AVG_TOP10_SECONDS']
        
        # Consistency score (inverse of lap time variance)
        df['CONSISTENCY_SCORE'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_TIME_SECONDS'].transform(
            lambda x: 1.0 / (x.std() + 0.001)  # Add small value to avoid division by zero
        )
        
        # Driver current form (avg of last 3 laps vs best)
        df['CURRENT_FORM'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_TIME_SECONDS'].transform(
            lambda x: x.rolling(window=3, min_periods=1).mean()
        ) / df['BEST_LAP_SECONDS']
        
        return df
    
    def _create_lap_progression_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Lap number and race progression features"""
        
        # Lap progression (normalized)
        df['LAP_PROGRESS'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_NUMBER'].transform(
            lambda x: x / x.max()
        )
        
        # Race phase (start, middle, end)
        df['RACE_PHASE'] = pd.cut(
            df['LAP_PROGRESS'],
            bins=[0, 0.33, 0.66, 1.0],
            labels=[1, 2, 3]  # 1=start, 2=middle, 3=end
        ).astype(int)
        
        # Laps remaining estimate
        df['LAPS_REMAINING'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_NUMBER'].transform(
            lambda x: x.max() - x
        )
        
        # Fresh tires indicator (first 5 laps)
        df['FRESH_TIRES'] = (df['TIRE_AGE'] <= 5).astype(int)
        
        # Old tires indicator (last 5 laps of stint)
        df['OLD_TIRES'] = (df['TIRE_AGE'] >= 15).astype(int)
        
        return df
    
    def _create_speed_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Speed-based features with track-normalized speeds"""
        
        # Track-normalized average speed (relative to track mean)
        df['AVG_SPEED_TRACK_NORM'] = df.groupby('TRACK')['KPH'].transform(
            lambda x: (x - x.mean()) / x.std() if x.std() > 0 else 0
        )
        
        # Track-normalized top speed
        df['TOP_SPEED_TRACK_NORM'] = df.groupby('TRACK')['TOP_SPEED'].transform(
            lambda x: (x - x.mean()) / x.std() if x.std() > 0 else 0
        )
        
        # Average sector speed
        df['AVG_SECTOR_SPEED'] = (
            (df['S1_SECONDS'] + df['S2_SECONDS'] + df['S3_SECONDS']) / 3
        )
        
        # Speed efficiency (top speed vs average speed)
        df['SPEED_EFFICIENCY'] = df['KPH'] / df['TOP_SPEED']
        
        # Top speed ratio vs lap time
        df['SPEED_TO_TIME_RATIO'] = df['TOP_SPEED'] / df['LAP_TIME_SECONDS']
        
        # Acceleration estimate (top speed / avg speed)
        df['ACCELERATION_ESTIMATE'] = df['TOP_SPEED'] / df['KPH']
        
        return df
    
    def _create_track_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Track and race categorical encoding with TrackID and unseen label handling"""
        
        # Label encode track (TrackID) with unseen label handling
        if 'TRACK' not in self.label_encoders:
            self.label_encoders['TRACK'] = LabelEncoder()
            df['TRACK_ID'] = self.label_encoders['TRACK'].fit_transform(df['TRACK'])
        else:
            # Handle unseen tracks gracefully
            tracks = df['TRACK']
            known_labels = set(self.label_encoders['TRACK'].classes_)
            
            # Map known labels, use -1 for unseen
            df['TRACK_ID'] = tracks.apply(
                lambda x: self.label_encoders['TRACK'].transform([x])[0] if x in known_labels else -1
            )
        
        # Keep legacy TRACK_ENCODED for compatibility
        df['TRACK_ENCODED'] = df['TRACK_ID']
        
        # Track difficulty (based on avg lap time)
        track_difficulty = df.groupby('TRACK')['LAP_TIME_SECONDS'].mean().to_dict()
        df['TRACK_DIFFICULTY'] = df['TRACK'].map(track_difficulty)
        
        # Normalize track difficulty
        if df['TRACK_DIFFICULTY'].max() != df['TRACK_DIFFICULTY'].min():
            df['TRACK_DIFFICULTY_NORM'] = (
                (df['TRACK_DIFFICULTY'] - df['TRACK_DIFFICULTY'].min()) /
                (df['TRACK_DIFFICULTY'].max() - df['TRACK_DIFFICULTY'].min())
            )
        else:
            df['TRACK_DIFFICULTY_NORM'] = 0.5
        
        return df
    
    def _create_rolling_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Rolling window statistics"""
        
        # Sort by driver and lap number
        df = df.sort_values(['TRACK', 'RACE', 'NUMBER', 'LAP_NUMBER'])
        
        # Rolling average lap time (last 3 laps)
        df['ROLLING_AVG_LAP_3'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_TIME_SECONDS'].transform(
            lambda x: x.rolling(window=3, min_periods=1).mean()
        )
        
        # Rolling average lap time (last 5 laps)
        df['ROLLING_AVG_LAP_5'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_TIME_SECONDS'].transform(
            lambda x: x.rolling(window=5, min_periods=1).mean()
        )
        
        # Rolling std (consistency over last 5 laps)
        df['ROLLING_STD_LAP_5'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_TIME_SECONDS'].transform(
            lambda x: x.rolling(window=5, min_periods=1).std().fillna(0)
        )
        
        # Rolling min (best lap in last 5)
        df['ROLLING_MIN_LAP_5'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_TIME_SECONDS'].transform(
            lambda x: x.rolling(window=5, min_periods=1).min()
        )
        
        # Trend (improving or degrading)
        df['LAP_TREND'] = df['LAP_TIME_SECONDS'] - df['ROLLING_AVG_LAP_5']
        
        return df
    
    def _create_momentum_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Improvement momentum and trends"""
        
        # Consecutive improvements
        df['CONSECUTIVE_IMPROVEMENTS'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['LAP_IMPROVEMENT'].transform(
            lambda x: (x > 0).astype(int).groupby((x <= 0).cumsum()).cumsum()
        )
        
        # Momentum score (weighted recent improvements)
        df['MOMENTUM_SCORE'] = (
            df['LAP_IMPROVEMENT'].fillna(0) * 0.5 +
            df['S1_IMPROVEMENT'].fillna(0) * 0.2 +
            df['S2_IMPROVEMENT'].fillna(0) * 0.2 +
            df['S3_IMPROVEMENT'].fillna(0) * 0.1
        )
        
        return df
    
    def _create_pit_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Pit stop impact features"""
        
        # Pit penalty (binary)
        df['PIT_PENALTY'] = (df['PIT_TIME'] > 0).astype(int)
        
        # Laps since pit
        df['LAPS_SINCE_PIT'] = df.groupby(['TRACK', 'RACE', 'NUMBER'])['PIT_PENALTY'].transform(
            lambda x: (~x.astype(bool)).cumsum() - (~x.astype(bool)).cumsum().where(x.astype(bool)).ffill().fillna(0)
        )
        
        return df
    
    def _balance_weather_conditions(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        ENHANCEMENT: Balance weather conditions using oversampling for wet laps
        Addresses weather imbalance where rain/wet conditions are underrepresented
        Uses RandomOverSampler (simpler than SMOTE for this use case)
        """
        
        if 'RAIN' not in df.columns:
            print("   No RAIN column found, skipping weather balancing")
            return df
        
        # Check rain distribution
        rain_counts = df['RAIN'].value_counts()
        total = len(df)
        
        # Only oversample if wet conditions are rare (< 10% of data)
        if 0 in rain_counts and rain_counts[0] / total > 0.9:
            wet_laps = df[df['RAIN'] > 0].copy()
            wet_count = len(wet_laps)
            
            if wet_count > 0:
                # Oversample wet laps to reach ~15% of dataset
                target_wet_count = int(total * 0.15)
                oversample_count = max(0, target_wet_count - wet_count)
                
                if oversample_count > 0:
                    # Simple random oversampling with replacement
                    oversampled = wet_laps.sample(n=oversample_count, replace=True, random_state=42)
                    df = pd.concat([df, oversampled], ignore_index=True)
                    
                    print(f"   Oversampled {oversample_count} wet laps ({wet_count} → {wet_count + oversample_count})")
                else:
                    print(f"   Weather already balanced (wet laps: {wet_count}/{total} = {wet_count/total*100:.1f}%)")
            else:
                print("   No wet laps found, skipping oversampling")
        else:
            dry_pct = rain_counts.get(0, 0) / total * 100
            print(f"   Weather distribution acceptable (dry: {dry_pct:.1f}%)")
        
        return df
    
    def _apply_feature_scaling(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        ENHANCEMENT 5: Apply RobustScaler to numeric features
        RobustScaler is more resistant to outliers than StandardScaler
        Excludes: Target variable, IDs, and categorical encoded columns
        """
        # Identify numeric columns to scale
        exclude_cols = [
            'LAP_TIME_SECONDS',  # Target variable - never scale
            'TRACK', 'RACE', 'NUMBER',  # IDs
            'DRIVER_ID', 'TRACK_ID',  # Categorical encoded
            'SLOWEST_SECTOR',  # Categorical
            'RAIN_START', 'RAIN_STOP',  # Binary
            'CROSSING_FINISH_LINE_IN_PIT'  # Binary
        ]
        
        # Get all numeric columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        
        # Filter out excluded columns
        cols_to_scale = [col for col in numeric_cols if col not in exclude_cols]
        
        if not cols_to_scale:
            print("⚠️  No numeric columns to scale")
            return df
        
        # Apply RobustScaler (fit and transform)
        df[cols_to_scale] = self.scaler.fit_transform(df[cols_to_scale])
        
        print(f"   Scaled {len(cols_to_scale)} numeric features with RobustScaler")
        
        return df


def main():
    """Test enhanced feature engineering"""
    print("Loading dataset...")
    # Try merged first, fall back to engineered
    try:
        df = pd.read_csv("../outputs/merged_dataset.csv")
        print("✅ Loaded merged_dataset.csv")
    except FileNotFoundError:
        # Use the existing engineered dataset as base (it has the merged data)
        print("⚠️  merged_dataset.csv not found, using existing engineered_dataset.csv as base")
        print("   (This will re-engineer features on already engineered data)")
        df = pd.read_csv("../outputs/engineered_dataset.csv")
        # Keep only original columns for clean re-engineering
        original_cols = ['TRACK', 'RACE', 'NUMBER', 'LAP_NUMBER', 'LAP_TIME_SECONDS', 
                        'S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS', 'BEST_LAP_SECONDS',
                        'AVG_TOP10_SECONDS', 'KPH', 'TOP_SPEED', 'TRACK_TEMP', 'AIR_TEMP',
                        'HUMIDITY', 'RAIN', 'WIND_SPEED', 'PIT_TIME', 'CROSSING_FINISH_LINE_IN_PIT',
                        'LAP_IMPROVEMENT', 'S1_IMPROVEMENT', 'S2_IMPROVEMENT', 'S3_IMPROVEMENT']
        available_cols = [c for c in original_cols if c in df.columns]
        if available_cols:
            df = df[available_cols].copy()
    
    print(f"\nOriginal features: {len(df.columns)}")
    
    engineer = RacingFeatureEngineer()
    df_engineered = engineer.engineer_features(df)
    
    print(f"\nEngineered features: {len(df_engineered.columns)}")
    print(f"New features added: {len(df_engineered.columns) - len(df.columns)}")
    
    print("\n📊 Sample of enhanced features:")
    feature_cols = [
        'LAP_TIME_SECONDS', 'LAP_TIME_NORMALIZED', 'DELTA_TRACK_TEMP', 'DRIVER_ID',
        'SECTOR_VARIANCE', 'TIRE_AGE', 'DRIVER_PACE_VS_TRACK', 'WEATHER_VOLATILITY'
    ]
    available_cols = [c for c in feature_cols if c in df_engineered.columns]
    print(df_engineered[available_cols].head(10))
    
    print("\n💾 Saving enhanced dataset...")
    df_engineered.to_csv("../outputs/enhanced_dataset.csv", index=False)
    print("✅ Saved to outputs/enhanced_dataset.csv")
    
    # Save outlier stats
    import json
    with open("../outputs/outlier_removal_stats.json", 'w') as f:
        json.dump(engineer.outlier_stats, f, indent=2)
    print("✅ Saved outlier stats to outputs/outlier_removal_stats.json")


def generate_features_from_live_input(data: dict, required_features: list) -> pd.DataFrame:
    """
    Convert live Zustand JSON data into model-ready features
    
    This function bridges the gap between real-time frontend data and the 98 features
    required by the lap time prediction model. It computes derived metrics from
    lap history and current state.
    
    Args:
        data (dict): Zustand store data from frontend containing:
            - trackName: str (e.g., "COTA")
            - currentLap: int (current lap number)
            - lapHistory: list of dicts with lap data
            - weather: dict (airTemp, trackTemp, rainfall, humidity, windSpeed)
            - tireAge, tireCompound, currentSpeed, avgSpeed, etc.
        required_features (list): List of feature names from model metadata
    
    Returns:
        pd.DataFrame: Single-row DataFrame with all 98 features aligned to model
    
    Features computed:
        - LAP_IMPROVEMENT: Previous lap time - current lap time (if improving, negative)
        - AVG_SPEED_TRACK_NORM: avgSpeed / 250 (normalized to typical max)
        - TOP_SPEED_TRACK_NORM: currentSpeed / 250
        - DELTA_TRACK_TEMP: Current track temp - previous lap track temp
        - DELTA_HUMIDITY: Current humidity - previous lap humidity
        - DRIVER_CONSISTENCY: std(lap times) / mean(lap times)
        - GRIP_ESTIMATE: (trackTemp × 0.01) - (rainfall × 0.005)
        - WEATHER_VOLATILITY: std([rainfall, humidity, windSpeed])
        - FUEL_RATIO: currentFuel / fuelCapacity
        - Sector improvements, rolling averages, and more
    """
    
    # Track metadata (static characteristics)
    TRACK_INFO = {
        'COTA': {'length_km': 5.513, 'complexity': 3, 'category': 2, 'turns_per_km': 3.63, 'difficulty': 8},
        'Road America': {'length_km': 6.515, 'complexity': 3, 'category': 2, 'turns_per_km': 2.30, 'difficulty': 7},
        'Sebring': {'length_km': 6.019, 'complexity': 3, 'category': 3, 'turns_per_km': 2.82, 'difficulty': 9},
        'Sonoma': {'length_km': 4.063, 'complexity': 2, 'category': 2, 'turns_per_km': 3.20, 'difficulty': 7},
        'VIR': {'length_km': 5.269, 'complexity': 3, 'category': 2, 'turns_per_km': 3.42, 'difficulty': 8},
        'barber': {'length_km': 3.830, 'complexity': 2, 'category': 2, 'turns_per_km': 4.44, 'difficulty': 6}
    }
    
    # Default track if not found
    DEFAULT_TRACK = {'length_km': 5.0, 'complexity': 2, 'category': 2, 'turns_per_km': 3.0, 'difficulty': 7}
    
    try:
        # Extract data from Zustand
        track_name = data.get('trackName', 'COTA')
        current_lap = data.get('currentLap', 1)
        lap_history = data.get('lapHistory', [])
        
        # Weather data
        weather = data.get('weather', {}) if 'weather' in data else data
        air_temp = weather.get('airTemp', data.get('airTemp', 25))
        track_temp = weather.get('trackTemp', data.get('trackTemp', 30))
        rainfall = weather.get('rainfall', data.get('rainfall', 0))
        humidity = weather.get('humidity', data.get('humidity', 50))
        wind_speed = weather.get('windSpeed', data.get('windSpeed', 10))
        
        # Tire data
        tire_age = data.get('tireAge', 0)
        tire_compound = data.get('tireCompound', 'Medium')
        
        # Fuel data
        current_fuel = data.get('currentFuel', 50)
        fuel_capacity = data.get('fuelCapacity', 50)
        
        # Speed data
        current_speed = data.get('currentSpeed', 0)
        avg_speed = data.get('avgSpeed', 0)
        
        # Calculate features
        features = {}
        
        # === BASIC IDENTIFIERS ===
        features['NUMBER'] = 1  # Placeholder driver number
        features['LAP_NUMBER'] = current_lap
        features['RACE'] = 1  # Assuming Race 1
        
        # === LAP HISTORY FEATURES ===
        if len(lap_history) >= 2:
            # Get last two laps
            prev_lap = lap_history[-1]
            prev_prev_lap = lap_history[-2] if len(lap_history) >= 2 else prev_lap
            
            prev_lap_time = prev_lap.get('lapTime', 90)
            prev_prev_lap_time = prev_prev_lap.get('lapTime', 90)
            
            # LAP_IMPROVEMENT (negative = faster)
            features['LAP_IMPROVEMENT'] = prev_prev_lap_time - prev_lap_time
            
            # Extract sector times from previous lap
            prev_sectors = prev_lap.get('sectorTimes', [0, 0, 0])
            prev_prev_sectors = prev_prev_lap.get('sectorTimes', [0, 0, 0]) if len(lap_history) >= 2 else prev_sectors
            
            # Sector times (use actual sector values, not divided by 3!)
            s1 = prev_sectors[0] if len(prev_sectors) > 0 and prev_sectors[0] > 0 else prev_lap_time / 3
            s2 = prev_sectors[1] if len(prev_sectors) > 1 and prev_sectors[1] > 0 else prev_lap_time / 3
            s3 = prev_sectors[2] if len(prev_sectors) > 2 and prev_sectors[2] > 0 else prev_lap_time / 3
            
            features['S1_SECONDS'] = s1
            features['S2_SECONDS'] = s2
            features['S3_SECONDS'] = s3
            
            # Sector improvements
            s1_prev = prev_prev_sectors[0] if len(prev_prev_sectors) > 0 else s1
            s2_prev = prev_prev_sectors[1] if len(prev_prev_sectors) > 1 else s2
            s3_prev = prev_prev_sectors[2] if len(prev_prev_sectors) > 2 else s3
            
            features['S1_IMPROVEMENT'] = s1_prev - s1
            features['S2_IMPROVEMENT'] = s2_prev - s2
            features['S3_IMPROVEMENT'] = s3_prev - s3
            
            # Speed from lap history
            features['KPH'] = prev_lap.get('avgSpeed', avg_speed)
            features['TOP_SPEED'] = prev_lap.get('topSpeed', current_speed)
            
            # Weather from previous lap
            prev_weather = prev_lap.get('weather', {})
            prev_air_temp = prev_weather.get('airTemp', air_temp)
            prev_track_temp = prev_weather.get('trackTemp', track_temp)
            prev_humidity = prev_weather.get('humidity', humidity)
            prev_rainfall = prev_weather.get('rainfall', rainfall)
            
            # Weather deltas
            features['DELTA_TRACK_TEMP'] = track_temp - prev_track_temp
            features['DELTA_AIR_TEMP'] = air_temp - prev_air_temp
            features['DELTA_HUMIDITY'] = humidity - prev_humidity
            features['DELTA_RAIN'] = 1 if rainfall > 0 and prev_rainfall == 0 else 0
            features['RAIN_START'] = 1 if features['DELTA_RAIN'] > 0 else 0
            features['RAIN_STOP'] = 1 if rainfall == 0 and prev_rainfall > 0 else 0
            features['DELTA_WIND_SPEED'] = wind_speed - prev_weather.get('windSpeed', wind_speed)
            
        else:
            # Not enough lap history - use defaults
            features['LAP_IMPROVEMENT'] = 0
            features['S1_IMPROVEMENT'] = 0
            features['S2_IMPROVEMENT'] = 0
            features['S3_IMPROVEMENT'] = 0
            features['S1_SECONDS'] = 30
            features['S2_SECONDS'] = 30
            features['S3_SECONDS'] = 30
            features['KPH'] = avg_speed if avg_speed > 0 else 200
            features['TOP_SPEED'] = current_speed if current_speed > 0 else 220
            features['DELTA_TRACK_TEMP'] = 0
            features['DELTA_AIR_TEMP'] = 0
            features['DELTA_HUMIDITY'] = 0
            features['DELTA_RAIN'] = 0
            features['RAIN_START'] = 0
            features['RAIN_STOP'] = 0
            features['DELTA_WIND_SPEED'] = 0
        
        # === WEATHER FEATURES ===
        features['AIR_TEMP'] = air_temp
        features['TRACK_TEMP'] = track_temp
        features['HUMIDITY'] = humidity
        features['RAIN'] = 1 if rainfall > 0 else 0
        features['WIND_SPEED'] = wind_speed
        
        # Weather volatility
        weather_values = [rainfall, humidity, wind_speed]
        features['WEATHER_VOLATILITY'] = np.std(weather_values) if len(weather_values) > 0 else 0
        
        # Grip estimate
        features['GRIP_ESTIMATE'] = (track_temp * 0.01) - (rainfall * 0.005)
        features['TEMP_DIFFERENTIAL'] = track_temp - air_temp
        features['WIND_IMPACT'] = wind_speed / 50.0  # Normalized
        features['WEATHER_INDEX'] = (air_temp * 0.3 + track_temp * 0.5 - rainfall * 0.2) / 50
        
        # === DRIVER STATISTICS ===
        if len(lap_history) >= 2:
            lap_times = [lap.get('lapTime', 90) for lap in lap_history]
            features['BEST_LAP_SECONDS'] = min(lap_times)
            features['AVG_TOP10_SECONDS'] = np.mean(sorted(lap_times)[:min(10, len(lap_times))])
            features['TOTAL_DRIVER_LAPS'] = len(lap_history)
            
            # CRITICAL: Set LAP_TIME_SECONDS from previous lap
            features['LAP_TIME_SECONDS'] = lap_times[-1]  # Last completed lap time
            
            # CRITICAL: Set AVG_LAP_TIME and STD_LAP_TIME
            features['AVG_LAP_TIME'] = np.mean(lap_times)
            features['STD_LAP_TIME'] = np.std(lap_times) if len(lap_times) > 1 else 0
            
            # Driver performance metrics
            features['DRIVER_AVG_LAPTIME'] = np.mean(lap_times)
            features['DRIVER_STD_LAPTIME'] = np.std(lap_times) if len(lap_times) > 1 else 0
            features['DRIVER_BEST_LAPTIME'] = min(lap_times)
            features['DRIVER_AVG_BEST'] = features['DRIVER_AVG_LAPTIME'] - features['DRIVER_BEST_LAPTIME']
            features['DRIVER_CONSISTENCY'] = features['DRIVER_STD_LAPTIME'] / features['DRIVER_AVG_LAPTIME'] if features['DRIVER_AVG_LAPTIME'] > 0 else 0
        else:
            features['BEST_LAP_SECONDS'] = 90
            features['AVG_TOP10_SECONDS'] = 90
            features['TOTAL_DRIVER_LAPS'] = current_lap
            
            # CRITICAL: Set defaults for missing lap history
            features['LAP_TIME_SECONDS'] = 90
            features['AVG_LAP_TIME'] = 90
            features['STD_LAP_TIME'] = 0
            
            features['DRIVER_AVG_LAPTIME'] = 90
            features['DRIVER_STD_LAPTIME'] = 0
            features['DRIVER_BEST_LAPTIME'] = 90
            features['DRIVER_AVG_BEST'] = 0
            features['DRIVER_CONSISTENCY'] = 0
        
        # === TRACK FEATURES ===
        track_info = TRACK_INFO.get(track_name, DEFAULT_TRACK)
        features['TRACK_LENGTH_KM'] = track_info['length_km']
        features['TRACK_COMPLEXITY'] = track_info['complexity']
        features['TRACK_CATEGORY'] = track_info['category']
        features['TURNS_PER_KM'] = track_info['turns_per_km']
        features['TRACK_DIFFICULTY'] = track_info['difficulty']
        features['TRACK_DIFFICULTY_NORM'] = track_info['difficulty'] / 10.0
        features['TRACK_LENGTH_FACTOR'] = track_info['length_km'] / 5.0  # Normalized to ~5km
        
        # Track-specific encoding
        features['TRACK_ID'] = list(TRACK_INFO.keys()).index(track_name) if track_name in TRACK_INFO else 0
        features['TRACK_ENCODED'] = features['TRACK_ID']
        
        # Track normalization
        features['TRACK_AVG_LAPTIME'] = features['DRIVER_AVG_LAPTIME']  # Use driver avg as proxy
        features['DRIVER_PACE_VS_TRACK'] = features['DRIVER_AVG_LAPTIME'] / features['TRACK_AVG_LAPTIME'] if features['TRACK_AVG_LAPTIME'] > 0 else 1.0
        features['LAP_TIME_NORMALIZED'] = features['DRIVER_AVG_LAPTIME'] / features['TRACK_LENGTH_KM']
        features['PERF_VS_TRACK_RECORD'] = features['BEST_LAP_SECONDS'] / 80.0  # Assume 80s track record
        
        # === SECTOR NORMALIZATION ===
        features['S1_SECONDS_NORMALIZED'] = features['S1_SECONDS'] / features['TRACK_LENGTH_KM']
        features['S2_SECONDS_NORMALIZED'] = features['S2_SECONDS'] / features['TRACK_LENGTH_KM']
        features['S3_SECONDS_NORMALIZED'] = features['S3_SECONDS'] / features['TRACK_LENGTH_KM']
        
        # === SECTOR STATISTICS ===
        sector_times = [features['S1_SECONDS'], features['S2_SECONDS'], features['S3_SECONDS']]
        features['SECTOR_VARIANCE'] = np.var(sector_times)
        features['SECTOR_STD'] = np.std(sector_times)
        total_sector_time = sum(sector_times)
        features['S1_RATIO'] = features['S1_SECONDS'] / total_sector_time if total_sector_time > 0 else 0.33
        features['S2_RATIO'] = features['S2_SECONDS'] / total_sector_time if total_sector_time > 0 else 0.33
        features['S3_RATIO'] = features['S3_SECONDS'] / total_sector_time if total_sector_time > 0 else 0.34
        features['SECTOR_BALANCE'] = features['SECTOR_STD'] / np.mean(sector_times) if np.mean(sector_times) > 0 else 0
        features['TOTAL_SECTOR_IMPROVEMENT'] = features['S1_IMPROVEMENT'] + features['S2_IMPROVEMENT'] + features['S3_IMPROVEMENT']
        
        # === ROLLING SECTOR MEANS ===
        if len(lap_history) >= 3:
            recent_laps = lap_history[-3:]
            # Extract actual sector times from each lap
            s1_times = [lap.get('sectorTimes', [0, 0, 0])[0] if len(lap.get('sectorTimes', [])) > 0 else 0 for lap in recent_laps]
            s2_times = [lap.get('sectorTimes', [0, 0, 0])[1] if len(lap.get('sectorTimes', [])) > 1 else 0 for lap in recent_laps]
            s3_times = [lap.get('sectorTimes', [0, 0, 0])[2] if len(lap.get('sectorTimes', [])) > 2 else 0 for lap in recent_laps]
            features['S1_ROLLING_MEAN_3'] = np.mean(s1_times) if any(s1_times) else features['S1_SECONDS']
            features['S2_ROLLING_MEAN_3'] = np.mean(s2_times) if any(s2_times) else features['S2_SECONDS']
            features['S3_ROLLING_MEAN_3'] = np.mean(s3_times) if any(s3_times) else features['S3_SECONDS']
        else:
            features['S1_ROLLING_MEAN_3'] = features['S1_SECONDS']
            features['S2_ROLLING_MEAN_3'] = features['S2_SECONDS']
            features['S3_ROLLING_MEAN_3'] = features['S3_SECONDS']
        
        # === TIRE FEATURES ===
        features['TIRE_AGE'] = tire_age
        features['DEGRADATION_RATE'] = 0.05 * tire_age  # 5% per lap
        features['CUMULATIVE_DEGRADATION'] = tire_age * 0.5
        features['DEGRADATION_IMPACT'] = tire_age * 0.1
        features['TIRE_CONDITION'] = max(0, 100 - tire_age * 2)  # 0-100 scale
        features['TIRE_TEMP_EFFECT'] = track_temp * 0.01 * tire_age
        features['FRESH_TIRES'] = 1 if tire_age <= 2 else 0
        features['OLD_TIRES'] = 1 if tire_age >= 15 else 0
        
        # === SPEED FEATURES ===
        features['AVG_SPEED_TRACK_NORM'] = avg_speed / 250.0 if avg_speed > 0 else features['KPH'] / 250.0
        features['TOP_SPEED_TRACK_NORM'] = current_speed / 250.0 if current_speed > 0 else features['TOP_SPEED'] / 250.0
        features['AVG_SECTOR_SPEED'] = (features['KPH'] + features['TOP_SPEED']) / 2
        features['SPEED_EFFICIENCY'] = features['KPH'] / features['TOP_SPEED'] if features['TOP_SPEED'] > 0 else 0.8
        features['SPEED_TO_TIME_RATIO'] = features['KPH'] / features['DRIVER_AVG_LAPTIME'] if features['DRIVER_AVG_LAPTIME'] > 0 else 2.0
        features['ACCELERATION_ESTIMATE'] = (features['TOP_SPEED'] - features['KPH']) / 10.0
        
        # === LAP PROGRESSION ===
        total_laps = data.get('totalLapCount', 20)
        features['LAP_PROGRESS'] = current_lap / total_laps if total_laps > 0 else 0.5
        features['RACE_PHASE'] = 1 if features['LAP_PROGRESS'] < 0.33 else (2 if features['LAP_PROGRESS'] < 0.67 else 3)
        features['LAPS_REMAINING'] = max(0, total_laps - current_lap)
        
        # === DRIVER PERFORMANCE INDEX ===
        features['DRIVER_PERFORMANCE_INDEX'] = (features['DRIVER_CONSISTENCY'] * 50 + features['DRIVER_PACE_VS_TRACK'] * 50) / 100
        features['GAP_TO_BEST'] = features['DRIVER_AVG_LAPTIME'] - features['BEST_LAP_SECONDS']
        features['GAP_TO_AVG_TOP10'] = features['DRIVER_AVG_LAPTIME'] - features['AVG_TOP10_SECONDS']
        features['CONSISTENCY_SCORE'] = 100 * (1 - features['DRIVER_CONSISTENCY']) if features['DRIVER_CONSISTENCY'] < 1 else 0
        features['CURRENT_FORM'] = -features['LAP_IMPROVEMENT'] if features['LAP_IMPROVEMENT'] < 0 else 0  # Negative improvement = getting faster
        
        # === DRIVER ID ===
        features['DRIVER_ID'] = 1  # Placeholder
        
        # === INTERMEDIATE TIMES (if available) ===
        features['INT-1_time'] = 0  # Not available from Zustand
        features['INT-1_elapsed'] = 0
        features['INT-2_time'] = 0
        
        # === ROLLING LAP STATISTICS ===
        if len(lap_history) >= 5:
            recent_5_laps = [lap.get('lapTime', 90) for lap in lap_history[-5:]]
            features['ROLLING_AVG_LAP_5'] = np.mean(recent_5_laps)
            features['ROLLING_STD_LAP_5'] = np.std(recent_5_laps)
            features['ROLLING_MIN_LAP_5'] = min(recent_5_laps)
        else:
            features['ROLLING_AVG_LAP_5'] = features['DRIVER_AVG_LAPTIME']
            features['ROLLING_STD_LAP_5'] = features['DRIVER_STD_LAPTIME']
            features['ROLLING_MIN_LAP_5'] = features['BEST_LAP_SECONDS']
        
        if len(lap_history) >= 3:
            recent_3_laps = [lap.get('lapTime', 90) for lap in lap_history[-3:]]
            features['ROLLING_AVG_LAP_3'] = np.mean(recent_3_laps)
        else:
            features['ROLLING_AVG_LAP_3'] = features['DRIVER_AVG_LAPTIME']
        
        # === LAP TREND ===
        if len(lap_history) >= 3:
            recent_times = [lap.get('lapTime', 90) for lap in lap_history[-3:]]
            # Simple trend: -1 (improving), 0 (stable), 1 (degrading)
            if recent_times[-1] < recent_times[0]:
                features['LAP_TREND'] = -1
            elif recent_times[-1] > recent_times[0]:
                features['LAP_TREND'] = 1
            else:
                features['LAP_TREND'] = 0
        else:
            features['LAP_TREND'] = 0
        
        # === CONSECUTIVE IMPROVEMENTS ===
        consecutive_improvements = 0
        if len(lap_history) >= 2:
            for i in range(len(lap_history) - 1, 0, -1):
                if lap_history[i]['lapTime'] < lap_history[i-1]['lapTime']:
                    consecutive_improvements += 1
                else:
                    break
        features['CONSECUTIVE_IMPROVEMENTS'] = consecutive_improvements
        
        # === MOMENTUM SCORE ===
        features['MOMENTUM_SCORE'] = features['CONSECUTIVE_IMPROVEMENTS'] * 10 - features['LAP_TREND'] * 5
        
        # === PIT STOP FEATURES ===
        pit_laps = [lap for lap in lap_history if lap.get('pitStop', False)]
        features['PIT_PENALTY'] = 1 if len(pit_laps) > 0 else 0
        features['LAPS_SINCE_PIT'] = current_lap - pit_laps[-1]['lapNumber'] if len(pit_laps) > 0 else current_lap
        
        # Convert to DataFrame
        df = pd.DataFrame([features])
        
        # Fill any missing features with 0
        for feat in required_features:
            if feat not in df.columns:
                df[feat] = 0
        
        # Ensure column order matches model
        df = df[required_features]
        
        return df
        
    except Exception as e:
        print(f"❌ Error generating features: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    main()
