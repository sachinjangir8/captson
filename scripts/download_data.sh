#!/usr/bin/env bash
# Dataset Download Helper
# @data-scientist
#
# Usage:
#   bash scripts/download_data.sh celeb-df
#   bash scripts/download_data.sh dfdc   (requires Kaggle API key)

set -e

DATASET=${1:-"celeb-df"}
RAW_DIR="data/raw"
mkdir -p "$RAW_DIR"

echo "=== Downloading dataset: $DATASET ==="

case $DATASET in
  celeb-df)
    echo "Downloading Celeb-DF v2..."
    echo "  Official page: https://github.com/yuezunli/celeb-deepfakeforensics"
    echo "  Request access form: https://docs.google.com/forms/d/e/1FAIpQLSdxjFEWPILIJ4mwxzl69xhKOc_ZxFwCJY_c8HtCJxWKhiknag/viewform"
    echo ""
    echo "  After downloading, organize as:"
    echo "  data/raw/celeb-df/"
    echo "  ├── Celeb-real/"
    echo "  ├── Celeb-synthesis/"
    echo "  └── YouTube-real/"
    ;;

  ff++)
    echo "Downloading FaceForensics++..."
    echo "  Request academic access: https://github.com/ondyari/FaceForensics"
    echo "  After approval, use provided download.py script:"
    echo ""
    echo "  python download.py data/raw/ff++ -d all -c c23 -t videos"
    echo ""
    echo "  Expected structure:"
    echo "  data/raw/ff++/"
    echo "  ├── original_sequences/youtube/"
    echo "  └── manipulated_sequences/"
    echo "      ├── Deepfakes/"
    echo "      ├── Face2Face/"
    echo "      ├── FaceSwap/"
    echo "      └── NeuralTextures/"
    ;;

  dfdc)
    echo "Downloading DFDC (Kaggle)..."
    if ! command -v kaggle &>/dev/null; then
      echo "  Error: kaggle CLI not found. Install: pip install kaggle"
      echo "  Then set your API key: https://www.kaggle.com/docs/api"
      exit 1
    fi
    mkdir -p "$RAW_DIR/dfdc"
    kaggle competitions download -c deepfake-detection-challenge -p "$RAW_DIR/dfdc"
    cd "$RAW_DIR/dfdc" && unzip "*.zip" && rm "*.zip"
    echo "DFDC downloaded to $RAW_DIR/dfdc"
    ;;

  *)
    echo "Unknown dataset: $DATASET"
    echo "Available: celeb-df | ff++ | dfdc"
    exit 1
    ;;
esac

echo "=== Done ==="
