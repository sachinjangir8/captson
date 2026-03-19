import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../firebase/config'

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true) // true until Firebase resolves auth state
  const [error, setError]     = useState(null) // Track authentication errors

  // Safety check: if Firebase isn't configured, provide helpful error
  useEffect(() => {
    if (!auth) {
      console.error(
        '⚠️ Firebase Authentication is not initialized.\n' +
        'Please ensure your .env file contains valid Firebase credentials.\n' +
        'See frontend/.env.example for reference.'
      )
      setError('Firebase not configured - please check your .env file')
      setLoading(false)
    }
  }, [])

  // Subscribe to Firebase auth state on mount
  useEffect(() => {
    // Skip if Firebase isn't initialized
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null) // Ensure we always have a value (not undefined)
      setError(null) // Clear any previous errors
      setLoading(false)
    }, (authError) => {
      // Handle auth state change errors
      console.error('Auth state change error:', authError.message)
      setError(authError.message)
      setLoading(false)
    })
    
    return unsubscribe // cleanup on unmount
  }, [])

  // ── Auth Actions ────────────────────────────────────────────────────────────

  const signup = useCallback(async (email, password, displayName) => {
    // Safety check: ensure Firebase is initialized
    if (!auth) {
      throw new Error('Firebase authentication is not configured. Please check your .env file.')
    }

    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
      // Optionally set a display name
      if (displayName && newUser) {
        await updateProfile(newUser, { displayName })
      }
      return newUser
    } catch (err) {
      console.error('Signup error:', err.code, err.message)
      throw err // Re-throw to be handled by useAuthForm
    }
  }, [])

  const login = useCallback(async (email, password) => {
    // Safety check: ensure Firebase is initialized
    if (!auth) {
      throw new Error('Firebase authentication is not configured. Please check your .env file.')
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      return result
    } catch (err) {
      console.error('Login error:', err.code, err.message)
      throw err // Re-throw to be handled by useAuthForm
    }
  }, [])

  const logout = useCallback(async () => {
    // Safety check: ensure Firebase is initialized
    if (!auth) {
      console.warn('Firebase not initialized - skipping logout')
      return
    }

    try {
      await signOut(auth)
    } catch (err) {
      console.error('Logout error:', err.message)
      throw err
    }
  }, [])

  // ── Context Value ───────────────────────────────────────────────────────────
  const value = {
    user,
    loading,
    error, // Expose error state for debugging
    signup,
    login,
    logout,
    isAuthenticated: !!user, // Always boolean, never undefined
    isConfigured: !!auth, // Indicate if Firebase is properly configured
  }

  // Don't render children until we know auth state (unless Firebase isn't configured)
  if (loading && !error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Initializing authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Custom Hook ───────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
