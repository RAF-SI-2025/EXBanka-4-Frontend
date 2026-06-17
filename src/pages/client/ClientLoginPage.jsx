import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useClientAuth } from '../../context/ClientAuthContext'

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

function validate(fields) {
  const errors = {}
  if (!fields.email)                    errors.email    = 'Email is required.'
  else if (!EMAIL_RE.test(fields.email)) errors.email   = 'Please enter a valid email address.'
  if (!fields.password)                 errors.password = 'Password is required.'
  return errors
}

export default function ClientLoginPage() {
  useWindowTitle('Sign In | AnkaBanka')
  const { clientLogin, clientValidateTotpLogin } = useClientAuth()
  const navigate = useNavigate()

  const [fields, setFields]       = useState({ email: '', password: '' })
  const [touched, setTouched]     = useState({ email: false, password: false })
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [lockedUntil, setLockedUntil] = useState(null)

  // TOTP second step state
  const [totpSessionToken, setTotpSessionToken] = useState(null)
  const [totpCode, setTotpCode] = useState('')
  const [totpError, setTotpError] = useState(null)
  const [totpLoading, setTotpLoading] = useState(false)

  const errors = validate(fields)
  const visibleErrors = {
    email:    (touched.email    || submitted) ? errors.email    : undefined,
    password: (touched.password || submitted) ? errors.password : undefined,
  }

  function handleChange(e) {
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setAuthError(null)
  }

  function handleBlur(e) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return
    try {
      const result = await clientLogin(fields.email, fields.password)
      if (result.requiresTotp) {
        setTotpSessionToken(result.sessionToken)
        return
      }
      navigate('/client')
    } catch (err) {
      setLockedUntil(null)
      if (err?.response?.status === 403) {
        const msg = err.response.data?.error ?? ''
        const match = msg.match(/account locked until (.+)/)
        setLockedUntil(match ? new Date(match[1]) : true)
      } else {
        setAuthError('Invalid email or password.')
      }
    }
  }

  async function handleTotpSubmit(e) {
    e.preventDefault()
    if (totpCode.length !== 6) {
      setTotpError('Please enter the 6-digit code from your authenticator app.')
      return
    }
    setTotpLoading(true)
    setTotpError(null)
    try {
      await clientValidateTotpLogin(totpSessionToken, totpCode)
      navigate('/client')
    } catch {
      setTotpError('Invalid or expired code. Please try again.')
    } finally {
      setTotpLoading(false)
    }
  }

  if (totpSessionToken) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Two-Factor Auth</p>
            <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Verify Identity</h1>
            <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mx-auto" />
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
              Enter the 6-digit code from your authenticator app.
            </p>
            <form onSubmit={handleTotpSubmit} className="space-y-6">
              <div>
                <label className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => { setTotpCode(e.target.value.replace(/\D/g, '')); setTotpError(null) }}
                  placeholder="000000"
                  className="input-field text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
                {totpError && <p className="mt-2 text-xs text-red-500">{totpError}</p>}
              </div>
              <button type="submit" disabled={totpLoading} className="btn-primary w-full">
                {totpLoading ? 'Verifying…' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { setTotpSessionToken(null); setTotpCode(''); setTotpError(null) }}
                className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-center"
              >
                ← Back to login
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/client" className="inline-flex items-center gap-3 mb-8">
            <div className="w-7 h-7 border border-violet-500 dark:border-violet-400 flex items-center justify-center">
              <span className="text-violet-500 dark:text-violet-400 text-xs font-serif font-semibold">A</span>
            </div>
            <span className="text-slate-900 dark:text-white font-serif text-lg tracking-widest font-light">
              Anka<span className="text-violet-600 dark:text-violet-400">Banka</span>
            </span>
          </Link>
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Sign In</h1>
          <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mx-auto" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={fields.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="your@email.com"
                className={`input-field ${visibleErrors.email ? 'input-error' : ''}`}
              />
              {visibleErrors.email && (
                <p className="mt-2 text-xs text-red-500">{visibleErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
                <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400"
                >
                  Password
                </label>
                <Link
                  to="/client/forgot-password"
                  className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-500 dark:hover:text-violet-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={fields.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Password"
                  className={`input-field pr-12 ${visibleErrors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {visibleErrors.password && (
                <p className="mt-2 text-xs text-red-500">{visibleErrors.password}</p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full mt-2">
              Sign In
            </button>
            {lockedUntil && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-xs text-red-700 dark:text-red-400 space-y-1">
                <p className="font-medium">Your account is temporarily locked.</p>
                {lockedUntil instanceof Date && (
                  <p>
                    Try again in {Math.max(1, Math.ceil((lockedUntil - Date.now()) / 60000))} minute(s) or{' '}
                    <Link to="/client/forgot-password" className="underline hover:text-red-900 dark:hover:text-red-300">
                      reset your password
                    </Link>{' '}
                    to unlock it immediately.
                  </p>
                )}
              </div>
            )}
            {authError && (
              <p className="text-xs text-red-500 text-center">{authError}</p>
            )}
          </form>
        </div>

      </div>
    </div>
  )
}
