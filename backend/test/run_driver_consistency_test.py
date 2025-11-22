"""
Standardized Test for Driver Consistency Predictor
Tests model with 5 samples per track and generates markdown report
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from standardized_test_runner import StandardizedModelTester


class DriverConsistencyTest(StandardizedModelTester):
    def __init__(self):
        super().__init__(
            model_name='driver_consistency_predictor',
            model_type='classification'
        )


if __name__ == "__main__":
    tester = DriverConsistencyTest()
    tester.run_full_test(target_col='CONSISTENCY_CLASS', track_col='TRACK')
