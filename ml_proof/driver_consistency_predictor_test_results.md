# Driver Consistency Predictor - Test Results
**Generated:** 2025-11-22 20:20:53
**Model Type:** Classification
**Features:** 131

---
## 1. Model Loading
- **Model Path:** `/Users/kyroz/Documents/VSCODE/GR PitIQ/backend/model/driver_consistency_predictor.pkl`
- **Total Training Samples:** 5791
- **Features Count:** 131

## 2. Test Sample Selection
**Strategy:** 5 random samples per track

| Track | Samples |
|-------|--------:|
| COTA | 5 |
| VIR | 5 |
| Sebring | 5 |
| Sonoma | 5 |
| Road America | 5 |
| barber | 5 |
| **Total** | **30** |

## 3. Test Results by Track

### COTA

| Sample | Predicted | Actual | Correct |
|--------|----------:|-------:|--------:|
| 1 | Low | Low | ✅ |
| 2 | Low | Low | ✅ |
| 3 | Low | Low | ✅ |
| 4 | Low | Low | ✅ |
| 5 | Low | Low | ✅ |

**Track Metrics:**
- Accuracy: 1.000
- F1-Score: 1.000

### VIR

| Sample | Predicted | Actual | Correct |
|--------|----------:|-------:|--------:|
| 1 | Low | Low | ✅ |
| 2 | High | High | ✅ |
| 3 | Low | Low | ✅ |
| 4 | High | High | ✅ |
| 5 | High | High | ✅ |

**Track Metrics:**
- Accuracy: 1.000
- F1-Score: 1.000

### Sebring

| Sample | Predicted | Actual | Correct |
|--------|----------:|-------:|--------:|
| 1 | Low | Low | ✅ |
| 2 | Low | Low | ✅ |
| 3 | Low | Low | ✅ |
| 4 | Low | Low | ✅ |
| 5 | Low | Low | ✅ |

**Track Metrics:**
- Accuracy: 1.000
- F1-Score: 1.000

### Sonoma

| Sample | Predicted | Actual | Correct |
|--------|----------:|-------:|--------:|
| 1 | Low | Low | ✅ |
| 2 | Low | Low | ✅ |
| 3 | Low | Low | ✅ |
| 4 | Low | Low | ✅ |
| 5 | Low | Low | ✅ |

**Track Metrics:**
- Accuracy: 1.000
- F1-Score: 1.000

### Road America

| Sample | Predicted | Actual | Correct |
|--------|----------:|-------:|--------:|
| 1 | Low | Low | ✅ |
| 2 | Low | Low | ✅ |
| 3 | Low | Low | ✅ |
| 4 | Low | Low | ✅ |
| 5 | Low | Low | ✅ |

**Track Metrics:**
- Accuracy: 1.000
- F1-Score: 1.000

### barber

| Sample | Predicted | Actual | Correct |
|--------|----------:|-------:|--------:|
| 1 | High | High | ✅ |
| 2 | Low | Low | ✅ |
| 3 | Low | Low | ✅ |
| 4 | High | High | ✅ |
| 5 | High | High | ✅ |

**Track Metrics:**
- Accuracy: 1.000
- F1-Score: 1.000

## 4. All Test Samples

| # | Track | Sample | Predicted | Actual | Correct |
|---|-------|--------|-----------|--------|:-------:|
| 1 | COTA | 1 | Low | Low | ✅ |
| 2 | COTA | 2 | Low | Low | ✅ |
| 3 | COTA | 3 | Low | Low | ✅ |
| 4 | COTA | 4 | Low | Low | ✅ |
| 5 | COTA | 5 | Low | Low | ✅ |
| 6 | VIR | 1 | Low | Low | ✅ |
| 7 | VIR | 2 | High | High | ✅ |
| 8 | VIR | 3 | Low | Low | ✅ |
| 9 | VIR | 4 | High | High | ✅ |
| 10 | VIR | 5 | High | High | ✅ |
| 11 | Sebring | 1 | Low | Low | ✅ |
| 12 | Sebring | 2 | Low | Low | ✅ |
| 13 | Sebring | 3 | Low | Low | ✅ |
| 14 | Sebring | 4 | Low | Low | ✅ |
| 15 | Sebring | 5 | Low | Low | ✅ |
| 16 | Sonoma | 1 | Low | Low | ✅ |
| 17 | Sonoma | 2 | Low | Low | ✅ |
| 18 | Sonoma | 3 | Low | Low | ✅ |
| 19 | Sonoma | 4 | Low | Low | ✅ |
| 20 | Sonoma | 5 | Low | Low | ✅ |
| 21 | Road America | 1 | Low | Low | ✅ |
| 22 | Road America | 2 | Low | Low | ✅ |
| 23 | Road America | 3 | Low | Low | ✅ |
| 24 | Road America | 4 | Low | Low | ✅ |
| 25 | Road America | 5 | Low | Low | ✅ |
| 26 | barber | 1 | High | High | ✅ |
| 27 | barber | 2 | Low | Low | ✅ |
| 28 | barber | 3 | Low | Low | ✅ |
| 29 | barber | 4 | High | High | ✅ |
| 30 | barber | 5 | High | High | ✅ |

**Total Samples:** 30

## 5. Overall Model Evaluation

### Classification Metrics

| Metric | Value |
|--------|------:|
| Accuracy | 1.000 |
| F1-Score (Macro) | 1.000 |
| F1-Score (Weighted) | 1.000 |
| Precision | 1.000 |
| Recall | 1.000 |
| Cohen's Kappa | 1.000 |
| Total Samples | 30 |

