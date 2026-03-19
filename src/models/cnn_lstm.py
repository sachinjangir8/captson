"""
CNN + LSTM Temporal Deepfake Detector
--------------------------------------
@deep-learning-researcher | @ml-engineer

Combines spatial feature extraction (EfficientNet-B4) with temporal
modelling (bi-directional LSTM) to detect deepfakes across video frames.

Why temporal modelling matters:
- Per-frame CNN can miss inconsistencies that only appear across time
- Deepfake blending creates temporal flickering in lighting, texture
- Face muscle movements follow natural temporal patterns in real videos
- LSTM learns to flag unnatural temporal transitions in blended faces

Architecture:
    For each frame in sequence:
        EfficientNet-B4 → feature vector (1792-dim)
    Stack of T frame features → (B, T, 1792)
        BiLSTM (2 layers) → (B, T, 2*hidden)
    Temporal attention → weighted context vector (B, 2*hidden)
        FC head → logit (B, 1)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import timm
from loguru import logger


class TemporalAttention(nn.Module):
    """
    Soft attention over the LSTM's hidden states.
    Learns which frames in the sequence are most diagnostic.
    """

    def __init__(self, hidden_dim: int):
        super().__init__()
        self.attn = nn.Linear(hidden_dim, 1)

    def forward(self, lstm_out: torch.Tensor) -> torch.Tensor:
        """
        Args:
            lstm_out: (B, T, H) — LSTM outputs for each timestep.

        Returns:
            context: (B, H) — weighted sum over time.
        """
        scores = self.attn(lstm_out)          # (B, T, 1)
        weights = F.softmax(scores, dim=1)    # (B, T, 1)
        context = (weights * lstm_out).sum(dim=1)  # (B, H)
        return context


class CNNLSTMDetector(nn.Module):
    """
    Spatial + Temporal deepfake detector.

    Args:
        sequence_length: Number of frames per input clip (T).
        hidden_size: LSTM hidden state size.
        num_layers: Number of LSTM layers.
        dropout: Dropout probability.
        pretrained: Load ImageNet weights for CNN backbone.
        bidirectional: Use bidirectional LSTM.
    """

    def __init__(
        self,
        sequence_length: int = 10,
        hidden_size: int = 512,
        num_layers: int = 2,
        dropout: float = 0.5,
        pretrained: bool = True,
        bidirectional: bool = True,
    ):
        super().__init__()
        self.sequence_length = sequence_length
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.bidirectional = bidirectional

        # ── Spatial encoder ──────────────────────────────
        self.cnn = timm.create_model(
            "efficientnet_b0",
            pretrained=pretrained,
            num_classes=0,
            global_pool="avg",
        )
        self.feature_dim = self.cnn.num_features  # 1792

        # Project CNN features before LSTM to reduce dimensionality
        self.feature_proj = nn.Sequential(
            nn.Linear(self.feature_dim, hidden_size),
            nn.LayerNorm(hidden_size),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout * 0.5),
        )

        # ── Temporal encoder ─────────────────────────────
        self.lstm = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional,
        )

        lstm_out_dim = hidden_size * (2 if bidirectional else 1)

        # ── Temporal attention ────────────────────────────
        self.attention = TemporalAttention(lstm_out_dim)

        # ── Classification head ───────────────────────────
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(lstm_out_dim, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout / 2),
            nn.Linear(256, 1),
        )

        self._init_weights()
        logger.info(
            f"CNNLSTMDetector ready | "
            f"seq_len={sequence_length} | "
            f"hidden={hidden_size} | "
            f"bidirectional={bidirectional}"
        )

    def _init_weights(self):
        for m in self.classifier.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
        for m in self.feature_proj.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight)

    def extract_frame_features(self, x: torch.Tensor) -> torch.Tensor:
        """
        Extract CNN features for a batch of frames.

        Args:
            x: (B*T, 3, H, W)

        Returns:
            projected: (B*T, hidden_size)
        """
        cnn_feats = self.cnn(x)          # (B*T, 1792)
        projected = self.feature_proj(cnn_feats)  # (B*T, hidden)
        return projected

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Video clip tensor of shape (B, T, 3, H, W).

        Returns:
            Logits of shape (B, 1).
        """
        B, T, C, H, W = x.shape

        # Reshape to process all frames in parallel through CNN
        x_flat = x.view(B * T, C, H, W)           # (B*T, 3, H, W)
        frame_feats = self.extract_frame_features(x_flat)  # (B*T, hidden)
        frame_feats = frame_feats.view(B, T, -1)   # (B, T, hidden)

        # LSTM: learn temporal dependencies
        lstm_out, _ = self.lstm(frame_feats)        # (B, T, lstm_out_dim)

        # Attention-weighted temporal pooling
        context = self.attention(lstm_out)          # (B, lstm_out_dim)

        # Classify
        logits = self.classifier(context)           # (B, 1)
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Return probabilities (0=real, 1=fake)."""
        return torch.sigmoid(self.forward(x))

    def freeze_cnn(self):
        for param in self.cnn.parameters():
            param.requires_grad = False
        logger.info("CNN backbone frozen")

    def unfreeze_cnn(self):
        for param in self.cnn.parameters():
            param.requires_grad = True
        logger.info("CNN backbone unfrozen")
