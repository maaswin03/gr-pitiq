# Weather Impact Predictor - Test Results
**Generated:** 2025-11-22 20:20:53
**Model Type:** Regression
**Features:** 114

---
## 1. Model Loading
- **Model Path:** `/Users/kyroz/Documents/VSCODE/GR PitIQ/backend/model/weather_impact_predictor.pkl`
- **Total Training Samples:** 2041
- **Features Count:** 114

## 2. Test Sample Selection
**Strategy:** 5 random samples per track

| Track | Samples |
|-------|--------:|
| COTA | 0 |
| VIR | 0 |
| Sebring | 5 |
| Sonoma | 5 |
| Road America | 0 |
| barber | 0 |
| **Total** | **10** |

## 3. Test Results by Track

### Sebring

| Sample | Predicted | Actual | Error | Error % |
|--------|----------:|-------:|------:|--------:|
| 1 | 0.257 | 0.276 | 0.019 | 6.93% |
| 2 | -0.305 | -0.291 | 0.014 | -4.73% |
| 3 | -0.209 | -0.196 | 0.013 | -6.86% |
| 4 | 0.045 | 0.063 | 0.017 | 27.77% |
| 5 | 0.390 | 0.410 | 0.020 | 4.87% |

**Track Metrics:**
- MAE: 0.017
- RMSE: 0.017
- R²: 0.996

### Sonoma

| Sample | Predicted | Actual | Error | Error % |
|--------|----------:|-------:|------:|--------:|
| 1 | -0.319 | -0.320 | 0.000 | -0.05% |
| 2 | -0.858 | -0.857 | 0.001 | -0.08% |
| 3 | 0.082 | 0.079 | 0.003 | 3.72% |
| 4 | -0.607 | -0.607 | 0.000 | -0.01% |
| 5 | -0.201 | -0.201 | 0.000 | -0.08% |

**Track Metrics:**
- MAE: 0.001
- RMSE: 0.001
- R²: 1.000

## 4. All Test Samples

| # | Track | Sample | Predicted | Actual | Error | Error % |
|---|-------|--------|----------:|-------:|------:|--------:|
| 1 | Sebring | 1 | 0.257 | 0.276 | 0.019 | 6.93% |
| 2 | Sebring | 2 | -0.305 | -0.291 | 0.014 | -4.73% |
| 3 | Sebring | 3 | -0.209 | -0.196 | 0.013 | -6.86% |
| 4 | Sebring | 4 | 0.045 | 0.063 | 0.017 | 27.77% |
| 5 | Sebring | 5 | 0.390 | 0.410 | 0.020 | 4.87% |
| 6 | Sonoma | 1 | -0.319 | -0.320 | 0.000 | -0.05% |
| 7 | Sonoma | 2 | -0.858 | -0.857 | 0.001 | -0.08% |
| 8 | Sonoma | 3 | 0.082 | 0.079 | 0.003 | 3.72% |
| 9 | Sonoma | 4 | -0.607 | -0.607 | 0.000 | -0.01% |
| 10 | Sonoma | 5 | -0.201 | -0.201 | 0.000 | -0.08% |

**Total Samples:** 10

## 5. Overall Model Evaluation

### Regression Metrics

| Metric | Value |
|--------|------:|
| MAE | 0.009 |
| RMSE | 0.012 |
| R² Score | 0.999 |
| MAPE | 5.51% |
| Total Samples | 10 |

