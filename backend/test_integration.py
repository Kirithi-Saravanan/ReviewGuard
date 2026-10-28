"""
Automated unit & integration test suite for ReviewGuard AI.
Verifies:
1. Class ID mapping: Class 1 = Fake, Class 0 = Genuine.
2. Threshold mapping: optimal_threshold applied to Fake probability (P(Class 1)).
3. Probability sum: Genuine + Fake = 1.0.
4. Input validation (short reviews fail with HTTP 422).
5. Exaggerated synthetic review classification.
6. Honest review classification.
"""
import unittest
from fastapi.testclient import TestClient

from backend.main import app, model_state


class TestReviewGuardPredictionPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client_context = TestClient(app)
        cls.client = cls.client_context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.client_context.__exit__(None, None, None)

    def test_01_model_and_threshold_loaded(self):
        """Verify model pipeline and threshold are loaded properly."""
        self.assertIsNotNone(model_state["pipeline"], "Pipeline must be loaded")
        self.assertAlmostEqual(model_state["optimal_threshold"], 0.7524, places=3)
        self.assertEqual(model_state["classes"], [0, 1])

    def test_02_health_endpoint(self):
        """Test GET /api/health."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "healthy")
        self.assertTrue(data["model_loaded"])
        self.assertAlmostEqual(data["optimal_threshold"], 0.7524, places=3)

    def test_03_exaggerated_synthetic_review_classified_as_fake(self):
        """
        Verify that an exaggerated spam/fake review has high Fake probability (Class 1)
        and is classified as FAKE when exceeding threshold 0.7524.
        """
        payload = {
            "review_title": "AMAZING PRODUCT BEST PURCHASE EVER!!!!",
            "review_text": "This is the best item I have ever bought in my entire life! Wow buy it right now do not hesitate 100% recommended seller is so helpful best best best!",
            "product_name": "Smart Watch",
            "star_rating": 5
        }
        res = self.client.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        # Verify probabilities
        self.assertGreater(data["fake_probability"], 0.7524, "Fake probability should exceed threshold")
        self.assertEqual(data["prediction"], "FAKE", "Should be predicted as FAKE")
        self.assertEqual(data["label"], 1, "Label for FAKE should be 1")
        self.assertAlmostEqual(data["fake_probability"] + data["genuine_probability"], 1.0, places=3)
        print(f"\n[Test Result] Synthetic Exaggerated Review: Verdict={data['prediction']} (Label={data['label']}), FakeProb={data['fake_probability']:.3f}, GenuineProb={data['genuine_probability']:.3f}, Confidence={data['confidence']}%")

    def test_04_genuine_detailed_review_classified_as_genuine(self):
        """
        Verify that a detailed genuine review has Fake probability below threshold
        and is classified as GENUINE.
        """
        payload = {
            "review_title": "Ergonomic and reliable mouse",
            "review_text": "Very comfortable mouse, fits the hand perfectly, reduced my wrist pain and holds a charge for weeks. The magnetic scroll wheel is remarkably quiet and responsive.",
            "product_name": "Ergo Mouse",
            "star_rating": 5
        }
        res = self.client.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        self.assertLess(data["fake_probability"], 0.7524, "Fake probability should be below threshold")
        self.assertEqual(data["prediction"], "GENUINE", "Should be predicted as GENUINE")
        self.assertEqual(data["label"], 0, "Label for GENUINE should be 0")
        self.assertAlmostEqual(data["fake_probability"] + data["genuine_probability"], 1.0, places=3)
        print(f"[Test Result] Genuine Review: Verdict={data['prediction']} (Label={data['label']}), FakeProb={data['fake_probability']:.3f}, GenuineProb={data['genuine_probability']:.3f}, Confidence={data['confidence']}%")

    def test_05_probability_sum_and_structure(self):
        """Ensure probabilities sum to 1.0 across different review inputs."""
        reviews = [
            "Decent headphones with good noise cancellation.",
            "CLICK LINK FOR FREE MONEY AND REWARD",
            "Broken upon arrival, customer support replaced it promptly."
        ]
        for r in reviews:
            res = self.client.post("/api/predict", json={"review_text": r})
            self.assertEqual(res.status_code, 200)
            data = res.json()
            total_prob = data["fake_probability"] + data["genuine_probability"]
            self.assertAlmostEqual(total_prob, 1.0, places=3)
            self.assertIn(data["prediction"], ["FAKE", "GENUINE"])
            self.assertIn(data["label"], [0, 1])

    def test_06_short_input_validation(self):
        """Ensure input validation enforces minimum review length."""
        res = self.client.post("/api/predict", json={"review_text": "ab"})
        self.assertEqual(res.status_code, 422)


if __name__ == "__main__":
    unittest.main()
