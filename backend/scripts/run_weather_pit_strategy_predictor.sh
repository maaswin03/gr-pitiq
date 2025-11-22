#!/bin/bash

# Weather Pit Strategy Predictor - Complete ML Pipeline
# Binary classification for pit stop decisions based on weather conditions

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    WEATHER PIT STRATEGY PREDICTOR - ML PIPELINE                    ║${NC}"
echo -e "${BLUE}║    Binary Classification: Pit vs No Pit (Weather-Based)           ║${NC}"
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
            echo "Examples:"
            echo "  $0                          # Run complete pipeline"
            echo "  $0 --skip-preprocess        # Run training & testing only"
            echo "  $0 --skip-training          # Run preprocessing & testing only"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
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
    
    if [ -f "$ROOT_DIR/backend/preprocess/prepare_weather_pit_strategy_data.py" ]; then
        echo -e "${BLUE}📊 Running weather pit strategy data preparation...${NC}"
        python3 "$ROOT_DIR/backend/preprocess/prepare_weather_pit_strategy_data.py"
        
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
    
    if [ -f "$ROOT_DIR/backend/train/train_weather_pit_strategy.py" ]; then
        echo -e "${BLUE}🤖 Training weather pit strategy model...${NC}"
        python3 "$ROOT_DIR/backend/train/train_weather_pit_strategy.py"
        
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
    
    if [ -f "$ROOT_DIR/backend/test/test_weather_pit_strategy_predictor.py" ]; then
        echo -e "${BLUE}📈 Testing weather pit strategy predictor...${NC}"
        python3 "$ROOT_DIR/backend/test/test_weather_pit_strategy_predictor.py"
        
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
echo -e "   Dataset:     ${GREEN}outputs/weather_pit_strategy_predictor/engineered_dataset.csv${NC}"
echo -e "   Model:       ${GREEN}backend/model/weather_pit_strategy_predictor.pkl${NC}"
echo -e "   Metadata:    ${GREEN}backend/model/weather_pit_strategy_metadata.json${NC}"
echo -e "   Predictions: ${GREEN}outputs/weather_pit_strategy_predictor/test_predictions.csv${NC}"
echo -e "   Metrics:     ${GREEN}outputs/weather_pit_strategy_predictor/test_metrics.txt${NC}"
echo ""
echo -e "${BLUE}📊 Model Type:${NC} Binary Classification (Pit vs No Pit)"
echo -e "${BLUE}🌤️  Features:${NC} Weather conditions, tire age, degradation, performance"
echo -e "${BLUE}🎯 Target:${NC} PIT_DECISION (0=No Pit, 1=Pit)"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "   • Review test metrics in outputs/weather_pit_strategy_predictor/test_metrics.txt"
echo -e "   • Check predictions in outputs/weather_pit_strategy_predictor/test_predictions.csv"
echo -e "   • Analyze F1-score and precision/recall for pit detection"
echo -e "   • Consider adjusting decision threshold if needed"
echo ""
