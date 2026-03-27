"""
API Schemas
--------------------------------
@python-engineer

Pydantic v2 models for request/response validation.
"""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="'real' or 'fake'", examples=["fake"])
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in prediction", examples=[0.93])
    fake_probability: float = Field(..., ge=0.0, le=1.0, description="Raw probability of being fake")
    frame_scores: List[float] = Field(default_factory=list, description="Per-frame fake probabilities")
    frames_analyzed: int = Field(..., description="Number of frames processed")
    processing_time_ms: float = Field(..., description="Total inference time in milliseconds")
    
    # NEW: XAI Explainability Fields
    explanations: Optional[List[str]] = Field(
        default=None,
        description="Natural language explanations for the prediction"
    )
    confidence_breakdown: Optional[Dict] = Field(
        default=None,
        description="Breakdown of confidence into contributing factors"
    )
    suspicious_frames: Optional[List[int]] = Field(
        default=None,
        description="Indices of frames with high fake probability"
    )
    temporal_inconsistency_detected: Optional[bool] = Field(
        default=None,
        description="Whether temporal inconsistencies were detected across frames"
    )
    frame_analysis: Optional[Dict] = Field(
        default=None,
        description="Detailed per-frame analysis statistics"
    )
    warnings: Optional[List[str]] = Field(
        default=None,
        description="Warning messages for edge cases"
    )
    faces_detected: Optional[bool] = Field(
        default=True,
        description="Whether faces were detected in the video"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "prediction": "fake",
                "confidence": 0.93,
                "fake_probability": 0.93,
                "frame_scores": [0.91, 0.94, 0.96, 0.89, 0.92],
                "frames_analyzed": 5,
                "processing_time_ms": 1243.5,
                "explanations": [
                    "Unnatural eye blinking pattern detected",
                    "Facial boundary inconsistencies found",
                    "Temporal inconsistency across frames"
                ],
                "confidence_breakdown": {
                    "frame_consistency_score": 0.85,
                    "average_confidence": 0.93,
                    "temporal_coherence_score": 0.78,
                    "artifact_detection_score": 0.91
                },
                "suspicious_frames": [2, 4],
                "temporal_inconsistency_detected": True,
                "warnings": ["Low confidence result - consider manual review"]
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
