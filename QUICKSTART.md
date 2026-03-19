# ⚡ Quick Start - Deepfake Detection App

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Python 3.8+ installed
- Node.js 16+ installed
- Git (optional)

---

## Step 1: Start Backend (Terminal 1)

```bash
# Navigate to project root
cd d:\from d\development and data science\data science\DATA_SCIENCE_PROJECTS\deepfake-detection\deepfake-detection

# Install Python dependencies (if needed)
pip install -r requirements.txt

# Start FastAPI backend
uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Model loaded successfully at startup
```

✅ **Backend is ready when:** You can open `http://localhost:8000/docs` in browser

---

## Step 2: Start Frontend (Terminal 2)

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

**Expected Output:**
```
VITE ready in 450 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

✅ **Frontend is ready when:** You see "Local: http://localhost:5173/"

---

## Step 3: Test the App

1. **Open Browser:** `http://localhost:5173`

2. **Sign Up / Log In:**
   - Click "Create your free account"
   - Enter email and password
   - Sign up successfully

3. **Upload Video:**
   - Drag & drop video file OR click to browse
   - Supported formats: MP4, AVI, MOV, WebM, MKV
   - Max size: 500 MB

4. **Analyze:**
   - Click "Analyze Video" button
   - Watch upload progress bar
   - Wait for AI analysis

5. **View Results:**
   - See prediction: REAL or FAKE
   - Confidence score: 0-100%
   - Risk level indicator

---

## 🔧 Troubleshooting

### "Network error. Please ensure the backend is running"

**Fix:**
```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running, start it:
uvicorn src.api.main:app --reload
```

### "FirebaseError: auth/invalid-api-key"

**Fix:**
1. Open `frontend/.env`
2. Verify Firebase credentials are correct
3. Restart frontend: `Ctrl+C`, then `npm run dev`

### "Model not loaded" (503 error)

**Fix:**
```bash
# Train a model first
python scripts/train.py

# Or download pre-trained weights
# Place at: checkpoints/best_model.pth
```

### App shows blank screen

**Fix:**
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests
4. Follow error messages to fix issue

---

## ✅ Success Indicators

You know everything is working when:

### Backend:
- ✅ No errors in terminal
- ✅ `http://localhost:8000/docs` shows API docs
- ✅ Health check returns: `{"status": "ok", "model_loaded": true}`

### Frontend:
- ✅ No errors in browser console
- ✅ Can log in successfully
- ✅ Can upload video files
- ✅ Results display with animations

### Integration:
- ✅ POST request to `/detect-deepfake` succeeds
- ✅ Returns valid JSON response
- ✅ Confidence score displays correctly
- ✅ No "undefined" errors

---

## 📚 Need More Help?

1. **Detailed Guide:** Read `MIGRATION_GUIDE.md`
2. **Testing:** Check `INTEGRATION_TESTS.md`
3. **Quick Reference:** See `QUICK_REFERENCE.md`
4. **Setup Issues:** Review `SETUP_GUIDE.md`

---

## 🎯 Common Commands

```bash
# Backend
uvicorn src.api.main:app --reload          # Start backend
pip install -r requirements.txt            # Install Python deps

# Frontend
npm run dev                                # Start dev server
npm install                                # Install Node deps
npm run build                              # Build for production
npm run preview                          # Preview production build

# Testing
curl http://localhost:8000/health          # Test backend health
```

---

## 🎉 You're Ready!

If both servers are running and you can:
- ✅ Log in to the app
- ✅ Upload a video
- ✅ Get analysis results

**Congratulations! Your deepfake detection app is fully functional!** 🚀

---

**Happy detecting! 🎭🔍**
