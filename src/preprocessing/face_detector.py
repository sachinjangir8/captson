"""
Face Detector
-------------
@computer-vision-expert | @deep-learning-researcher

Uses MTCNN (Multi-task Cascaded Convolutional Network) to detect,
align, and crop faces from video frames.
MTCNN runs three cascaded networks: P-Net → R-Net → O-Net.
"""

import cv2
import numpy as np
from pathlib import Path
from typing import List, Optional, Tuple

import torch
from facenet_pytorch import MTCNN
from PIL import Image
from loguru import logger


class FaceDetector:
    """
    MTCNN-based face detector with alignment.

    Args:
        image_size: Output face crop size (pixels).
        margin: Fractional padding added around the face box.
        min_face_size: Minimum face size to detect (pixels).
        batch_size: Frames to process per MTCNN forward pass.
        device: 'cuda', 'cpu', or None (auto-detect).
        keep_all: If True, return all faces; False returns largest.
    """

    def __init__(
        self,
        image_size: int = 224,
        margin: float = 0.3,
        min_face_size: int = 60,
        batch_size: int = 32,
        device: Optional[str] = None,
        keep_all: bool = False,
    ):
        self.image_size = image_size
        self.margin = margin
        self.min_face_size = min_face_size
        self.batch_size = batch_size
        self.keep_all = keep_all

        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        # MTCNN: returns aligned face tensors ready for recognition models
        self.mtcnn = MTCNN(
            image_size=image_size,
            margin=int(image_size * margin),
            min_face_size=min_face_size,
            thresholds=[0.6, 0.7, 0.7],   # P-Net, R-Net, O-Net thresholds
            factor=0.709,
            post_process=False,             # keep [0,255] range
            keep_all=keep_all,
            device=self.device,
        )

        logger.info(f"FaceDetector initialized on {self.device}")

    def detect_face(
        self, frame: np.ndarray
    ) -> Optional[np.ndarray]:
        """
        Detect and crop the primary face from a single BGR frame.

        Returns:
            RGB numpy array of shape (H, W, 3) or None if no face found.
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)

        face_tensor = self.mtcnn(pil_img)  # returns (C, H, W) tensor or None

        if face_tensor is None:
            return None

        # Convert tensor → numpy (H, W, C), uint8
        if face_tensor.ndim == 4:
            # keep_all=True returns (N, C, H, W); take largest
            face_tensor = face_tensor[0]

        face_np = face_tensor.permute(1, 2, 0).numpy().astype(np.uint8)
        return face_np

    def detect_faces_batch(
        self, frames: List[np.ndarray]
    ) -> List[Optional[np.ndarray]]:
        """
        Process a batch of BGR frames.

        Returns:
            List of face arrays (or None for frames with no detection).
        """
        pil_frames = [
            Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)) for f in frames
        ]
        face_tensors = self.mtcnn(pil_frames)

        results = []
        if face_tensors is None:
            return [None] * len(frames)

        for ft in face_tensors:
            if ft is None:
                results.append(None)
            else:
                if ft.ndim == 4:
                    ft = ft[0]
                face_np = ft.permute(1, 2, 0).numpy().astype(np.uint8)
                results.append(face_np)

        return results

    def get_face_boxes(
        self, frame: np.ndarray
    ) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Return raw bounding boxes and landmarks without cropping.

        Returns:
            (boxes, landmarks) — both None if no face detected.
            boxes: array of shape (N, 4) with [x1, y1, x2, y2]
            landmarks: array of shape (N, 5, 2)
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        boxes, _, landmarks = self.mtcnn.detect(pil_img, landmarks=True)
        return boxes, landmarks

    def save_face_crops(
        self,
        frame_paths: List[str],
        output_dir: str,
        skip_no_face: bool = True,
    ) -> List[dict]:
        """
        Process saved frame images and write face crops to disk.

        Returns:
            List of dicts: {input_path, output_path, has_face}
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        records = []

        for i in range(0, len(frame_paths), self.batch_size):
            batch_paths = frame_paths[i: i + self.batch_size]
            frames = [cv2.imread(p) for p in batch_paths]
            faces = self.detect_faces_batch(
                [f for f in frames if f is not None]
            )

            face_iter = iter(faces)
            for path, frame in zip(batch_paths, frames):
                if frame is None:
                    records.append({"input_path": path, "output_path": None, "has_face": False})
                    continue

                face = next(face_iter)
                if face is None:
                    records.append({"input_path": path, "output_path": None, "has_face": False})
                    continue

                out_name = Path(path).stem + "_face.jpg"
                out_path = output_dir / out_name
                # face is RGB; convert to BGR for cv2.imwrite
                cv2.imwrite(str(out_path), cv2.cvtColor(face, cv2.COLOR_RGB2BGR))
                records.append({"input_path": path, "output_path": str(out_path), "has_face": True})

        found = sum(1 for r in records if r["has_face"])
        logger.info(f"Face detection complete: {found}/{len(records)} faces found")
        return records
