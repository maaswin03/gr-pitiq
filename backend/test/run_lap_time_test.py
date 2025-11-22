"""
Standardized Test for Lap Time Predictor
Tests model with 5 samples per track and generates markdown report
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from standardized_test_runner import StandardizedModelTester


class LapTimeTest(StandardizedModelTester):
    def __init__(self):
        super().__init__(
            model_name='lap_time_predictor',
            model_type='regression'
        )


if __name__ == "__main__":
    tester = LapTimeTest()
    tester.run_full_test(target_col='LAP_TIME_SECONDS', track_col='TRACK')
