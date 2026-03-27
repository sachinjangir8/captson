"""
FastAPI Deepfake Detection API
------------------------------
@mlops-engineer | @python-engineer

Endpoints:
  POST /detect-deepfake  — Upload video/image, get real/fake prediction
  GET  /health           — Service health check
  GET  /model-info       — Current model metadata
"""

import os
import time
import tempfile
import shutil
from pathlib import Path
from typing import Optional

import yaml
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger

from .schemas import PredictionResponse, HealthResponse, ModelInfoResponse
from ..inference.predictor import DeepfakePredictor


# ── App setup ─────────────────────────────────────────────────────────

app = FastAPI(
    title="DeepFake Detection API",
    description="End-to-end deepfake detection for videos and images.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files Setup (Video Serving) ────────────────────────────────

# Create uploads directory if it doesn't exist
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# Mount static files for serving uploaded videos
try:
    app.mount("/videos", StaticFiles(directory=str(UPLOADS_DIR)), name="videos")
    logger.info(f"Static files mounted at /videos from {UPLOADS_DIR}")
except Exception as e:
    logger.error(f"Failed to mount static files: {e}")

# ── Globals ───────────────────────────────────────────────────────────

predictor: Optional[DeepfakePredictor] = None
config: dict = {}
startup_time = time.time()

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_MB = 500


# ── Lifecycle ─────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    global predictor, config

    config_path = os.getenv("CONFIG_PATH", "configs/config.yaml")
    if Path(config_path).exists():
        with open(config_path) as f:
            config = yaml.safe_load(f)
    else:
        config = {}

    model_path = config.get("inference", {}).get("model_path", "checkpoints/best_model.pth")
    model_type = config.get("training", {}).get("model", "efficientnet")

    if Path(model_path).exists():
        try:
            predictor = DeepfakePredictor(
                model=model_path,
                model_type=model_type,
                aggregation=config.get("inference", {}).get("aggregation", "mean"),
                fake_threshold=config.get("evaluation", {}).get("threshold", 0.5),
            )
            logger.info("Model loaded successfully at startup")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            predictor = None
    else:
        logger.warning(f"No checkpoint at {model_path} — /detect-deepfake will be unavailable")


def get_predictor() -> DeepfakePredictor:
    if predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Train a model first and place checkpoint at checkpoints/best_model.pth",
        )
    return predictor


# ── Routes ────────────────────────────────────────────────────────────

@app.post(
    "/upload",
    tags=["Upload"],
    summary="Upload video file",
    description="Upload a video file for storage and later analysis",
)
async def upload_video(file: UploadFile = File(...)):
    """
    Upload a video file to the server.
    
    - **file**: Video file (MP4, AVI, MOV, MKV, WebM)
    - Returns: URL to access the uploaded video
    """
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )
    
    # Read and check file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max: {MAX_FILE_SIZE_MB} MB",
        )
    
    # Generate unique filename to avoid conflicts
    import uuid
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_location = UPLOADS_DIR / unique_filename
    
    # Save file
    try:
        with open(file_location, "wb") as buffer:
            buffer.write(content)
        
        logger.info(f"Video uploaded: {unique_filename} ({size_mb:.1f} MB)")
        
        # Return accessible URL
        video_url = f"http://localhost:8000/videos/{unique_filename}"
        
        return {
            "filename": file.filename,
            "saved_filename": unique_filename,
            "video_url": video_url,
            "size_mb": round(size_mb, 2),
            "format": ext,
        }
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.post(
    "/detect-deepfake",
    response_model=PredictionResponse,
    summary="Detect deepfake in uploaded media",
    tags=["Detection"],
)
async def detect_deepfake(
    file: UploadFile = File(..., description="Video (.mp4, .avi, .mov) or image (.jpg, .png)"),
    pred: DeepfakePredictor = Depends(get_predictor),
):
    """
    Upload a video or image and receive a deepfake probability score.

    - **prediction**: `"fake"` or `"real"`
    - **confidence**: How confident the model is in its prediction (0–1)
    - **fake_probability**: Raw probability the media is AI-generated
    - **frame_scores**: Per-frame probabilities (videos only)
    """
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    # Read and check file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max: {MAX_FILE_SIZE_MB} MB",
        )

    # Write to temp file and run inference
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content)
        tmp_path = tmp.name

    try:
        result = pred.predict(tmp_path)
        logger.info(
            f"Prediction: {result['prediction']} "
            f"(conf={result['confidence']:.2f}) | "
            f"file={file.filename} | "
            f"size={size_mb:.1f}MB"
        )
        return PredictionResponse(**result)
    except Exception as e:
        logger.error(f"Inference error for {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    tags=["System"],
)
async def health():
    return HealthResponse(
        status="ok" if predictor is not None else "degraded",
        model_loaded=predictor is not None,
        uptime_seconds=round(time.time() - startup_time, 1),
    )


@app.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Model metadata",
    tags=["System"],
)
async def model_info():
    return ModelInfoResponse(
        model_type=config.get("training", {}).get("model", "unknown"),
        version="1.0.0",
        input_size=224,
        threshold=config.get("evaluation", {}).get("threshold", 0.5),
        supported_formats=sorted(ALLOWED_EXTENSIONS),
    )


@app.get("/", include_in_schema=False)
async def root():
    return {"message": "DeepFake Detection API", "docs": "/docs"}
