"""
Standardized Test for Fuel Consumption Predictor
Tests model with 5 samples per track and generates markdown report
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from standardized_test_runner import StandardizedModelTester


class FuelConsumptionTest(StandardizedModelTester):
    def __init__(self):
        super().__init__(
            model_name='fuel_consumption_predictor',
            model_type='regression'
        )


if __name__ == "__main__":
    tester = FuelConsumptionTest()
    tester.run_full_test(target_col='FUEL_CONSUMPTION', track_col='TRACK')
