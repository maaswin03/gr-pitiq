"""
Multi-Predictor API

Unified REST API for multiple race prediction models:
- Fuel Consumption Predictor
- Pit Stop Time Predictor
- Weather Pit Strategy Predictor
- Weather Impact Predictor
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import json
import os
import traceback

app = Flask(__name__)
CORS(app)

# Setup paths
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BACKEND_DIR, 'model')
METADATA_DIR = os.path.join(MODEL_DIR, 'metadata')

# Model configurations
MODELS = {
    'fuel_consumption': {
        'name': 'Fuel Consumption Predictor',
        'model_path': os.path.join(MODEL_DIR, 'fuel_consumption_predictor.pkl'),
        'metadata_path': os.path.join(METADATA_DIR, 'fuel_consumption_predictor.json'),
        'prediction_field': 'predicted_fuel_consumption',
        'unit': 'liters'
    },
    'pit_stop_time': {
        'name': 'Pit Stop Time Predictor',
        'model_path': os.path.join(MODEL_DIR, 'pit_stop_time_predictor.pkl'),
        'metadata_path': os.path.join(METADATA_DIR, 'pit_stop_time_predictor.json'),
        'prediction_field': 'predicted_pit_stop_time',
        'unit': 'seconds'
    },
    'weather_pit_strategy': {
        'name': 'Weather Pit Strategy Predictor',
        'model_path': os.path.join(MODEL_DIR, 'weather_pit_strategy_predictor.pkl'),
        'metadata_path': os.path.join(METADATA_DIR, 'weather_pit_strategy_predictor.json'),
        'prediction_field': 'pit_decision',
        'unit': 'binary (0=no pit, 1=pit)'
    },
    'weather_impact': {
        'name': 'Weather Impact Predictor',
        'model_path': os.path.join(MODEL_DIR, 'weather_impact_predictor.pkl'),
        'metadata_path': os.path.join(METADATA_DIR, 'weather_impact_predictor.json'),
        'prediction_field': 'predicted_weather_impact',
        'unit': 'seconds'
    }
}

# Global storage for loaded models
loaded_models = {}


def load_model(model_key):
    """Load a model and its metadata"""
    if model_key in loaded_models:
        return loaded_models[model_key]
    
    config = MODELS.get(model_key)
    if not config:
        raise ValueError(f"Unknown model: {model_key}")
    
    # Load model
    if not os.path.exists(config['model_path']):
        raise FileNotFoundError(f"Model file not found: {config['model_path']}")
    
    model = joblib.load(config['model_path'])
    
    # Load metadata
    metadata = None
    if os.path.exists(config['metadata_path']):
        with open(config['metadata_path'], 'r') as f:
            metadata = json.load(f)
    
    loaded_models[model_key] = {
        'model': model,
        'metadata': metadata,
        'config': config
    }
    
    print(f"✅ Loaded {config['name']}")
    if metadata:
        print(f"   Features required: {len(metadata.get('feature_names', []))}")
    
    return loaded_models[model_key]


def prepare_features(data, feature_names, track_columns=None):
    """
    Prepare feature vector from input data
    Handles one-hot encoding for TRACK columns
    """
    features = {}
    
    # Handle track one-hot encoding
    track_value = data.get('TRACK', '').lower()
    
    for feature in feature_names:
        if feature.startswith('TRACK_'):
            # One-hot encode track
            track_name = feature.replace('TRACK_', '')
            features[feature] = 1 if track_name.lower() == track_value else 0
        elif feature in data:
            features[feature] = data[feature]
        else:
            # Default to 0 for missing features
            features[feature] = 0
    
    # Create DataFrame with correct column order
    df = pd.DataFrame([features], columns=feature_names)
    
    return df


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    available_models = []
    for key, config in MODELS.items():
        exists = os.path.exists(config['model_path'])
        available_models.append({
            'key': key,
            'name': config['name'],
            'available': exists
        })
    
    return jsonify({
        'status': 'healthy',
        'models': available_models
    }), 200


@app.route('/api/models', methods=['GET'])
def list_models():
    """List all available models with their required features"""
    models_info = []
    
    for key, config in MODELS.items():
        info = {
            'key': key,
            'name': config['name'],
            'prediction_field': config['prediction_field'],
            'unit': config['unit'],
            'available': os.path.exists(config['model_path'])
        }
        
        # Load metadata if available
        if os.path.exists(config['metadata_path']):
            with open(config['metadata_path'], 'r') as f:
                metadata = json.load(f)
                info['features'] = metadata.get('feature_names', [])
                info['feature_count'] = len(metadata.get('feature_names', []))
        
        models_info.append(info)
    
    return jsonify({
        'models': models_info,
        'total': len(models_info)
    }), 200


@app.route('/api/predict/<model_key>', methods=['POST'])
def predict(model_key):
    """
    Make prediction using specified model
    
    URL: /api/predict/fuel_consumption
    
    Request body: JSON with required features
    {
        "RACE_SESSION": 1,
        "LAP_NUMBER": 10,
        "LAP_TIME": 98.5,
        "AVG_LAP_TIME": 99.2,
        "TRACK": "barber",
        ...
    }
    """
    try:
        # Validate model key
        if model_key not in MODELS:
            return jsonify({
                'error': 'Invalid model',
                'message': f'Model "{model_key}" not found',
                'available_models': list(MODELS.keys())
            }), 404
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Request body must contain JSON data with required features',
                'hint': f'Use GET /api/models to see required features for {model_key}'
            }), 400
        
        # Load model
        model_data = load_model(model_key)
        model = model_data['model']
        metadata = model_data['metadata']
        config = model_data['config']
        
        if not metadata:
            return jsonify({
                'error': 'Metadata not found',
                'message': f'Cannot determine required features for {model_key}'
            }), 500
        
        feature_names = metadata['feature_names']
        
        # Check for missing required features (excluding one-hot encoded TRACK columns)
        base_features = [f for f in feature_names if not f.startswith('TRACK_')]
        missing_features = [f for f in base_features if f not in data and f != 'TRACK']
        
        if missing_features:
            return jsonify({
                'error': 'Missing required features',
                'missing': missing_features,
                'provided': list(data.keys()),
                'required': base_features,
                'note': 'TRACK will be one-hot encoded automatically'
            }), 400
        
        # Prepare features
        try:
            X = prepare_features(data, feature_names)
        except Exception as e:
            return jsonify({
                'error': 'Feature preparation failed',
                'message': str(e),
                'traceback': traceback.format_exc() if app.debug else None
            }), 400
        
        # Make prediction
        # Handle ensemble models (dict with 'models' key)
        if isinstance(model, dict) and 'models' in model:
            # Ensemble model - use first model or voting
            if 'scaler' in model and model['scaler'] is not None:
                X_scaled = model['scaler'].transform(X)
                X_scaled = pd.DataFrame(X_scaled, columns=X.columns)
            else:
                X_scaled = X
            
            # Use first model in ensemble for prediction
            first_model = list(model['models'].values())[0]
            prediction = first_model.predict(X_scaled)[0]
        else:
            prediction = model.predict(X)[0]
        
        # Format prediction
        if isinstance(prediction, (np.integer, np.floating)):
            prediction = float(prediction)
        
        # Prepare response
        response = {
            'model': config['name'],
            'prediction': {
                config['prediction_field']: prediction,
                'unit': config['unit']
            },
            'input_features': {k: v for k, v in data.items() if not k.startswith('_')},
            'metadata': {
                'features_used': len(feature_names),
                'model_key': model_key
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e),
            'traceback': traceback.format_exc() if app.debug else None
        }), 500


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """
    Make predictions for multiple models at once
    
    Request body:
    {
        "models": ["fuel_consumption", "pit_stop_time"],
        "features": {
            "RACE_SESSION": 1,
            "LAP_NUMBER": 10,
            ...
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'models' not in data or 'features' not in data:
            return jsonify({
                'error': 'Invalid request',
                'message': 'Request must contain "models" array and "features" object',
                'example': {
                    'models': ['fuel_consumption', 'pit_stop_time'],
                    'features': {'RACE_SESSION': 1, 'LAP_NUMBER': 10}
                }
            }), 400
        
        model_keys = data['models']
        features = data['features']
        
        # Validate models
        invalid_models = [m for m in model_keys if m not in MODELS]
        if invalid_models:
            return jsonify({
                'error': 'Invalid models',
                'invalid': invalid_models,
                'available': list(MODELS.keys())
            }), 400
        
        # Make predictions for each model
        predictions = {}
        errors = {}
        
        for model_key in model_keys:
            try:
                model_data = load_model(model_key)
                model = model_data['model']
                metadata = model_data['metadata']
                config = model_data['config']
                
                if metadata:
                    feature_names = metadata['feature_names']
                    X = prepare_features(features, feature_names)
                    
                    # Handle ensemble models
                    if isinstance(model, dict) and 'models' in model:
                        if 'scaler' in model and model['scaler'] is not None:
                            X_scaled = model['scaler'].transform(X)
                            X_scaled = pd.DataFrame(X_scaled, columns=X.columns)
                        else:
                            X_scaled = X
                        first_model = list(model['models'].values())[0]
                        prediction = first_model.predict(X_scaled)[0]
                    else:
                        prediction = model.predict(X)[0]
                    
                    predictions[model_key] = {
                        'value': float(prediction) if isinstance(prediction, (np.integer, np.floating)) else prediction,
                        'unit': config['unit'],
                        'field': config['prediction_field']
                    }
            except Exception as e:
                errors[model_key] = str(e)
        
        response = {
            'predictions': predictions,
            'input_features': features,
            'metadata': {
                'requested_models': len(model_keys),
                'successful_predictions': len(predictions),
                'failed_predictions': len(errors)
            }
        }
        
        if errors:
            response['errors'] = errors
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Batch prediction failed',
            'message': str(e),
            'traceback': traceback.format_exc() if app.debug else None
        }), 500


if __name__ == '__main__':
    print("\n" + "="*70)
    print("🏁 Multi-Predictor API")
    print("="*70)
    print("\nAvailable Models:")
    for key, config in MODELS.items():
        status = "✅" if os.path.exists(config['model_path']) else "❌"
        print(f"  {status} {key}: {config['name']}")
    
    print("\nEndpoints:")
    print("  GET  /api/health                    - Health check")
    print("  GET  /api/models                    - List all models")
    print("  POST /api/predict/<model_key>       - Single prediction")
    print("  POST /api/predict/batch             - Batch predictions")
    print("\nStarting server on http://localhost:8001")
    print("="*70 + "\n")
    
    app.run(host='0.0.0.0', port=8001, debug=True)
