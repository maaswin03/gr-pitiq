#!/bin/bash

# Optimal Sector Predictor - Preprocessing Pipeline
# This script loads raw data and engineers features for training

echo "=================================="
echo "🏎️  Optimal Sector Predictor Preprocessing"
echo "=================================="

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Navigate to GR PitIQ root (2 levels up from backend/preprocess/)
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"

echo "📂 Root directory: $ROOT_DIR"

# Change to root directory
cd "$ROOT_DIR" || exit 1

# Run preprocessing
python3 backend/preprocess/prepare_optimal_sector_data.py

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Preprocessing complete!"
    echo ""
    echo "📁 Output files created:"
    echo "   - outputs/optimal_sector_predictor/raw_data.csv"
    echo "   - outputs/optimal_sector_predictor/engineered_dataset.csv"
    echo ""
    echo "🎯 Ready for training! Run:"
    echo "   python3 backend/train/train_optimal_sector_time.py"
else
    echo ""
    echo "❌ Preprocessing failed!"
    exit 1
fi
