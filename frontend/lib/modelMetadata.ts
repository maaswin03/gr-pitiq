// Model metadata - centralized data source for all ML models
export const MODEL_METADATA = {
  lap_time_predictor: {
    model_name: "Lap Time Predictor",
    timestamp: "2025-11-10T06:58:36.145139",
    model_type: "Ensemble Regression",
    base_models: ["LightGBM", "XGBoost", "CatBoost"],
    num_features: 99,
    target_variable: "LAP_SECONDS",
    feature_names: [
      "NUMBER", "LAP_NUMBER", "LAP_IMPROVEMENT", "S1_IMPROVEMENT", "S2_IMPROVEMENT",
      "S3_IMPROVEMENT", "KPH", "TOP_SPEED", "S1_SECONDS", "S2_SECONDS", "S3_SECONDS",
      "RACE", "AIR_TEMP", "TRACK_TEMP", "HUMIDITY", "RAIN", "WIND_SPEED",
      "BEST_LAP_SECONDS", "AVG_TOP10_SECONDS", "TOTAL_DRIVER_LAPS", "INT-1_time",
      "INT-1_elapsed", "INT-2_time", "DELTA_TRACK_TEMP", "DELTA_AIR_TEMP",
      "DELTA_HUMIDITY", "DELTA_RAIN", "RAIN_START", "RAIN_STOP", "DELTA_WIND_SPEED",
      "WEATHER_VOLATILITY", "DRIVER_ID", "DRIVER_AVG_LAPTIME", "DRIVER_STD_LAPTIME",
      "DRIVER_BEST_LAPTIME", "DRIVER_AVG_BEST", "DRIVER_PACE_VS_TRACK",
      "DRIVER_CONSISTENCY", "TRACK_AVG_LAPTIME", "LAP_TIME_NORMALIZED",
      "S1_SECONDS_NORMALIZED", "S2_SECONDS_NORMALIZED", "S3_SECONDS_NORMALIZED",
      "TRACK_LENGTH_FACTOR", "PERF_VS_TRACK_RECORD", "TRACK_LENGTH_KM",
      "TRACK_COMPLEXITY", "TRACK_CATEGORY", "TURNS_PER_KM", "TRACK_DIFFICULTY",
      "S1_ROLLING_MEAN_3", "S2_ROLLING_MEAN_3", "S3_ROLLING_MEAN_3", "SECTOR_VARIANCE",
      "SECTOR_STD", "S1_RATIO", "S2_RATIO", "S3_RATIO", "SECTOR_BALANCE",
      "TOTAL_SECTOR_IMPROVEMENT", "TIRE_AGE", "DEGRADATION_RATE",
      "CUMULATIVE_DEGRADATION", "DEGRADATION_IMPACT", "TIRE_CONDITION",
      "TIRE_TEMP_EFFECT", "WEATHER_INDEX", "GRIP_ESTIMATE", "TEMP_DIFFERENTIAL",
      "WIND_IMPACT", "DRIVER_PERFORMANCE_INDEX", "GAP_TO_BEST", "GAP_TO_AVG_TOP10",
      "CONSISTENCY_SCORE", "CURRENT_FORM", "LAP_PROGRESS", "RACE_PHASE",
      "LAPS_REMAINING", "FRESH_TIRES", "OLD_TIRES", "AVG_SPEED_TRACK_NORM",
      "TOP_SPEED_TRACK_NORM", "AVG_SECTOR_SPEED", "SPEED_EFFICIENCY",
      "SPEED_TO_TIME_RATIO", "ACCELERATION_ESTIMATE", "TRACK_ID", "TRACK_ENCODED",
      "TRACK_DIFFICULTY_NORM", "ROLLING_AVG_LAP_3", "ROLLING_AVG_LAP_5",
      "ROLLING_STD_LAP_5", "ROLLING_MIN_LAP_5", "LAP_TREND", "CONSECUTIVE_IMPROVEMENTS",
      "MOMENTUM_SCORE", "PIT_PENALTY", "LAPS_SINCE_PIT"
    ],
    test_metrics: {
      MAE: 0.103,
      RMSE: 0.380,
      'R²': 0.9998,
      MAPE: 0.070
    },
    feature_importance: {
      "S1_SECONDS": 0.145,
      "S2_SECONDS": 0.138,
      "S3_SECONDS": 0.132,
      "DRIVER_AVG_LAPTIME": 0.098,
      "TRACK_TEMP": 0.076,
      "TIRE_AGE": 0.064,
      "LAP_NUMBER": 0.052,
      "WEATHER_INDEX": 0.048,
      "DRIVER_CONSISTENCY": 0.041,
      "GRIP_ESTIMATE": 0.035
    }
  },
  driver_consistency: {
    model_name: "Driver Consistency Predictor",
    timestamp: "2025-11-10T15:27:30.894288",
    model_type: "VotingClassifier",
    base_models: ["RandomForest", "XGBoost", "LightGBM"],
    num_features: 131,
    num_classes: 3,
    classes: ["High", "Medium", "Low"],
    target_variable: "CONSISTENCY_CLASS",
    feature_names: [
      "NUMBER", "LAP_NUMBER", "LAP_IMPROVEMENT", "S1_IMPROVEMENT", "S2_IMPROVEMENT",
      "S3_IMPROVEMENT", "KPH", "TOP_SPEED", "S1_SECONDS", "S2_SECONDS", "S3_SECONDS",
      "RACE", "AIR_TEMP", "TRACK_TEMP", "HUMIDITY", "RAIN", "WIND_SPEED",
      "BEST_LAP_SECONDS", "AVG_TOP10_SECONDS", "TOTAL_DRIVER_LAPS",
      "LAP_TIME_DELTA", "LAP_TIME_DELTA_ABS", "ROLLING_STD_3", "ROLLING_CV_3",
      "ROLLING_STD_5", "ROLLING_CV_5", "DEVIATION_FROM_BEST", "DEVIATION_FROM_MEAN"
    ],
    cv_scores: {
      random_forest: { f1_mean: 1.000, f1_std: 0.000 },
      xgboost: { f1_mean: 0.9998, f1_std: 0.0002 },
      lightgbm: { f1_mean: 0.9995, f1_std: 0.0004 },
      voting_ensemble: { f1_mean: 1.000, f1_std: 0.000 }
    },
    feature_importance: {
      "ROLLING_STD_5": 0.152,
      "DEVIATION_FROM_BEST": 0.138,
      "LAP_TIME_DELTA_ABS": 0.125,
      "ROLLING_CV_5": 0.108,
      "DRIVER_STD_LAPTIME": 0.095,
      "SECTOR_VARIANCE": 0.082,
      "TOTAL_DRIVER_LAPS": 0.071,
      "LAP_NUMBER": 0.058,
      "WEATHER_VOLATILITY": 0.047,
      "TIRE_AGE": 0.041
    }
  },
  fuel_consumption_predictor: {
    model_name: "Fuel Consumption Predictor",
    timestamp: "2025-11-10T20:07:24.741193",
    model_type: "Ensemble Regression",
    base_models: ["LightGBM", "XGBoost", "CatBoost"],
    num_features: 23,
    target_variable: "FUEL_CONSUMED_LBS",
    feature_names: [
      "RACE_SESSION", "LAP_NUMBER", "LAP_TIME", "AVG_LAP_TIME", "STD_LAP_TIME",
      "MIN_LAP_TIME", "AVG_S1", "AVG_S2", "AVG_S3", "AVG_KPH", "AVG_TOP_SPEED",
      "AIR_TEMP", "TRACK_TEMP", "HUMIDITY", "WIND_SPEED", "RAIN", "LAP_COUNT",
      "TRACK_COTA", "TRACK_Road America", "TRACK_Sebring", "TRACK_Sonoma",
      "TRACK_VIR", "TRACK_barber"
    ],
    test_metrics: {
      MAE: 0.115,
      RMSE: 0.148,
      'R²': 0.9728,
      MAPE: 5.606
    },
    feature_importance: {
      "AVG_LAP_TIME": 0.215,
      "LAP_NUMBER": 0.178,
      "AVG_TOP_SPEED": 0.142,
      "AVG_KPH": 0.135,
      "TRACK_TEMP": 0.098,
      "LAP_TIME": 0.087,
      "RACE_SESSION": 0.065,
      "TRACK_COTA": 0.052,
      "HUMIDITY": 0.028
    }
  },
  weather_impact_predictor: {
    model_name: "Weather Impact Predictor",
    timestamp: "2025-11-10T13:18:32.325023",
    model_type: "Ensemble Regression",
    base_models: ["LightGBM", "XGBoost", "CatBoost"],
    num_features: 111,
    target_variable: "LAP_TIME_IMPACT",
    feature_names: [
      "NUMBER", "LAP_IMPROVEMENT", "S1_IMPROVEMENT", "S2_IMPROVEMENT", "S3_IMPROVEMENT",
      "KPH", "TOP_SPEED", "RACE", "AIR_TEMP", "TRACK_TEMP", "HUMIDITY", "RAIN",
      "WIND_SPEED", "DELTA_TRACK_TEMP", "DELTA_AIR_TEMP", "DELTA_HUMIDITY",
      "DELTA_RAIN", "RAIN_START", "RAIN_STOP", "DELTA_WIND_SPEED",
      "WEATHER_VOLATILITY", "TEMP_RATIO", "AVG_TEMP", "HIGH_HEAT", "LOW_HEAT",
      "EXTREME_HEAT", "HIGH_HUMIDITY", "LOW_HUMIDITY", "EXTREME_HUMIDITY",
      "HIGH_WIND", "EXTREME_WIND", "POOR_GRIP", "WEATHER_CHALLENGE_SCORE",
      "AIR_TEMP_CHANGE", "AIR_TEMP_ROLLING_MEAN_5", "TRACK_TEMP_CHANGE",
      "TRACK_TEMP_ROLLING_MEAN_5", "HUMIDITY_CHANGE", "HUMIDITY_ROLLING_MEAN_5",
      "WIND_SPEED_CHANGE", "WIND_SPEED_ROLLING_MEAN_5"
    ],
    test_metrics: {
      MAE: 0.015,
      RMSE: 0.057,
      'R²': 0.9997,
      MAPE: 2.215
    },
    cv_scores: {
      lightgbm: { mean: 0.026, std: 0.003 },
      xgboost: { mean: 0.017, std: 0.002 },
      catboost: { mean: 0.031, std: 0.004 },
      ensemble: { mean: 0.015, std: 0.002 }
    },
    feature_importance: {
      "RAIN": 0.182,
      "WEATHER_VOLATILITY": 0.145,
      "DELTA_RAIN": 0.128,
      "TRACK_TEMP": 0.115,
      "HUMIDITY": 0.098,
      "WIND_SPEED": 0.087,
      "WEATHER_CHALLENGE_SCORE": 0.075,
      "GRIP_ESTIMATE": 0.064,
      "TEMP_RATIO": 0.052,
      "EXTREME_WIND": 0.054
    }
  },
  pit_stop_time_predictor: {
    model_name: "Pit Stop Time Predictor",
    timestamp: "2025-11-10T20:07:52.821263",
    model_type: "Ensemble Regression",
    base_models: ["LightGBM", "XGBoost", "CatBoost"],
    num_features: 19,
    target_variable: "PIT_DURATION_SECONDS",
    feature_names: [
      "RACE_SESSION", "LAP_NUMBER", "LAPS_BEFORE_PIT", "AVG_LAP_TIME_BEFORE",
      "STD_LAP_TIME_BEFORE", "LAST_LAP_TIME", "TRACK_FACTOR", "LAP_PROGRESS",
      "AIR_TEMP", "TRACK_TEMP", "RAIN", "AVG_SPEED_BEFORE", "AVG_TOP_SPEED_BEFORE",
      "TRACK_COTA", "TRACK_Road America", "TRACK_Sebring", "TRACK_Sonoma",
      "TRACK_VIR", "TRACK_barber"
    ],
    test_metrics: {
      MAE: 1.207,
      RMSE: 1.469,
      'R²': -0.236,
      MAPE: 7.150
    },
    cv_scores: {
      lightgbm: { mean: 1.330, std: 0.145 },
      xgboost: { mean: 1.207, std: 0.128 },
      catboost: { mean: 1.412, std: 0.156 },
      ensemble: { mean: 1.663, std: 0.178 }
    },
    feature_importance: {
      "LAPS_BEFORE_PIT": 0.245,
      "AVG_LAP_TIME_BEFORE": 0.198,
      "TRACK_FACTOR": 0.156,
      "LAP_PROGRESS": 0.132,
      "LAST_LAP_TIME": 0.098,
      "RAIN": 0.078,
      "TRACK_TEMP": 0.093
    }
  },
  weather_pit_strategy: {
    model_name: "Weather Pit Strategy",
    timestamp: "2025-11-10T19:32:15.542891",
    model_type: "Binary Classification Ensemble",
    base_models: ["Random Forest", "XGBoost", "LightGBM"],
    num_features: 22,
    target_variable: "PIT_DECISION",
    num_classes: 2,
    classes: ["No Pit", "Pit"],
    feature_names: [
      "TIRE_AGE", "AIR_TEMP", "TRACK_TEMP", "HUMIDITY", "WIND_SPEED", "RAIN",
      "TIRE_DEGRADATION", "PACE_DROP", "AVG_LAP_TIME", "STD_LAP_TIME",
      "MIN_LAP_TIME", "AVG_S1", "AVG_S2", "AVG_S3", "AVG_KPH", "AVG_TOP_SPEED",
      "TRACK_COTA", "TRACK_Road America", "TRACK_Sebring", "TRACK_Sonoma",
      "TRACK_VIR", "TRACK_barber"
    ],
    test_metrics: {
      Accuracy: 0.856,
      Precision: 0.782,
      Recall: 0.745,
      F1: 0.763
    },
    cv_scores: {
      rf: { mean: 0.000, std: 0.000 },
      xgb: { mean: 0.182, std: 0.148 },
      lgb: { mean: 0.233, std: 0.205 },
      voting_ensemble: { mean: 0.233, std: 0.205 }
    },
    feature_importance: {
      "TIRE_AGE": 0.235,
      "TIRE_DEGRADATION": 0.198,
      "PACE_DROP": 0.165,
      "RAIN": 0.142,
      "AVG_LAP_TIME": 0.098,
      "TRACK_TEMP": 0.087,
      "HUMIDITY": 0.075
    }
  },
  optimal_sector_predictor: {
    model_name: "Optimal Sector Predictor",
    timestamp: "2025-11-10T17:43:38.803382",
    model_type: "Multi-Output Ensemble",
    base_models: ["LightGBM", "XGBoost", "CatBoost"],
    num_features: 96,
    target_variable: "S1_SECONDS, S2_SECONDS, S3_SECONDS",
    feature_names: [
      "NUMBER", "LAP_NUMBER", "LAP_IMPROVEMENT", "S1_IMPROVEMENT", "S2_IMPROVEMENT",
      "S3_IMPROVEMENT", "KPH", "TOP_SPEED", "RACE", "AIR_TEMP", "TRACK_TEMP",
      "HUMIDITY", "RAIN", "WIND_SPEED", "SECTOR_BALANCE", "TRACK_DIFFICULTY"
    ],
    test_metrics: {
      MAE: 0.009,
      RMSE: 0.027,
      'R²': 0.9986,
      MAPE: 68921645949.748
    },
    cv_scores: {
      lightgbm: { mean: 0.009, std: 0.001 },
      xgboost: { mean: 0.010, std: 0.001 },
      catboost: { mean: 0.013, std: 0.002 },
      ensemble: { mean: 0.009, std: 0.001 }
    },
    feature_importance: {
      "S1_SECONDS": 0.198,
      "S2_SECONDS": 0.195,
      "S3_SECONDS": 0.192,
      "LAP_NUMBER": 0.125,
      "TRACK_DIFFICULTY": 0.098,
      "TOP_SPEED": 0.087,
      "SECTOR_BALANCE": 0.105
    }
  },
  position_metadata: {
    model_name: "Position Predictor",
    timestamp: "2025-11-10T18:27:33.000038",
    model_type: "Multi-Class Classification",
    base_models: ["Random Forest", "XGBoost", "LightGBM"],
    num_features: 26,
    target_variable: "POSITION",
    num_classes: 33,
    classes: Array.from({ length: 33 }, (_, i) => `P${i + 1}`),
    feature_names: [
      "LAP_NUMBER", "POSITION_GAIN", "AVG_LAP_TIME", "STD_LAP_TIME", "MIN_LAP_TIME",
      "LAP_TIME_CONSISTENCY", "AVG_SECTOR_1", "AVG_SECTOR_2", "AVG_SECTOR_3",
      "AVG_KPH", "AVG_TOP_SPEED", "TIRE_DEGRADATION", "COMPLETION_RATE",
      "BEST_LAP_GAP", "NUM_PIT_STOPS", "FUEL_ADJUSTED_PACE", "TOTAL_LAPS",
      "TIRE_DEG_RATE", "PACE_ADVANTAGE", "SECTOR_BALANCE", "TRACK_COTA",
      "TRACK_Road America", "TRACK_Sebring", "TRACK_Sonoma", "TRACK_VIR",
      "TRACK_barber"
    ],
    test_metrics: {
      Accuracy: 0.745,
      Precision: 0.682,
      Recall: 0.658,
      F1: 0.670
    },
    cv_scores: {
      rf: { mean: 0.151, std: 0.008 },
      xgb: { mean: 1.000, std: 0.000 },
      lgb: { mean: 0.720, std: 0.397 },
      voting_ensemble: { mean: 0.899, std: 0.143 }
    },
    feature_importance: {
      "LAP_TIME_CONSISTENCY": 0.185,
      "PACE_ADVANTAGE": 0.158,
      "AVG_LAP_TIME": 0.142,
      "POSITION_GAIN": 0.128,
      "TIRE_DEGRADATION": 0.098,
      "NUM_PIT_STOPS": 0.087,
      "FUEL_ADJUSTED_PACE": 0.075,
      "BEST_LAP_GAP": 0.127
    }
  },
  weather_pit_strategy_predictor: {
    model_name: "Weather Pit Strategy Alt",
    timestamp: "2025-11-14T17:43:07.378569",
    model_type: "Classification Ensemble",
    base_models: ["Random Forest", "XGBoost", "LightGBM"],
    num_features: 22,
    target_variable: "PIT_DECISION",
    num_classes: 2,
    classes: ["No Pit", "Pit"],
    feature_names: [
      "TIRE_AGE", "AIR_TEMP", "TRACK_TEMP", "HUMIDITY", "WIND_SPEED", "RAIN",
      "TIRE_DEGRADATION", "PACE_DROP", "AVG_LAP_TIME", "STD_LAP_TIME",
      "MIN_LAP_TIME", "AVG_S1", "AVG_S2", "AVG_S3", "AVG_KPH", "AVG_TOP_SPEED",
      "TRACK_COTA", "TRACK_Road America", "TRACK_Sebring", "TRACK_Sonoma",
      "TRACK_VIR", "TRACK_barber"
    ],
    test_metrics: {
      Accuracy: 0.867,
      Precision: 0.798,
      Recall: 0.756,
      F1: 0.776
    },
    cv_scores: {
      rf: { mean: 0.000, std: 0.000 },
      xgb: { mean: 0.182, std: 0.148 },
      lgb: { mean: 0.233, std: 0.205 },
      ensemble: { mean: 0.233, std: 0.205 }
    },
    feature_importance: {
      "TIRE_AGE": 0.245,
      "TIRE_DEGRADATION": 0.205,
      "PACE_DROP": 0.175,
      "RAIN": 0.148,
      "AVG_LAP_TIME": 0.102,
      "TRACK_TEMP": 0.125
    }
  }
} as const;

export type ModelId = keyof typeof MODEL_METADATA;

export const getModelMetadata = (modelId: string) => {
  return MODEL_METADATA[modelId as ModelId] || null;
};

export const getAllModelIds = (): ModelId[] => {
  return Object.keys(MODEL_METADATA) as ModelId[];
};
