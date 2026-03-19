"""
API Schemas
-----------
@python-engineer

Pydantic v2 models for request/response validation.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="'real' or 'fake'", examples=["fake"])
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in prediction", examples=[0.93])
    fake_probability: float = Field(..., ge=0.0, le=1.0, description="Raw probability of being fake")
    frame_scores: List[float] = Field(default_factory=list, description="Per-frame fake probabilities")
    frames_analyzed: int = Field(..., description="Number of frames processed")
    processing_time_ms: float = Field(..., description="Total inference time in milliseconds")

    model_config = {
        "json_schema_extra": {
            "example": {
                "prediction": "fake",
                "confidence": 0.93,
                "fake_probability": 0.93,
                "frame_scores": [0.91, 0.94, 0.96, 0.89, 0.92],
                "frames_analyzed": 5,
                "processing_time_ms": 1243.5,
            }
        }
    }


class HealthResponse(BaseModel):
    status: str = Field(..., description="'ok' or 'degraded'")
    model_loaded: bool
    uptime_seconds: float


class ModelInfoResponse(BaseModel):
    model_type: str
    version: str
    input_size: int
    threshold: float
    supported_formats: List[str]
