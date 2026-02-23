# logic-engine/test_priority.py
import unittest
from datetime import datetime, timedelta
from priority_engine import calculate_priority

class TestAIPriorityEngine(unittest.TestCase):

    def test_high_priority(self):
        # Create a date 2 hours from now
        future_date = datetime.now() + timedelta(hours=2)
        result = calculate_priority(future_date.isoformat())
        self.assertEqual(result, "High")

    def test_medium_priority(self):
        # Create a date 48 hours (2 days) from now
        future_date = datetime.now() + timedelta(hours=48)
        result = calculate_priority(future_date.isoformat())
        self.assertEqual(result, "Medium")

    def test_low_priority(self):
        # Create a date 5 days from now
        future_date = datetime.now() + timedelta(days=5)
        result = calculate_priority(future_date.isoformat())
        self.assertEqual(result, "Low")

if __name__ == '__main__':
    unittest.main()