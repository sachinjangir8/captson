"""
Inference Predictor
-------------------
@ml-engineer | @computer-vision-expert

End-to-end inference pipeline:
  Video/Image → Frame extraction → Face detection → Model → Score
"""

import time
from pathlib import Path
from typing import Dict, List, Optional, Union

import cv2
import numpy as np
import torch
import torch.nn as nn
import albumentations as A
from albumentations.pytorch import ToTensorV2
from loguru import logger

from ..preprocessing.frame_extractor import FrameExtractor
from ..preprocessing.face_detector import FaceDetector
from ..models.model_factory import load_checkpoint


# ---------------------------------------------------------
# TRANSFORMS
# ---------------------------------------------------------

INFERENCE_TRANSFORMS = A.Compose([
    A.Resize(224, 224),
    A.Normalize(
        mean=(0.485, 0.456, 0.406),
        std=(0.229, 0.224, 0.225)
    ),
    ToTensorV2(),
])


# ---------------------------------------------------------
# HELPER: DRAW FACE BOXES
# ---------------------------------------------------------

def draw_face_box(frame: np.ndarray):
    """
    Draw a simple visualization bounding box in the center
    (since FaceDetector returns cropped face).
    """

    h, w = frame.shape[:2]

    box_size = int(min(h, w) * 0.4)

    x1 = int(w/2 - box_size/2)
    y1 = int(h/2 - box_size/2)
    x2 = x1 + box_size
    y2 = y1 + box_size

    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

    return frame


# ---------------------------------------------------------
# MAIN CLASS
# ---------------------------------------------------------

class DeepfakePredictor:

    def __init__(
        self,
        model: Union[nn.Module, str],
        model_type: str = "efficientnet",
        device: Optional[str] = None,
        frame_sample_rate: int = 10,
        max_frames: int = 30,
        aggregation: str = "mean",
        fake_threshold: float = 0.5,
    ):

        self.model_type = model_type
        self.aggregation = aggregation
        self.fake_threshold = fake_threshold

        if device is None:
            self.device = torch.device(
                "cuda" if torch.cuda.is_available() else "cpu"
            )
        else:
            self.device = torch.device(device)

        # Load model
        if isinstance(model, str):
            from ..models.model_factory import build_model
            m = build_model(model_type, {})
            load_checkpoint(m, model, device=str(self.device))
            self.model = m
        else:
            self.model = model
            self.model.to(self.device)

        self.model.eval()

        # utilities
        self.frame_extractor = FrameExtractor(
            sample_rate=frame_sample_rate,
            max_frames=max_frames
        )

        self.face_detector = FaceDetector(
            image_size=224,
            margin=0.3,
            device=str(self.device)
        )

        logger.info(f"DeepfakePredictor ready on {self.device}")

    # ---------------------------------------------------------
    # IMAGE PREDICTION
    # ---------------------------------------------------------

    def predict_image(self, image: Union[str, np.ndarray]) -> Dict:

        t0 = time.time()

        if isinstance(image, str):
            frame = cv2.imread(image)
            if frame is None:
                raise ValueError(f"Cannot read image: {image}")
        else:
            frame = image

        face = self.face_detector.detect_face(frame)

        if face is None:
            logger.warning("No face detected — using full frame")

            face = cv2.resize(
                cv2.cvtColor(frame, cv2.COLOR_BGR2RGB),
                (224, 224)
            )

        prob = self._predict_face(face)

        elapsed_ms = (time.time() - t0) * 1000

        return self._format_result([prob], elapsed_ms)

    # ---------------------------------------------------------
    # VIDEO PREDICTION
    # ---------------------------------------------------------

    def predict_video(self, video_path: str) -> Dict:

        t0 = time.time()

        logger.info(f"Processing video: {video_path}")

        frames = self.frame_extractor.extract_frames(video_path)

        if not frames:
            raise ValueError("No frames extracted")

        frame_probs = []
        visualization_frame = None

        for frame in frames:

            face = self.face_detector.detect_face(frame)

            if face is None:
                continue

            prob = self._predict_face(face)
            frame_probs.append(prob)

            # Save one frame for visualization
            if visualization_frame is None:

                vis_frame = draw_face_box(frame.copy())

                visualization_frame = cv2.cvtColor(
                    vis_frame,
                    cv2.COLOR_BGR2RGB
                )

        # fallback if no faces
        if not frame_probs:

            logger.warning("No faces detected — using raw frames")

            for frame in frames:

                rgb = cv2.cvtColor(
                    cv2.resize(frame, (224, 224)),
                    cv2.COLOR_BGR2RGB
                )

                prob = self._predict_face(rgb)

                frame_probs.append(prob)

        elapsed_ms = (time.time() - t0) * 1000

        return self._format_result(
            frame_probs,
            elapsed_ms,
            visualization_frame
        )

    # ---------------------------------------------------------
    # AUTO DISPATCH
    # ---------------------------------------------------------

    def predict(self, input_path: str) -> Dict:

        ext = Path(input_path).suffix.lower()

        image_exts = {".jpg", ".jpeg", ".png"}
        video_exts = {".mp4", ".avi", ".mov", ".mkv"}

        if ext in image_exts:
            return self.predict_image(input_path)

        elif ext in video_exts:
            return self.predict_video(input_path)

        else:
            raise ValueError(f"Unsupported file type: {ext}")

    # ---------------------------------------------------------
    # MODEL INFERENCE
    # ---------------------------------------------------------

    @torch.no_grad()
    def _predict_face(self, face_rgb: np.ndarray) -> float:

        augmented = INFERENCE_TRANSFORMS(image=face_rgb)

        tensor = augmented["image"].unsqueeze(0).to(self.device)

        if self.model_type == "cnn_lstm":
            tensor = tensor.unsqueeze(1)

        logit = self.model(tensor).squeeze()

        prob = torch.sigmoid(logit).item()

        return float(prob)

    # ---------------------------------------------------------
    # AGGREGATION
    # ---------------------------------------------------------

    def _aggregate(self, probs: List[float]) -> float:

        arr = np.array(probs)

        if self.aggregation == "mean":
            return float(np.mean(arr))

        elif self.aggregation == "max":
            return float(np.max(arr))

        elif self.aggregation == "weighted":

            weights = np.abs(arr - 0.5) + 0.01

            return float(np.average(arr, weights=weights))

        return float(np.mean(arr))

    # ---------------------------------------------------------
    # RESULT FORMAT
    # ---------------------------------------------------------

    def _format_result(
        self,
        probs: List[float],
        elapsed_ms: float,
        visualization_frame=None
    ) -> Dict:

        score = self._aggregate(probs)

        is_fake = score >= self.fake_threshold

        confidence = score if is_fake else (1.0 - score)

        result = {
            "prediction": "fake" if is_fake else "real",
            "confidence": round(confidence, 4),
            "fake_probability": round(score, 4),
            "frame_scores": [round(p, 4) for p in probs],
            "frames_analyzed": len(probs),
            "processing_time_ms": round(elapsed_ms, 1),
        }

        if visualization_frame is not None:
            result["visualization_frame"] = visualization_frame.tolist()

        return result