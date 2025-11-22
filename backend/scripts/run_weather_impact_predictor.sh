#!/bin/bash

# Weather Impact Predictor - Complete Pipeline
# Run preprocessing and training for weather impact model

# Detect script directory and root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Change to root directory
cd "$ROOT_DIR" || exit 1

echo "========================================"
echo "🌤️  Weather Impact Predictor Pipeline"
echo "========================================"
echo "Working directory: $ROOT_DIR"
echo ""

# Parse arguments
SKIP_PREPROCESS=false
for arg in "$@"; do
    if [ "$arg" = "--skip-preprocess" ]; then
        SKIP_PREPROCESS=true
    fi
done

# Step 1: Preprocessing (unless skipped)
if [ "$SKIP_PREPROCESS" = false ]; then
    echo "Step 1: Running preprocessing..."
    echo "========================================"
    python3 backend/preprocess/prepare_weather_impact_data.py
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Preprocessing failed!"
        exit 1
    fi
    echo ""
fi

# Step 2: Training
echo "Step 2: Training weather impact model..."
echo "========================================"
python3 backend/train/train_weather_impact_model.py

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Training complete!"
    echo "📂 Model: backend/model/weather_impact_predictor.pkl"
    echo "📂 Outputs: outputs/weather_impact_predictor/"
    echo ""
    echo "🎯 Next: Run tests with python backend/test/test_weather_impact_predictor.py"
else
    echo ""
    echo "❌ Training failed!"
    exit 1
fi
