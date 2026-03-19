"""
Inference CLI
-------------
@ml-engineer | @mlops-engineer

Run deepfake detection on a single file from the command line.

Usage:
    python scripts/infer.py --input path/to/video.mp4
    python scripts/infer.py --input path/to/image.jpg --model cnn_lstm
    python scripts/infer.py --input video.mp4 --threshold 0.6 --verbose
"""

import sys
import argparse
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import yaml
from loguru import logger

from src.inference.predictor import DeepfakePredictor


def parse_args():
    parser = argparse.ArgumentParser(description="DeepFake Detection — Inference CLI")
    parser.add_argument("--input", required=True, help="Path to video or image")
    parser.add_argument("--checkpoint", default="checkpoints/best_model.pth")
    parser.add_argument("--model", default="cnn_lstm", choices=["efficientnet", "cnn_lstm"])
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--device", default="auto", choices=["auto", "cpu", "cuda"])
    parser.add_argument("--aggregation", default="mean", choices=["mean", "max", "weighted"])
    parser.add_argument("--verbose", action="store_true")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    return parser.parse_args()


def main():
    args = parse_args()

    if not Path(args.input).exists():
        logger.error(f"Input not found: {args.input}")
        sys.exit(1)

    if not Path(args.checkpoint).exists():
        logger.error(
            f"Checkpoint not found: {args.checkpoint}\n"
            "Train a model first: python scripts/train.py"
        )
        sys.exit(1)

    if not args.verbose:
        logger.remove()

    predictor = DeepfakePredictor(
        model=args.checkpoint,
        model_type=args.model,
        device=args.device,
        fake_threshold=args.threshold,
        aggregation=args.aggregation,
    )

    result = predictor.predict(args.input)

    if args.json:
        print(json.dumps(result, indent=2))
    else:
        pred = result["prediction"].upper()
        conf = result["confidence"]
        prob = result["fake_probability"]
        frames = result["frames_analyzed"]
        ms = result["processing_time_ms"]

        icon = "⚠️ " if result["prediction"] == "fake" else "✅"
        print(f"\n{icon}  Prediction   : {pred}")
        print(f"   Confidence   : {conf:.1%}")
        print(f"   Fake prob.   : {prob:.1%}")
        print(f"   Frames used  : {frames}")
        print(f"   Time         : {ms:.0f}ms")

        if args.verbose and result["frame_scores"]:
            print(f"\n   Per-frame scores: {result['frame_scores']}")

        print()


if __name__ == "__main__":
    main()
