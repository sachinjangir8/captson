# 🔧 Frontend Setup Guide - DeepGuard AI

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Firebase Configuration](#firebase-configuration)
- [Troubleshooting](#troubleshooting)
- [Fixes Applied](#fixes-applied)

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

**Copy the example environment file:**
```bash
cp .env.example .env
```

**⚠️ IMPORTANT:** Replace ALL placeholder values in `.env` with your actual Firebase credentials.

### 3. Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or select existing one)
3. Click **Project Settings** ⚙️ → **General** → **Your apps**
4. Click **Add app** → Web app (</>)
5. Register your app and copy the `firebaseConfig` object
6. Paste the values into your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

### 4. Enable Email/Password Authentication

In Firebase Console:
1. Go to **Authentication** → **Sign-in method**
2. Click **Email/Password**
3. Toggle **Enable**
4. Click **Save**

### 5. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 🐛 Troubleshooting

### Issue: "FirebaseError: auth/invalid-api-key"

**Cause:** Missing or incorrect Firebase API key

**Solution:**
1. Check that `.env` file exists in the `frontend` directory
2. Verify all `VITE_FIREBASE_*` variables are set correctly
3. Ensure no quotes around values in `.env`
4. Restart the dev server after changing `.env`

### Issue: App crashes with "Cannot read property 'sentence' of undefined"

**Cause:** API response is undefined or malformed

**Solution:**
This has been fixed! The updated code now:
- Validates API responses before using them
- Provides safe defaults for missing fields
- Catches errors gracefully with ErrorBoundary

### Issue: "Firebase not configured" warning

**Cause:** Environment variables not loaded

**Solution:**
1. Verify `.env` file is in the `frontend` directory (NOT root)
2. Check variable names start with `VITE_` (required by Vite)
3. Run `npm run dev` again (env vars are loaded at startup)

### Issue: Authentication not working

**Checklist:**
- ✅ Firebase credentials are correct in `.env`
- ✅ Email/Password authentication is enabled in Firebase Console
- ✅ No CORS errors in browser console
- ✅ Backend is running (for video analysis features)

---

## ✨ Fixes Applied

### 1. Firebase Configuration (`src/firebase/config.js`)
- ✅ Added validation for environment variables
- ✅ Prevents crash when API key is missing
- ✅ Provides clear error messages for debugging
- ✅ Graceful fallback when Firebase isn't configured

### 2. Authentication Context (`src/context/AuthContext.jsx`)
- ✅ Added null/undefined checks before accessing user data
- ✅ Improved error handling with detailed messages
- ✅ Loading state while Firebase initializes
- ✅ Exposes `isConfigured` flag for debugging

### 3. Error Boundary (`src/components/ErrorBoundary.jsx`)
- ✅ Catches JavaScript errors anywhere in component tree
- ✅ Prevents entire app from crashing
- ✅ User-friendly error UI with retry option
- ✅ Shows technical details in development mode

### 4. API Service (`src/services/api.js`)
- ✅ Validates response structure before returning
- ✅ Provides safe defaults for missing fields
- ✅ Improved network error handling
- ✅ Better timeout and progress tracking

### 5. Video Analysis Hook (`src/hooks/useVideoAnalysis.js`)
- ✅ Additional null checks for file operations
- ✅ Validates API response data structure
- ✅ Memory leak prevention (URL cleanup)
- ✅ Better error messages with logging

### 6. Environment Configuration (`.env`)
- ✅ Created with placeholder values for testing
- ✅ Clear instructions for obtaining real credentials
- ✅ Separated from version control (in `.gitignore`)

---

## 📁 Project Structure

```
frontend/
├── .env                 # Your Firebase credentials (DO NOT COMMIT)
├── .env.example         # Template for .env
├── src/
│   ├── components/
│   │   └── ErrorBoundary.jsx    # NEW: Catches runtime errors
│   ├── context/
│   │   └── AuthContext.jsx      # IMPROVED: Better error handling
│   ├── firebase/
│   │   └── config.js            # IMPROVED: Validation & safety
│   ├── hooks/
│   │   └── useVideoAnalysis.js  # IMPROVED: Null safety
│   └── services/
│       └── api.js               # IMPROVED: Response validation
└── ...
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use environment variables** for sensitive data
3. **Enable Firebase App Check** in production
4. **Set up Firebase Security Rules** for database/storage
5. **Use HTTPS** in production

---

## 🎯 Next Steps

1. **Test Authentication:**
   - Navigate to `/login`
   - Try signing up with a test email
   - Verify you can log in successfully

2. **Test Video Analysis:**
   - Ensure backend is running (`python scripts/train.py` or FastAPI server)
   - Upload a test video
   - Click "Analyze Video"

3. **Check Console:**
   - Open browser DevTools
   - Look for any errors or warnings
   - Fix any issues using the troubleshooting guide above

---

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Review this guide's troubleshooting section
3. Verify Firebase configuration is correct
4. Ensure both frontend and backend are running

**Common Commands:**
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ No errors in browser console
- ✅ Can create account and log in
- ✅ Can upload and analyze videos
- ✅ Error boundary shows friendly UI if something breaks

**Remember:** The app now gracefully handles missing Firebase configuration and won't crash on undefined data access!
