#!/bin/bash

# Driver Consistency Predictor - Complete Pipeline Runner
# Runs preprocessing and training for driver consistency classification

set -e  # Exit on error

echo "================================================================================"
echo "🏎️  DRIVER CONSISTENCY PREDICTOR - COMPLETE PIPELINE"
echo "================================================================================"
echo ""

# Parse command line arguments
SKIP_PREPROCESS=false
OPTIMIZE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-preprocess)
            SKIP_PREPROCESS=true
            shift
            ;;
        --optimize)
            OPTIMIZE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-preprocess] [--optimize]"
            exit 1
            ;;
    esac
done

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 not found"
    exit 1
fi

echo "✅ Python: $(python3 --version)"
echo ""

# Step 1: Preprocessing
if [ "$SKIP_PREPROCESS" = false ]; then
    echo "================================================================================"
    echo "STEP 1: PREPROCESSING - Calculating Driver Consistency Metrics"
    echo "================================================================================"
    echo ""
    
    python3 "$ROOT_DIR/backend/preprocess/prepare_driver_consistency_data.py"
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Preprocessing failed!"
        exit 1
    fi
    
    echo ""
else
    echo "⏭️  STEP 1: SKIPPED - Using existing preprocessed data"
    echo ""
fi

# Step 2: Training
echo "================================================================================"
echo "STEP 2: TRAINING - Classification Model (High/Medium/Low)"
echo "================================================================================"
echo ""

if [ "$OPTIMIZE" = true ]; then
    echo "🔧 Running with hyperparameter optimization (this may take longer)..."
    python3 "$ROOT_DIR/backend/train/train_driver_consistency.py" --optimize
else
    python3 "$ROOT_DIR/backend/train/train_driver_consistency.py"
fi

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Training failed!"
    exit 1
fi

echo ""
echo "================================================================================"
echo "✅ PIPELINE COMPLETE!"
echo "================================================================================"
echo ""
echo "📁 Output Location:"
echo "   Data:   $ROOT_DIR/outputs/driver_consistency_predictor/"
echo "   Model:  $ROOT_DIR/backend/model/driver_consistency_predictor.pkl"
echo ""
echo "🎯 Next Steps:"
echo "   1. Run tests: python3 backend/test/test_driver_consistency_predictor.py"
echo "   2. View visualizations: outputs/driver_consistency_predictor/visualizations/"
echo ""
echo "================================================================================"
