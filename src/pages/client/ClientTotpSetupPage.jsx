import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { clientAuthService } from '../../services/clientAuthService'

const STEPS = { INTRO: 'intro', QR: 'qr', VERIFY: 'verify', SUCCESS: 'success' }

export default function ClientTotpSetupPage() {
  useWindowTitle('Setup 2FA | AnkaBanka')
  const navigate = useNavigate()

  const [step, setStep] = useState(STEPS.INTRO)
  const [totpData, setTotpData] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerateQR() {
    setLoading(true)
    setError(null)
    try {
      const data = await clientAuthService.generateTotpSecret()
      setTotpData(data)
      setStep(STEPS.QR)
    } catch {
      setError('Failed to generate QR code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await clientAuthService.verifyTotp(code)
      setStep(STEPS.SUCCESS)
    } catch {
      setError('Invalid code. Please try again with the current code from your app.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="mb-8">
          <Link
            to="/client/settings/security"
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            ← Security Settings
          </Link>
        </div>

        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Security</p>
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-3">
            Two-Factor Authentication
          </h1>
          <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mx-auto" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[STEPS.INTRO, STEPS.QR, STEPS.VERIFY].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step === s
                  ? 'bg-violet-600 text-white'
                  : step === STEPS.SUCCESS || [STEPS.QR, STEPS.VERIFY].indexOf(s) < [STEPS.QR, STEPS.VERIFY].indexOf(step)
                    ? 'bg-violet-200 dark:bg-violet-800 text-violet-600 dark:text-violet-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className="w-8 h-px bg-slate-200 dark:bg-slate-700" />}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">

          {/* Step 1: Intro */}
          {step === STEPS.INTRO && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Secure your account with 2FA
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Two-factor authentication adds an extra layer of security. After enabling it,
                  you'll need to enter a 6-digit code from your authenticator app each time you log in.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Compatible apps
                </p>
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>• Google Authenticator (iOS / Android)</p>
                  <p>• Microsoft Authenticator (iOS / Android)</p>
                  <p>• Authy (iOS / Android / Desktop)</p>
                </div>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={handleGenerateQR} disabled={loading} className="btn-primary w-full">
                {loading ? 'Generating…' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2: QR Code */}
          {step === STEPS.QR && totpData && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Scan QR code</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Open your authenticator app and scan this QR code.
                </p>
              </div>
              <div className="flex justify-center">
                {totpData.qr_code_png ? (
                  <img
                    src={`data:image/png;base64,${totpData.qr_code_png}`}
                    alt="TOTP QR code"
                    className="w-48 h-48 border border-slate-200 dark:border-slate-700 rounded-lg"
                  />
                ) : (
                  <p className="text-xs text-slate-400 break-all">{totpData.otpauth_uri}</p>
                )}
              </div>
              {totpData.secret && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Manual entry key</p>
                  <p className="text-sm font-mono text-slate-700 dark:text-slate-300 break-all">{totpData.secret}</p>
                </div>
              )}
              <button onClick={() => setStep(STEPS.VERIFY)} className="btn-primary w-full">
                I've scanned the code
              </button>
            </div>
          )}

          {/* Step 3: Verify */}
          {step === STEPS.VERIFY && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Verify your code</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Enter the 6-digit code from your authenticator app to confirm setup.
                </p>
              </div>
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs tracking-widest uppercase text-slate-600 dark:text-slate-400 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(null) }}
                    placeholder="000000"
                    className="input-field text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Verifying…' : 'Enable 2FA'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(STEPS.QR)}
                  className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-center"
                >
                  ← Back to QR code
                </button>
              </form>
            </div>
          )}

          {/* Step 4: Success */}
          {step === STEPS.SUCCESS && (
            <div className="text-center space-y-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-2">2FA is now active</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Your account is protected with two-factor authentication.
                  You'll be asked for a code each time you log in.
                </p>
              </div>
              <button onClick={() => navigate('/client/settings/security')} className="btn-primary w-full">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </ClientPortalLayout>
  )
}
