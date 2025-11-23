#!/bin/bash
# Azure App Service Startup Script

echo "=== GR PitIQ Backend Startup ==="
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"
echo "Listing files:"
ls -la

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Verify route files exist
if [ ! -f "routes/simulation_routes.py" ]; then
    echo "ERROR: routes/simulation_routes.py not found!"
    exit 1
fi

if [ ! -f "routes/model_routes.py" ]; then
    echo "ERROR: routes/model_routes.py not found!"
    exit 1
fi

echo "Route files verified ✓"

# Start Gunicorn with threading (better for APScheduler)
echo "Starting Gunicorn with threading..."
gunicorn --bind=0.0.0.0:8000 \
  --workers=1 \
  --threads=4 \
  --worker-class=gthread \
  --timeout=120 \
  --access-logfile=- \
  --error-logfile=- \
  app:app
