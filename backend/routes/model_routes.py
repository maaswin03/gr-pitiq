"""
Model Metadata Routes
Provides endpoints for accessing ML model metadata and insights
"""

import os
import json
from flask import Blueprint, jsonify, send_file
from pathlib import Path

model_bp = Blueprint('model', __name__, url_prefix='/api')

# Path to model metadata directory
METADATA_DIR = Path(__file__).parent.parent / 'model' / 'metadata'

@model_bp.route('/model-metadata/<model_name>', methods=['GET'])
def get_model_metadata(model_name):
    """
    Get metadata for a specific model
    """
    try:
        # Try different file name variations
        possible_files = [
            f"{model_name}.json",
            f"{model_name}_metadata.json",
            f"{model_name.replace('_metadata', '')}.json",
            f"{model_name.replace('_predictor', '')}_metadata.json"
        ]
        
        metadata_path = None
        for filename in possible_files:
            path = METADATA_DIR / filename
            if path.exists():
                metadata_path = path
                break
        
        if not metadata_path:
            return jsonify({
                "error": f"Metadata not found for model: {model_name}",
                "available_models": [f.stem for f in METADATA_DIR.glob('*.json')]
            }), 404
        
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        
        # Add model name to response
        metadata['model_name'] = model_name
        
        return jsonify(metadata), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@model_bp.route('/model-metadata', methods=['GET'])
def list_models():
    """
    List all available models with metadata
    """
    try:
        models = []
        for metadata_file in METADATA_DIR.glob('*.json'):
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            models.append({
                'id': metadata_file.stem,
                'name': metadata_file.stem.replace('_', ' ').title(),
                'model_type': metadata.get('model_type', 'Unknown'),
                'num_features': metadata.get('num_features', 0),
                'timestamp': metadata.get('timestamp', '')
            })
        
        return jsonify({"models": models}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@model_bp.route('/model-metadata/<model_name>/download', methods=['GET'])
def download_model_metadata(model_name):
    """
    Download metadata JSON file for a specific model
    """
    try:
        metadata_file = f"{model_name}.json"
        metadata_path = METADATA_DIR / metadata_file
        
        if not metadata_path.exists():
            return jsonify({"error": f"Metadata not found for model: {model_name}"}), 404
        
        return send_file(
            metadata_path,
            mimetype='application/json',
            as_attachment=True,
            download_name=f"{model_name}_metadata.json"
        )
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
