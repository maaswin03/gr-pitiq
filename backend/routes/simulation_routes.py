"""
Flask API Routes for GR PitIQ Simulation
Endpoints for starting, stopping, and querying simulation state
"""

from flask import Blueprint, request, jsonify
import sys
from pathlib import Path
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from simulation.scheduler import get_scheduler
from simulation.supabase_service import SupabaseService

# Create Blueprint
simulation_bp = Blueprint('simulation', __name__, url_prefix='/api/simulation')

# Initialize services
supabase_service = SupabaseService()


@simulation_bp.route('/start', methods=['POST'])
def start_simulation():
    """
    Start a new simulation session
    
    Request Body:
    {
        "user_id": "string",
        "track": "string" (optional, default "Barber")
    }
    
    Response:
    {
        "success": true,
        "message": "Simulation started",
        "user_id": "string",
        "track": "string"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: user_id"
            }), 400
            
        user_id = data['user_id']
        track = data.get('track', 'Barber')
        
        # Extract user configuration (optional)
        user_config = data.get('config', {})
        
        # Validate track
        valid_tracks = ["Barber", "COTA", "Road America", "Sebring", "Sonoma", "VIR"]
        if track not in valid_tracks:
            return jsonify({
                "success": False,
                "error": f"Invalid track. Valid options: {', '.join(valid_tracks)}"
            }), 400
        
        # Get scheduler and start simulation with config
        scheduler = get_scheduler()
        success = scheduler.start_simulation(user_id, track, user_config)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Simulation started successfully",
                "user_id": user_id,
                "track": track,
                "update_interval_seconds": 2
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Failed to start simulation"
            }), 500
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/update', methods=['POST'])
def update_simulation():
    """
    Update configuration for an active simulation session
    Allows real-time parameter changes without stopping the simulation
    
    Request Body:
    {
        "user_id": "string",
        "config": {
            "driverSkill": "Pro" | "Amateur" | "Aggressive" | "Conservative",
            "carNumber": number,
            "enginePower": number (80-120),
            "downforceLevel": number (0-100),
            "tireCompound": "Soft" | "Medium" | "Hard",
            "fuelLoad": number (30-50),
            "airTemp": number (15-35),
            "trackTemp": number (20-55),
            "humidity": number (30-95),
            "rainfall": number (0-100),
            "windSpeed": number (0-40),
            "lapCount": number
        }
    }
    
    Response:
    {
        "success": true,
        "message": "Configuration updated",
        "user_id": "string",
        "updated_params": ["param1", "param2", ...]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: user_id"
            }), 400
            
        if 'config' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: config"
            }), 400
            
        user_id = data['user_id']
        config = data['config']
        
        # Get scheduler and update simulation
        scheduler = get_scheduler()
        success = scheduler.update_simulation(user_id, config)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Configuration updated successfully",
                "user_id": user_id,
                "updated_params": list(config.keys())
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "No active simulation found for this user"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/pit-stop', methods=['POST'])
def pit_stop():
    """
    Execute manual pit stop for active simulation
    
    Request Body:
    {
        "user_id": "string"
    }
    
    Response:
    {
        "success": true,
        "pit_duration": 27.3,
        "fuel_added": 15.5,
        "fuel_now": 50.0,
        "tire_compound": "Soft",
        "old_tire_age": 12,
        "new_tire_age": 0,
        "time_penalty": 27.3
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: user_id"
            }), 400
            
        user_id = data['user_id']
        
        # Get scheduler and execute pit stop
        scheduler = get_scheduler()
        result = scheduler.pit_stop(user_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/resume', methods=['POST'])
def resume_simulation():
    """
    Resume simulation after pit stop
    
    Request Body:
    {
        "user_id": "string"
    }
    
    Response:
    {
        "success": true,
        "resumed": true,
        "time_penalty_applied": 27.3,
        "tire_compound": "Soft"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: user_id"
            }), 400
            
        user_id = data['user_id']
        
        # Get scheduler and resume simulation
        scheduler = get_scheduler()
        result = scheduler.resume(user_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/stop', methods=['POST'])
def stop_simulation():
    """
    Stop an active simulation session
    
    Request Body:
    {
        "user_id": "string"
    }
    
    Response:
    {
        "success": true,
        "message": "Simulation stopped",
        "user_id": "string"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'user_id' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: user_id"
            }), 400
            
        user_id = data['user_id']
        
        # Get scheduler and stop simulation
        scheduler = get_scheduler()
        success = scheduler.stop_simulation(user_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": "Simulation stopped successfully",
                "user_id": user_id
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "No active simulation found for this user"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/state', methods=['GET'])
def get_simulation_state():
    """
    Get current simulation state from Supabase
    Frontend polls this endpoint every 2-3 seconds
    
    Query Parameters:
    - user_id: string (required)
    
    Response:
    {
        "success": true,
        "data": {
            "user_id": "string",
            "timestamp": "ISO datetime",
            "current_lap": int,
            "current_sector": int,
            "sector_progress": float,
            "raw_telemetry": { ... all 97+ model parameters ... },
            "engineered_features": { ... 50+ ML features ... },
            "lap_time": float,
            "speed": float,
            "fuel": float,
            "tire_age": int,
            "track": "string",
            "is_active": bool
        }
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Missing required parameter: user_id"
            }), 400
            
        # Get current state from Supabase
        state = supabase_service.get_current_state(user_id)
        
        if state:
            return jsonify({
                "success": True,
                "data": state
            }), 200
        else:
            # Check if simulation is active in scheduler but not in DB yet
            scheduler = get_scheduler()
            is_active = scheduler.is_simulation_active(user_id)
            
            return jsonify({
                "success": False,
                "error": "No simulation state found for this user",
                "simulation_active": is_active,
                "message": "Simulation may be starting, try again in 2 seconds" if is_active else "No active simulation"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/laps', methods=['GET'])
def get_lap_history():
    """
    Get lap history for a user, optionally filtered by session
    
    Query Parameters:
    - user_id: string (required)
    - limit: int (optional, default 50)
    - session_id: string (optional, filter to specific simulation session)
    
    Response:
    {
        "success": true,
        "data": [
            {
                "lap_number": int,
                "lap_time": float,
                "sector_times": { "s1": float, "s2": float, "s3": float },
                "speed_stats": { "avg_speed": float, "top_speed": float },
                "tire_stats": { "age": int, "compound": "string" },
                "fuel_stats": { "used": float, "remaining": float },
                "weather": { ... },
                "engineered_features": { ... },
                "timestamp": "ISO datetime"
            },
            ...
        ],
        "count": int
    }
    """
    try:
        user_id = request.args.get('user_id')
        limit = request.args.get('limit', 50, type=int)
        session_id = request.args.get('session_id')
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Missing required parameter: user_id"
            }), 400
            
        # Validate limit
        if limit < 1 or limit > 200:
            return jsonify({
                "success": False,
                "error": "Limit must be between 1 and 200"
            }), 400
            
        # Get lap history from Supabase, optionally filtered by session
        laps = supabase_service.get_lap_history(user_id, limit, session_id)
        
        return jsonify({
            "success": True,
            "data": laps,
            "count": len(laps),
            "session_id": session_id
        }), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/status', methods=['GET'])
def get_simulation_status():
    """
    Get simulation scheduler status and active sessions
    
    Query Parameters:
    - user_id: string (optional, for specific user status)
    
    Response:
    {
        "success": true,
        "scheduler_running": bool,
        "active_users": ["user1", "user2", ...],
        "user_status": { ... } (if user_id provided)
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        scheduler = get_scheduler()
        
        response_data = {
            "success": True,
            "scheduler_running": scheduler.scheduler.running if hasattr(scheduler, 'scheduler') else False,
            "active_users": scheduler.get_active_users(),
            "active_count": len(scheduler.get_active_users())
        }
        
        # Add specific user status if requested
        if user_id:
            response_data["user_status"] = scheduler.get_simulation_status(user_id)
            
        return jsonify(response_data), 200
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    
    Response:
    {
        "status": "healthy",
        "service": "simulation",
        "timestamp": "ISO datetime"
    }
    """
    from datetime import datetime
    
    return jsonify({
        "status": "healthy",
        "service": "simulation",
        "timestamp": datetime.now().isoformat()
    }), 200


# Error handlers
@simulation_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@simulation_bp.route('/predict', methods=['GET'])
def get_predictions():
    """
    Get ML model predictions for current simulation state
    
    Query Parameters:
    - user_id: string (required)
    
    Response:
    {
        "success": true,
        "data": {
            "lap_time": float,
            "pit_stop_time": float,
            "fuel_consumption": float,
            "driver_consistency": float,
            "weather_impact": float,
            "optimal_sector": { "s1": float, "s2": float, "s3": float },
            "weather_pit_strategy": string,
            "timestamp": ISO datetime
        }
    }
    """
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({
                "success": False,
                "error": "Missing required parameter: user_id"
            }), 400
        
        # Get current simulation state
        scheduler = get_scheduler()
        if user_id not in scheduler.active_simulations:
            return jsonify({
                "success": False,
                "error": "No active simulation for this user"
            }), 404
        
        sim_engine = scheduler.active_simulations[user_id]
        
        # Generate snapshot with all features
        snapshot = sim_engine._generate_snapshot()
        engineered_features = snapshot.get('engineered_features', {})
        raw_snapshot = snapshot.get('raw_snapshot', {})
        
        # Load models and make predictions
        import joblib
        import os
        import numpy as np
        import pandas as pd
        import json
        
        model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model')
        metadata_dir = os.path.join(model_dir, 'metadata')
        predictions = {}
        
        # Helper function to prepare features for a model
        def prepare_features(raw_data, feature_names):
            """Extract only the features the model needs from raw data"""
            filtered_data = {}
            for feature in feature_names:
                if feature in raw_data:
                    filtered_data[feature] = raw_data[feature]
                else:
                    # Provide default for missing features
                    filtered_data[feature] = 0
            return pd.DataFrame([filtered_data])
        
        try:
            # Lap Time Prediction
            lap_time_model = joblib.load(os.path.join(model_dir, 'lap_time_predictor.pkl'))
            with open(os.path.join(metadata_dir, 'lap_time_predictor.json'), 'r') as f:
                lap_metadata = json.load(f)
            lap_features = prepare_features(raw_snapshot, lap_metadata['feature_names'])
            predictions['lap_time'] = float(lap_time_model.predict(lap_features)[0])
        except Exception as e:
            print(f"Lap time prediction error: {e}")
            import traceback
            traceback.print_exc()
            predictions['lap_time'] = raw_snapshot.get('LAP_TIME_SECONDS', 92.0)
        
        try:
            # Pit Stop Time Prediction
            pit_model = joblib.load(os.path.join(model_dir, 'pit_stop_time_predictor.pkl'))
            with open(os.path.join(metadata_dir, 'pit_stop_time_predictor.json'), 'r') as f:
                pit_metadata = json.load(f)
            pit_features = prepare_features(raw_snapshot, pit_metadata['feature_names'])
            predictions['pit_stop_time'] = float(pit_model.predict(pit_features)[0])
        except Exception as e:
            print(f"Pit stop prediction error: {e}")
            import traceback
            traceback.print_exc()
            predictions['pit_stop_time'] = 25.0
        
        try:
            # Fuel Consumption Prediction
            fuel_model = joblib.load(os.path.join(model_dir, 'fuel_consumption_predictor.pkl'))
            with open(os.path.join(metadata_dir, 'fuel_consumption_predictor.json'), 'r') as f:
                fuel_metadata = json.load(f)
            fuel_features = prepare_features(raw_snapshot, fuel_metadata['feature_names'])
            predictions['fuel_consumption'] = float(fuel_model.predict(fuel_features)[0])
        except Exception as e:
            print(f"Fuel prediction error: {e}")
            import traceback
            traceback.print_exc()
            predictions['fuel_consumption'] = 2.1
        
        try:
            # Driver Consistency Prediction
            consistency_data = joblib.load(os.path.join(model_dir, 'driver_consistency_predictor.pkl'))
            consistency_features = prepare_features(raw_snapshot, consistency_data['feature_names'])
            # This is an ensemble, use the first model
            consistency_model = consistency_data['models']['random_forest']
            predictions['driver_consistency'] = float(consistency_model.predict(consistency_features)[0])
        except Exception as e:
            print(f"Consistency prediction error: {e}")
            import traceback
            traceback.print_exc()
            predictions['driver_consistency'] = 94.0
        
        try:
            # Weather Impact Prediction
            weather_model = joblib.load(os.path.join(model_dir, 'weather_impact_predictor.pkl'))
            with open(os.path.join(metadata_dir, 'weather_impact_predictor.json'), 'r') as f:
                weather_metadata = json.load(f)
            weather_features = prepare_features(raw_snapshot, weather_metadata['feature_names'])
            predictions['weather_impact'] = float(weather_model.predict(weather_features)[0])
        except Exception as e:
            print(f"Weather impact prediction error: {e}")
            import traceback
            traceback.print_exc()
            predictions['weather_impact'] = 1.5
        
        try:
            # Optimal Sector Prediction
            sector_model = joblib.load(os.path.join(model_dir, 'optimal_sector_predictor.pkl'))
            with open(os.path.join(metadata_dir, 'optimal_sector_predictor.json'), 'r') as f:
                sector_metadata = json.load(f)
            sector_features = prepare_features(raw_snapshot, sector_metadata['feature_names'])
            sector_pred = sector_model.predict(sector_features)[0]
            if isinstance(sector_pred, np.ndarray) and len(sector_pred) == 3:
                predictions['optimal_sector'] = {
                    's1': float(sector_pred[0]),
                    's2': float(sector_pred[1]),
                    's3': float(sector_pred[2])
                }
            else:
                predictions['optimal_sector'] = {
                    's1': 30.0,
                    's2': 31.0,
                    's3': 30.5
                }
        except Exception as e:
            print(f"Sector prediction error: {e}")
            import traceback
            traceback.print_exc()
            predictions['optimal_sector'] = {
                's1': raw_snapshot.get('S1_SECONDS', 30.0),
                's2': raw_snapshot.get('S2_SECONDS', 31.0),
                's3': raw_snapshot.get('S3_SECONDS', 30.5)
            }
        
        try:
            # Weather Pit Strategy Prediction
            pit_strategy_data = joblib.load(os.path.join(model_dir, 'weather_pit_strategy_predictor.pkl'))
            pit_strategy_features = prepare_features(raw_snapshot, pit_strategy_data['feature_names'])
            # This is an ensemble, use rf (random forest) or voting_ensemble
            if 'rf' in pit_strategy_data['models']:
                pit_strategy_model = pit_strategy_data['models']['rf']
            elif 'voting_ensemble' in pit_strategy_data['models']:
                pit_strategy_model = pit_strategy_data['models']['voting_ensemble']
            else:
                pit_strategy_model = list(pit_strategy_data['models'].values())[0]
            strategy = pit_strategy_model.predict(pit_strategy_features)[0]
            predictions['weather_pit_strategy'] = str(strategy)
        except Exception as e:
            print(f"Pit strategy prediction error: {e}")
            import traceback
            traceback.print_exc()
            predictions['weather_pit_strategy'] = 'Standard'
        
        # Add metadata
        predictions['timestamp'] = datetime.now().isoformat()
        predictions['current_lap'] = sim_engine.current_lap
        
        print(f"\n{'='*60}")
        print(f"ML PREDICTIONS FOR USER: {user_id}")
        print(f"Current Lap: {sim_engine.current_lap}")
        print(f"Lap Time Prediction: {predictions['lap_time']:.3f}s")
        print(f"Fuel Consumption: {predictions['fuel_consumption']:.2f}L")
        print(f"Pit Stop Time: {predictions['pit_stop_time']:.2f}s")
        print(f"Driver Consistency: {predictions['driver_consistency']:.1f}%")
        print(f"Weather Impact: +{predictions['weather_impact']:.2f}s")
        print(f"Optimal Sectors: S1={predictions['optimal_sector']['s1']:.3f}s, S2={predictions['optimal_sector']['s2']:.3f}s, S3={predictions['optimal_sector']['s3']:.3f}s")
        print(f"Pit Strategy: {predictions['weather_pit_strategy']}")
        print(f"{'='*60}\n")
        
        return jsonify({
            "success": True,
            "data": predictions
        }), 200
        
    except Exception as e:
        print(f"Prediction endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.route('/optimize-strategy', methods=['POST'])
def optimize_strategy():
    """
    Optimize race strategy based on parameters
    
    Request Body:
    {
        "tire_type": "soft|medium|hard",
        "fuel_load": float (20-100),
        "weather_forecast": "dry|light_rain|heavy_rain",
        "aggression_level": int (1-10),
        "pit_stop_timing": int (lap number 5-30)
    }
    
    Response:
    {
        "fastest_race_time": float,
        "optimal_pit_lap": int,
        "risk_level": string,
        "risk_score": float,
        "tire_wear_curve": [float],
        "fuel_delta": float,
        "lap_time_delta": float,
        "total_laps": int,
        "estimated_finish_position": int,
        "tire_degradation_rate": float,
        "fuel_efficiency": float,
        "strategy_confidence": float
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Missing request body"
            }), 400
        
        # Extract parameters with defaults
        tire_type = data.get('tire_type', 'medium')
        fuel_load = float(data.get('fuel_load', 50))
        weather_forecast = data.get('weather_forecast', 'dry')
        aggression_level = int(data.get('aggression_level', 5))
        pit_stop_timing = int(data.get('pit_stop_timing', 15))
        
        # Validate parameters
        if tire_type not in ['soft', 'medium', 'hard']:
            return jsonify({"success": False, "error": "Invalid tire type"}), 400
        if not 20 <= fuel_load <= 100:
            return jsonify({"success": False, "error": "Fuel load must be between 20-100L"}), 400
        if weather_forecast not in ['dry', 'light_rain', 'heavy_rain']:
            return jsonify({"success": False, "error": "Invalid weather forecast"}), 400
        if not 1 <= aggression_level <= 10:
            return jsonify({"success": False, "error": "Aggression level must be between 1-10"}), 400
        if not 5 <= pit_stop_timing <= 30:
            return jsonify({"success": False, "error": "Pit stop timing must be between lap 5-30"}), 400
        
        # Calculate tire characteristics
        tire_multipliers = {
            'soft': {'speed': 1.05, 'wear': 1.8, 'grip': 1.2},
            'medium': {'speed': 1.0, 'wear': 1.0, 'grip': 1.0},
            'hard': {'speed': 0.97, 'wear': 0.6, 'grip': 0.85}
        }
        tire_char = tire_multipliers[tire_type]
        
        # Calculate weather impact
        weather_multipliers = {
            'dry': {'time': 0.0, 'risk': 0.1, 'wear': 1.0},
            'light_rain': {'time': 2.5, 'risk': 0.3, 'wear': 0.8},
            'heavy_rain': {'time': 8.0, 'risk': 0.6, 'wear': 0.6}
        }
        weather_char = weather_multipliers[weather_forecast]
        
        # Base lap time (seconds) - adjust based on track
        base_lap_time = 95.0  # ~1:35 for Barber
        
        # Calculate optimal lap time
        lap_time_delta = (
            (10 - aggression_level) * 0.3  # Conservative = slower
            + weather_char['time']  # Weather penalty
            - (tire_char['speed'] - 1.0) * 5  # Tire grip benefit
            + (fuel_load - 50) * 0.02  # Fuel weight penalty
        )
        
        optimal_lap_time = base_lap_time + lap_time_delta
        
        # Calculate race parameters
        total_laps = 35  # Standard race length
        
        # Optimize pit lap based on tire wear and fuel
        tire_life_laps = int(25 / tire_char['wear'])
        fuel_life_laps = int(fuel_load / 2.1)  # ~2.1L per lap
        
        # Optimal pit is when tire wear reaches 70% or fuel gets low
        optimal_pit_lap = min(
            int(tire_life_laps * 0.7),
            fuel_life_laps - 3,  # 3 lap safety margin
            pit_stop_timing
        )
        optimal_pit_lap = max(5, min(optimal_pit_lap, 30))  # Clamp between 5-30
        
        # Calculate tire wear curve (every 5 laps)
        tire_wear_curve = []
        for lap in range(5, total_laps + 1, 5):
            if lap <= optimal_pit_lap:
                wear = (lap / tire_life_laps) * 100 * tire_char['wear']
            else:
                laps_since_pit = lap - optimal_pit_lap
                wear = (laps_since_pit / tire_life_laps) * 100 * tire_char['wear']
            tire_wear_curve.append(min(100, wear))
        
        # Calculate risk score
        risk_score = (
            aggression_level * 5  # Aggression adds risk
            + weather_char['risk'] * 100  # Weather risk
            + (abs(pit_stop_timing - optimal_pit_lap) * 2)  # Sub-optimal pit timing
            + (tire_char['wear'] * 15)  # Tire wear rate
        )
        risk_score = min(100, risk_score)
        
        if risk_score < 30:
            risk_level = "LOW"
        elif risk_score < 70:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        # Calculate race time
        pit_stop_time = 18.5  # Average pit stop
        fastest_race_time = (optimal_lap_time * total_laps) + pit_stop_time
        
        # Fuel calculations
        baseline_consumption = 2.1
        actual_consumption = baseline_consumption * (1 + (aggression_level - 5) * 0.02)
        fuel_delta = (actual_consumption - baseline_consumption) * total_laps
        
        # Fuel efficiency rating
        fuel_efficiency = 100 - (abs(fuel_delta) / fuel_load * 100)
        fuel_efficiency = max(0, min(100, fuel_efficiency))
        
        # Tire degradation rate
        tire_degradation_rate = (100 / tire_life_laps) * tire_char['wear']
        
        # Estimated finish position (simplified model)
        time_advantage = (base_lap_time - optimal_lap_time) * total_laps
        estimated_finish_position = max(1, min(20, int(10 - (time_advantage / 10))))
        
        # Strategy confidence
        strategy_confidence = 100 - (risk_score * 0.5) - (abs(fuel_delta) * 2)
        strategy_confidence = max(0, min(100, strategy_confidence))
        
        result = {
            "fastest_race_time": round(fastest_race_time, 2),
            "optimal_pit_lap": optimal_pit_lap,
            "risk_level": risk_level,
            "risk_score": round(risk_score, 1),
            "tire_wear_curve": [round(w, 1) for w in tire_wear_curve],
            "fuel_delta": round(fuel_delta, 2),
            "lap_time_delta": round(lap_time_delta, 3),
            "total_laps": total_laps,
            "estimated_finish_position": estimated_finish_position,
            "tire_degradation_rate": round(tire_degradation_rate, 2),
            "fuel_efficiency": round(fuel_efficiency, 1),
            "strategy_confidence": round(strategy_confidence, 1)
        }
        
        print(f"\n{'='*60}")
        print("STRATEGY OPTIMIZATION RESULT")
        print(f"{'='*60}")
        print(f"Tire: {tire_type.upper()} | Fuel: {fuel_load}L | Weather: {weather_forecast.replace('_', ' ').title()}")
        print(f"Aggression: {aggression_level}/10 | Target Pit: Lap {pit_stop_timing}")
        print(f"---")
        print(f"Optimal Pit Lap: {optimal_pit_lap}")
        print(f"Fastest Race Time: {result['fastest_race_time']}s ({int(result['fastest_race_time']//60)}:{int(result['fastest_race_time']%60):02d})")
        print(f"Risk Level: {risk_level} ({risk_score:.1f}%)")
        print(f"Strategy Confidence: {strategy_confidence:.1f}%")
        print(f"{'='*60}\n")
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Strategy optimization error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@simulation_bp.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500
