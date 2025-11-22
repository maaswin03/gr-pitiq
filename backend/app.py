#!/usr/bin/env python3
"""
GR PitIQ Simulation API Server
Production-ready Flask application with logging, rate limiting, and security
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from werkzeug.middleware.proxy_fix import ProxyFix

# Load environment variables
load_dotenv()

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from routes.simulation_routes import simulation_bp
from routes.model_routes import model_bp

# ===== Configuration =====
class Config:
    """Application configuration"""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', os.urandom(32).hex())
    
    # Server
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8000))
    DEBUG = os.getenv('FLASK_ENV', 'production') == 'development'
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.getenv('RATELIMIT_STORAGE_URL', 'memory://')
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '100 per minute')
    
    # Supabase
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/app.log')

# ===== Logging Setup =====
def setup_logging(config):
    """Configure application logging"""
    log_dir = Path(__file__).parent / 'logs'
    log_dir.mkdir(exist_ok=True)
    
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    log_level = getattr(logging, config.LOG_LEVEL.upper(), logging.INFO)
    
    # File handler
    file_handler = logging.FileHandler(log_dir / 'app.log')
    file_handler.setLevel(log_level)
    file_handler.setFormatter(logging.Formatter(log_format))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(logging.Formatter(log_format))
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        handlers=[file_handler, console_handler]
    )
    
    # Reduce noise from libraries
    logging.getLogger('werkzeug').setLevel(logging.WARNING)
    logging.getLogger('urllib3').setLevel(logging.WARNING)

# ===== Application Factory =====
def create_app(config_class=Config):
    """Create and configure Flask application"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Setup logging
    setup_logging(config_class)
    logger = logging.getLogger(__name__)
    
    # Validate required environment variables
    if not config_class.SUPABASE_URL or not config_class.SUPABASE_ANON_KEY:
        logger.error("Missing required Supabase credentials")
        if config_class.DEBUG:
            logger.warning("Running without Supabase connection (development mode)")
        else:
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY must be set in production")
    
    # Proxy fix for production deployment behind reverse proxy
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)
    
    # CORS configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": config_class.CORS_ORIGINS,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })
    
    # Rate limiting
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[config_class.RATELIMIT_DEFAULT],
        storage_uri=config_class.RATELIMIT_STORAGE_URL
    )
    
    # Register blueprints
    app.register_blueprint(simulation_bp)
    app.register_blueprint(model_bp)
    
    # ===== Core Routes =====
    @app.route('/')
    def home():
        """API root endpoint with service information"""
        return jsonify({
            "service": "GR PitIQ Simulation API",
            "version": "1.0.0",
            "environment": "development" if app.config['DEBUG'] else "production",
            "endpoints": {
                "simulation": {
                    "start": "POST /api/simulation/start",
                    "stop": "POST /api/simulation/stop",
                    "update": "POST /api/simulation/update",
                    "pit_stop": "POST /api/simulation/pit-stop",
                    "state": "GET /api/simulation/state?user_id=<id>",
                    "laps": "GET /api/simulation/laps?user_id=<id>",
                    "status": "GET /api/simulation/status",
                    "health": "GET /api/simulation/health"
                },
                "models": {
                    "list": "GET /api/model-metadata",
                    "detail": "GET /api/model-metadata/<model_name>",
                    "download": "GET /api/model-metadata/<model_name>/download"
                }
            },
            "docs": "https://github.com/maaswin03/gr-pitiq"
        })
    
    @app.route('/health')
    def health():
        """Health check endpoint for monitoring"""
        try:
            # Check if Supabase is configured
            supabase_status = "configured" if config_class.SUPABASE_URL else "not_configured"
            
            return jsonify({
                "status": "healthy",
                "service": "GR PitIQ API",
                "timestamp": datetime.utcnow().isoformat(),
                "checks": {
                    "supabase": supabase_status
                }
            }), 200
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return jsonify({
                "status": "unhealthy",
                "error": str(e)
            }), 503
    
    # ===== Error Handlers =====
    @app.errorhandler(400)
    def bad_request(e):
        logger.warning(f"Bad request: {request.url} - {e}")
        return jsonify({"error": "Bad request", "message": str(e)}), 400
    
    @app.errorhandler(404)
    def not_found(e):
        logger.warning(f"Not found: {request.url}")
        return jsonify({"error": "Not found", "message": "The requested resource does not exist"}), 404
    
    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        logger.warning(f"Rate limit exceeded: {get_remote_address()}")
        return jsonify({"error": "Rate limit exceeded", "message": "Too many requests. Please try again later."}), 429
    
    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal error: {e}", exc_info=True)
        return jsonify({"error": "Internal server error", "message": "An unexpected error occurred"}), 500
    
    # ===== Request/Response Logging =====
    @app.before_request
    def log_request():
        logger.info(f"{request.method} {request.path} from {get_remote_address()}")
    
    @app.after_request
    def log_response(response):
        logger.info(f"{request.method} {request.path} - {response.status_code}")
        return response
    
    return app

# ===== Application Instance =====
app = create_app()

if __name__ == '__main__':
    config = Config()
    logger = logging.getLogger(__name__)
    
    logger.info("="*60)
    logger.info("🚀 Starting GR PitIQ Simulation Server")
    logger.info("="*60)
    logger.info(f"Environment: {'Development' if config.DEBUG else 'Production'}")
    logger.info(f"Host: {config.HOST}:{config.PORT}")
    logger.info(f"CORS Origins: {', '.join(config.CORS_ORIGINS)}")
    logger.info(f"Rate Limit: {config.RATELIMIT_DEFAULT}")
    logger.info(f"Log Level: {config.LOG_LEVEL}")
    logger.info("="*60)
    
    app.run(
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG,
        use_reloader=config.DEBUG
    )
