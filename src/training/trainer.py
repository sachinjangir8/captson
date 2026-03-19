"""
Trainer
-------
@ml-engineer | @deep-learning-researcher | @mlops-engineer

Production-grade training loop featuring:
  - Mixed precision training (torch.cuda.amp)
  - Gradient clipping
  - Learning rate warm-up + cosine annealing
  - Early stopping
  - TensorBoard logging
  - Best-model checkpointing
"""

import time
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.cuda.amp import GradScaler, autocast
from torch.utils.tensorboard import SummaryWriter
from loguru import logger

from ..evaluation.metrics import compute_metrics
from ..models.model_factory import save_checkpoint


class EarlyStopping:
    def __init__(self, patience: int = 7, min_delta: float = 1e-4, mode: str = "max"):
        self.patience = patience
        self.min_delta = min_delta
        self.mode = mode
        self.counter = 0
        self.best = None
        self.should_stop = False

    def step(self, value: float) -> bool:
        if self.best is None:
            self.best = value
            return False

        improved = (
            value > self.best + self.min_delta
            if self.mode == "max"
            else value < self.best - self.min_delta
        )

        if improved:
            self.best = value
            self.counter = 0
        else:
            self.counter += 1
            if self.counter >= self.patience:
                self.should_stop = True
                logger.info(f"Early stopping triggered after {self.patience} epochs without improvement")

        return self.should_stop


class Trainer:
    """
    Orchestrates model training and validation.

    Args:
        model: PyTorch model.
        train_loader / val_loader: DataLoaders.
        config: Training config dict from YAML.
        device: 'cuda' or 'cpu'.
        checkpoint_dir: Directory for saving checkpoints.
        log_dir: TensorBoard log directory.
    """

    def __init__(
        self,
        model: nn.Module,
        train_loader: DataLoader,
        val_loader: DataLoader,
        config: dict,
        device: str = "auto",
        checkpoint_dir: str = "checkpoints",
        log_dir: str = "logs",
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.config = config
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)

        if device == "auto":
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        self.model.to(self.device)
        logger.info(f"Training on {self.device}")

        # ── Loss ──────────────────────────────────────────
        # BCEWithLogitsLoss: numerically stable binary cross-entropy
        # pos_weight handles class imbalance (optional)
        self.criterion = nn.BCEWithLogitsLoss()

        # ── Optimizer ─────────────────────────────────────
        self.optimizer = torch.optim.AdamW(
            filter(lambda p: p.requires_grad, model.parameters()),
            lr=config.get("learning_rate", 1e-4),
            weight_decay=config.get("weight_decay", 1e-5),
        )

        # ── LR Scheduler ──────────────────────────────────
        num_epochs = config.get("epochs", 30)
        warmup = config.get("warmup_epochs", 2)

        # Warm-up phase followed by cosine annealing
        def lr_lambda(epoch):
            if epoch < warmup:
                return (epoch + 1) / warmup
            progress = (epoch - warmup) / max(num_epochs - warmup, 1)
            return 0.5 * (1.0 + torch.cos(torch.tensor(progress * 3.14159)).item())

        self.scheduler = torch.optim.lr_scheduler.LambdaLR(self.optimizer, lr_lambda)

        # ── AMP ───────────────────────────────────────────
        self.use_amp = config.get("mixed_precision", True) and torch.cuda.is_available()
        self.scaler = GradScaler(enabled=self.use_amp)
        logger.info(f"Mixed precision: {self.use_amp}")

        # ── Early stopping ────────────────────────────────
        self.early_stopping = EarlyStopping(
            patience=config.get("early_stopping_patience", 7)
        )

        # ── TensorBoard ───────────────────────────────────
        self.writer = SummaryWriter(log_dir=log_dir)

        self.best_val_auc = 0.0
        self.global_step = 0

    def _train_epoch(self, epoch: int) -> dict:
        self.model.train()
        total_loss = 0.0
        all_labels, all_probs = [], []

        for batch_idx, (inputs, labels) in enumerate(self.train_loader):
            inputs = inputs.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            self.optimizer.zero_grad(set_to_none=True)

            with autocast(enabled=self.use_amp):
                logits = self.model(inputs).squeeze(1)   # (B,)
                loss = self.criterion(logits, labels)

            self.scaler.scale(loss).backward()

            # Gradient clipping
            grad_clip = self.config.get("grad_clip", 1.0)
            self.scaler.unscale_(self.optimizer)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), grad_clip)

            self.scaler.step(self.optimizer)
            self.scaler.update()

            total_loss += loss.item()
            probs = torch.sigmoid(logits.detach()).cpu().numpy()
            all_probs.extend(probs.tolist())
            all_labels.extend(labels.cpu().numpy().tolist())

            # Log every 50 steps
            if batch_idx % 50 == 0:
                self.writer.add_scalar("train/step_loss", loss.item(), self.global_step)
                lr = self.optimizer.param_groups[0]["lr"]
                self.writer.add_scalar("train/lr", lr, self.global_step)

            self.global_step += 1

        metrics = compute_metrics(all_labels, all_probs, threshold=0.5)
        metrics["loss"] = total_loss / len(self.train_loader)
        return metrics

    @torch.no_grad()
    def _val_epoch(self) -> dict:
        self.model.eval()
        total_loss = 0.0
        all_labels, all_probs = [], []

        for inputs, labels in self.val_loader:
            inputs = inputs.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            with autocast(enabled=self.use_amp):
                logits = self.model(inputs).squeeze(1)
                loss = self.criterion(logits, labels)

            total_loss += loss.item()
            probs = torch.sigmoid(logits).cpu().numpy()
            all_probs.extend(probs.tolist())
            all_labels.extend(labels.cpu().numpy().tolist())

        metrics = compute_metrics(all_labels, all_probs, threshold=0.5)
        metrics["loss"] = total_loss / len(self.val_loader)
        return metrics

    def train(self) -> dict:
        """Run the full training loop."""
        num_epochs = self.config.get("epochs", 30)
        history = {"train": [], "val": []}

        logger.info(f"Starting training for {num_epochs} epochs")

        for epoch in range(num_epochs):
            t0 = time.time()

            train_metrics = self._train_epoch(epoch)
            val_metrics   = self._val_epoch()

            self.scheduler.step()
            elapsed = time.time() - t0

            # Log to TensorBoard
            for k, v in train_metrics.items():
                self.writer.add_scalar(f"train/{k}", v, epoch)
            for k, v in val_metrics.items():
                self.writer.add_scalar(f"val/{k}", v, epoch)

            # Console log
            logger.info(
                f"Epoch {epoch+1:3d}/{num_epochs} [{elapsed:.0f}s] | "
                f"train_loss={train_metrics['loss']:.4f} "
                f"train_auc={train_metrics.get('roc_auc', 0):.4f} | "
                f"val_loss={val_metrics['loss']:.4f} "
                f"val_auc={val_metrics.get('roc_auc', 0):.4f} "
                f"val_f1={val_metrics.get('f1', 0):.4f}"
            )

            history["train"].append(train_metrics)
            history["val"].append(val_metrics)

            # Save best model
            val_auc = val_metrics.get("roc_auc", 0)
            if val_auc > self.best_val_auc:
                self.best_val_auc = val_auc
                save_checkpoint(
                    self.model,
                    self.optimizer,
                    epoch,
                    {"val_auc": val_auc, "val_f1": val_metrics.get("f1", 0)},
                    str(self.checkpoint_dir / "best_model.pth"),
                )

            # Save latest checkpoint every 5 epochs
            if (epoch + 1) % 5 == 0:
                save_checkpoint(
                    self.model,
                    self.optimizer,
                    epoch,
                    val_metrics,
                    str(self.checkpoint_dir / f"checkpoint_epoch{epoch+1}.pth"),
                )

            # Early stopping
            if self.early_stopping.step(val_auc):
                logger.info(f"Early stopping at epoch {epoch+1}")
                break

        self.writer.close()
        logger.info(f"Training complete. Best val AUC: {self.best_val_auc:.4f}")
        return history
