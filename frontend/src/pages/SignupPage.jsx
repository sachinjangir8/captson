import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useAuthForm } from '../hooks/useAuthForm'
import Alert from '../components/Alert'

const ShieldIcon = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
)

const EyeIcon = ({ open }) => open ? (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
) : (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
)

// ── Password Strength Indicator ───────────────────────────────────────────────
function PasswordStrength({ password }) {
  const getStrength = () => {
    if (!password) return { score: 0, label: '', color: '' }
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    const levels = [
      { label: 'Too short', color: 'bg-slate-300' },
      { label: 'Weak', color: 'bg-red-400' },
      { label: 'Fair', color: 'bg-yellow-400' },
      { label: 'Good', color: 'bg-blue-400' },
      { label: 'Strong', color: 'bg-emerald-400' },
    ]
    return { score, ...levels[score] }
  }

  const { score, label, color } = getStrength()
  if (!password) return null

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300
            ${i <= score ? color : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className={`text-xs ${score >= 3 ? 'text-emerald-500' : score >= 2 ? 'text-yellow-500' : 'text-slate-500'}`}>
        {label}
      </p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const { signup } = useAuth()
  const { formError, isSubmitting, clearError, handleAuthAction } = useAuthForm()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirm) {
      // We re-use the hook's setFormError via a thrown error pattern
      handleAuthAction(async () => {
        throw Object.assign(new Error(), { code: 'passwords-mismatch' })
      })
      return
    }
    handleAuthAction(async () => {
      await signup(email, password, name)
      navigate('/dashboard')
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/3 -right-24 w-80 h-80 bg-purple-200/50 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 -left-24 w-80 h-80 bg-indigo-200/50 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl
                            bg-indigo-50 border border-indigo-100 mb-4 text-indigo-500">
              <ShieldIcon />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Create Account</h1>
            <p className="text-slate-500 mt-1 text-sm">Join DeepGuard AI today — it's free</p>
          </div>

          {formError && (
            <div className="mb-4">
              <Alert message={formError} type="error" onDismiss={clearError} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-slate-600 mb-1.5 font-medium">Display Name</label>
              <input
                type="text"
                id="signup-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                className="input-field"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-slate-600 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="input-field"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-600 mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  id="signup-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <EyeIcon open={showPass} />
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-slate-600 mb-1.5 font-medium">Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                id="signup-confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required
                autoComplete="new-password"
                className={`input-field ${confirm && confirm !== password
                  ? 'border-red-400 focus:border-red-500'
                  : confirm && confirm === password
                    ? 'border-emerald-400 focus:border-emerald-500'
                    : ''
                  }`}
              />
              {confirm && confirm !== password && (
                <p className="text-red-500 text-xs mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={isSubmitting}
              className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 font-semibold text-xs border border-slate-200 bg-slate-50 px-2 py-1 rounded-full">ALREADY HAVE ONE?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            to="/login"
            className="block text-center py-3 px-6 rounded-xl border border-slate-200
                       text-slate-600 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50
                       transition-all duration-200 font-medium text-sm shadow-sm"
          >
            Sign in instead
          </Link>
        </div>

        <p className="text-center text-slate-500 text-xs mt-5">
          🔒 Secured with Firebase Authentication
        </p>
      </motion.div>
    </div>
  )
}
