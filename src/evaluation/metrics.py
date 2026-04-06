"""
Evaluation Metrics
------------------
@data-scientist | @ml-engineer
see it carefully
Comprehensive evaluation: accuracy, precision, recall, F1, ROC-AUC.
Includes plotting utilities for ROC curve and confusion matrix.
"""

from typing import Dict, List, Optional

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report,
    average_precision_score,
)
from loguru import logger


def compute_metrics(
    y_true: List[int],
    y_prob: List[float],
    threshold: float = 0.5,
) -> Dict[str, float]:
    """
    Compute all classification metrics from probabilities.

    Args:
        y_true: Ground-truth binary labels (0=real, 1=fake).
        y_prob: Predicted probabilities for class 1 (fake).
        threshold: Decision boundary for binary predictions.

    Returns:
        Dict of metric names → float values.
    """
    y_true = np.array(y_true)
    y_prob = np.array(y_prob)
    y_pred = (y_prob >= threshold).astype(int)

    metrics = {
        "accuracy":  float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall":    float(recall_score(y_true, y_pred, zero_division=0)),
        "f1":        float(f1_score(y_true, y_pred, zero_division=0)),
    }

    # ROC-AUC requires both classes present
    if len(np.unique(y_true)) > 1:
        metrics["roc_auc"] = float(roc_auc_score(y_true, y_prob))
        metrics["avg_precision"] = float(average_precision_score(y_true, y_prob))
    else:
        metrics["roc_auc"] = 0.0
        metrics["avg_precision"] = 0.0

    return metrics


def print_evaluation_report(
    y_true: List[int],
    y_prob: List[float],
    threshold: float = 0.5,
):
    """Print a formatted evaluation report to the console."""
    y_pred = (np.array(y_prob) >= threshold).astype(int)
    metrics = compute_metrics(y_true, y_prob, threshold)

    logger.info("=" * 55)
    logger.info("  Deepfake Detection — Evaluation Report")
    logger.info("=" * 55)
    logger.info(f"  Threshold   : {threshold:.2f}")
    logger.info(f"  Samples     : {len(y_true)} (real={sum(1 for l in y_true if l==0)}, fake={sum(1 for l in y_true if l==1)})")
    logger.info("-" * 55)
    logger.info(f"  Accuracy    : {metrics['accuracy']:.4f}")
    logger.info(f"  Precision   : {metrics['precision']:.4f}")
    logger.info(f"  Recall      : {metrics['recall']:.4f}")
    logger.info(f"  F1 Score    : {metrics['f1']:.4f}")
    logger.info(f"  ROC-AUC     : {metrics['roc_auc']:.4f}")
    logger.info(f"  Avg Prec.   : {metrics['avg_precision']:.4f}")
    logger.info("=" * 55)
    logger.info("\nClassification Report:\n" + classification_report(
        y_true, y_pred, target_names=["Real", "Fake"]
    ))


def plot_roc_curve(
    y_true: List[int],
    y_prob: List[float],
    save_path: Optional[str] = None,
):
    """Plot and optionally save the ROC curve."""
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    auc = roc_auc_score(y_true, y_prob)

    fig, ax = plt.subplots(figsize=(7, 6))
    ax.plot(fpr, tpr, color="#3266ad", lw=2, label=f"ROC (AUC = {auc:.4f})")
    ax.plot([0, 1], [0, 1], color="#888", linestyle="--", lw=1)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curve — Deepfake Detector")
    ax.legend(loc="lower right")
    ax.set_xlim([-0.01, 1.01])
    ax.set_ylim([-0.01, 1.01])
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, dpi=150)
        logger.info(f"ROC curve saved → {save_path}")
    else:
        plt.show()
    plt.close()


def plot_confusion_matrix(
    y_true: List[int],
    y_prob: List[float],
    threshold: float = 0.5,
    save_path: Optional[str] = None,
):
    """Plot and optionally save the confusion matrix."""
    y_pred = (np.array(y_prob) >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)

    fig, ax = plt.subplots(figsize=(5, 4))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=["Real", "Fake"],
        yticklabels=["Real", "Fake"],
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("Confusion Matrix")
    plt.tight_layout()

    if save_path:
        plt.savefig(save_path, dpi=150)
        logger.info(f"Confusion matrix saved → {save_path}")
    else:
        plt.show()
    plt.close()


def find_optimal_threshold(
    y_true: List[int],
    y_prob: List[float],
    metric: str = "f1",
) -> float:
    """
    Sweep thresholds to find the one maximizing a given metric.

    Args:
        metric: 'f1', 'accuracy', or 'balanced'

    Returns:
        Optimal threshold float.
    """
    thresholds = np.linspace(0.1, 0.9, 81)
    best_val, best_t = -1.0, 0.5

    for t in thresholds:
        y_pred = (np.array(y_prob) >= t).astype(int)
        if metric == "f1":
            val = f1_score(y_true, y_pred, zero_division=0)
        elif metric == "accuracy":
            val = accuracy_score(y_true, y_pred)
        elif metric == "balanced":
            tp = np.sum((np.array(y_true) == 1) & (y_pred == 1))
            tn = np.sum((np.array(y_true) == 0) & (y_pred == 0))
            fp = np.sum((np.array(y_true) == 0) & (y_pred == 1))
            fn = np.sum((np.array(y_true) == 1) & (y_pred == 0))
            val = 0.5 * (tp / max(tp + fn, 1) + tn / max(tn + fp, 1))
        else:
            raise ValueError(f"Unknown metric: {metric}")

        if val > best_val:
            best_val = val
            best_t = float(t)

    logger.info(f"Optimal threshold: {best_t:.2f} ({metric}={best_val:.4f})")
    return best_t
