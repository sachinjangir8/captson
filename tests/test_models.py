"""
Tests — Models
--------------
@python-engineer | @deep-learning-researcher
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
import torch
import numpy as np

from src.models.cnn_detector import EfficientNetDetector
from src.models.cnn_lstm import CNNLSTMDetector
from src.models.model_factory import build_model


class TestEfficientNetDetector:

    def test_forward_shape(self):
        model = EfficientNetDetector(pretrained=False)
        model.eval()
        x = torch.randn(2, 3, 224, 224)
        with torch.no_grad():
            out = model(x)
        assert out.shape == (2, 1)

    def test_predict_proba_range(self):
        model = EfficientNetDetector(pretrained=False)
        model.eval()
        x = torch.randn(4, 3, 224, 224)
        with torch.no_grad():
            probs = model.predict_proba(x)
        assert probs.shape == (4, 1)
        assert (probs >= 0).all() and (probs <= 1).all()

    def test_freeze_backbone(self):
        model = EfficientNetDetector(pretrained=False, freeze_backbone=True)
        frozen = sum(1 for p in model.backbone.parameters() if not p.requires_grad)
        assert frozen > 0

    def test_unfreeze_top_blocks(self):
        model = EfficientNetDetector(pretrained=False, freeze_backbone=True)
        before = sum(1 for p in model.parameters() if p.requires_grad)
        model.unfreeze_top_blocks(num_blocks=2)
        after = sum(1 for p in model.parameters() if p.requires_grad)
        assert after > before


class TestCNNLSTMDetector:

    def test_forward_shape(self):
        model = CNNLSTMDetector(sequence_length=4, pretrained=False)
        model.eval()
        x = torch.randn(2, 4, 3, 224, 224)    # (B, T, C, H, W)
        with torch.no_grad():
            out = model(x)
        assert out.shape == (2, 1)

    def test_predict_proba_range(self):
        model = CNNLSTMDetector(sequence_length=4, pretrained=False)
        model.eval()
        x = torch.randn(2, 4, 3, 224, 224)
        with torch.no_grad():
            probs = model.predict_proba(x)
        assert (probs >= 0).all() and (probs <= 1).all()

    def test_sequence_length_variation(self):
        for T in [3, 5, 10]:
            model = CNNLSTMDetector(sequence_length=T, pretrained=False)
            model.eval()
            x = torch.randn(1, T, 3, 224, 224)
            with torch.no_grad():
                out = model(x)
            assert out.shape == (1, 1), f"Failed for T={T}"


class TestModelFactory:

    def test_build_efficientnet(self):
        model = build_model("efficientnet", {"pretrained": False})
        assert isinstance(model, EfficientNetDetector)

    def test_build_cnn_lstm(self):
        model = build_model("cnn_lstm", {"pretrained": False, "sequence_length": 5})
        assert isinstance(model, CNNLSTMDetector)

    def test_unknown_model_raises(self):
        with pytest.raises(ValueError):
            build_model("resnet_v999", {})
