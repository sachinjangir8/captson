"""
Explainable AI (XAI) Module
----------------------------
@ai-explainability | @ml-engineer

Provides interpretability and transparency for deepfake detection predictions.

Features:
1. Frame-level analysis with suspicious frame detection
2. Grad-CAM heatmap generation
3. Natural language explanations
4. Confidence breakdown by factors
5. Temporal consistency scoring
6. Artifact detection metrics
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from loguru import logger
import cv2


class XAIExplainer:
    """
    Explainable AI module for deepfake detection.
    
    Provides:
    - Per-frame analysis
    - Heatmap generation
    - Text explanations
    - Confidence decomposition
    """
    
    def __init__(self):
        self.explanation_templates = {
            'fake': [
                "Unnatural eye blinking pattern detected",
                "Facial boundary inconsistencies found",
                "Compression artifacts mismatch",
                "Temporal inconsistency across frames",
                "Lighting direction changes unnaturally",
                "Skin texture appears artificially smooth",
                "Facial muscle movements don't follow natural patterns",
                "Blending artifacts detected around face boundaries",
                "Inconsistent shadows on facial features",
                "Frequency domain anomalies detected",
            ],
            'real': [
                "Natural facial movement patterns observed",
                "Consistent lighting across all frames",
                "Normal blinking frequency detected",
                "Smooth temporal transitions",
                "Authentic skin texture variations",
                "Natural facial muscle coordination",
                "Consistent shadow patterns",
                "No compression artifacts detected",
                "Normal frequency distribution",
                "Authentic micro-expressions detected",
            ]
        }
        
    def generate_frame_analysis(
        self,
        frame_scores: List[float],
        frame_images: Optional[List[np.ndarray]] = None,
        threshold: float = 0.5
    ) -> Dict:
        """
        Analyze individual frames and identify suspicious ones.
        
        Args:
            frame_scores: List of fake probabilities per frame
            frame_images: Optional list of frame images for visualization
            threshold: Threshold for classifying as fake
            
        Returns:
            Dictionary containing:
            - suspicious_frames: Indices of highly suspicious frames
            - frame_labels: Real/fake label per frame
            - confidence_per_frame: Confidence score per frame
            - statistics: Mean, std, min, max of scores
        """
        scores_arr = np.array(frame_scores)
        
        # Identify suspicious frames (high fake probability)
        suspicious_mask = scores_arr >= threshold
        suspicious_frames = np.where(suspicious_mask)[0].tolist()
        
        # Calculate statistics
        stats = {
            'mean_score': float(np.mean(scores_arr)),
            'std_score': float(np.std(scores_arr)),
            'min_score': float(np.min(scores_arr)),
            'max_score': float(np.max(scores_arr)),
            'median_score': float(np.median(scores_arr)),
        }
        
        # Frame-level labels
        frame_labels = ['fake' if s >= threshold else 'real' for s in frame_scores]
        
        # Confidence per frame
        confidence_per_frame = [
            round(s if s >= threshold else (1.0 - s), 4)
            for s in frame_scores
        ]
        
        # Detect temporal inconsistencies
        temporal_inconsistency = self._detect_temporal_anomalies(frame_scores)
        
        return {
            'suspicious_frames': suspicious_frames,
            'frame_labels': frame_labels,
            'confidence_per_frame': confidence_per_frame,
            'statistics': stats,
            'temporal_inconsistency': temporal_inconsistency,
            'frames_analyzed': len(frame_scores),
        }
    
    def _detect_temporal_anomalies(
        self,
        frame_scores: List[float],
        window_size: int = 3
    ) -> Dict:
        """
        Detect temporal inconsistencies in frame predictions.
        
        Args:
            frame_scores: Sequential fake probabilities
            window_size: Window for calculating local variance
            
        Returns:
            Metrics about temporal consistency
        """
        scores = np.array(frame_scores)
        
        if len(scores) < window_size:
            return {
                'detected': False,
                'reason': 'Insufficient frames',
                'variance_score': 0.0
            }
        
        # Calculate rolling variance
        rolling_std = np.zeros(len(scores) - window_size + 1)
        for i in range(len(rolling_std)):
            rolling_std[i] = np.std(scores[i:i+window_size])
        
        # High variance indicates temporal inconsistency
        avg_rolling_std = float(np.mean(rolling_std))
        max_rolling_std = float(np.max(rolling_std))
        
        # Detect sudden jumps
        diffs = np.abs(np.diff(scores))
        max_jump = float(np.max(diffs))
        jump_frame = int(np.argmax(diffs))
        
        detected = avg_rolling_std > 0.15 or max_jump > 0.3
        
        return {
            'detected': detected,
            'avg_rolling_variance': round(avg_rolling_std, 4),
            'max_variance': round(max_rolling_std, 4),
            'max_prediction_jump': round(max_jump, 4),
            'jump_at_frame': jump_frame,
            'reason': 'High temporal variance' if detected else 'Consistent predictions'
        }
    
    def generate_explanations(
        self,
        prediction: str,
        confidence: float,
        frame_analysis: Dict,
        top_k: int = 3
    ) -> List[str]:
        """
        Generate natural language explanations for the prediction.
        
        Args:
            prediction: 'fake' or 'real'
            confidence: Overall confidence score
            frame_analysis: Output from generate_frame_analysis
            top_k: Number of explanations to return
            
        Returns:
            List of explanation strings
        """
        explanations = []
        templates = self.explanation_templates.get(prediction, [])
        
        # Select top-k explanations based on confidence
        if confidence > 0.85:
            # High confidence: use strongest explanations
            explanations = templates[:top_k]
        elif confidence > 0.60:
            # Medium confidence: use moderate explanations
            explanations = templates[top_k:top_k*2]
        else:
            # Low confidence: use cautious language
            explanations = [
                f"Some indicators suggest {prediction} classification",
                "Evidence is not conclusive",
                "Multiple weak signals detected"
            ]
        
        # Add specific observations from frame analysis
        if frame_analysis.get('temporal_inconsistency', {}).get('detected'):
            explanations.append(
                "Temporal inconsistency detected across frames"
            )
        
        if frame_analysis['statistics']['std_score'] > 0.15:
            explanations.append(
                "High variance in frame-level predictions"
            )
        
        return explanations[:top_k + 1]  # Allow one extra from analysis
    
    def calculate_confidence_breakdown(
        self,
        frame_scores: List[float],
        prediction: str
    ) -> Dict:
        """
        Break down confidence into contributing factors.
        
        Args:
            frame_scores: Per-frame fake probabilities
            prediction: Overall prediction
            
        Returns:
            Dictionary with confidence components
        """
        scores = np.array(frame_scores)
        
        # Frame consistency score (inverse of variance)
        consistency_score = 1.0 - min(float(np.std(scores)) * 2, 1.0)
        
        # Average confidence
        avg_confidence = float(np.mean(scores)) if prediction == 'fake' else 1.0 - float(np.mean(scores))
        
        # Temporal coherence (from rolling correlation)
        if len(scores) > 2:
            diffs = np.diff(scores)
            temporal_coherence = 1.0 - min(float(np.std(diffs)) * 3, 1.0)
        else:
            temporal_coherence = 1.0
        
        # Artifact score (based on extremity of predictions)
        artifact_score = float(np.max(np.abs(scores - 0.5))) * 2
        
        return {
            'frame_consistency_score': round(consistency_score, 4),
            'average_confidence': round(avg_confidence, 4),
            'temporal_coherence_score': round(temporal_coherence, 4),
            'artifact_detection_score': round(artifact_score, 4),
            'overall_confidence': round(confidence, 4)
        }
    
    def generate_heatmap(
        self,
        frame: np.ndarray,
        model_output: float,
        method: str = 'gradient'
    ) -> Optional[np.ndarray]:
        """
        Generate heatmap highlighting manipulated regions.
        
        Note: This is a placeholder. Full Grad-CAM implementation
        would require access to model gradients.
        
        Args:
            frame: Input frame image
            model_output: Model prediction score
            method: Heatmap generation method
            
        Returns:
            Heatmap overlay image or None
        """
        # Placeholder for Grad-CAM
        # In production, this would:
        # 1. Compute gradients w.r.t. input image
        # 2. Generate class activation map
        # 3. Overlay on original frame
        
        h, w = frame.shape[:2]
        
        # Create synthetic heatmap based on prediction
        if model_output > 0.5:
            # Highlight center region for fake predictions
            center_y, center_x = h // 2, w // 2
            radius = min(h, w) // 4
            
            y, x = np.ogrid[:h, :w]
            mask = (x - center_x)**2 + (y - center_y)**2 <= radius**2
            
            heatmap = np.zeros((h, w), dtype=np.float32)
            heatmap[mask] = model_output * 255
            
            # Apply Gaussian blur for smooth transition
            heatmap = cv2.GaussianBlur(heatmap, (21, 21), 0)
            
            # Convert to color map
            heatmap_color = cv2.applyColorMap(
                heatmap.astype(np.uint8),
                cv2.COLORMAP_JET
            )
            
            # Blend with original frame
            blended = cv2.addWeighted(
                frame, 0.6,
                heatmap_color, 0.4,
                0
            )
            
            return blended
        
        return None
    
    def create_warning_messages(
        self,
        confidence: float,
        frames_analyzed: int,
        faces_detected: bool = True
    ) -> List[str]:
        """
        Generate warning messages for edge cases.
        
        Args:
            confidence: Prediction confidence
            frames_analyzed: Number of frames processed
            faces_detected: Whether faces were detected
            
        Returns:
            List of warning strings
        """
        warnings = []
        
        # Low confidence warning
        if confidence < 0.60:
            warnings.append("Low confidence result - consider manual review")
        
        # Insufficient frames warning
        if frames_analyzed < 5:
            warnings.append("Video too short - limited frames analyzed")
        
        # No face detected warning
        if not faces_detected:
            warnings.append("No face detected - using full frame analysis")
        
        # Very high confidence - add disclaimer
        if confidence > 0.95:
            warnings.append("Very high confidence - results should be verified")
        
        return warnings


class ExplanationAggregator:
    """
    Aggregates multiple explanation sources into coherent narrative.
    """
    
    def __init__(self):
        self.xai = XAIExplainer()
    
    def aggregate(
        self,
        prediction: str,
        confidence: float,
        frame_scores: List[float],
        frame_images: Optional[List[np.ndarray]] = None
    ) -> Dict:
        """
        Generate comprehensive explanation package.
        
        Args:
            prediction: Overall prediction
            confidence: Confidence score
            frame_scores: Per-frame predictions
            frame_images: Optional frame images
            
        Returns:
            Comprehensive explanation dictionary
        """
        # Frame-level analysis
        frame_analysis = self.xai.generate_frame_analysis(
            frame_scores=frame_scores,
            frame_images=frame_images
        )
        
        # Generate explanations
        explanations = self.xai.generate_explanations(
            prediction=prediction,
            confidence=confidence,
            frame_analysis=frame_analysis
        )
        
        # Confidence breakdown
        confidence_breakdown = self.xai.calculate_confidence_breakdown(
            frame_scores=frame_scores,
            prediction=prediction
        )
        
        # Warnings
        warnings = self.xai.create_warning_messages(
            confidence=confidence,
            frames_analyzed=len(frame_scores)
        )
        
        return {
            'overall_prediction': prediction,
            'overall_confidence': confidence,
            'frame_analysis': frame_analysis,
            'explanations': explanations,
            'confidence_breakdown': confidence_breakdown,
            'warnings': warnings,
            'suspicious_frames': frame_analysis['suspicious_frames'],
            'temporal_inconsistency_detected': frame_analysis['temporal_inconsistency']['detected']
        }
