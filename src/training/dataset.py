"""
Dataset & DataLoader
--------------------
@ml-engineer | @data-scientist

PyTorch Dataset classes for:
  1. DeepfakeFrameDataset  — single frames (for CNN detector)
  2. DeepfakeClipDataset   — fixed-length frame sequences (for CNN-LSTM)

Both support train/val augmentation via albumentations.
"""

import cv2
import random
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Callable, List, Optional, Tuple

import torch
from torch.utils.data import Dataset, DataLoader, WeightedRandomSampler
import albumentations as A
from albumentations.pytorch import ToTensorV2
from loguru import logger


# ── Augmentation pipelines ────────────────────────────────────────────

def get_train_transforms(image_size: int = 224) -> A.Compose:
    return A.Compose([
        A.RandomResizedCrop(image_size, image_size, scale=(0.8, 1.0)),
        A.HorizontalFlip(p=0.5),
        A.ShiftScaleRotate(shift_limit=0.05, scale_limit=0.1, rotate_limit=10, p=0.5),
        A.OneOf([
            A.GaussianBlur(blur_limit=(3, 5), p=1.0),
            A.GaussNoise(var_limit=(10, 50), p=1.0),
        ], p=0.3),
        A.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1, hue=0.05, p=0.5),
        A.ImageCompression(quality_lower=60, quality_upper=95, p=0.2),
        A.CoarseDropout(max_holes=4, max_height=16, max_width=16, p=0.2),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])


def get_val_transforms(image_size: int = 224) -> A.Compose:
    return A.Compose([
        A.Resize(image_size, image_size),
        A.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ToTensorV2(),
    ])


# ── Single-frame Dataset ──────────────────────────────────────────────

class DeepfakeFrameDataset(Dataset):
    """
    Loads individual face-crop images with binary labels.

    Args:
        df: DataFrame with columns ['frame_path', 'label'].
        transform: albumentations Compose pipeline.
        image_size: Fallback resize if transform is None.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        transform: Optional[A.Compose] = None,
        image_size: int = 224,
    ):
        self.df = df.reset_index(drop=True)
        self.transform = transform or get_val_transforms(image_size)
        self.image_size = image_size

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        row = self.df.iloc[idx]
        img_path = row["frame_path"]
        label = int(row["label"])

        img = cv2.imread(str(img_path))
        if img is None:
            # Return a blank image on read failure (shouldn't happen in prod)
            img = np.zeros((self.image_size, self.image_size, 3), dtype=np.uint8)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        augmented = self.transform(image=img)
        tensor = augmented["image"]                     # (3, H, W)
        return tensor, torch.tensor(label, dtype=torch.float32)


# ── Clip / Sequence Dataset ───────────────────────────────────────────

class DeepfakeClipDataset(Dataset):
    """
    Builds fixed-length clips of consecutive frames from the same video.
    Used as input to the CNN-LSTM model.

    Args:
        df: DataFrame with columns ['frame_path', 'label', 'video_path'].
        sequence_length: Number of frames per clip (T).
        transform: Frame-level augmentation.
    """

    def __init__(
        self,
        df: pd.DataFrame,
        sequence_length: int = 10,
        transform: Optional[A.Compose] = None,
        image_size: int = 224,
    ):
        self.sequence_length = sequence_length
        self.transform = transform or get_val_transforms(image_size)
        self.image_size = image_size

        # Group frames by video
        self.clips: List[Tuple[List[str], int]] = []
        for video_id, group in df.groupby("video_path"):
            paths = group.sort_values("frame_path")["frame_path"].tolist()
            label = int(group["label"].iloc[0])

            # Slide a window over the frame list (non-overlapping)
            for start in range(0, len(paths) - sequence_length + 1, sequence_length):
                clip_paths = paths[start: start + sequence_length]
                self.clips.append((clip_paths, label))

            # Pad short videos by repeating frames
            if len(paths) < sequence_length:
                padded = paths + [paths[-1]] * (sequence_length - len(paths))
                self.clips.append((padded, label))

        logger.info(f"ClipDataset: {len(self.clips)} clips from {df['video_path'].nunique()} videos")

    def __len__(self) -> int:
        return len(self.clips)

    def __getitem__(self, idx: int) -> Tuple[torch.Tensor, torch.Tensor]:
        clip_paths, label = self.clips[idx]
        frames = []

        for path in clip_paths:
            img = cv2.imread(str(path))
            if img is None:
                img = np.zeros((self.image_size, self.image_size, 3), dtype=np.uint8)
            else:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            augmented = self.transform(image=img)
            frames.append(augmented["image"])          # (3, H, W)

        clip_tensor = torch.stack(frames, dim=0)       # (T, 3, H, W)
        return clip_tensor, torch.tensor(label, dtype=torch.float32)


# ── DataLoader factory ────────────────────────────────────────────────

def build_dataloaders(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    test_df: pd.DataFrame,
    model_type: str = "efficientnet",   # 'efficientnet' | 'cnn_lstm'
    batch_size: int = 32,
    num_workers: int = 4,
    image_size: int = 224,
    sequence_length: int = 10,
    oversample: bool = True,
) -> Tuple[DataLoader, DataLoader, DataLoader]:
    """
    Build train/val/test DataLoaders.

    For imbalanced datasets, applies WeightedRandomSampler on training set.
    """

    DatasetCls = (
        DeepfakeClipDataset if model_type == "cnn_lstm" else DeepfakeFrameDataset
    )

    shared_kwargs = {"image_size": image_size}
    if model_type == "cnn_lstm":
        shared_kwargs["sequence_length"] = sequence_length

    train_ds = DatasetCls(train_df, transform=get_train_transforms(image_size), **shared_kwargs)
    val_ds   = DatasetCls(val_df,   transform=get_val_transforms(image_size),   **shared_kwargs)
    test_ds  = DatasetCls(test_df,  transform=get_val_transforms(image_size),   **shared_kwargs)

    # Weighted sampler to handle class imbalance
    sampler = None
    if oversample and model_type != "cnn_lstm":
        labels = train_df["label"].values
        class_counts = np.bincount(labels)
        class_weights = 1.0 / class_counts
        sample_weights = class_weights[labels]
        sampler = WeightedRandomSampler(
            weights=torch.from_numpy(sample_weights).float(),
            num_samples=len(sample_weights),
            replacement=True,
        )

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        sampler=sampler,
        shuffle=(sampler is None),
        num_workers=num_workers,
        pin_memory=True,
        drop_last=True,
    )
    val_loader = DataLoader(
        val_ds, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=True,
    )
    test_loader = DataLoader(
        test_ds, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=True,
    )

    logger.info(
        f"DataLoaders built | "
        f"train={len(train_ds)} | val={len(val_ds)} | test={len(test_ds)}"
    )
    return train_loader, val_loader, test_loader
