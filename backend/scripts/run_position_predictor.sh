#!/bin/bash

# Position Predictor Pipeline
# Step 1: Preprocess data
# Step 2: Train classification model
# Step 3: Test model

set -e  # Exit on error

echo "================================================================================"
echo "🏎️  GR PitIQ - POSITION PREDICTOR - COMPLETE PIPELINE"
echo "================================================================================"

# Get script directory and root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo ""
echo "📁 Root directory: $ROOT_DIR"
echo ""

# Check if we're in the right directory
if [ ! -d "$ROOT_DIR/backend/preprocess" ]; then
    echo "❌ Error: backend/preprocess directory not found"
    echo "   Please run from GR PitIQ root directory"
    exit 1
fi

# Change to root directory
cd "$ROOT_DIR"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python 3.8+"
    exit 1
fi

echo "✅ Python3 found: $(python3 --version)"
echo ""

# Parse arguments
SKIP_PREPROCESS=false
SKIP_TRAINING=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-preprocess)
            SKIP_PREPROCESS=true
            echo "⏭️  Skipping preprocessing (using existing engineered_dataset.csv)"
            shift
            ;;
        --skip-training)
            SKIP_TRAINING=true
            echo "⏭️  Skipping training (using existing model)"
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-preprocess] [--skip-training]"
            exit 1
            ;;
    esac
done

echo ""

# ============================================================================
# STEP 1: PREPROCESSING
# ============================================================================
if [ "$SKIP_PREPROCESS" = false ]; then
    echo "================================================================================"
    echo "📊 STEP 1: DATA PREPROCESSING"
    echo "================================================================================"
    echo ""
    
    python3 backend/preprocess/prepare_position_data.py
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Preprocessing failed"
        exit 1
    fi
    
    echo ""
    echo "✅ Preprocessing complete"
    echo ""
fi

# ============================================================================
# STEP 2: TRAINING
# ============================================================================
if [ "$SKIP_TRAINING" = false ]; then
    echo "================================================================================"
    echo "🤖 STEP 2: MODEL TRAINING"
    echo "================================================================================"
    echo ""
    
    python3 backend/train/train_position.py
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Training failed"
        exit 1
    fi
    
    echo ""
    echo "✅ Training complete"
    echo ""
fi

# ============================================================================
# STEP 3: TESTING
# ============================================================================
echo "================================================================================"
echo "🧪 STEP 3: MODEL TESTING"
echo "================================================================================"
echo ""

python3 backend/test/test_position_predictor.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Testing failed"
    exit 1
fi

echo ""
echo "================================================================================"
echo "✅ PIPELINE COMPLETE"
echo "================================================================================"
echo ""
echo "📂 Output files:"
echo "   - Model: backend/model/position_predictor.pkl"
echo "   - Metadata: backend/model/position_metadata.json"
echo "   - Visualizations: backend/visualizations/position_predictor/"
echo "   - Dataset: outputs/position_predictor/engineered_dataset.csv"
echo ""
