"""Comprehensive test suite for ScholarPulse AI Backend."""
import os
import unittest
from starlette.testclient import TestClient
from app.main import app
from app.services.pdf_service import (
    extract_text,
    split_sections,
    is_scanned_pdf,
    extract_metadata_and_stats,
)


class TestScholarPulseAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.sample_pdf_path = os.path.join(os.path.dirname(__file__), "..", "sample_test.pdf")

    def test_root_endpoint(self):
        """Test GET / returns app info."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("app", data)
        self.assertIn("version", data)

    def test_health_endpoint(self):
        """Test GET /health returns status ok."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "ok")

    def test_sample_endpoint(self):
        """Test GET /sample returns all required analysis fields."""
        response = self.client.get("/sample")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check top-level required schema keys
        required_keys = [
            "filename",
            "keywords",
            "summary",
            "methodology",
            "formal_limitations",
            "research_gap",
            "future_scope",
            "important_references",
            "stats",
            "structured",
        ]
        for key in required_keys:
            self.assertIn(key, data, f"Missing key: {key}")

        # Check stats subfields
        stats = data["stats"]
        self.assertIn("page_count", stats)
        self.assertIn("total_words", stats)
        self.assertIn("estimated_read_time_mins", stats)
        self.assertIn("section_breakdown", stats)
        self.assertIsInstance(stats["section_breakdown"], list)

        # Check structured subfields
        structured = data["structured"]
        self.assertIn("method_structured", structured)
        self.assertIn("gaps_structured", structured)
        self.assertIn("scope_structured", structured)
        self.assertIn("references_structured", structured)

        # Check keywords
        self.assertIsInstance(data["keywords"], list)
        self.assertGreater(len(data["keywords"]), 0)
        self.assertIn("keyword", data["keywords"][0])
        self.assertIn("score", data["keywords"][0])

    def test_pdf_service_unit(self):
        """Test PDF extraction and section splitting on sample_test.pdf."""
        self.assertTrue(os.path.exists(self.sample_pdf_path), "sample_test.pdf should exist")
        text = extract_text(self.sample_pdf_path)
        self.assertGreater(len(text), 100)
        self.assertFalse(is_scanned_pdf(text))

        sections = split_sections(text)
        self.assertIsInstance(sections, dict)
        self.assertIn("abstract", sections)

        stats = extract_metadata_and_stats(self.sample_pdf_path, text, sections)
        self.assertEqual(stats["page_count"], 1)
        self.assertGreater(stats["total_words"], 0)
        self.assertGreaterEqual(stats["complexity_score"], 0)

    def test_analyze_non_pdf(self):
        """Test POST /analyze rejects non-pdf uploads."""
        response = self.client.post(
            "/analyze",
            files={"file": ("test.txt", b"This is not a pdf file.", "text/plain")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("valid PDF", response.json()["detail"])

    def test_analyze_empty_pdf(self):
        """Test POST /analyze rejects empty or corrupt PDF."""
        # A minimal dummy pdf header with no extractable text
        dummy_pdf = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
        response = self.client.post(
            "/analyze",
            files={"file": ("empty.pdf", dummy_pdf, "application/pdf")},
        )
        # Should fail as scanned/unparseable PDF
        self.assertIn(response.status_code, [422, 500])

    def test_analyze_real_pdf_integration(self):
        """End-to-end integration test: POST /analyze with sample_test.pdf."""
        with open(self.sample_pdf_path, "rb") as f:
            pdf_bytes = f.read()

        response = self.client.post(
            "/analyze",
            files={"file": ("sample_test.pdf", pdf_bytes, "application/pdf")},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["filename"], "sample_test.pdf")
        self.assertTrue(len(data["summary"]) > 20)
        self.assertIn("keywords", data)
        self.assertIn("stats", data)
        self.assertIn("structured", data)


if __name__ == "__main__":
    unittest.main()
