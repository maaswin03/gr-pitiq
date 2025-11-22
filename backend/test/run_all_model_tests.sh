#!/bin/bash

# Run all 8 standardized model tests
# Generates markdown reports for each model

echo "========================================="
echo "Running All 8 Model Tests"
echo "========================================="

cd "$(dirname "$0")"

python3 run_all_tests.py

echo ""
echo "========================================="
echo "✅ All tests complete!"
echo "========================================="
echo ""
echo "Markdown reports generated in backend/test/:"
echo "  - lap_time_predictor_test_results.md"
echo "  - driver_consistency_predictor_test_results.md"
echo "  - fuel_consumption_predictor_test_results.md"
echo "  - pit_stop_time_predictor_test_results.md"
echo "  - weather_impact_predictor_test_results.md"
echo "  - optimal_sector_predictor_test_results.md"
echo "  - weather_pit_strategy_predictor_test_results.md"
echo "  - position_predictor_test_results.md"
