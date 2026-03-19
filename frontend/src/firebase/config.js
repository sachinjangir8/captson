// ============================================================
//  Firebase Configuration
//  
//  FIXES APPLIED:
//  1. Added validation for environment variables
//  2. Added error handling for Firebase initialization
//  3. Prevents crash when API key is missing/invalid
//  4. Provides clear error messages for debugging
//
//  How to get your config:
//  1. Go to https://console.firebase.google.com
//  2. Create a project (or use existing one)
//  3. Click "Add App" → choose Web
//  4. Copy the firebaseConfig object here
//  5. In Firebase Console → Authentication → Sign-in method
//     → Enable "Email/Password"
// ============================================================

import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'

// ── Environment Variable Validation ──────────────────────────────────────────
// Ensure all required env vars are present before initializing Firebase
const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value || value === 'your-api-key-here' || value.includes('your-project'))
  .map(([key]) => key)

if (missingVars.length > 0) {
  console.error(
    `❌ Firebase Configuration Error:\n` +
    `Missing or invalid environment variables: ${missingVars.join(', ')}\n` +
    `Please create a .env file in the frontend directory with your Firebase credentials.\n` +
    `See .env.example for reference.`
  )
}

const firebaseConfig = {
  apiKey:            requiredEnvVars.apiKey,
  authDomain:        requiredEnvVars.authDomain,
  projectId:         requiredEnvVars.projectId,
  storageBucket:     requiredEnvVars.storageBucket,
  messagingSenderId: requiredEnvVars.messagingSenderId,
  appId:             requiredEnvVars.appId,
}

// ── Firebase Initialization ───────────────────────────────────────────────────
let app
let auth

try {
  // Initialize Firebase app only if we have valid configuration
  if (!missingVars.length > 0 && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('your-')) {
    app = initializeApp(firebaseConfig)
    
    // Initialize Firebase Auth with persistent session (survives page refresh)
    auth = getAuth(app)
    setPersistence(auth, browserLocalPersistence)
    
    console.log('✅ Firebase initialized successfully')
  } else {
    console.warn('⚠️ Firebase not configured - authentication will be disabled')
    // Create mock auth object to prevent crashes
    auth = null
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message)
  console.error('Check your Firebase credentials in the .env file')
  
  // Fallback: create a minimal auth object to prevent crashes
  auth = null
}

export { app, auth }
export default app
