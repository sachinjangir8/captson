# ⚡ Quick Reference - DeepGuard AI Frontend

## 🚨 Common Issues & Solutions

### "FirebaseError: auth/invalid-api-key"
```bash
# SOLUTION: Check your .env file
cd frontend
cat .env  # Verify VITE_FIREBASE_API_KEY is set correctly
```

**Fix:** Replace placeholder values in `frontend/.env` with real Firebase credentials

---

### App shows blank white screen
```javascript
// CHECK: Browser console for errors
// LOOK FOR: "Firebase not configured" or similar
```

**Fix:** 
1. Verify `.env` exists in `frontend/` directory
2. Restart dev server: `npm run dev`
3. Check Firebase credentials are valid

---

### "Cannot read property 'sentence' of undefined"
✅ **ALREADY FIXED!** The ErrorBoundary will catch this and show a friendly error UI instead of crashing.

**To recover:** Click "Try Again" button or reload page

---

### Authentication not working
```bash
# CHECKLIST:
✅ .env file has correct Firebase credentials
✅ Email/Password auth enabled in Firebase Console
✅ No CORS errors in console
✅ Backend running (for video analysis)
```

---

## 🔧 Essential Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 📁 Critical Files

```
frontend/
├── .env                    # 🔑 Firebase credentials (DO NOT COMMIT)
├── .env.example            # Template for .env
├── SETUP_GUIDE.md          # 📖 Detailed setup instructions
└── src/
    ├── firebase/config.js  # ⚙️ Firebase initialization
    ├── context/AuthContext.jsx  # 🔐 Auth state management
    ├── components/ErrorBoundary.jsx  # 🛡️ Catches runtime errors
    └── services/api.js     # 🌐 API calls with error handling
```

---

## 🎯 Testing Checklist

### 1. Environment Setup
- [ ] `.env` file exists in `frontend/`
- [ ] All `VITE_FIREBASE_*` variables are set
- [ ] Values don't contain "your-" placeholders

### 2. Firebase Configuration
- [ ] Firebase project created at console.firebase.google.com
- [ ] Web app registered in Firebase project
- [ ] Email/Password authentication enabled
- [ ] Credentials copied to `.env` file

### 3. Application Testing
- [ ] Dev server starts without errors
- [ ] Can navigate to `/login`
- [ ] Can create new account
- [ ] Can log in with credentials
- [ ] Can access `/dashboard` after login
- [ ] Can upload video files
- [ ] Can analyze videos (backend required)

### 4. Error Handling
- [ ] No crashes when Firebase credentials missing
- [ ] Helpful error messages shown
- [ ] Error boundary catches runtime errors
- [ ] Can recover from errors using "Try Again" button

---

## 🔍 Debugging Tips

### Check Environment Variables
```javascript
// In browser console (dev tools):
import.meta.env.VITE_FIREBASE_API_KEY
// Should show your API key, not undefined
```

### Check Firebase Initialization
```javascript
// Look for these messages in console:
"✅ Firebase initialized successfully"  // Good!
"⚠️ Firebase not configured"             // Check .env file
```

### Check Auth State
```javascript
// React DevTools → Components → AuthProvider
// Should show:
// - user: null or user object
// - loading: false
// - isConfigured: true
```

---

## 📞 Getting Help

### Step 1: Check Console
Open browser DevTools → Console
Look for error messages starting with ❌ or ⚠️

### Step 2: Review Error Message
Error messages now include helpful information:
- What went wrong
- Why it happened
- How to fix it

### Step 3: Consult Documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `FIREBASE_FIXES_SUMMARY.md` - Complete list of fixes
- This file - Quick reference

### Step 4: Common Fixes
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear cache and restart
npm run dev -- --force

# Check .env file location
ls -la frontend/.env
```

---

## 🎨 Visual Indicators

### Success Indicators ✅
- Green checkmarks in console
- "Firebase initialized successfully" message
- Can log in and use app features
- No red errors in console

### Warning Indicators ⚠️
- Yellow warning messages
- "Firebase not configured" message
- App works but auth disabled
- Fix by adding credentials to .env

### Error Indicators ❌
- Red error messages
- Error boundary UI appears
- App shows recovery options
- Click "Try Again" or follow error instructions

---

## 🔐 Security Reminders

- ✅ Never commit `.env` file
- ✅ Use environment variables for secrets
- ✅ Enable Firebase App Check in production
- ✅ Set up proper Firebase Security Rules
- ✅ Use HTTPS in production

---

## 📊 File Size Limits

| Feature | Limit | Notes |
|---------|-------|-------|
| Video Upload | 500 MB | Configured in useVideoAnalysis.js |
| Supported Formats | MP4, AVI, MOV, WebM, MKV | See ALLOWED_TYPES array |
| Request Timeout | 2 minutes | Configured in api.js |

---

## 🚀 Production Deployment

### Environment Variables
Set these in your hosting platform (Vercel, Netlify, etc.):

```env
VITE_FIREBASE_API_KEY=production_api_key
VITE_FIREBASE_AUTH_DOMAIN=prod-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=prod-app-id
VITE_FIREBASE_STORAGE_BUCKET=prod-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
VITE_API_BASE_URL=https://your-production-api.com
```

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/  # Deploy this folder
```

---

## 💡 Pro Tips

1. **Keep DevTools Open** while testing - you'll see helpful console messages
2. **Use React DevTools** extension to inspect component state
3. **Test Error States** by temporarily breaking your .env file
4. **Read Error Messages** - they now provide actionable solutions
5. **Check Both Frontend and Backend** when video analysis fails

---

## 🎉 You're Ready!

If everything is working:
- ✅ No errors in console
- ✅ Can create account and log in
- ✅ Can upload and analyze videos
- ✅ Errors show friendly UI instead of crashing

**Happy coding! 🚀**
