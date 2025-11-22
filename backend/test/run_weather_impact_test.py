"""
Standardized Test for Weather Impact Predictor
Tests model with 5 samples per track and generates markdown report
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from standardized_test_runner import StandardizedModelTester


class WeatherImpactTest(StandardizedModelTester):
    def __init__(self):
        super().__init__(
            model_name='weather_impact_predictor',
            model_type='regression'
        )


if __name__ == "__main__":
    tester = WeatherImpactTest()
    tester.run_full_test(target_col='WEATHER_DELTA', track_col='TRACK')
