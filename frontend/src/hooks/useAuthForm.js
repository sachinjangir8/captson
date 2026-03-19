import { useState, useCallback } from 'react'

/**
 * Helper to translate Firebase auth error codes into friendly messages.
 */
export function useAuthForm() {
  const [formError, setFormError]     = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearError = useCallback(() => setFormError(''), [])

  /**
   * Wraps an async auth action, catches Firebase errors, and maps them to
   * user-readable messages.
   *
   * @param {Function} action – async function that may throw a Firebase error
   */
  const handleAuthAction = useCallback(async (action) => {
    setFormError('')
    setIsSubmitting(true)
    try {
      await action()
    } catch (err) {
      setFormError(mapFirebaseError(err.code))
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return { formError, isSubmitting, clearError, handleAuthAction }
}

// ── Firebase Error Code → Human Message ───────────────────────────────────────
function mapFirebaseError(code) {
  const map = {
    'auth/email-already-in-use':    'An account with this email already exists.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/user-not-found':          'No account found with this email. Please sign up.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Invalid email or password. Please try again.',
    'auth/too-many-requests':       'Too many failed attempts. Please wait a moment and try again.',
    'auth/network-request-failed':  'Network error. Check your internet connection.',
    'auth/user-disabled':           'This account has been disabled. Contact support.',
    'auth/operation-not-allowed':   'Email/password sign-in is not enabled.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}
