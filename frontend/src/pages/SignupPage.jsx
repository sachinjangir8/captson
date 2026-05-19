import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthForm } from '../hooks/useAuthForm'

// ── Password Strength ─────────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const levels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', '#E24B4A', '#EF9F27', '#378ADD', '#1D9E75']

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1,
            height: 3,
            borderRadius: 99,
            background: i <= score ? colors[score] : '#EBEBEB',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {score > 0 && (
        <p style={{ fontSize: 11, color: colors[score], fontWeight: 500 }}>
          {levels[score]}
        </p>
      )}
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

  const passwordMismatch = confirm.length > 0 && confirm !== password
  const passwordMatch = confirm.length > 0 && confirm === password

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password !== confirm) {
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

  const focusTeal = e => e.target.style.borderColor = '#1D9E75'
  const blurGray  = e => e.target.style.borderColor = '#EBEBEB'

  return (
    <div style={styles.root}>

      {/* ── Left panel ── */}
      <div style={styles.left}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span style={styles.logoName}>DeepGuard AI</span>
        </div>

        <div style={styles.leftBody}>
          <div style={styles.tag}>
            <div style={styles.tagDot} />
            Threat intelligence platform
          </div>
          <h1 style={styles.leftTitle}>Detect threats<br />before they<br />become damage.</h1>
          <p style={styles.leftSub}>
            AI-powered analysis protecting your infrastructure around the clock. Free to start.
          </p>
          <div style={styles.pills}>
            {['AI-powered', 'Zero-day detection', 'SOC integration', 'GDPR ready'].map(f => (
              <span key={f} style={styles.pill}>{f}</span>
            ))}
          </div>
          <div style={styles.socialProof}>
            <div style={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="13" height="13" viewBox="0 0 20 20" fill="#EF9F27">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p style={styles.trustText}>Trusted by <span style={{ color: '#0A0A0A', fontWeight: 500 }}>12,000+</span> security teams</p>
          </div>
        </div>

        <div style={styles.leftFoot}>ISO 27001 · GDPR compliant</div>
      </div>

      {/* ── Right panel ── */}
      <div style={styles.right}>
        <div style={styles.step}>Create account</div>

        <h2 style={styles.rTitle}>Get started free</h2>
        <p style={styles.rSub}>No credit card required</p>

        {formError && (
          <div style={styles.errBox}>
            {formError}
            <button onClick={clearError} style={styles.errClose} aria-label="Dismiss">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>

          {/* Name */}
          <div style={styles.field}>
            <label style={styles.flabel}>Full name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              style={styles.inp}
              onFocus={focusTeal}
              onBlur={blurGray}
            />
          </div>

          {/* Email */}
          <div style={styles.field}>
            <label style={styles.flabel}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              style={styles.inp}
              onFocus={focusTeal}
              onBlur={blurGray}
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <div style={styles.flabelRow}>
              <label style={styles.flabel}>Password</label>
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={styles.showBtn}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              style={styles.inp}
              onFocus={focusTeal}
              onBlur={blurGray}
            />
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div style={styles.field}>
            <label style={styles.flabel}>Confirm password</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password"
              required
              autoComplete="new-password"
              style={{
                ...styles.inp,
                borderColor: passwordMismatch ? '#E24B4A' : passwordMatch ? '#1D9E75' : '#EBEBEB',
              }}
              onFocus={e => {
                if (!passwordMismatch && !passwordMatch) e.target.style.borderColor = '#1D9E75'
              }}
              onBlur={e => {
                if (!passwordMismatch && !passwordMatch) e.target.style.borderColor = '#EBEBEB'
              }}
            />
            {passwordMismatch && (
              <p style={{ fontSize: 11, color: '#E24B4A', marginTop: 5, fontWeight: 400 }}>
                Passwords do not match
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.btn,
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => !isSubmitting && (e.currentTarget.style.background = '#222')}
            onMouseLeave={e => e.currentTarget.style.background = '#0A0A0A'}
          >
            {isSubmitting ? (
              <>
                <span style={styles.spinner} />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div style={styles.divRow}>
          <div style={styles.divLine} />
          <span style={styles.divTxt}>Already have an account?</span>
          <div style={styles.divLine} />
        </div>

        <Link to="/login" style={styles.signinBtn}>
          Sign in instead
        </Link>
      </div>
    </div>
  )
}

const styles = {
  root: {
    minHeight: '100vh',
    background: '#fff',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  /* ── Left ── */
  left: {
    background: '#F5F5F3',
    padding: '56px 52px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: '#0A0A0A',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoName: {
    fontSize: 15,
    fontWeight: 500,
    color: '#0A0A0A',
    letterSpacing: '-0.2px',
  },
  leftBody: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '40px 0',
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#E8F5F0',
    color: '#0F6E56',
    fontSize: 11,
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: 20,
    marginBottom: 28,
    width: 'fit-content',
  },
  tagDot: {
    width: 6,
    height: 6,
    background: '#1D9E75',
    borderRadius: '50%',
  },
  leftTitle: {
    fontSize: 36,
    fontWeight: 600,
    color: '#0A0A0A',
    lineHeight: 1.15,
    letterSpacing: '-1.1px',
    marginBottom: 16,
  },
  leftSub: {
    fontSize: 14,
    color: '#888',
    lineHeight: 1.65,
    fontWeight: 300,
    maxWidth: 280,
  },
  pills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 28,
  },
  pill: {
    fontSize: 12,
    color: '#555',
    padding: '6px 14px',
    border: '1px solid #E0E0E0',
    borderRadius: 20,
    background: '#fff',
    fontWeight: 400,
  },
  socialProof: {
    marginTop: 32,
  },
  stars: {
    display: 'flex',
    gap: 2,
    marginBottom: 6,
  },
  trustText: {
    fontSize: 12,
    color: '#999',
    fontWeight: 300,
  },
  leftFoot: {
    fontSize: 11,
    color: '#bbb',
    letterSpacing: '0.02em',
  },

  /* ── Right ── */
  right: {
    padding: '48px 52px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
  },
  step: {
    fontSize: 11,
    color: '#bbb',
    fontWeight: 500,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  rTitle: {
    fontSize: 28,
    fontWeight: 600,
    color: '#0A0A0A',
    letterSpacing: '-0.7px',
    marginBottom: 6,
  },
  rSub: {
    fontSize: 14,
    color: '#999',
    fontWeight: 300,
    marginBottom: 32,
  },
  errBox: {
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    color: '#991B1B',
    fontSize: 13,
    padding: '10px 14px',
    borderRadius: 8,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#991B1B',
    fontSize: 13,
    padding: '0 0 0 8px',
  },
  field: {
    marginBottom: 18,
  },
  flabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },
  flabel: {
    fontSize: 12,
    fontWeight: 500,
    color: '#444',
    marginBottom: 7,
    display: 'block',
  },
  showBtn: {
    fontSize: 11,
    color: '#1D9E75',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
    padding: 0,
  },
  inp: {
    width: '100%',
    height: 46,
    border: '1.5px solid #EBEBEB',
    borderRadius: 10,
    padding: '0 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#0A0A0A',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.18s',
    fontWeight: 300,
  },
  btn: {
    width: '100%',
    height: 48,
    background: '#0A0A0A',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    cursor: 'pointer',
    marginTop: 8,
    letterSpacing: '-0.1px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.18s',
  },
  spinner: {
    width: 16,
    height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  divRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '24px 0',
  },
  divLine: {
    flex: 1,
    height: 1,
    background: '#F0F0F0',
  },
  divTxt: {
    fontSize: 11,
    color: '#ccc',
    whiteSpace: 'nowrap',
  },
  signinBtn: {
    width: '100%',
    height: 46,
    background: '#fff',
    color: '#0A0A0A',
    border: '1.5px solid #EBEBEB',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: 'inherit',
    cursor: 'pointer',
    fontWeight: 400,
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.18s, background 0.18s',
  },
}

