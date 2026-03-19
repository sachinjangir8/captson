"""
Training Entrypoint
-------------------
@ml-engineer | @mlops-engineer

Usage:
    python scripts/train.py --config configs/config.yaml --model cnn_lstm
    python scripts/train.py --config configs/config.yaml --model efficientnet --epochs 20
"""

import sys
import os
import argparse
import random
from pathlib import Path

import yaml
import numpy as np
import torch
from loguru import logger

# Allow imports from project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.models.model_factory import build_model
from src.training.dataset import build_dataloaders
from src.training.trainer import Trainer
from src.preprocessing.dataset_builder import DatasetBuilder
from src.evaluation.metrics import print_evaluation_report, plot_roc_curve, plot_confusion_matrix


def set_seed(seed: int):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True


def parse_args():
    parser = argparse.ArgumentParser(description="Train DeepFake Detector")
    parser.add_argument("--config", type=str, default="configs/config.yaml")
    parser.add_argument("--model", type=str, default=None, help="Override model type")
    parser.add_argument("--epochs", type=int, default=None, help="Override epoch count")
    parser.add_argument("--batch-size", type=int, default=None)
    parser.add_argument("--lr", type=float, default=None, help="Override learning rate")
    parser.add_argument("--dataset", type=str, default=None, help="Dataset name override")
    parser.add_argument("--resume", type=str, default=None, help="Path to checkpoint to resume from")
    return parser.parse_args()


def main():
    args = parse_args()

    # Load config
    with open(args.config) as f:
        cfg = yaml.safe_load(f)

    # Apply CLI overrides
    train_cfg = cfg["training"]
    if args.model:      train_cfg["model"] = args.model
    if args.epochs:     train_cfg["epochs"] = args.epochs
    if args.batch_size: train_cfg["batch_size"] = args.batch_size
    if args.lr:         train_cfg["learning_rate"] = args.lr
    if args.dataset:    cfg["dataset"]["name"] = args.dataset

    set_seed(cfg["project"].get("seed", 42))

    model_name   = train_cfg["model"]
    dataset_name = cfg["dataset"]["name"]
    splits_dir   = cfg["paths"]["splits"]

    logger.info(f"Training model: {model_name} | dataset: {dataset_name}")

    # ── Load data splits ──────────────────────────────────────────────
    builder = DatasetBuilder(
        processed_dir=cfg["paths"]["data_processed"],
        splits_dir=splits_dir,
        train_ratio=cfg["dataset"]["train_split"],
        val_ratio=cfg["dataset"]["val_split"],
        seed=cfg["project"].get("seed", 42),
    )

    try:
        train_df, val_df, test_df = builder.load_splits(dataset_name)
        logger.info("Loaded existing splits from CSV")
    except FileNotFoundError:
        logger.error(
            f"No splits found for '{dataset_name}' in {splits_dir}. "
            f"Run: python scripts/preprocess.py first."
        )
        sys.exit(1)

    # ── DataLoaders ───────────────────────────────────────────────────
    train_loader, val_loader, test_loader = build_dataloaders(
        train_df=train_df,
        val_df=val_df,
        test_df=test_df,
        model_type=model_name,
        batch_size=train_cfg["batch_size"],
        num_workers=train_cfg.get("num_workers", 4),
        image_size=cfg["preprocessing"]["face_image_size"],
        sequence_length=train_cfg.get("sequence_length", 10),
    )

    # ── Model ─────────────────────────────────────────────────────────
    model = build_model(model_name, train_cfg)

    # Optionally resume
    if args.resume:
        from src.models.model_factory import load_checkpoint
        load_checkpoint(model, args.resume)
        logger.info(f"Resumed from: {args.resume}")

    # ── Train ─────────────────────────────────────────────────────────
    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        config=train_cfg,
        checkpoint_dir=cfg["paths"]["checkpoints"],
        log_dir=cfg["paths"]["logs"],
    )

    history = trainer.train()

    # ── Evaluate on test set ──────────────────────────────────────────
    logger.info("Evaluating best model on test set...")

    from src.models.model_factory import load_checkpoint
    best_ckpt = Path(cfg["paths"]["checkpoints"]) / "best_model.pth"
    if best_ckpt.exists():
        load_checkpoint(model, str(best_ckpt))

    device = next(model.parameters()).device
    model.eval()
    all_labels, all_probs = [], []

    import torch
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            logits = model(inputs).squeeze(1)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.extend(probs.tolist())
            all_labels.extend(labels.numpy().tolist())

    print_evaluation_report(all_labels, all_probs, threshold=cfg["evaluation"]["threshold"])

    outputs_dir = Path("outputs")
    outputs_dir.mkdir(exist_ok=True)
    plot_roc_curve(all_labels, all_probs, save_path=str(outputs_dir / "roc_curve.png"))
    plot_confusion_matrix(all_labels, all_probs, save_path=str(outputs_dir / "confusion_matrix.png"))

    logger.info("Training complete. Check outputs/ for evaluation plots.")


if __name__ == "__main__":
    main()
