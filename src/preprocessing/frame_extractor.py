"""
Frame Extractor
---------------
@computer-vision-expert | @python-engineer

Extracts frames from video files using OpenCV.
Supports sampling rate control and multi-threaded batch extraction.
"""

import cv2
import os
from pathlib import Path
from typing import Generator, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

import random
import numpy as np
from loguru import logger
from tqdm import tqdm


class FrameExtractor:
    """
    Extracts frames from video files.

    Args:
        sample_rate: Extract every Nth frame (1 = all frames).
        max_frames: Maximum frames to extract per video (None = unlimited).
        output_size: Resize frames to (W, H). None keeps original size.
    """

    def __init__(
        self,
        sample_rate: int = 10,
        max_frames: int = 30,
        output_size: Optional[Tuple[int, int]] = None,
    ):
        self.sample_rate = sample_rate
        self.max_frames = max_frames
        self.output_size = output_size

    def extract_frames(self, video_path: str) -> List[np.ndarray]:
        """
        Extract frames from a single video.

        Returns:
            List of BGR numpy arrays (H, W, 3).
        """
        video_path = str(video_path)
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            logger.warning(f"Cannot open video: {video_path}")
            return []

        frames = []
        frame_idx = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % self.sample_rate == 0:
                    if self.output_size is not None:
                        frame = cv2.resize(frame, self.output_size)
                    frames.append(frame)

                    if self.max_frames and len(frames) >= self.max_frames:
                        break

                frame_idx += 1
        finally:
            cap.release()

        return frames

    def extract_frames_generator(
        self, video_path: str
    ) -> Generator[Tuple[int, np.ndarray], None, None]:
        """
        Generator version — yields (frame_index, frame) tuples.
        Memory-efficient for long videos.
        """
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            logger.warning(f"Cannot open video: {video_path}")
            return

        frame_idx = 0
        extracted = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_idx % self.sample_rate == 0:
                    if self.output_size:
                        frame = cv2.resize(frame, self.output_size)
                    yield frame_idx, frame
                    extracted += 1

                    if self.max_frames and extracted >= self.max_frames:
                        break

                frame_idx += 1
        finally:
            cap.release()

    def save_frames(
        self,
        video_path: str,
        output_dir: str,
        video_id: Optional[str] = None,
    ) -> List[str]:
        """
        Extract and save frames as JPEG files.

        Returns:
            List of saved file paths.
        """
        video_path = Path(video_path)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        vid_id = video_id or video_path.stem
        saved_paths = []

        for frame_idx, frame in self.extract_frames_generator(str(video_path)):
            out_path = output_dir / f"{vid_id}_frame{frame_idx:06d}.jpg"
            cv2.imwrite(str(out_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            saved_paths.append(str(out_path))

        return saved_paths

    def get_video_info(self, video_path: str) -> dict:
        """Return basic metadata for a video file."""
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return {}

        info = {
            "total_frames": int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            "fps": cap.get(cv2.CAP_PROP_FPS),
            "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            "duration_seconds": int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            / max(cap.get(cv2.CAP_PROP_FPS), 1),
        }
        cap.release()
        return info


class BatchFrameExtractor:
    """
    Batch-process a directory of videos using thread pool.

    Args:
        extractor: Configured FrameExtractor instance.
        num_workers: Number of parallel threads.
    """

    def __init__(self, extractor: FrameExtractor, num_workers: int = 4):
        self.extractor = extractor
        self.num_workers = num_workers

    def process_directory(
        self,
        input_dir: str,
        output_dir: str,
        label: int,
        extensions: Tuple[str, ...] = (".mp4", ".avi", ".mov", ".mkv"),
    ) -> List[dict]:
        """
        Extract frames from all videos in a directory.

        Returns:
            List of dicts: {video_path, frame_path, label}
        """
# ------------------------------------------------------------------------------------------
        input_dir = Path(input_dir)
        video_files = [
            f for f in input_dir.rglob("*") if f.suffix.lower() in extensions
        ]

        # Limit dataset size (example: 100 per class)
        MAX_VIDEOS_PER_CLASS = 100  

        if len(video_files) > MAX_VIDEOS_PER_CLASS:
            video_files = random.sample(video_files, MAX_VIDEOS_PER_CLASS)
# ------------------------------------------------------------------------------------------
        logger.info(
            f"Found {len(video_files)} videos in {input_dir} (label={label})"
        )

        results = []

        def process_one(video_path: Path):
            vid_output = Path(output_dir) / video_path.stem
            paths = self.extractor.save_frames(
                str(video_path), str(vid_output), video_id=video_path.stem
            )
            return [
                {"video_path": str(video_path), "frame_path": p, "label": label}
                for p in paths
            ]

        with ThreadPoolExecutor(max_workers=self.num_workers) as executor:
            futures = {
                executor.submit(process_one, vp): vp for vp in video_files
            }
            for future in tqdm(
                as_completed(futures), total=len(futures), desc="Extracting frames"
            ):
                try:
                    results.extend(future.result())
                except Exception as e:
                    logger.error(f"Error processing {futures[future]}: {e}")

        logger.info(f"Extracted {len(results)} total frames")
        return results
