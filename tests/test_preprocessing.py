"""
Tests — Preprocessing
---------------------
@python-engineer
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

import numpy as np
import pytest
import cv2
import tempfile
import os

from src.preprocessing.frame_extractor import FrameExtractor


def make_dummy_video(path: str, num_frames: int = 30, fps: int = 30):
    """Create a small synthetic MP4 for testing."""
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(path, fourcc, fps, (64, 64))
    for i in range(num_frames):
        frame = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
        out.write(frame)
    out.release()


class TestFrameExtractor:

    def test_extract_frames_basic(self, tmp_path):
        video_path = str(tmp_path / "test.mp4")
        make_dummy_video(video_path, num_frames=30)

        extractor = FrameExtractor(sample_rate=5, max_frames=10)
        frames = extractor.extract_frames(video_path)

        assert len(frames) <= 10
        assert all(isinstance(f, np.ndarray) for f in frames)

    def test_extract_frames_respects_sample_rate(self, tmp_path):
        video_path = str(tmp_path / "test.mp4")
        make_dummy_video(video_path, num_frames=60)

        extractor = FrameExtractor(sample_rate=10, max_frames=100)
        frames = extractor.extract_frames(video_path)

        # 60 frames / sample_rate 10 = 6 frames
        assert len(frames) == 6

    def test_extract_invalid_path(self):
        extractor = FrameExtractor()
        frames = extractor.extract_frames("nonexistent_file.mp4")
        assert frames == []

    def test_save_frames(self, tmp_path):
        video_path = str(tmp_path / "test.mp4")
        make_dummy_video(video_path, num_frames=20)

        extractor = FrameExtractor(sample_rate=5, max_frames=5)
        saved = extractor.save_frames(video_path, str(tmp_path / "frames"))

        assert len(saved) > 0
        for p in saved:
            assert Path(p).exists()

    def test_video_info(self, tmp_path):
        video_path = str(tmp_path / "test.mp4")
        make_dummy_video(video_path, num_frames=30, fps=30)

        extractor = FrameExtractor()
        info = extractor.get_video_info(video_path)

        assert "total_frames" in info
        assert "fps" in info
        assert info["width"] == 64
        assert info["height"] == 64
