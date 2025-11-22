#!/bin/bash

# Complete Optimal Sector Predictor Pipeline (Standalone Backend)
# Step 1: Preprocess data (load + engineer features)
# Step 2: Train model (ensemble with Optuna optimization)

set -e  # Exit on error

echo "================================================================================"
echo "🏎️  GR PitIQ - OPTIMAL SECTOR PREDICTOR - COMPLETE PIPELINE (STANDALONE)"
echo "================================================================================"

# Get root directory (GR PitIQ root, not backend)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"  # Go up 2 levels: backend/scripts -> backend -> GR PitIQ

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
if [[ "$1" == "--skip-preprocess" ]]; then
    SKIP_PREPROCESS=true
    echo "⏭️  Skipping preprocessing (using existing engineered_dataset.csv)"
    echo ""
fi

# ============================================================================
# STEP 1: PREPROCESSING
# ============================================================================
if [ "$SKIP_PREPROCESS" = false ]; then
    echo "================================================================================"
    echo "STEP 1/2: PREPROCESSING (Load Data + Engineer Features)"
    echo "================================================================================"
    echo ""
    
    python3 backend/preprocess/prepare_optimal_sector_data.py
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ Preprocessing failed!"
        exit 1
    fi
    
    echo ""
    echo "✅ Preprocessing complete!"
    echo ""
else
    # Check if engineered data exists
    if [ ! -f "outputs/optimal_sector_predictor/engineered_dataset.csv" ]; then
        echo "❌ Error: outputs/optimal_sector_predictor/engineered_dataset.csv not found"
        echo "   Run without --skip-preprocess to generate it"
        exit 1
    fi
    echo "✅ Using existing engineered_dataset.csv"
    echo ""
fi

# ============================================================================
# STEP 2: MODEL TRAINING
# ============================================================================
echo "================================================================================"
echo "STEP 2/2: MODEL TRAINING (Ensemble with Optuna Optimization)"
echo "================================================================================"
echo ""
echo "⏱️  This will take 30-60 minutes (3 models × 30 Optuna trials each)"
echo "💡 You can reduce n_trials in train_optimal_sector_time.py for faster training"
echo ""
echo "Press Ctrl+C to cancel, or wait 5 seconds to start..."
sleep 5

python3 backend/train/train_optimal_sector_time.py

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Training failed!"
    exit 1
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo "================================================================================"
echo "✅ COMPLETE PIPELINE FINISHED!"
echo "================================================================================"
echo ""
echo "📁 Generated Files:"
echo ""
echo "   Data:"
echo "   ├── outputs/optimal_sector_predictor/raw_data.csv"
echo "   └── outputs/optimal_sector_predictor/engineered_dataset.csv"
echo ""
echo "   Model (Backend):"
echo "   ├── backend/model/optimal_sector_predictor.pkl (ensemble only)"
echo "   └── backend/model/metadata/optimal_sector_predictor.json"
echo ""
echo "   Visualizations:"
echo "   ├── outputs/optimal_sector_predictor/prediction_comparison.png"
echo "   ├── outputs/optimal_sector_predictor/error_distribution.png"
echo "   ├── outputs/optimal_sector_predictor/metrics_comparison.png"
echo "   ├── outputs/optimal_sector_predictor/feature_importance.png"
echo "   ├── outputs/optimal_sector_predictor/shap_feature_importance.png"
echo "   ├── outputs/optimal_sector_predictor/model_enhancement_report.json"
echo "   └── outputs/optimal_sector_predictor/outlier_removal_stats.json"
echo ""
echo "🎯 Next Steps:"
echo "   1. Review visualizations in outputs/optimal_sector_predictor/"
echo "   2. Check model performance in model_enhancement_report.json"
echo "   3. Test inference with your frontend"
echo "   4. Integrate with 3D visualization"
echo ""
echo "🎉 Model ready for hackathon submission!"
echo "================================================================================"
