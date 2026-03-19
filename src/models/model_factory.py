"""
Model Factory
-------------
@ml-engineer

Registry pattern for model creation. Decouples config from instantiation.
"""

import torch
import torch.nn as nn
from pathlib import Path
from typing import Optional

from loguru import logger

from .cnn_detector import EfficientNetDetector
from .cnn_lstm import CNNLSTMDetector


MODEL_REGISTRY = {
    "efficientnet": EfficientNetDetector,
    "cnn_lstm": CNNLSTMDetector,
}


def build_model(model_name: str, config: dict) -> nn.Module:
    """
    Instantiate a model by name using the provided config dict.

    Args:
        model_name: Key in MODEL_REGISTRY.
        config: Flat dict of constructor kwargs.

    Returns:
        Instantiated nn.Module.
    """
    if model_name not in MODEL_REGISTRY:
        raise ValueError(
            f"Unknown model '{model_name}'. "
            f"Available: {list(MODEL_REGISTRY.keys())}"
        )

    cls = MODEL_REGISTRY[model_name]

    # Filter config keys to only those accepted by the constructor
    import inspect
    valid_keys = inspect.signature(cls.__init__).parameters.keys()
    filtered = {k: v for k, v in config.items() if k in valid_keys}

    model = cls(**filtered)
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(
        f"Model '{model_name}' | "
        f"total_params={total_params/1e6:.1f}M | "
        f"trainable={trainable_params/1e6:.1f}M"
    )
    return model


def load_checkpoint(
    model: nn.Module,
    checkpoint_path: str,
    device: Optional[str] = None,
    strict: bool = True,
) -> dict:
    """
    Load weights from a checkpoint file.

    Returns:
        Checkpoint metadata dict (epoch, metrics, etc.).
    """
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"

    checkpoint = torch.load(checkpoint_path, map_location=device)

    state_dict = checkpoint.get("model_state_dict", checkpoint)
    model.load_state_dict(state_dict, strict=strict)
    model.to(device)

    meta = {k: v for k, v in checkpoint.items() if k != "model_state_dict"}
    epoch = meta.get("epoch", "?")
    auc = meta.get("val_auc", "?")
    logger.info(f"Loaded checkpoint from {checkpoint_path} (epoch={epoch}, val_auc={auc})")
    return meta


def save_checkpoint(
    model: nn.Module,
    optimizer: torch.optim.Optimizer,
    epoch: int,
    metrics: dict,
    path: str,
):
    """Save a training checkpoint with full metadata."""
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "epoch": epoch,
            **metrics,
        },
        path,
    )
    logger.info(f"Checkpoint saved → {path}")
