#!/bin/bash

# Fuel Consumption Predictor - Complete ML Pipeline
# Regression model to predict fuel consumption per lap

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    FUEL CONSUMPTION PREDICTOR - ML PIPELINE                        ║${NC}"
echo -e "${BLUE}║    Regression: Predict Liters Per Lap                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Parse command line arguments
SKIP_PREPROCESS=false
SKIP_TRAINING=false
SKIP_TESTING=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-preprocess)
            SKIP_PREPROCESS=true
            shift
            ;;
        --skip-training)
            SKIP_TRAINING=true
            shift
            ;;
        --skip-testing)
            SKIP_TESTING=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-preprocess    Skip data preprocessing step"
            echo "  --skip-training      Skip model training step"
            echo "  --skip-testing       Skip model testing step"
            echo "  -h, --help          Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Step 1: Preprocessing
if [ "$SKIP_PREPROCESS" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}STEP 1: DATA PREPROCESSING${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [ -f "$ROOT_DIR/backend/preprocess/prepare_fuel_consumption_data.py" ]; then
        echo -e "${BLUE}⛽ Running fuel consumption data preparation...${NC}"
        python3 "$ROOT_DIR/backend/preprocess/prepare_fuel_consumption_data.py"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Preprocessing completed successfully${NC}"
        else
            echo -e "${RED}❌ Preprocessing failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Preprocessing script not found${NC}"
        exit 1
    fi
    
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping preprocessing step${NC}"
    echo ""
fi

# Step 2: Training
if [ "$SKIP_TRAINING" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}STEP 2: MODEL TRAINING${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [ -f "$ROOT_DIR/backend/train/train_fuel_consumption.py" ]; then
        echo -e "${BLUE}🤖 Training fuel consumption model...${NC}"
        python3 "$ROOT_DIR/backend/train/train_fuel_consumption.py"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Training completed successfully${NC}"
        else
            echo -e "${RED}❌ Training failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Training script not found${NC}"
        exit 1
    fi
    
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping training step${NC}"
    echo ""
fi

# Step 3: Testing
if [ "$SKIP_TESTING" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}STEP 3: MODEL TESTING${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [ -f "$ROOT_DIR/backend/test/test_fuel_consumption_predictor.py" ]; then
        echo -e "${BLUE}📈 Testing fuel consumption predictor...${NC}"
        python3 "$ROOT_DIR/backend/test/test_fuel_consumption_predictor.py"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Testing completed successfully${NC}"
        else
            echo -e "${RED}❌ Testing failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Testing script not found${NC}"
        exit 1
    fi
    
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping testing step${NC}"
    echo ""
fi

# Summary
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                   🎉 PIPELINE COMPLETED 🎉                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📁 Output locations:${NC}"
echo -e "   Dataset:     ${GREEN}outputs/fuel_consumption_predictor/engineered_dataset.csv${NC}"
echo -e "   Model:       ${GREEN}backend/model/fuel_consumption_predictor.pkl${NC}"
echo -e "   Metadata:    ${GREEN}backend/model/fuel_consumption_metadata.json${NC}"
echo -e "   Predictions: ${GREEN}outputs/fuel_consumption_predictor/test_predictions.csv${NC}"
echo -e "   Metrics:     ${GREEN}outputs/fuel_consumption_predictor/test_metrics.txt${NC}"
echo ""
echo -e "${BLUE}📊 Model Type:${NC} Regression (Fuel Liters Per Lap)"
echo -e "${BLUE}⛽ Target:${NC} FUEL_CONSUMPTION (typical range: 1.0-4.0 L/lap)"
echo ""
