#!/bin/bash

# Weather Impact Predictor - Preprocessing Script
# Runs feature engineering and saves to outputs/weather_impact_predictor/

# Detect script directory and root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

# Change to root directory
cd "$ROOT_DIR" || exit 1

echo "========================================"
echo "🌤️  Weather Impact Preprocessing"
echo "========================================"
echo "Working directory: $ROOT_DIR"
echo ""

# Run preprocessing
python3 backend/preprocess/prepare_weather_impact_data.py

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Preprocessing complete!"
    echo "📂 Output: outputs/weather_impact_predictor/engineered_dataset.csv"
else
    echo ""
    echo "❌ Preprocessing failed!"
    exit 1
fi
