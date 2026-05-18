import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAuthForm } from '../hooks/useAuthForm'

export default function LoginPage() {
  const { login } = useAuth()
  const { formError, isSubmitting, clearError, handleAuthAction } = useAuthForm()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    handleAuthAction(async () => {
      await login(email, password)
      navigate('/dashboard')
    })
  }

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
            Live threat monitoring
          </div>
          <h1 style={styles.leftTitle}>Security that<br />never blinks.</h1>
          <p style={styles.leftSub}>
            Real-time detection across your entire infrastructure. Threats caught before they land.
          </p>
          <div style={styles.pills}>
            {['99.98% uptime', '< 200ms detection', '47 regions', 'SOC 2 Type II'].map((p) => (
              <span key={p} style={styles.pill}>{p}</span>
            ))}
          </div>
        </div>

        <div style={styles.leftFoot}>ISO 27001 · GDPR compliant</div>
      </div>

      {/* ── Right panel ── */}
      <div style={styles.right}>
        <div style={styles.step}>Sign in</div>

        <h2 style={styles.rTitle}>Welcome back</h2>
        <p style={styles.rSub}>Enter your details to continue</p>

        {formError && (
          <div style={styles.errBox}>
            {formError}
            <button onClick={clearError} style={styles.errClose} aria-label="Dismiss">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Email */}
          <div style={styles.field}>
            <label style={styles.flabel}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              style={styles.inp}
              onFocus={e => e.target.style.borderColor = '#1D9E75'}
              onBlur={e => e.target.style.borderColor = '#EBEBEB'}
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <div style={styles.flabelRow}>
              <label style={styles.flabel}>Password</label>
              <button type="button" style={styles.forgot}>Forgot password?</button>
            </div>
            <div style={styles.inpWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{ ...styles.inp, paddingRight: 42 }}
                onFocus={e => e.target.style.borderColor = '#1D9E75'}
                onBlur={e => e.target.style.borderColor = '#EBEBEB'}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={styles.eyeBtn}
                aria-label="Toggle password visibility"
              >
                {showPass ? (
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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
            onMouseEnter={e => !isSubmitting && (e.target.style.background = '#222')}
            onMouseLeave={e => e.target.style.background = '#0A0A0A'}
          >
            {isSubmitting ? (
              <>
                <span style={styles.spinner} />
                Signing in…
              </>
            ) : (
              <>
                Sign in
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div style={styles.divRow}>
          <div style={styles.divLine} />
          <span style={styles.divTxt}>Don't have an account?</span>
          <div style={styles.divLine} />
        </div>

        <Link to="/signup" style={styles.signupBtn}>
          Create free account
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
    fontSize: 38,
    fontWeight: 600,
    color: '#0A0A0A',
    lineHeight: 1.15,
    letterSpacing: '-1.2px',
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
    marginTop: 36,
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
  leftFoot: {
    fontSize: 11,
    color: '#bbb',
    letterSpacing: '0.02em',
  },

  /* ── Right ── */
  right: {
    padding: '56px 52px',
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
    marginBottom: 32,
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
    marginBottom: 40,
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
    marginBottom: 20,
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
  forgot: {
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
  inpWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#ccc',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
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
  signupBtn: {
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
