import unittest

from health_trends import detect_trends


class HealthTrendsTests(unittest.TestCase):
    def detect(self, counts):
        return detect_trends({"departments": {"General Medicine": counts}, "keywords": {}}, 10)

    def test_no_spike(self):
        self.assertEqual(self.detect([8] * 9)["alerts"], [])

    def test_watch(self):
        self.assertEqual(self.detect([8] * 8 + [10])["alerts"][0]["tier"], "watch")

    def test_elevated(self):
        self.assertEqual(self.detect([8] * 8 + [12])["alerts"][0]["tier"], "elevated")

    def test_high_and_seasonal_context(self):
        alert = self.detect([8] * 8 + [16])["alerts"][0]
        self.assertEqual(alert["tier"], "high")
        self.assertTrue(alert["seasonal_match"])
        self.assertIn("Influenza", alert["seasonal_diseases"])

    def test_insufficient_baseline(self):
        result = self.detect([0, 0, 0, 0, 0, 2, 2, 2, 50])
        self.assertEqual(result["alerts"], [])
        self.assertEqual(result["baseline_status"], "insufficient")
        self.assertEqual(result["series_status"]["departments"]["General Medicine"], "insufficient_baseline")

    def test_current_under_five(self):
        self.assertEqual(self.detect([1] * 8 + [4])["alerts"], [])

    def test_variance_and_keyword_sorting(self):
        result = detect_trends({"departments": {"General Medicine": [1, 15] * 4 + [14]},
                                "keywords": {"fever": [2] * 8 + [10]}}, 10)
        self.assertEqual([a["name"] for a in result["alerts"]], ["fever"])
        self.assertFalse(result["alerts"][0]["seasonal_match"])

    def test_invalid_input(self):
        for counts in ([1] * 8, [1] * 8 + [-1], [1] * 8 + [True], [1] * 8 + [float("nan")]):
            with self.assertRaises(ValueError):
                self.detect(counts)
        with self.assertRaises(ValueError):
            detect_trends({"departments": {}, "keywords": {}}, 13)


if __name__ == "__main__":
    unittest.main()
