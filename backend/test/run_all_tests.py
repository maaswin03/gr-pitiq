"""
Master Test Runner - Run All 8 Model Tests
Generates standardized markdown reports for all models
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from run_lap_time_test import LapTimeTest
from run_driver_consistency_test import DriverConsistencyTest
from run_fuel_consumption_test import FuelConsumptionTest
from run_pit_stop_time_test import PitStopTimeTest
from run_weather_impact_test import WeatherImpactTest
from run_optimal_sector_test import OptimalSectorTest
from run_weather_pit_strategy_test import WeatherPitStrategyTest
from run_position_test import PositionTest


def main():
    """Run all model tests"""
    print("\n" + "=" * 80)
    print("🚀 MASTER TEST RUNNER - ALL 8 MODELS")
    print("=" * 80)
    
    tests = [
        ("Lap Time Predictor", LapTimeTest, 'LAP_TIME_SECONDS'),
        ("Driver Consistency Predictor", DriverConsistencyTest, 'CONSISTENCY_CLASS'),
        ("Fuel Consumption Predictor", FuelConsumptionTest, 'FUEL_CONSUMPTION'),
        ("Pit Stop Time Predictor", PitStopTimeTest, 'PIT_STOP_TIME'),
        ("Weather Impact Predictor", WeatherImpactTest, 'WEATHER_DELTA'),
        ("Optimal Sector Predictor", OptimalSectorTest, None),  # Special case
        ("Weather Pit Strategy Predictor", WeatherPitStrategyTest, 'PIT_DECISION'),
        ("Position Predictor", PositionTest, 'FINAL_POSITION'),
    ]
    
    results = []
    
    for i, (name, TestClass, target_col) in enumerate(tests, 1):
        print(f"\n{'='*80}")
        print(f"📊 TEST {i}/8: {name}")
        print(f"{'='*80}\n")
        
        try:
            tester = TestClass()
            
            if target_col:
                tester.run_full_test(target_col=target_col, track_col='TRACK')
            else:
                # Special case for optimal sector
                tester.run_full_test(track_col='TRACK')
            
            results.append((name, "✅ Success"))
            
        except Exception as e:
            print(f"\n❌ Error testing {name}: {e}")
            results.append((name, f"❌ Failed: {str(e)[:50]}"))
            import traceback
            traceback.print_exc()
    
    # Summary
    print("\n" + "=" * 80)
    print("📋 TEST SUMMARY")
    print("=" * 80)
    
    for name, status in results:
        print(f"  {status:15s} | {name}")
    
    success_count = sum(1 for _, status in results if "✅" in status)
    print(f"\n🎯 Completed: {success_count}/{len(tests)} tests")
    
    print("\n" + "=" * 80)
    print("✨ ALL TESTS COMPLETE!")
    print("=" * 80)
    print("\n📄 Markdown reports saved in: backend/test/")
    print("   - lap_time_predictor_test_results.md")
    print("   - driver_consistency_predictor_test_results.md")
    print("   - fuel_consumption_predictor_test_results.md")
    print("   - pit_stop_time_predictor_test_results.md")
    print("   - weather_impact_predictor_test_results.md")
    print("   - optimal_sector_predictor_test_results.md")
    print("   - weather_pit_strategy_predictor_test_results.md")
    print("   - position_predictor_test_results.md")


if __name__ == "__main__":
    main()
