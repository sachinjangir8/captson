# 🦺 Integration Testing Script - Deepfake Detection

## Quick Verification Steps

Run these commands to verify your full-stack integration is working.

---

## 1️⃣ Check Backend Health

### Test if Backend is Running

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "uptime_seconds": 123.4
}
```

**If you get error:**
- ❌ `ERR_CONNECTION_REFUSED` → Backend not running
- ✅ Start backend: `uvicorn src.api.main:app --reload`

---

## 2️⃣ Check Model Info

```bash
curl http://localhost:8000/model-info
```

**Expected Response:**
```json
{
  "model_type": "efficientnet",
  "version": "1.0.0",
  "input_size": 224,
  "threshold": 0.5,
  "supported_formats": [".avi", ".jpg", ".jpeg", ".mkv", ".mov", ".mp4", ".png"]
}
```

---

## 3️⃣ Test API Endpoint Directly

### With curl (Linux/Mac/WSL):
```bash
curl -X POST http://localhost:8000/detect-deepfake \
  -F "file=@path/to/your/test_video.mp4"
```

### With PowerShell (Windows):
```powershell
# Create form data
$form = @{
    file = Get-Item "C:\path\to\test_video.mp4"
}

# Send request
Invoke-RestMethod -Uri "http://localhost:8000/detect-deepfake" `
  -Method Post `
  -Form $form
```

**Expected Response:**
```json
{
  "prediction": "fake",
  "confidence": 0.9234,
  "fake_probability": 0.9234,
  "frame_scores": [0.85, 0.89, 0.92],
  "heatmap_url": null
}
```

---

## 4️⃣ Check Frontend Configuration

### Verify .env File

```bash
cd frontend
cat .env | findstr VITE_API_BASE_URL
```

**Should output:**
```
VITE_API_BASE_URL=http://localhost:8000
```

### Verify API Service

Check that `frontend/src/services/api.js` has correct endpoint:

```javascript
// Line ~85 should be:
xhr.open('POST', `${BASE_URL}/detect-deepfake`)
```

**NOT:**
```javascript
xhr.open('POST', `${BASE_URL}/predict`)  // ❌ Wrong!
```

---

## 5️⃣ Browser DevTools Test

### Step-by-Step:

1. **Open App**
   ```
   http://localhost:5173
   ```

2. **Open DevTools** (F12)

3. **Go to Console Tab**
   - Should see: "✅ Firebase initialized successfully"
   - Should NOT see: "FirebaseError: auth/invalid-api-key"

4. **Upload Test Video**
   - Click or drag video to dropzone
   - Should see file preview

5. **Click "Analyze Video"**

6. **Go to Network Tab**
   - Look for POST request to `http://localhost:8000/detect-deepfake`
   - Status should be `(pending)` then `200 OK`
   - Request type: `fetch` or `xhr`

7. **Inspect Response**
   - Click on the request
   - Go to "Response" tab
   - Should see valid JSON with `prediction` and `confidence`

8. **Check for Errors**
   - Red errors in Console? → Click on them for details
   - Failed network requests? → Check status code

---

## 6️⃣ Common Issues & Fixes

### Issue: "Network error. Please ensure the backend is running"

**Diagnosis:**
```bash
# Try to ping backend
curl http://localhost:8000/health
```

**Fixes:**
1. ✅ Start backend if not running
2. ✅ Check `.env` has correct URL
3. ✅ Restart frontend after changing `.env`
4. ✅ Check firewall isn't blocking port 8000

---

### Issue: "404 Not Found" for /detect-deepfake

**Diagnosis:**
```bash
curl http://localhost:8000/docs
```

**Fixes:**
1. ✅ Verify backend endpoint exists at `/detect-deepfake`
2. ✅ Check `src/api/main.py` line 98-152
3. ✅ Restart backend after code changes

---

### Issue: CORS Error in Browser

**Symptoms:**
```
Access to fetch at 'http://localhost:8000/detect-deepfake' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Fixes:**
1. ✅ Verify CORS middleware in `main.py` (lines 38-43)
2. ✅ Clear browser cache
3. ✅ Restart backend
4. ✅ Check no proxy interfering

---

### Issue: "Model not loaded" (503 error)

**Diagnosis:**
```bash
curl http://localhost:8000/health
# Check "model_loaded" field
```

**Fixes:**
1. ✅ Train model: `python scripts/train.py`
2. ✅ Download pre-trained weights
3. ✅ Place at `checkpoints/best_model.pth`
4. ✅ Restart backend

---

### Issue: "Unsupported file type"

**Symptoms:**
```json
{
  "detail": "Unsupported file type '.gif'. Allowed: ['.avi', '.jpg', ...]"
}
```

**Fixes:**
1. ✅ Use supported formats: MP4, AVI, MOV, MKV, JPG, PNG
2. ✅ Check file extension matches actual format
3. ✅ Rename file if needed

---

## 7️⃣ Full Integration Test Checklist

Run through this checklist to verify everything works:

### Backend Checks
- [ ] Backend starts without errors
- [ ] `/health` endpoint returns `"status": "ok"`
- [ ] `/model-info` endpoint returns model metadata
- [ ] `/detect-deepfake` endpoint accepts test file
- [ ] Returns valid JSON response
- [ ] No errors in backend logs

### Frontend Checks
- [ ] Frontend starts without errors
- [ ] Can navigate to `/login`
- [ ] Can create account / log in
- [ ] Can access `/dashboard`
- [ ] Can upload video file
- [ ] File preview shows correctly
- [ ] "Analyze Video" button is clickable
- [ ] Upload progress bar shows during upload
- [ ] Results display after analysis
- [ ] No errors in browser console

### Integration Checks
- [ ] POST request goes to correct endpoint (`/detect-deepfake`)
- [ ] Request includes file as FormData
- [ ] Response is parsed correctly
- [ ] Confidence score displays (0-100%)
- [ ] Prediction label shows (Real/Fake)
- [ ] Error messages appear if something fails
- [ ] Can analyze multiple videos sequentially

---

## 8️⃣ Automated Test Script

Save this as `test_integration.py` and run:

```python
import requests
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["ok", "degraded"]
        print("✅ Health check passed")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_model_info():
    """Test model info endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/model-info")
        assert response.status_code == 200
        data = response.json()
        assert "model_type" in data
        print("✅ Model info check passed")
        return True
    except Exception as e:
        print(f"❌ Model info failed: {e}")
        return False

def test_prediction(test_file_path):
    """Test actual prediction"""
    try:
        with open(test_file_path, 'rb') as f:
            files = {"file": f}
            response = requests.post(f"{BASE_URL}/detect-deepfake", files=files)
        
        assert response.status_code == 200
        data = response.json()
        assert "prediction" in data
        assert "confidence" in data
        assert isinstance(data["confidence"], float)
        
        print(f"✅ Prediction test passed")
        print(f"   Prediction: {data['prediction']}")
        print(f"   Confidence: {data['confidence']:.2%}")
        return True
    except FileNotFoundError:
        print(f"❌ Test file not found: {test_file_path}")
        return False
    except Exception as e:
        print(f"❌ Prediction test failed: {e}")
        return False

if __name__ == "__main__":
    print("🧪 Running Integration Tests...\n")
    
    # Test 1: Health check
    if not test_health():
        print("\n⚠️  Backend not running! Start it first:")
        print("   uvicorn src.api.main:app --reload")
        exit(1)
    
    # Test 2: Model info
    test_model_info()
    
    # Test 3: Prediction (if you have a test file)
    test_file = input("\nEnter path to test video (or press Enter to skip): ").strip()
    if test_file:
        test_prediction(test_file)
    
    print("\n✅ Integration tests complete!")
```

**Run it:**
```bash
pip install requests
python test_integration.py
```

---

## 9️⃣ Debugging Tips

### Enable Verbose Logging

**Frontend:**
```javascript
// In api.js, add more console.logs
console.log('Sending request to:', `${BASE_URL}/detect-deepfake`)
console.log('File:', file.name, file.size, 'bytes')
```

**Backend:**
```python
# In main.py, add logging
logger.info(f"Received file: {file.filename}, size: {size_mb:.1f}MB")
logger.info(f"Prediction result: {result}")
```

### Watch Both Logs

**Terminal 1 (Backend):**
```bash
uvicorn src.api.main:app --reload --log-level debug
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

**Browser:**
- Open DevTools → Console
- Keep "Preserve log" checked
- Watch for errors in red

---

## 🔟 Success Indicators

You know everything is working when:

✅ **Backend:**
- Health check returns `"status": "ok"`
- Model is loaded (`"model_loaded": true`)
- Accepts file uploads
- Returns valid JSON predictions

✅ **Frontend:**
- No console errors
- Can upload files
- Shows upload progress
- Displays results correctly
- Handles errors gracefully

✅ **Integration:**
- Frontend can reach backend
- CORS allows requests
- Data flows both ways
- No undefined/crash errors

---

## 🎯 Next Steps After Testing

1. **If all tests pass:**
   - ✅ Your migration is complete!
   - ✅ Ready for development
   - ✅ Can proceed to deployment

2. **If some tests fail:**
   - Review error messages
   - Check logs in both frontend and backend
   - Consult MIGRATION_GUIDE.md
   - Verify each configuration step

3. **For production:**
   - Update CORS settings
   - Set up proper authentication
   - Configure rate limiting
   - Deploy to cloud platforms

---

**Happy testing! 🚀**
