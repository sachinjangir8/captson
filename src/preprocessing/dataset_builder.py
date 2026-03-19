"""
Dataset Builder
---------------
@data-scientist | @ml-engineer

Scans processed face crops, builds a master CSV, and creates
stratified train/val/test splits. Supports FaceForensics++,
Celeb-DF, and DFDC formats.
"""

import os
import json
import random
from pathlib import Path
from typing import Dict, Optional, Tuple

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from loguru import logger


DATASET_CONFIGS = {
    "celeb-df": {
        "real_dirs": ["Celeb-real", "YouTube-real"],
        "fake_dirs": ["Celeb-synthesis"],
        "label_file": None,
    },
    "ff++": {
        "real_dirs": ["original_sequences/youtube"],
        "fake_dirs": [
            "manipulated_sequences/Deepfakes",
            "manipulated_sequences/Face2Face",
            "manipulated_sequences/FaceSwap",
            "manipulated_sequences/NeuralTextures",
        ],
        "label_file": None,
    },
    "dfdc": {
        "real_dirs": [],
        "fake_dirs": [],
        "label_file": "labels.csv",  # DFDC uses a flat label file
    },
}


class DatasetBuilder:
    """
    Build structured CSV splits from preprocessed face crops.

    Args:
        processed_dir: Root of processed data (face crops live here).
        splits_dir: Where to write train/val/test CSV files.
        train_ratio: Fraction for training.
        val_ratio: Fraction for validation.
        seed: Random seed for reproducibility.
    """

    def __init__(
        self,
        processed_dir: str,
        splits_dir: str,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        seed: int = 42,
    ):
        self.processed_dir = Path(processed_dir)
        self.splits_dir = Path(splits_dir)
        self.splits_dir.mkdir(parents=True, exist_ok=True)
        self.train_ratio = train_ratio
        self.val_ratio = val_ratio
        self.test_ratio = 1.0 - train_ratio - val_ratio
        self.seed = seed
        random.seed(seed)
        np.random.seed(seed)

    def build_from_records(self, records: list, dataset_name: str = "dataset") -> Dict[str, pd.DataFrame]:
        """
        Build splits from the records list produced by preprocessing.

        Args:
            records: List of {'frame_path', 'label', 'video_path'} dicts.
        """
        df = pd.DataFrame(records)
        df = df[df["frame_path"].notna()].reset_index(drop=True)

        logger.info(
            f"Building splits from {len(df)} samples "
            f"(real={len(df[df.label==0])}, fake={len(df[df.label==1])})"
        )

        # Group by source video to avoid data leakage across splits
        video_ids = df["video_path"].unique()
        labels_per_video = (
            df.groupby("video_path")["label"].first().reindex(video_ids).values
        )

        train_vids, temp_vids, _, temp_labels = train_test_split(
            video_ids,
            labels_per_video,
            test_size=(1 - self.train_ratio),
            stratify=labels_per_video,
            random_state=self.seed,
        )

        val_ratio_adjusted = self.val_ratio / (self.val_ratio + self.test_ratio)
        val_vids, test_vids = train_test_split(
            temp_vids,
            test_size=(1 - val_ratio_adjusted),
            stratify=temp_labels,
            random_state=self.seed,
        )

        train_df = df[df["video_path"].isin(train_vids)].reset_index(drop=True)
        val_df   = df[df["video_path"].isin(val_vids)].reset_index(drop=True)
        test_df  = df[df["video_path"].isin(test_vids)].reset_index(drop=True)

        splits = {"train": train_df, "val": val_df, "test": test_df}
        self._save_splits(splits, dataset_name)
        self._print_summary(splits)
        return splits

    def build_from_directory(
        self,
        real_dir: str,
        fake_dir: str,
        dataset_name: str = "dataset",
    ) -> Dict[str, pd.DataFrame]:
        """
        Scan real_dir and fake_dir for image files and build records automatically.
        """
        records = []

        for img_path in Path(real_dir).rglob("*.jpg"):
            records.append({"frame_path": str(img_path), "label": 0, "video_path": img_path.parent.name})
        for img_path in Path(real_dir).rglob("*.png"):
            records.append({"frame_path": str(img_path), "label": 0, "video_path": img_path.parent.name})

        for img_path in Path(fake_dir).rglob("*.jpg"):
            records.append({"frame_path": str(img_path), "label": 1, "video_path": img_path.parent.name})
        for img_path in Path(fake_dir).rglob("*.png"):
            records.append({"frame_path": str(img_path), "label": 1, "video_path": img_path.parent.name})

        logger.info(f"Scanned: {len(records)} total images (real + fake)")
        return self.build_from_records(records, dataset_name)

    def _save_splits(self, splits: Dict[str, pd.DataFrame], name: str):
        for split_name, df in splits.items():
            out = self.splits_dir / f"{name}_{split_name}.csv"
            df.to_csv(out, index=False)
            logger.info(f"Saved {split_name} split → {out}")

    def _print_summary(self, splits: Dict[str, pd.DataFrame]):
        logger.info("=" * 50)
        logger.info("Dataset Split Summary")
        logger.info("=" * 50)
        for name, df in splits.items():
            real_n = len(df[df.label == 0])
            fake_n = len(df[df.label == 1])
            logger.info(
                f"  {name:6s}: {len(df):6d} samples  "
                f"(real={real_n}, fake={fake_n}, "
                f"ratio={fake_n/(real_n+1):.2f})"
            )
        logger.info("=" * 50)

    def load_splits(
        self, dataset_name: str
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """Load previously saved splits from CSV files."""
        train_df = pd.read_csv(self.splits_dir / f"{dataset_name}_train.csv")
        val_df   = pd.read_csv(self.splits_dir / f"{dataset_name}_val.csv")
        test_df  = pd.read_csv(self.splits_dir / f"{dataset_name}_test.csv")
        return train_df, val_df, test_df
