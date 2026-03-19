"""
Evaluation Script
-----------------
@data-scientist | @ml-engineer

Runs full evaluation on the test split and saves plots.

Usage:
    python scripts/evaluate.py --dataset celeb-df --checkpoint checkpoints/best_model.pth
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import yaml
import torch
from loguru import logger

from src.models.model_factory import build_model, load_checkpoint
from src.training.dataset import build_dataloaders, get_val_transforms
from src.preprocessing.dataset_builder import DatasetBuilder
from src.evaluation.metrics import (
    print_evaluation_report,
    plot_roc_curve,
    plot_confusion_matrix,
    find_optimal_threshold,
)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="configs/config.yaml")
    parser.add_argument("--dataset", required=True)
    parser.add_argument("--checkpoint", default="checkpoints/best_model.pth")
    parser.add_argument("--model", default=None)
    parser.add_argument("--threshold", type=float, default=None)
    parser.add_argument("--output-dir", default="outputs")
    return parser.parse_args()


def main():
    args = parse_args()

    with open(args.config) as f:
        cfg = yaml.safe_load(f)

    model_name = args.model or cfg["training"]["model"]
    threshold  = args.threshold or cfg["evaluation"]["threshold"]
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load splits
    builder = DatasetBuilder(
        processed_dir=cfg["paths"]["data_processed"],
        splits_dir=cfg["paths"]["splits"],
    )
    _, _, test_df = builder.load_splits(args.dataset)

    _, _, test_loader = build_dataloaders(
        train_df=test_df,  # dummy
        val_df=test_df,
        test_df=test_df,
        model_type=model_name,
        batch_size=cfg["training"]["batch_size"],
        num_workers=cfg["training"].get("num_workers", 4),
    )

    # Load model
    model = build_model(model_name, cfg["training"])
    load_checkpoint(model, args.checkpoint, device=str(device))
    model.eval()

    # Run inference
    all_labels, all_probs = [], []
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs = inputs.to(device)
            logits = model(inputs).squeeze(1)
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.extend(probs.tolist())
            all_labels.extend(labels.numpy().tolist())

    # Auto-find optimal threshold if not given
    if args.threshold is None:
        threshold = find_optimal_threshold(all_labels, all_probs, metric="f1")

    print_evaluation_report(all_labels, all_probs, threshold)
    plot_roc_curve(all_labels, all_probs, save_path=str(output_dir / "roc_curve.png"))
    plot_confusion_matrix(all_labels, all_probs, threshold, save_path=str(output_dir / "confusion_matrix.png"))

    logger.info(f"Plots saved to {output_dir}/")


if __name__ == "__main__":
    main()
