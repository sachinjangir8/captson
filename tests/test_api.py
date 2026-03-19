"""
Tests — API
-----------
@python-engineer | @mlops-engineer

Uses TestClient so no running server is needed.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import io
import numpy as np
import cv2
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from src.api.main import app

client = TestClient(app)


def make_jpeg_bytes(width=64, height=64) -> bytes:
    """Generate a small random JPEG in memory."""
    img = np.random.randint(0, 255, (height, width, 3), dtype=np.uint8)
    _, buf = cv2.imencode(".jpg", img)
    return buf.tobytes()


class TestHealthEndpoint:

    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_has_required_fields(self):
        data = client.get("/health").json()
        assert "status" in data
        assert "model_loaded" in data
        assert "uptime_seconds" in data


class TestModelInfoEndpoint:

    def test_model_info_returns_200(self):
        response = client.get("/model-info")
        assert response.status_code == 200

    def test_model_info_fields(self):
        data = client.get("/model-info").json()
        assert "model_type" in data
        assert "threshold" in data
        assert "supported_formats" in data


class TestDetectEndpoint:

    def test_unsupported_format_returns_415(self):
        """PDF should be rejected."""
        files = {"file": ("doc.pdf", b"fake content", "application/pdf")}
        # When model not loaded we get 503, but format check runs first
        response = client.post("/detect-deepfake", files=files)
        assert response.status_code in (415, 503)

    def test_model_not_loaded_returns_503(self):
        jpeg_bytes = make_jpeg_bytes()
        files = {"file": ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
        response = client.post("/detect-deepfake", files=files)
        # Model won't be loaded in test environment
        assert response.status_code == 503

    def test_detect_with_mocked_predictor(self):
        """Mock the predictor so we can test the full response schema."""
        mock_result = {
            "prediction": "fake",
            "confidence": 0.93,
            "fake_probability": 0.93,
            "frame_scores": [0.91, 0.94],
            "frames_analyzed": 2,
            "processing_time_ms": 123.4,
        }
        mock_pred = MagicMock()
        mock_pred.predict.return_value = mock_result

        with patch("src.api.main.predictor", mock_pred):
            jpeg_bytes = make_jpeg_bytes()
            files = {"file": ("test.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
            response = client.post("/detect-deepfake", files=files)

        assert response.status_code == 200
        data = response.json()
        assert data["prediction"] == "fake"
        assert data["confidence"] == 0.93
        assert "frame_scores" in data
        assert "processing_time_ms" in data
