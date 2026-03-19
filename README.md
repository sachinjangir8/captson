# DeepFake Detection System

A **production-ready, full-stack deepfake detection system** built using **React, FastAPI, PyTorch, and OpenCV**.
Detects whether a video or image is **real or AI-generated** with confidence scores and frame-level analysis.

---

## 🚀 Tech Stack

* **Frontend:** React.js (Vite + Tailwind)
* **Backend:** FastAPI
* **ML/DL:** PyTorch, EfficientNet-B4, LSTM
* **Computer Vision:** OpenCV, MTCNN
* **Authentication:** Firebase Auth
* **Deployment Ready:** Docker

---

## 🧠 Architecture Overview

```
User Upload (React UI)
        ↓
FastAPI Backend (REST API)
        ↓
Frame Extraction (OpenCV)
        ↓
Face Detection (MTCNN)
        ↓
Feature Extraction (EfficientNet-B4)
        ↓
Temporal Modeling (LSTM)
        ↓
Prediction → Real / Fake + Confidence Score
        ↓
Response sent back to React UI
```

---

## 📁 Project Structure

```
deepfake-detection/
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── pages/              # Login, Signup, Dashboard
│   │   ├── components/         # UI components
│   │   ├── services/           # API calls
│   │   ├── context/            # Auth context (Firebase)
│   │   └── App.jsx
│   └── package.json
│
├── src/                         # Backend + ML
│   ├── api/                     # FastAPI routes
│   ├── preprocessing/           # Frame + face extraction
│   ├── models/                  # CNN / LSTM models
│   ├── training/                # Training pipeline
│   ├── inference/               # Prediction pipeline
│   └── evaluation/              # Metrics
│
├── configs/
├── scripts/
├── tests/
├── checkpoints/                 # Model weights (ignored in git)
├── data/                        # Dataset (ignored in git)
├── logs/
├── requirements.txt
├── Dockerfile
└── README.md
```

---

## ⚡ Features

* 🔍 Deepfake detection (image & video)
* 🎯 Frame-level confidence scoring
* ⚡ Fast API inference (<2s)
* 🌐 Modern React UI
* 🔐 User Authentication (Firebase)
* 📊 Scalable ML pipeline

---

## 🛠️ Setup Instructions

### 1. Clone Repo

```bash
git clone https://github.com/yourname/deepfake-detection.git
cd deepfake-detection
```

---

### 2. Backend Setup

```bash
python -m venv venv
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn src.api.main:app --reload
```

---

### 3. Frontend Setup (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
👉 http://localhost:5173

---

### 4. API Endpoint

```
POST /detect-deepfake
```

**Request:**

* `multipart/form-data` → video/image file

**Response:**

```json
{
  "prediction": "fake",
  "confidence": 0.93,
  "frame_scores": [0.91, 0.94, 0.96],
  "processing_time_ms": 1243
}
```

---

## 🤖 Models

| Model      | Backbone        | Temporal | AUC   |
| ---------- | --------------- | -------- | ----- |
| CNN        | EfficientNet-B4 | ❌        | ~0.93 |
| CNN + LSTM | EfficientNet-B4 | ✅        | ~0.96 |

---

## 📊 Datasets Used

* FaceForensics++
* Celeb-DF
* DFDC (Kaggle)

---

## 🔐 Authentication

* Firebase Email/Password Login
* Protected routes in React
* Secure API interaction

---

## 🐳 Docker Support

```bash
docker build -t deepfake-detector .
docker run -p 8000:8000 deepfake-detector
```

---

## 📌 Future Improvements

* 🎥 Real-time webcam detection
* ☁️ Cloud deployment (AWS/GCP)
* 📱 Mobile app integration
* ⚡ Model optimization (ONNX / TensorRT)

---

## 📜 License

MIT License
