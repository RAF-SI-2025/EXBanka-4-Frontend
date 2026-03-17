import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081'

const MIN_LENGTH = 8
const MAX_LENGTH = 32
const HAS_UPPER  = /[A-Z]/
const HAS_LOWER  = /[a-z]/
const TWO_DIGITS = /(?=(.*[0-9]){2})/

function validate(password, confirm) {
  const errors = {}
  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < MIN_LENGTH) {
    errors.password = `Password must be at least ${MIN_LENGTH} characters.`
  } else if (password.length > MAX_LENGTH) {
    errors.password = `Password must be at most ${MAX_LENGTH} characters.`
  } else if (!HAS_UPPER.test(password)) {
    errors.password = 'Password must contain at least one uppercase letter.'
  } else if (!HAS_LOWER.test(password)) {
    errors.password = 'Password must contain at least one lowercase letter.'
  } else if (!TWO_DIGITS.test(password)) {
    errors.password = 'Password must contain at least two numbers.'
  }
  if (!confirm) {
    errors.confirm = 'Please confirm your password.'
  } else if (password && confirm !== password) {
    errors.confirm = 'Passwords do not match.'
  }
  return errors
}

export default function ClientActivatePage() {
  useWindowTitle('Activate Account | AnkaBanka')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [fields, setFields]       = useState({ password: '', confirm: '' })
  const [touched, setTouched]     = useState({ password: false, confirm: false })
  const [submitted, setSubmitted] = useState(false)
  const [done, setDone]           = useState(false)
  const [apiError, setApiError]   = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm,  setShowConfirm]  = useState(false)

  const errors = validate(fields.password, fields.confirm)
  const visibleErrors = {
    password: (touched.password || submitted) ? errors.password : undefined,
    confirm:  (touched.confirm  || submitted) ? errors.confirm  : undefined,
  }

  function handleChange(e) {
    setApiError(null)
    setFields((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleBlur(e) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    if (Object.keys(errors).length > 0) return
    try {
      await axios.post(`${BASE_URL}/client/activate`, {
        token,
        password:         fields.password,
        confirm_password: fields.confirm,
      })
      setDone(true)
    } catch (err) {
      const msg = err?.response?.data?.error
      setApiError(msg ?? 'Something went wrong. The link may have expired.')
    }
  }

  /* Missing token */
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
        <p className="text-xs tracking-widest uppercase text-red-500 mb-4">Invalid Link</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Link not found</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mx-auto mb-6" />
        <p className="text-slate-500 dark:text-slate-400 font-light mb-10">
          This activation link is invalid or has already been used.
        </p>
        <Link to="/client/login" className="btn-primary">Go to Client Login</Link>
      </div>
    )
  }

  /* Success */
  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
        <div className="w-14 h-14 border border-violet-500 dark:border-violet-400 flex items-center justify-center mx-auto mb-8">
          <svg className="w-6 h-6 text-violet-500 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">All Set</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Account Activated</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mx-auto mb-6" />
        <p className="text-slate-500 dark:text-slate-400 font-light mb-10">
          Your account is ready. You can now sign in with your email and new password.
        </p>
        <Link to="/client/login" className="btn-primary">Sign In</Link>
      </div>
    )
  }

  /* Form */
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 py-16">
      <Link to="/client" className="flex items-center gap-3 mb-14">
        <div className="w-7 h-7 border border-violet-500 dark:border-violet-400 flex items-center justify-center">
          <span className="text-violet-500 dark:text-violet-400 text-xs font-serif font-semibold">A</span>
        </div>
        <span className="text-slate-900 dark:text-white font-serif text-lg tracking-widest font-light">
          Anka<span className="text-violet-600 dark:text-violet-400">Banka</span>
        </span>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Account Activation</p>
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-2">Create Password</h1>
          <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-light text-sm">
            Set a password to activate your banking account.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            <div>
              <label htmlFor="password" className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={fields.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="8–32 characters"
                  className={`input-field pr-12 ${visibleErrors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
              {visibleErrors.password && <p className="mt-2 text-xs text-red-500">{visibleErrors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm"
                  name="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={fields.confirm}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Repeat password"
                  className={`input-field pr-12 ${visibleErrors.confirm ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon show={showConfirm} />
                </button>
              </div>
              {visibleErrors.confirm && <p className="mt-2 text-xs text-red-500">{visibleErrors.confirm}</p>}
            </div>

            {apiError && <p className="text-xs text-red-500">{apiError}</p>}

            <button type="submit" className="btn-primary w-full">
              Activate Account
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function EyeIcon({ show }) {
  return show ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
