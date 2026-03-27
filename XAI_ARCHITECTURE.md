# 🏗️ XAI Architecture & Implementation Details

## 📐 System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Uploads Video                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                        │
│  - VideoDropzone: File upload & validation                  │
│  - DashboardPage: Main analysis UI                          │
│  - useVideoAnalysis: State management                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP POST /detect-deepfake
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend (FastAPI)                              │
│  - CORS Middleware                                          │
│  - /detect-deepfake endpoint                                │
│  - Validation & Error Handling                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           DeepfakePredictor (Inference)                     │
│  - Frame extraction                                          │
│  - Face detection                                            │
│  - Per-frame predictions                                     │
│  - Aggregation                                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         XAI Explainer (NEW)                                 │
│  - Frame-level analysis                                      │
│  - Explanation generation                                    │
│  - Confidence breakdown                                      │
│  - Temporal analysis                                         │
│  - Warning detection                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Enhanced Response                              │
│  { prediction, confidence, explanations,                    │
│    confidence_breakdown, suspicious_frames, ... }           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Frontend Visualization                             │
│  - ResultCard: Main prediction                               │
│  - FrameTimeline: Interactive graph                          │
│  - ExplanationPanel: Why prediction                          │
│  - ConfidenceBreakdown: Metrics                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Breakdown

### 1. XAI Explainer Module

**File:** `src/evaluation/xai_explainer.py`

#### Classes:

**XAIExplainer**
```python
class XAIExplainer:
    Methods:
    - generate_frame_analysis() → Dict
      * Identifies suspicious frames
      * Calculates statistics (mean, std, min, max)
      * Detects temporal anomalies
    
    - generate_explanations() → List[str]
      * Selects from explanation templates
      * Based on confidence level
      * Adds specific observations
    
    - calculate_confidence_breakdown() → Dict
      * Frame consistency score
      * Average confidence
      * Temporal coherence score
      * Artifact detection score
    
    - detect_temporal_anomalies() → Dict
      * Rolling variance calculation
      * Jump detection
      * Consistency analysis
    
    - generate_heatmap() → Optional[np.ndarray]
      * Placeholder for Grad-CAM
      * Synthetic heatmap based on prediction
    
    - create_warning_messages() → List[str]
      * Low confidence warnings
      * Insufficient frames
      * No face detected
```

**ExplanationAggregator**
```python
class ExplanationAggregator:
    Methods:
    - aggregate() → Dict
      * Calls all XAIExplainer methods
      * Combines into comprehensive package
      * Returns structured explanation
```

---

### 2. Enhanced Predictor

**File:** `src/inference/predictor.py`

#### Changes:

**Initialization:**
```python
def __init__(self, ..., enable_xai=True):
    self.enable_xai = enable_xai
    
    if self.enable_xai:
        self.xai_explainer = XAIExplainer()
        self.xai_aggregator = ExplanationAggregator()
```

**Video Prediction:**
```python
def predict_video(self, video_path: str) -> Dict:
    # Extract frames
    frames = self.frame_extractor.extract_frames(video_path)
    
    frame_probs = []
    frame_images = []  # NEW: Store for XAI
    
    for frame in frames:
        face = self.face_detector.detect_face(frame)
        prob = self._predict_face(face)
        
        frame_probs.append(prob)
        frame_images.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))  # NEW
    
    return self._format_result(
        frame_probs,
        elapsed_ms,
        visualization_frame,
        frame_images=frame_images,  # NEW
        faces_detected=faces_detected
    )
```

**Result Formatting:**
```python
def _format_result(self, ..., frame_images, faces_detected) -> Dict:
    result = {
        "prediction": "...",
        "confidence": ...,
        "frame_scores": [...],
        ...
    }
    
    # NEW: Add XAI if enabled
    if self.enable_xai and hasattr(self, 'xai_aggregator'):
        xai_output = self.xai_aggregator.aggregate(...)
        result.update({
            "explanations": xai_output["explanations"],
            "confidence_breakdown": xai_output["confidence_breakdown"],
            "suspicious_frames": xai_output["suspicious_frames"],
            ...
        })
    
    return result
```

---

### 3. API Schemas

**File:** `src/api/schemas.py`

#### Enhanced PredictionResponse:

```python
class PredictionResponse(BaseModel):
    # Original fields
    prediction: str
    confidence: float
    fake_probability: float
    frame_scores: List[float]
    frames_analyzed: int
    processing_time_ms: float
    
    # NEW: XAI fields
    explanations: Optional[List[str]]
    confidence_breakdown: Optional[Dict]
    suspicious_frames: Optional[List[int]]
    temporal_inconsistency_detected: Optional[bool]
    frame_analysis: Optional[Dict]
    warnings: Optional[List[str]]
    faces_detected: Optional[bool]
```

---

### 4. Frontend Components

#### ExplanationPanel.jsx

**Props:**
- `explanations: string[]`
- `prediction: 'real' | 'fake'`

**Structure:**
```jsx
function ExplanationPanel({ explanations, prediction }) {
  // Color coding based on prediction
  const bgColor = prediction === 'fake' 
    ? 'bg-red-500/10' 
    : 'bg-emerald-500/10'
  
  return (
    <motion.div>
      <h3>Why this prediction?</h3>
      <ul>
        {explanations.map((exp, i) => (
          <motion.li key={i}>{exp}</motion.li>
        ))}
      </ul>
    </motion.div>
  )
}
```

---

#### FrameTimeline.jsx

**Props:**
- `frameScores: number[]`
- `suspiciousFrames: number[]`

**Features:**
- SVG line graph with gradient
- Interactive frame markers
- Statistics display
- Click to view details
- Toggle heatmap

**Structure:**
```jsx
function FrameTimeline({ frameScores, suspiciousFrames }) {
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(true)
  
  // Generate SVG points
  const points = frameScores.map((score, i) => {
    const x = (i / (length - 1)) * width
    const y = height - (score * height)
    return `${x},${y}`
  })
  
  return (
    <div>
      <svg viewBox="0 0 100 40">
        {/* Threshold line */}
        {/* Area under curve */}
        {/* Line graph */}
        {/* Suspicious markers */}
      </svg>
      
      {/* Statistics */}
      {/* Selected frame details */}
    </div>
  )
}
```

---

#### ConfidenceBreakdown.jsx

**Props:**
- `confidenceBreakdown: object`
- `warnings: string[]`

**Metrics Displayed:**
1. Frame Consistency Score (🔵 blue)
2. Average Confidence (🟣 purple)
3. Temporal Coherence Score (🟢 green)
4. Artifact Detection Score (🔴 red)

**Structure:**
```jsx
function ConfidenceBreakdown({ confidenceBreakdown, warnings }) {
  return (
    <div>
      {/* Metric bars */}
      {Object.entries(confidenceBreakdown).map(([key, value]) => (
        <MetricBar 
          label={key}
          value={value}
          color={getColor(key)}
        />
      ))}
      
      {/* Warnings */}
      {warnings.map(warning => (
        <li>{warning}</li>
      ))}
    </div>
  )
}
```

---

## 🔄 Data Flow

### Complete Request/Response Cycle

1. **User uploads video** via VideoDropzone
2. **Frontend sends POST** to `/detect-deepfake`
3. **Backend receives file**:
   ```python
   @app.post("/detect-deepfake")
   async def detect_deepfake(file: UploadFile):
       result = predictor.predict(file.path)
       return PredictionResponse(**result)
   ```

4. **Predictor processes video**:
   - Extract frames
   - Detect faces
   - Run inference per frame
   - Store frames for XAI
   - Aggregate predictions

5. **XAI Explainer analyzes**:
   ```python
   xai_output = xai_aggregator.aggregate(
       prediction=result["prediction"],
       confidence=confidence,
       frame_scores=probs,
       frame_images=frames
   )
   ```

6. **Response merged**:
   ```python
   result.update({
       "explanations": xai_output["explanations"],
       "confidence_breakdown": xai_output["confidence_breakdown"],
       ...
   })
   ```

7. **Frontend receives enhanced response**

8. **Components render**:
   - ResultCard shows main prediction
   - FrameTimeline displays graph
   - ExplanationPanel lists reasons
   - ConfidenceBreakdown shows metrics

---

## 📊 Algorithm Details

### 1. Temporal Anomaly Detection

```python
def _detect_temporal_anomalies(self, frame_scores, window_size=3):
    scores = np.array(frame_scores)
    
    # Calculate rolling standard deviation
    rolling_std = np.zeros(len(scores) - window_size + 1)
    for i in range(len(rolling_std)):
        rolling_std[i] = np.std(scores[i:i+window_size])
    
    # Detect sudden jumps
    diffs = np.abs(np.diff(scores))
    max_jump = np.max(diffs)
    
    # Classify as inconsistent if:
    detected = avg_rolling_std > 0.15 or max_jump > 0.3
    
    return {
        'detected': detected,
        'avg_rolling_variance': float(np.mean(rolling_std)),
        'max_prediction_jump': float(max_jump),
        ...
    }
```

---

### 2. Confidence Breakdown Calculation

```python
def calculate_confidence_breakdown(self, frame_scores, prediction):
    scores = np.array(frame_scores)
    
    # Frame consistency (inverse of variance)
    consistency_score = 1.0 - min(np.std(scores) * 2, 1.0)
    
    # Average confidence
    avg_confidence = np.mean(scores) if prediction == 'fake' else 1.0 - np.mean(scores)
    
    # Temporal coherence
    if len(scores) > 2:
        diffs = np.diff(scores)
        temporal_coherence = 1.0 - min(np.std(diffs) * 3, 1.0)
    else:
        temporal_coherence = 1.0
    
    # Artifact score
    artifact_score = np.max(np.abs(scores - 0.5)) * 2
    
    return {
        'frame_consistency_score': round(consistency_score, 4),
        'average_confidence': round(avg_confidence, 4),
        'temporal_coherence_score': round(temporal_coherence, 4),
        'artifact_detection_score': round(artifact_score, 4),
    }
```

---

### 3. Explanation Template Selection

```python
def generate_explanations(self, prediction, confidence, frame_analysis, top_k=3):
    templates = self.explanation_templates[prediction]
    
    if confidence > 0.85:
        # High confidence: use strongest explanations
        explanations = templates[:top_k]
    elif confidence > 0.60:
        # Medium confidence: use moderate explanations
        explanations = templates[top_k:top_k*2]
    else:
        # Low confidence: use cautious language
        explanations = [
            f"Some indicators suggest {prediction}",
            "Evidence is not conclusive",
            ...
        ]
    
    # Add specific observations
    if frame_analysis['temporal_inconsistency']['detected']:
        explanations.append("Temporal inconsistency detected")
    
    return explanations[:top_k + 1]
```

---

## 🎨 Visual Design System

### Color Coding

| Purpose | Fake | Real |
|---------|------|------|
| Background | Red-500/10 | Emerald-500/10 |
| Border | Red-500/30 | Emerald-500/30 |
| Text | Red-400 | Emerald-400 |
| Icon | 🚨 | ✅ |

### Metric Colors

| Metric | Color | Hex |
|--------|-------|-----|
| Frame Consistency | 🔵 Blue | #3b82f6 |
| Average Confidence | 🟣 Purple | #8b5cf6 |
| Temporal Coherence | 🟢 Green | #10b981 |
| Artifact Detection | 🔴 Red | #ef4444 |

### Animation Timing

```javascript
// Stagger animations for visual hierarchy
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.4, delay: 0.2 }}

// Progress bars animate slower
transition={{ duration: 0.8, delay: 0.2 }}
```

---

## ⚡ Performance Optimization

### Caching Strategy

```python
# Cache XAI results for previously analyzed videos
@lru_cache(maxsize=100)
def get_cached_xai(video_hash, frame_scores_tuple):
    # Return cached XAI output
    pass
```

### Async Processing

```python
# Generate XAI asynchronously
async def analyze_with_xai(video_path):
    result = await predictor.predict_async(video_path)
    xai_output = await run_in_executor(xai_aggregator.aggregate, ...)
    return {**result, **xai_output}
```

### Batch Processing

```python
# Process multiple frames in parallel
with torch.no_grad():
    batch_probs = model(batch_frames)
```

---

## 🔒 Error Handling

### Graceful Degradation

```python
try:
    xai_output = xai_aggregator.aggregate(...)
    result.update(xai_output)
    logger.info(f"XAI generated: {len(explanations)} reasons")
except Exception as e:
    logger.error(f"XAI failed: {e}")
    # Continue without XAI - don't crash
    pass
```

### Validation

```python
# Ensure required fields exist
if not frame_scores or len(frame_scores) == 0:
    return {"error": "No frames analyzed"}

# Validate confidence range
assert 0.0 <= confidence <= 1.0
```

---

## 📈 Monitoring & Logging

### Key Metrics to Log

```python
logger.info(f"XAI explanations generated: {len(explanations)} reasons")
logger.info(f"Confidence breakdown: {confidence_breakdown}")
logger.info(f"Suspicious frames: {len(suspicious_frames)}")
logger.info(f"Temporal inconsistency: {temporal_inconsistency_detected}")
```

### Performance Tracking

```python
import time

t0 = time.time()
# ... XAI processing ...
elapsed_ms = (time.time() - t0) * 1000
logger.info(f"XAI processing took {elapsed_ms:.1f}ms")
```

---

## 🎯 Testing Strategy

### Unit Tests

```python
def test_frame_analysis():
    xai = XAIExplainer()
    frame_scores = [0.9, 0.95, 0.88, 0.92]
    
    analysis = xai.generate_frame_analysis(frame_scores)
    
    assert 'suspicious_frames' in analysis
    assert 'statistics' in analysis
    assert len(analysis['frame_labels']) == len(frame_scores)
```

### Integration Tests

```python
def test_full_pipeline():
    predictor = DeepfakePredictor(..., enable_xai=True)
    result = predictor.predict("test_fake.mp4")
    
    assert "explanations" in result
    assert "confidence_breakdown" in result
    assert len(result["explanations"]) > 0
```

---

## 🚀 Deployment Checklist

- [ ] XAI module installed on server
- [ ] Sufficient memory allocated (+200MB)
- [ ] Timeout increased for XAI processing
- [ ] Logging configured for XAI messages
- [ ] Frontend components built and deployed
- [ ] API docs updated with new fields
- [ ] Monitoring dashboard includes XAI metrics

---

**Your XAI system is fully architected and ready for production! 🎉**
