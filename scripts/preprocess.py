"""
Preprocessing Pipeline
----------------------
@data-scientist | @computer-vision-expert

Runs the full preprocessing pipeline:
Raw videos → Frame extraction → Face detection → Saved crops → CSV splits
"""

import sys
import argparse
from pathlib import Path

import yaml
from loguru import logger

sys.path.insert(0, str(Path(__file__).parent.parent))

from src.preprocessing.frame_extractor import BatchFrameExtractor, FrameExtractor
from src.preprocessing.face_detector import FaceDetector
from src.preprocessing.dataset_builder import DatasetBuilder, DATASET_CONFIGS


def parse_args():
    parser = argparse.ArgumentParser(description="Preprocess deepfake dataset")

    parser.add_argument(
        "--config",
        default="configs/config.yaml"
    )

    parser.add_argument(
        "--dataset",
        required=True,
        choices=list(DATASET_CONFIGS.keys()),
        help="Dataset to preprocess"
    )

    parser.add_argument(
        "--raw-dir",
        default=None,
        help="Override raw data dir"
    )

    parser.add_argument(
        "--output",
        default="data/processed",
        help="Output directory for face crops"
    )

    parser.add_argument(
        "--workers",
        type=int,
        default=4
    )

    return parser.parse_args()


def main():

    args = parse_args()

    with open(args.config) as f:
        cfg = yaml.safe_load(f)

    prep_cfg = cfg["preprocessing"]

    raw_dir = Path(args.raw_dir or cfg["paths"]["data_raw"])

    output_dir = Path(args.output)

    logger.info(f"Preprocessing dataset: {args.dataset}")
    logger.info(f"Raw data: {raw_dir} → Processed: {output_dir}")

    # Frame extraction
    extractor = FrameExtractor(
        sample_rate=prep_cfg["frame_sample_rate"],
        max_frames=prep_cfg["max_frames_per_video"],
    )

    batch_extractor = BatchFrameExtractor(
        extractor,
        num_workers=args.workers
    )

    ds_config = DATASET_CONFIGS[args.dataset]

    frames_dir = output_dir / "frames"

    all_records = []

    # -----------------------------
    # Real videos
    # -----------------------------
    for real_subdir in ds_config["real_dirs"]:

        real_path = raw_dir / args.dataset / real_subdir

        if not real_path.exists():
            logger.warning(f"Directory not found: {real_path}")
            continue

        records = batch_extractor.process_directory(
            str(real_path),
            str(frames_dir / "real"),
            label=0
        )

        all_records.extend(records)

    # -----------------------------
    # Fake videos
    # -----------------------------
    for fake_subdir in ds_config["fake_dirs"]:

        fake_path = raw_dir / args.dataset / fake_subdir

        if not fake_path.exists():
            logger.warning(f"Directory not found: {fake_path}")
            continue

        records = batch_extractor.process_directory(
            str(fake_path),
            str(frames_dir / "fake"),
            label=1
        )

        all_records.extend(records)

    if not all_records:
        logger.error("No frames extracted. Check dataset structure.")
        sys.exit(1)

    logger.info(f"Total frames extracted: {len(all_records)}")

    # -----------------------------
    # Face Detection
    # -----------------------------
    logger.info("Running face detection...")

    detector = FaceDetector(
        image_size=prep_cfg["face_image_size"],
        margin=prep_cfg["face_margin"],
        min_face_size=prep_cfg["min_face_size"],
        batch_size=prep_cfg["mtcnn_batch_size"],
    )

    face_records = []

    for record in all_records:

        result = detector.save_face_crops(
            [record["frame_path"]],
            output_dir=str(
                output_dir / "faces" /
                ("fake" if record["label"] == 1 else "real")
            ),
        )

        for r in result:
            if r["has_face"]:

                face_records.append(
                    {
                        "frame_path": r["output_path"],
                        "label": record["label"],
                        "video_path": record["video_path"],
                    }
                )

    logger.info(f"Face crops saved: {len(face_records)}")

    # -----------------------------
    # Dataset Split
    # -----------------------------
    builder = DatasetBuilder(
        processed_dir=str(output_dir),
        splits_dir=cfg["paths"]["splits"],
        train_ratio=cfg["dataset"]["train_split"],
        val_ratio=cfg["dataset"]["val_split"],
        seed=cfg["project"].get("seed", 42),
    )

    builder.build_from_records(
        face_records,
        dataset_name=args.dataset
    )

    logger.info("Preprocessing complete!")


if __name__ == "__main__":
    main()