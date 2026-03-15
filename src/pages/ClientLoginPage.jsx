import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useClientAuth } from '../context/ClientAuthContext'

function validate(fields) {
  const errors = {}
  if (!fields.email)    errors.email    = 'Email is required.'
  if (!fields.password) errors.password = 'Password is required.'
  return errors
}

export default function ClientLoginPage() {
  useWindowTitle('Sign In | AnkaBanka')
  const { clientLogin } = useClientAuth()
  const navigate = useNavigate()

  const [fields, setFields]       = useState({ email: '', password: '' })
  const [touched, setTouched]     = useState({ email: false, password: false })
  const [submitted, setSubmitted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState(null)

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
      await clientLogin(fields.email, fields.password)
      navigate('/client')
    } catch {
      setAuthError('Invalid email or password.')
    }
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
              <label
                htmlFor="password"
                className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400 mb-2"
              >
                Password
              </label>
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
            {authError && (
              <p className="text-xs text-red-500 text-center">{authError}</p>
            )}
          </form>
        </div>

      </div>
    </div>
  )
}
