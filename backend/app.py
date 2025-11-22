#!/usr/bin/env python3
"""
Quick Start Flask App for GR PitIQ Simulation
Run this to test the simulation system
"""

import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from routes.simulation_routes import simulation_bp
from routes.model_routes import model_bp

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

app.register_blueprint(simulation_bp)
app.register_blueprint(model_bp)

@app.route('/')
def home():
    return {
        "service": "GR PitIQ Simulation API",
        "version": "1.0.0",
        "endpoints": {
            "start": "POST /api/simulation/start",
            "stop": "POST /api/simulation/stop",
            "state": "GET /api/simulation/state?user_id=<id>",
            "laps": "GET /api/simulation/laps?user_id=<id>",
            "status": "GET /api/simulation/status",
            "health": "GET /api/simulation/health"
        },
        "docs": "See backend/simulation/README.md"
    }

@app.route('/health')
def health():
    return {"status": "healthy", "service": "GR PitIQ API"}

if __name__ == '__main__':
    if not os.getenv('SUPABASE_URL') or not os.getenv('SUPABASE_ANON_KEY'):
        print("⚠️  WARNING: Supabase credentials not found!")
        print("Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
        print("Example:")
        print('  export SUPABASE_URL="https://your-project.supabase.co"')
        print('  export SUPABASE_ANON_KEY="your-anon-key"')
        print()
    
    print("🚀 Starting GR PitIQ Simulation Server...")
    print("📡 API available at: http://localhost:8000")
    print("📚 Documentation: backend/simulation/README.md")
    print()
    
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=True,
        use_reloader=False
    )
