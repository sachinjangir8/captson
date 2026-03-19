"""
CNN Deepfake Detector
---------------------
@deep-learning-researcher | @ml-engineer

EfficientNet-B4 backbone fine-tuned for binary deepfake classification.
EfficientNet scales depth, width, and resolution uniformly using a
compound scaling coefficient — achieving SOTA accuracy/efficiency trade-off.

Why EfficientNet for deepfakes?
- Strong spatial feature extraction at multiple scales
- Pre-trained ImageNet weights capture general texture/edge features
- Efficient at high resolution (224×224), critical for artifact detection
- B4 variant balances accuracy and GPU memory
"""

import torch
import torch.nn as nn
import timm
from loguru import logger


class EfficientNetDetector(nn.Module):
    """
    Binary deepfake classifier built on EfficientNet-B4.

    Architecture:
        EfficientNet-B4 backbone (pre-trained)
            → Global Average Pooling
            → Dropout (regularisation)
            → FC 1792 → 512
            → ReLU + Dropout
            → FC 512 → 1  (logit for fake probability)

    Args:
        pretrained: Load ImageNet weights for the backbone.
        dropout: Dropout probability before classification head.
        freeze_backbone: If True, freeze backbone weights (linear probe mode).
    """

    def __init__(
        self,
        pretrained: bool = True,
        dropout: float = 0.4,
        freeze_backbone: bool = False,
    ):
        super().__init__()

        # Load backbone without the original classifier head
        self.backbone = timm.create_model(
            "efficientnet_b4",
            pretrained=pretrained,
            num_classes=0,           # removes classifier, exposes feature vector
            global_pool="avg",
        )
        feature_dim = self.backbone.num_features  # 1792 for B4

        if freeze_backbone:
            for param in self.backbone.parameters():
                param.requires_grad = False
            logger.info("Backbone frozen — training head only")

        # Classification head
        self.classifier = nn.Sequential(
            nn.Dropout(p=dropout),
            nn.Linear(feature_dim, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=dropout / 2),
            nn.Linear(512, 1),
        )

        self._init_weights()
        logger.info(
            f"EfficientNetDetector ready | "
            f"backbone_features={feature_dim} | "
            f"pretrained={pretrained}"
        )

    def _init_weights(self):
        for m in self.classifier.modules():
            if isinstance(m, nn.Linear):
                nn.init.kaiming_normal_(m.weight, mode="fan_out", nonlinearity="relu")
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: Image tensor of shape (B, 3, H, W), values in [0, 1].

        Returns:
            Logits of shape (B, 1). Apply sigmoid for probabilities.
        """
        features = self.backbone(x)       # (B, 1792)
        logits = self.classifier(features) # (B, 1)
        return logits

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """Return probabilities (0=real, 1=fake)."""
        return torch.sigmoid(self.forward(x))

    def unfreeze_top_blocks(self, num_blocks: int = 3):
        """Gradually unfreeze the top N blocks for fine-tuning."""
        blocks = list(self.backbone.blocks)
        for block in blocks[-num_blocks:]:
            for param in block.parameters():
                param.requires_grad = True
        logger.info(f"Unfrozen top {num_blocks} EfficientNet blocks")
