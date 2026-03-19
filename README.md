# DeepFake Detection System

A production-ready, end-to-end deepfake detection pipeline built with PyTorch, OpenCV, and FastAPI. Classifies videos and images as **real** or **AI-generated** with a confidence score.

[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-red)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)](https://fastapi.tiangolo.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Architecture Overview

```
Raw Video / Image
      ↓
Frame Extraction (OpenCV)
      ↓
Face Detection (MTCNN)
      ↓
Face Cropping & Alignment
      ↓
Feature Extraction (EfficientNet-B4 CNN)
      ↓
Temporal Analysis (LSTM / Transformer)
      ↓
Classification Head → Probability Score (Real vs Fake)
```

---

## Project Structure

```
deepfake-detection/
├── configs/
│   ├── config.yaml              # Global config
│   └── model_config.yaml        # Model hyperparameters
├── data/
│   ├── raw/                     # Raw downloaded datasets
│   ├── processed/               # Preprocessed face crops
│   └── splits/                  # train/val/test CSV splits
├── src/
│   ├── preprocessing/
│   │   ├── __init__.py
│   │   ├── frame_extractor.py   # OpenCV frame extraction
│   │   ├── face_detector.py     # MTCNN face detection
│   │   └── dataset_builder.py   # Build dataset splits
│   ├── models/
│   │   ├── __init__.py
│   │   ├── cnn_detector.py      # EfficientNet-B4 classifier
│   │   ├── cnn_lstm.py          # CNN + LSTM temporal model
│   │   └── model_factory.py     # Model registry
│   ├── training/
│   │   ├── __init__.py
│   │   ├── dataset.py           # PyTorch Dataset + DataLoader
│   │   ├── trainer.py           # Training loop
│   │   └── callbacks.py         # Checkpointing, early stopping
│   ├── evaluation/
│   │   ├── __init__.py
│   │   └── metrics.py           # Accuracy, AUC, F1, ROC
│   ├── inference/
│   │   ├── __init__.py
│   │   └── predictor.py         # End-to-end inference
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   └── schemas.py           # Pydantic models
│   └── ui/
│       └── app.py               # Streamlit UI
├── scripts/
│   ├── download_data.sh         # Dataset download helper
│   ├── preprocess.py            # Run full preprocessing
│   └── train.py                 # Launch training
├── tests/
│   ├── test_preprocessing.py
│   ├── test_models.py
│   └── test_api.py
├── notebooks/
│   └── exploration.ipynb
├── checkpoints/                 # Saved model weights
├── logs/                        # TensorBoard logs
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## Quickstart

### 1. Clone & Install

```bash
git clone https://github.com/yourname/deepfake-detection.git
cd deepfake-detection
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Download Datasets

```bash
# FaceForensics++ (requires academic access request)
# https://github.com/ondyari/FaceForensics

# Celeb-DF (public)
bash scripts/download_data.sh celeb-df

# DFDC (Kaggle)
kaggle competitions download -c deepfake-detection-challenge
```

Organize under `data/raw/`:
```
data/raw/
├── FaceForensics/
│   ├── original_sequences/
│   └── manipulated_sequences/
├── Celeb-DF/
│   ├── Celeb-real/
│   └── Celeb-synthesis/
└── DFDC/
    ├── train/
    └── labels.csv
```

### 3. Preprocess

```bash
python scripts/preprocess.py --dataset celeb-df --output data/processed
```

### 4. Train

```bash
python scripts/train.py --config configs/config.yaml --model efficientnet
```

### 5. Run API

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

POST to `http://localhost:8000/detect-deepfake` with a video file.

### 6. Run Streamlit UI

```bash
streamlit run src/ui/app.py
```

---

## Models

| Model | Backbone | Temporal | Params | Val AUC |
|-------|----------|----------|--------|---------|
| CNN Detector | EfficientNet-B4 | None | 19M | ~0.93 |
| CNN-LSTM | EfficientNet-B4 + LSTM | LSTM (2-layer) | 23M | ~0.96 |

---

## Datasets

| Dataset | Videos | Labels | Notes |
|---------|--------|--------|-------|
| FaceForensics++ | ~5,000 | Binary | Multiple manipulation types |
| Celeb-DF | ~5,600 | Binary | High visual quality fakes |
| DFDC | ~128,000 | Binary | Largest, most diverse |

---

## API Reference

### `POST /detect-deepfake`

**Request:** `multipart/form-data` with `file` field (video `.mp4`, `.avi`, `.mov`)

**Response:**
```json
{
  "prediction": "fake",
  "confidence": 0.93,
  "frame_scores": [0.91, 0.94, 0.96, 0.89],
  "processing_time_ms": 1243
}
```

---

## License

MIT License. See [LICENSE](LICENSE).
