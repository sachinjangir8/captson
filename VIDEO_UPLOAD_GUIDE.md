# 🎥 Video Upload & Playback Guide

## 🎯 Overview

The DeepFake Detection app now supports **instant video preview** and **seamless backend integration** for analysis.

---

## ✅ Features Implemented

### Frontend (React)
1. ✅ **Instant Video Preview** - Blob URL generation with `URL.createObjectURL()`
2. ✅ **HTML5 Video Player** - Full controls, responsive design
3. ✅ **Memory Cleanup** - Automatic `URL.revokeObjectURL()` on unmount
4. ✅ **Drag & Drop Upload** - Intuitive file selection
5. ✅ **File Validation** - Type and size checks before upload
6. ✅ **Progress Tracking** - Real-time upload progress

### Backend (FastAPI)
1. ✅ **Video Upload Endpoint** - `/upload` for file storage
2. ✅ **Static File Serving** - `/videos/{filename}` for playback
3. ✅ **Direct Analysis Endpoint** - `/detect-deepfake` accepts files directly
4. ✅ **CORS Enabled** - Cross-origin requests allowed
5. ✅ **Unique Filenames** - UUID-based naming prevents conflicts

---

## 🏗️ Architecture

### Video Flow

```
User selects video file
    ↓
Frontend generates Blob URL (instant preview)
    ↓
Video player displays with controls
    ↓
User clicks "Analyze Video"
    ↓
File sent to backend via FormData
    ↓
Backend processes with ML model
    ↓
Returns prediction + XAI results
```

### Two Usage Patterns

#### Pattern 1: Direct Analysis (Recommended)
```javascript
// Frontend sends file directly to /detect-deepfake
const formData = new FormData()
formData.append('file', videoFile)

const response = await fetch(`${BASE_URL}/detect-deepfake`, {
  method: 'POST',
  body: formData,
})
```

**Pros:**
- Single API call
- No server storage needed
- Faster processing
- Temporary file cleanup

**Cons:**
- File not persisted
- Cannot re-analyze without re-upload

---

#### Pattern 2: Upload Then Analyze
```javascript
// Step 1: Upload to server
const uploadResponse = await fetch(`${BASE_URL}/upload`, {
  method: 'POST',
  body: formData,
})
const { video_url } = uploadResponse.json()

// Step 2: Use video URL for playback
setVideoUrl(video_url)

// Step 3: Analyze (optional, can use stored file)
const analysisResponse = await fetch(`${BASE_URL}/detect-deepfake`, {
  method: 'POST',
  body: formData,
})
```

**Pros:**
- File persisted on server
- Can re-analyze later
- Separate upload and analysis

**Cons:**
- Two API calls
- Server storage required
- Slower overall

---

## ⚛️ Frontend Implementation

### 1. File Selection with Preview

**Hook:** `useVideoAnalysis.js`

```javascript
import { useState, useCallback, useEffect } from 'react'

export function useVideoAnalysis() {
  const [videoFile, setVideoFile] = useState(null)
  const [videoURL, setVideoURL] = useState(null)
  
  // Safety cleanup: revoke URL on unmount
  useEffect(() => {
    return () => {
      if (videoURL) {
        try {
          URL.revokeObjectURL(videoURL)
        } catch (err) {
          console.warn('Error revoking URL:', err)
        }
      }
    }
  }, [videoURL])
  
  const selectFile = useCallback((file) => {
    // Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Unsupported file type')
      return
    }
    
    // Revoke previous URL
    if (videoURL) {
      URL.revokeObjectURL(videoURL)
    }
    
    // Create preview URL for instant playback
    const previewUrl = URL.createObjectURL(file)
    
    setVideoFile(file)
    setVideoURL(previewUrl)
  }, [videoURL])
  
  return { videoFile, videoURL, selectFile, ... }
}
```

**Key Points:**
- ✅ `URL.createObjectURL(file)` creates blob URL
- ✅ `URL.revokeObjectURL()` cleans up memory
- ✅ Proper lifecycle management with useEffect
- ✅ Error handling for revocation failures

---

### 2. Video Player Component

**Component:** `DashboardPage.jsx`

```jsx
<AnimatePresence>
  {videoURL && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <p className="text-gray-400 text-sm mb-2 font-medium">Preview</p>
      <video
        src={videoURL}
        controls
        className="w-full rounded-xl border border-white/10 max-h-48 object-cover"
      />
    </motion.div>
  )}
</AnimatePresence>
```

**Features:**
- ✅ HTML5 `<video>` tag with controls
- ✅ Responsive sizing (`max-h-48`)
- ✅ Smooth animations with Framer Motion
- ✅ Conditional rendering (only shows when videoURL exists)

---

### 3. Drag & Drop Upload

**Component:** `VideoDropzone.jsx`

```jsx
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop: (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  },
  accept: { 'video/*': ['.mp4', '.avi', '.mov', '.webm', '.mkv'] },
  multiple: false,
  onDragEnter: () => setIsDragging(true),
  onDragLeave: () => setIsDragging(false),
})

<div {...getRootProps()} className={isDragActive ? 'drag-active' : ''}>
  <input {...getInputProps()} />
  {isDragActive ? 'Drop your video here!' : 'Drag & drop your video'}
</div>
```

**Features:**
- ✅ Drag and drop support
- ✅ Visual feedback during drag
- ✅ File type validation
- ✅ Single file only

---

## ⚡ Backend Implementation

### 1. Static File Serving

**File:** `src/api/main.py`

```python
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Create uploads directory
UPLOADS_DIR = Path("uploads")
UPLOADS_DIR.mkdir(exist_ok=True)

# Mount static files
app.mount("/videos", StaticFiles(directory=str(UPLOADS_DIR)), name="videos")
```

**Result:**
- Files in `uploads/` directory accessible at `http://localhost:8000/videos/{filename}`
- Automatic MIME type detection
- Efficient file serving

---

### 2. Upload Endpoint

```python
@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported file type")
    
    # Check file size
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Generate unique filename
    import uuid
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_location = UPLOADS_DIR / unique_filename
    
    # Save file
    with open(file_location, "wb") as buffer:
        buffer.write(content)
    
    # Return accessible URL
    video_url = f"http://localhost:8000/videos/{unique_filename}"
    
    return {
        "filename": file.filename,
        "saved_filename": unique_filename,
        "video_url": video_url,
        "size_mb": round(size_mb, 2),
        "format": ext,
    }
```

**Features:**
- ✅ File type validation
- ✅ Size limit enforcement (500 MB)
- ✅ Unique filenames (UUID)
- ✅ Returns accessible URL
- ✅ Comprehensive error handling

---

### 3. Direct Analysis Endpoint

```python
@app.post("/detect-deepfake")
async def detect_deepfake(file: UploadFile = File(...)):
    # Validate file
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported type")
    
    # Process directly (no storage)
    result = predictor.predict(file.file)
    
    return PredictionResponse(**result)
```

**Advantages:**
- ✅ No server storage needed
- ✅ Faster processing
- ✅ Automatic cleanup
- ✅ XAI explanations included

---

## 🔗 Integration Examples

### Example 1: Instant Preview + Direct Analysis

```jsx
import { useVideoAnalysis } from '../hooks/useVideoAnalysis'

function DashboardPage() {
  const { videoFile, videoURL, selectFile, analyze, result } = useVideoAnalysis()
  
  return (
    <div>
      {/* Upload */}
      <VideoDropzone onFileSelect={selectFile} />
      
      {/* Preview */}
      {videoURL && (
        <video src={videoURL} controls />
      )}
      
      {/* Analyze */}
      <button onClick={analyze} disabled={!videoFile}>
        Analyze Video
      </button>
      
      {/* Results */}
      {result && <ResultCard result={result} />}
    </div>
  )
}
```

---

### Example 2: Upload to Server First

```jsx
async function handleUpload(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  // Upload to server
  const response = await fetch('http://localhost:8000/upload', {
    method: 'POST',
    body: formData,
  })
  
  const data = await response.json()
  
  // Use server URL for playback
  setVideoUrl(data.video_url)
  
  // Store for later analysis
  setUploadedFilename(data.saved_filename)
}

// Later, analyze the uploaded file
async function handleAnalysis() {
  const response = await fetch(`http://localhost:8000/analyze/${uploadedFilename}`)
  const result = await response.json()
  setResult(result)
}
```

---

## 🧪 Testing Checklist

### Frontend Tests

- [ ] Select file via drag & drop
- [ ] Select file via click/browse
- [ ] Video preview appears instantly
- [ ] Video plays with controls
- [ ] Pause/play works
- [ ] Seek bar functional
- [ ] Volume control works
- [ ] Remove file (reset) clears preview
- [ ] Memory cleanup on unmount
- [ ] Error messages for invalid files
- [ ] Progress bar during upload

### Backend Tests

```bash
# Test upload endpoint
curl -X POST http://localhost:8000/upload \
  -F "file=@test_video.mp4"

# Expected response:
{
  "filename": "test_video.mp4",
  "saved_filename": "abc123def456.mp4",
  "video_url": "http://localhost:8000/videos/abc123def456.mp4",
  "size_mb": 12.34,
  "format": ".mp4"
}

# Access video in browser
http://localhost:8000/videos/abc123def456.mp4

# Test direct analysis
curl -X POST http://localhost:8000/detect-deepfake \
  -F "file=@test_video.mp4"
```

---

## 🐛 Troubleshooting

### Issue: Video preview doesn't appear

**Causes:**
1. Blob URL not generated
2. Video format not supported
3. File corrupted

**Solutions:**
```javascript
// Check if file is valid
console.log('File:', file)
console.log('Type:', file.type)
console.log('Size:', file.size)

// Verify blob URL created
const url = URL.createObjectURL(file)
console.log('Blob URL:', url)  // Should be like: blob:http://localhost:5173/xxx

// Test in new tab
window.open(url, '_blank')
```

---

### Issue: Video plays but no audio

**Causes:**
1. Browser muted
2. Video codec issue
3. Audio track missing

**Solutions:**
- Check browser volume
- Try different video format (MP4 recommended)
- Verify video has audio track

---

### Issue: Backend returns 415 Unsupported Media Type

**Causes:**
1. Wrong file extension
2. Extension not in ALLOWED_EXTENSIONS

**Solutions:**
```python
# Check allowed extensions in main.py
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".jpg", ".jpeg", ".png"}

# Ensure file has correct extension
```

---

### Issue: CORS errors in browser

**Symptoms:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solutions:**
```python
# Verify CORS middleware in main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (dev only)
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Production:**
```python
allow_origins=["https://your-domain.com"],
```

---

### Issue: Video URL returns 404

**Causes:**
1. File not saved correctly
2. Wrong URL path
3. Static files not mounted

**Solutions:**
```python
# Verify static files mounted
try:
    app.mount("/videos", StaticFiles(directory=str(UPLOADS_DIR)), name="videos")
    logger.info("Static files mounted successfully")
except Exception as e:
    logger.error(f"Failed to mount static files: {e}")

# Check file exists
from pathlib import Path
file_path = UPLOADS_DIR / unique_filename
assert file_path.exists(), f"File not found: {file_path}"
```

---

## 📊 Performance Optimization

### Frontend

#### 1. Lazy Loading Videos
```jsx
// Only load video when needed
{showPreview && videoURL && (
  <video src={videoURL} controls />
)}
```

#### 2. Memory Management
```javascript
// Always revoke blob URLs
useEffect(() => {
  return () => {
    if (videoURL) URL.revokeObjectURL(videoURL)
  }
}, [videoURL])
```

#### 3. Compression Before Upload
```javascript
// Optional: Compress large videos
async function compressVideo(file) {
  // Use ffmpeg.wasm or similar
  const compressed = await compress(file, { quality: 0.7 })
  return compressed
}
```

---

### Backend

#### 1. Streaming Uploads
```python
# Process file in chunks
async def upload_video(file: UploadFile):
    async for chunk in file.file:
        # Process chunk
        pass
```

#### 2. Background Processing
```python
# Use Celery or background tasks
from fastapi.background import BackgroundTasks

@app.post("/detect-deepfake")
async def detect(background_tasks: BackgroundTasks):
    background_tasks.add_task(process_video, file)
    return {"status": "processing"}
```

#### 3. File Cleanup
```python
# Delete temporary files after processing
import tempfile

with tempfile.NamedTemporaryFile(delete=False) as tmp:
    tmp.write(content)
    tmp_path = tmp.name

try:
    result = predictor.predict(tmp_path)
finally:
    Path(tmp_path).unlink(missing_ok=True)  # Cleanup
```

---

## 🎨 UI/UX Enhancements

### 1. Loading States
```jsx
{isLoading ? (
  <div className="animate-pulse">Loading video...</div>
) : (
  <video src={videoURL} controls />
)}
```

### 2. Error Boundaries
```jsx
{error && (
  <Alert message={error} type="error" />
)}
```

### 3. Thumbnail Generation
```javascript
// Generate thumbnail from video
function generateThumbnail(videoUrl) {
  const video = document.createElement('video')
  video.src = videoUrl
  video.currentTime = 1  // First second
  
  video.addEventListener('loadeddata', () => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 180
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, 320, 180)
    const thumbnail = canvas.toDataURL('image/jpeg')
    setThumbnail(thumbnail)
  })
}
```

---

## 📁 File Structure

```
deepfake-detection/
├── frontend/
│   └── src/
│       ├── components/
│       │   └── VideoDropzone.jsx    ← Drag & drop upload
│       └── hooks/
│           └── useVideoAnalysis.js  ← Video state management
├── src/
│   └── api/
│       └── main.py                  ← Upload + analysis endpoints
└── uploads/                         ← Stored videos
    └── abc123def456.mp4
```

---

## 🎯 Best Practices

### Do's ✅
- Use `URL.createObjectURL()` for instant preview
- Always `URL.revokeObjectURL()` to prevent memory leaks
- Validate file type and size before upload
- Show clear error messages
- Provide visual feedback during upload
- Support multiple video formats
- Clean up temporary files

### Don'ts ❌
- Don't store large videos indefinitely
- Don't skip file validation
- Don't forget error handling
- Don't block UI during upload
- Don't ignore memory cleanup
- Don't accept arbitrary file types

---

## 🚀 Deployment Considerations

### Storage Options

#### 1. Local Storage (Development)
```python
UPLOADS_DIR = Path("uploads")
```

#### 2. Cloud Storage (Production)
```python
# AWS S3
import boto3
s3 = boto3.client('s3')
s3.upload_fileobj(file.file, 'bucket-name', key)

# Or use presigned URLs
url = s3.generate_presigned_url('get_object', Params={'Bucket': 'bucket-name', 'Key': key})
```

#### 3. CDN Integration
```python
# Serve videos via CDN
CDN_BASE = "https://cdn.your-domain.com"
video_url = f"{CDN_BASE}/{unique_filename}"
```

---

## 📞 Support

### Common Questions

**Q: Why use Blob URLs instead of base64?**
A: Blob URLs are more memory efficient and don't bloat the DOM.

**Q: How to handle very large videos (>1GB)?**
A: Use chunked upload with progress tracking.

**Q: Can I stream videos instead of downloading?**
A: Yes, use HTTP range requests and video streaming.

**Q: How to add subtitles/captions?**
A: Add `<track>` element to video tag.

---

**Your video upload and playback system is fully functional! 🎉**
