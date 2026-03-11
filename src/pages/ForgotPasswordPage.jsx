import { useState } from 'react'
import { Link } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { authService } from '../services/authService'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function ForgotPasswordPage() {
  useWindowTitle('Reset Password | AnkaBanka')

  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [sent, setSent] = useState(false)
  const [apiError, setApiError] = useState(null)

  const emailError =
    !email
      ? 'Email address is required.'
      : !EMAIL_REGEX.test(email)
      ? 'Please enter a valid email address.'
      : undefined

  const showError = (touched || submitted) && emailError

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    if (emailError) return
    setApiError(null)
    try {
      await authService.forgotPassword(email)
      setSent(true)
    } catch (err) {
      const msg = err?.response?.data?.error
      setApiError(msg ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 mb-14">
        <div className="w-7 h-7 border border-violet-500 dark:border-violet-400 flex items-center justify-center">
          <span className="text-violet-500 dark:text-violet-400 text-xs font-serif font-semibold">A</span>
        </div>
        <span className="text-slate-900 dark:text-white font-serif text-lg tracking-widest font-light">
          Anka<span className="text-violet-600 dark:text-violet-400">Banka</span>
        </span>
      </Link>

      <div className="w-full max-w-md">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 border border-violet-500 dark:border-violet-400 flex items-center justify-center mx-auto mb-8">
              <svg className="w-6 h-6 text-violet-500 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Email Sent</p>
            <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Check Your Inbox</h1>
            <div className="w-10 h-px bg-violet-500 mx-auto mb-6" />
            <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed mb-10">
              If an account exists for{' '}
              <span className="text-slate-900 dark:text-white font-medium">{email}</span>, you will receive a
              password reset link within a few minutes.
            </p>
            <Link to="/login" className="btn-primary">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-10">
              <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Account Recovery</p>
              <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Reset Password</h1>
              <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mx-auto mb-6" />
              <p className="text-slate-500 dark:text-slate-400 font-light text-sm leading-relaxed">
                Enter the email address associated with your account and we will send you a secure
                reset link.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400 mb-2"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouched(true)}
                    placeholder="employee@ankabanka.com"
                    className={`input-field ${showError ? 'input-error' : ''}`}
                  />
                  {showError && (
                    <p className="mt-2 text-xs text-red-500">{emailError}</p>
                  )}
                </div>

                {apiError && (
                  <p className="text-xs text-red-500">{apiError}</p>
                )}

                <button type="submit" className="btn-primary w-full">
                  Send Reset Link
                </button>
              </form>
            </div>

            <div className="text-center mt-8">
              <Link
                to="/login"
                className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ForgotPasswordPage
