# API Documentation

## Backend REST API Reference

The GR PitIQ backend provides a RESTful API for race simulation control and ML predictions.

**Base URL**: `http://localhost:8000` (development)  
**API Prefix**: `/api/simulation`

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/simulation/start` | Start new simulation |
| POST | `/api/simulation/stop` | Stop current simulation |
| POST | `/api/simulation/update` | Update simulation parameters |
| POST | `/api/simulation/pit-stop` | Execute pit stop |
| POST | `/api/simulation/resume` | Resume after pit stop |
| GET | `/api/simulation/state` | Get current simulation state |
| GET | `/api/simulation/laps` | Get lap history |
| GET | `/api/simulation/status` | Get simulation status |
| GET | `/api/simulation/predict` | Get ML predictions |
| GET | `/api/simulation/health` | Health check |
| POST | `/api/simulation/optimize-strategy` | Get strategy optimization |

---

## 1. Start Simulation

**Endpoint**: `POST /api/simulation/start`

**Description**: Initialize and start a new race simulation with specified configuration.

### Request Body
```json
{
  "user_id": "uuid-string",
  "track": "COTA",
  "config": {
    "driverSkill": "Pro",
    "carNumber": 1,
    "enginePower": 100,
    "downforceLevel": 5,
    "tireCompound": "Soft",
    "fuelLoad": 50,
    "airTemp": 25,
    "trackTemp": 35,
    "humidity": 60,
    "rainfall": 0,
    "windSpeed": 10,
    "lapCount": 20
  }
}
```

### Parameters

| Parameter | Type | Required | Values | Description |
|-----------|------|----------|--------|-------------|
| `user_id` | string | Yes | UUID | User identifier from auth |
| `track` | string | Yes | `Barber`, `COTA`, `Road America`, `Sebring`, `Sonoma`, `VIR` | Track name |
| `config.driverSkill` | string | No | `Pro`, `Amateur`, `Aggressive`, `Conservative` | Driver skill level |
| `config.carNumber` | number | No | 1-99 | Car number |
| `config.enginePower` | number | No | 80-120 | Engine power percentage |
| `config.downforceLevel` | number | No | 0-100 | Downforce level |
| `config.tireCompound` | string | No | `Soft`, `Medium`, `Hard` | Tire compound |
| `config.fuelLoad` | number | No | 30-50 | Starting fuel in liters |
| `config.airTemp` | number | No | 15-35 | Air temperature (°C) |
| `config.trackTemp` | number | No | 20-55 | Track temperature (°C) |
| `config.humidity` | number | No | 30-95 | Humidity (%) |
| `config.rainfall` | number | No | 0-100 | Rainfall (%) |
| `config.windSpeed` | number | No | 0-40 | Wind speed (km/h) |
| `config.lapCount` | number | No | 1-200 | Total race laps |

### Response
```json
{
  "success": true,
  "message": "Simulation started successfully",
  "user_id": "uuid-string",
  "track": "COTA",
  "update_interval_seconds": 2
}
```

### Error Responses
```json
// 400 Bad Request - Missing user_id
{
  "success": false,
  "error": "Missing required field: user_id"
}

// 400 Bad Request - Invalid track
{
  "success": false,
  "error": "Invalid track. Valid options: Barber, COTA, Road America, Sebring, Sonoma, VIR"
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to start simulation"
}
```

---

## 2. Stop Simulation

**Endpoint**: `POST /api/simulation/stop`

**Description**: Stop the currently running simulation.

### Request Body
```json
{
  "user_id": "uuid-string"
}
```

### Response
```json
{
  "success": true,
  "message": "Simulation stopped"
}
```

---

## 3. Update Simulation Configuration

**Endpoint**: `POST /api/simulation/update`

**Description**: Update simulation parameters in real-time while simulation is running.

### Request Body
```json
{
  "user_id": "uuid-string",
  "config": {
    "enginePower": 105,
    "downforceLevel": 6,
    "tireCompound": "Medium",
    "airTemp": 26,
    "rainfall": 20
  }
}
```

### Response
```json
{
  "success": true,
  "message": "Configuration updated successfully",
  "updated_fields": ["enginePower", "downforceLevel", "tireCompound", "airTemp", "rainfall"]
}
```

---

## 4. Execute Pit Stop

**Endpoint**: `POST /api/simulation/pit-stop`

**Description**: Execute a pit stop with tire change and refueling.

### Request Body
```json
{
  "user_id": "uuid-string"
}
```

### Response
```json
{
  "success": true,
  "message": "Pit stop executed",
  "pit_duration": 8.5,
  "new_tire_age": 0,
  "fuel_added": 30.5
}
```

---

## 5. Resume After Pit Stop

**Endpoint**: `POST /api/simulation/resume`

**Description**: Resume simulation after pit stop is complete.

### Request Body
```json
{
  "user_id": "uuid-string"
}
```

### Response
```json
{
  "success": true,
  "message": "Simulation resumed"
}
```

---

## 6. Get Simulation State

**Endpoint**: `GET /api/simulation/state?user_id={user_id}`

**Description**: Get current real-time simulation state. Frontend polls this every 2-3 seconds.

### Query Parameters
- `user_id`: User identifier (required)

### Response
```json
{
  "success": true,
  "state": {
    "is_running": true,
    "is_paused": false,
    "current_lap": 15,
    "total_laps": 20,
    "current_fuel": 22.5,
    "tire_age": 14,
    "position": 3,
    "last_lap_time": 105.234,
    "best_lap_time": 104.891,
    "track": "COTA",
    "weather": {
      "air_temp": 26,
      "track_temp": 36,
      "humidity": 58,
      "rainfall": 0,
      "wind_speed": 12
    },
    "car": {
      "driver_skill": "Pro",
      "car_number": 1,
      "engine_power": 100,
      "downforce_level": 5,
      "tire_compound": "Soft"
    }
  }
}
```

---

## 7. Get Lap History

**Endpoint**: `GET /api/simulation/laps?user_id={user_id}&limit={limit}&session_id={session_id}`

**Description**: Retrieve historical lap data for the current or specified session.

### Query Parameters
- `user_id`: User identifier (required)
- `limit`: Number of laps to retrieve (optional, default: 50)
- `session_id`: Specific session ID (optional, defaults to current)

### Response
```json
{
  "success": true,
  "laps": [
    {
      "lap_number": 1,
      "lap_time": 106.234,
      "fuel_used": 2.8,
      "tire_age": 1,
      "position": 1,
      "sector_1": 28.5,
      "sector_2": 39.2,
      "sector_3": 38.534
    },
    {
      "lap_number": 2,
      "lap_time": 105.123,
      "fuel_used": 2.7,
      "tire_age": 2,
      "position": 1,
      "sector_1": 28.1,
      "sector_2": 38.9,
      "sector_3": 38.123
    }
  ],
  "total_laps": 2
}
```
      "wind_speed": 10,
      "rainfall": 0
    }
  }
}
```

---

## 8. Get Simulation Status

**Endpoint**: `GET /api/simulation/status?user_id={user_id}`

**Description**: Check if simulation is running for a specific user.

### Query Parameters
- `user_id`: User identifier (required)

### Response
```json
{
  "success": true,
  "is_running": true,
  "session_id": "uuid-string",
  "track": "COTA"
}
```

---

## 9. Get ML Predictions

**Endpoint**: `GET /api/simulation/predict?user_id={user_id}`

**Description**: Get real-time predictions from all 8 ML models based on current simulation state.

### Query Parameters
- `user_id`: User identifier (required)

### Response
```json
{
  "success": true,
  "predictions": {
    "lap_time": {
      "predicted_time": 88.234,
      "confidence": 0.95,
      "model_metrics": {
        "mae": 0.103,
        "r2_score": 0.9998
      }
    },
    "fuel_consumption": {
      "liters_per_lap": 2.85,
      "laps_remaining": 15,
      "confidence": 0.92,
      "model_metrics": {
        "mae": 0.115,
        "r2_score": 0.973
      }
    },
    "pit_stop_time": {
      "predicted_time": 17.2,
      "confidence": 0.78,
      "model_metrics": {
        "mae": 1.207,
        "r2_score": 0.812
      }
    },
    "driver_consistency": {
      "level": "high",
      "score": 0.95,
      "confidence": 1.0,
      "model_metrics": {
        "f1_score": 1.0,
        "accuracy": 1.0
      }
    },
    "weather_impact": {
      "time_delta": 0.5,
      "impact_level": "low",
      "confidence": 0.98,
      "model_metrics": {
        "mae": 0.015,
        "r2_score": 0.9997
      }
    },
    "optimal_sectors": {
      "sector_1": 28.5,
      "sector_2": 32.1,
      "sector_3": 27.6,
      "total": 88.2,
      "confidence": 0.97,
      "model_metrics": {
        "mae": 0.0088,
        "r2_score": 0.9986
      }
    },
    "position_prediction": {
      "predicted_position": 2,
      "probability": 0.75
    },
    "pit_strategy": {
      "recommendation": "medium",
      "pit_on_lap": 15,
      "confidence": 0.89,
      "reasoning": "Optimal tire life vs pace balance"
    }
  },
  "timestamp": "2024-01-15T14:30:00Z"
}
```

---

## 10. Optimize Pit Strategy

**Endpoint**: `POST /api/simulation/optimize-strategy`

**Description**: Get optimal pit strategy recommendation based on current race conditions.

### Request Body
```json
{
  "user_id": "uuid-string"
}
```

### Response
```json
{
  "success": true,
  "strategy": {
    "pit_on_lap": 12,
    "tire_compound": "Medium",
    "fuel_to_add": 35.5,
    "expected_benefit": 2.3,
    "reasoning": "Weather conditions improving, medium tires optimal for remaining laps"
  }
}
```

---

## 11. Health Check

**Endpoint**: `GET /api/simulation/health`

**Description**: Check if backend is running and models are loaded.

### Response
```json
{
  "success": true,
  "status": "healthy",
  "models_loaded": 8,
  "uptime_seconds": 3600,
  "version": "1.0.0"
}
```

---

## Model Metadata API

### Get Model Metadata

**Endpoint**: `GET /api/model-metadata/<model_name>`

**Description**: Retrieve metadata for a specific ML model.

### Path Parameters
- `model_name`: One of: `lap_time_predictor`, `fuel_consumption_predictor`, `pit_stop_time_predictor`, `driver_consistency_predictor`, `weather_impact_predictor`, `optimal_sector_predictor`, `position_predictor`, `weather_pit_strategy_predictor`

### Response
```json
{
  "success": true,
  "metadata": {
    "model_name": "lap_time_predictor",
    "version": "1.0.0",
    "ensemble_type": "StackingRegressor",
    "base_models": ["LightGBM", "XGBoost", "CatBoost"],
    "meta_learner": "Ridge",
    "metrics": {
      "mae": 0.103,
      "mse": 0.021,
      "rmse": 0.145,
      "r2_score": 0.9998
    },
    "features": ["driver_skill", "engine_power", "downforce_level", "tire_compound", "tire_age", "fuel_load", "track", "air_temp", "track_temp", "humidity", "rainfall", "wind_speed"],
    "training_samples": 50000,
    "last_trained": "2024-01-10T12:00:00Z"
  }
}
```

### List All Models

**Endpoint**: `GET /api/model-metadata`

**Description**: List all available ML models and their status.

### Response
```json
{
  "success": true,
  "models": [
    {
      "name": "lap_time_predictor",
      "type": "regression",
      "ensemble": "StackingRegressor",
      "status": "loaded"
    },
    {
      "name": "fuel_consumption_predictor",
      "type": "regression",
      "ensemble": "StackingRegressor",
      "status": "loaded"
    }
    // ... 6 more models
  ],
  "total_models": 8
}
```

### Download Model Metadata

**Endpoint**: `GET /api/model-metadata/<model_name>/download`

**Description**: Download full model metadata as JSON file.

### Response
Downloads JSON file with complete model metadata, training history, and performance metrics.

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error description",
  "details": {}
}
```

### Common HTTP Status Codes
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters or missing user_id
- `404 Not Found` - Endpoint doesn't exist or resource not found
- `500 Internal Server Error` - Server error

---

## Authentication

All endpoints require a `user_id` parameter which is obtained from the frontend authentication system (Supabase). The frontend stores this in localStorage as `auth_token` and includes it in all API requests.


---

## CORS Configuration

The backend allows requests from:
- `http://localhost:3000` (Next.js development)
- `http://127.0.0.1:3000` (alternative localhost)

**Configuration** in `backend/app.py`:
```python
from flask_cors import CORS

CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000"
])
```

---

## Rate Limiting

The backend implements rate limiting to prevent abuse:

```python
from flask_limiter import Limiter

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)
```

---

## Testing API

### Using cURL

```bash
# Start simulation
curl -X POST http://localhost:8000/api/simulation/start \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-uuid-here",
    "track": "COTA",
    "config": {
      "driverSkill": "Pro",
      "carNumber": 1,
      "enginePower": 100,
      "downforceLevel": 5,
      "tireCompound": "Soft",
      "fuelLoad": 50,
      "airTemp": 25,
      "trackTemp": 35,
      "humidity": 60,
      "rainfall": 0,
      "windSpeed": 10,
      "lapCount": 20
    }
  }'

# Get state
curl "http://localhost:8000/api/simulation/state?user_id=your-uuid-here"

# Execute pit stop
curl -X POST http://localhost:8000/api/simulation/pit-stop \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "your-uuid-here"
  }'

# Get predictions
curl "http://localhost:8000/api/simulation/predict?user_id=your-uuid-here"
```

### Using Python Requests

```python
import requests

BASE_URL = "http://localhost:8000"
USER_ID = "your-uuid-here"

# Start simulation
response = requests.post(f"{BASE_URL}/api/simulation/start", json={
    "user_id": USER_ID,
    "track": "COTA",
    "config": {
        "driverSkill": "Pro",
        "enginePower": 100,
        "downforceLevel": 5,
        "tireCompound": "Soft",
        "fuelLoad": 50,
        "lapCount": 20
    }
})
print(response.json())

# Poll state
response = requests.get(f"{BASE_URL}/api/simulation/state", params={"user_id": USER_ID})
print(response.json())

# Get predictions
response = requests.get(f"{BASE_URL}/api/simulation/predict", params={"user_id": USER_ID})
print(response.json())
```

### Using JavaScript/TypeScript (Frontend)

```typescript
const BASE_URL = "http://localhost:8000";
const userId = localStorage.getItem('auth_token');

// Start simulation
const startSimulation = async () => {
  const response = await fetch(`${BASE_URL}/api/simulation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      track: "COTA",
      config: {
        driverSkill: "Pro",
        enginePower: 100,
        downforceLevel: 5,
        tireCompound: "Soft",
        fuelLoad: 50,
        lapCount: 20
      }
    })
  });
  return await response.json();
};

// Poll state (every 2-3 seconds)
const pollState = async () => {
  const response = await fetch(
    `${BASE_URL}/api/simulation/state?user_id=${userId}`
  );
  return await response.json();
};
```

---

## Notes

- **Frontend Polling**: The frontend polls `/api/simulation/state` every 2-3 seconds to update the UI in real-time.
- **User Isolation**: All simulation state is isolated by `user_id` - multiple users can run simultaneous simulations.
- **State Persistence**: Simulation state is persisted to Supabase PostgreSQL, allowing session recovery.
- **Track Data**: Track configurations loaded from `dataset/` directory with real iRacing telemetry.
- **Model Performance**: All 8 ML models achieve >97% accuracy with ensemble learning (LightGBM + XGBoost + CatBoost).

---

**API Documentation Version**: 1.0.0  
**Last Updated**: 2024  
**Backend Port**: 8000 (Flask development server)  
**Status**: Production-ready with rate limiting and CORS configured
