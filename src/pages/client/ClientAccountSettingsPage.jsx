import { useState } from 'react'
import { Link } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { clientAuthService } from '../../services/clientAuthService'

export default function ClientAccountSettingsPage() {
  useWindowTitle('Security Settings | AnkaBanka')
  const [disableConfirm, setDisableConfirm] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [disableError, setDisableError] = useState(null)
  const [totpDisabled, setTotpDisabled] = useState(false)

  async function handleDisable() {
    setDisabling(true)
    setDisableError(null)
    try {
      await clientAuthService.disableTotp()
      setTotpDisabled(true)
      setDisableConfirm(false)
    } catch {
      setDisableError('Failed to disable 2FA. Please try again.')
    } finally {
      setDisabling(false)
    }
  }

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-lg mx-auto">
        <div className="mb-8">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-1">Account</p>
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white">Security Settings</h1>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-medium text-slate-900 dark:text-white">Two-Factor Authentication</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Protect your account with an authenticator app.
            </p>
          </div>
          <div className="px-6 py-5">
            {totpDisabled ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">2FA is disabled</span>
                </div>
                <Link to="/client/settings/totp" className="btn-primary text-xs px-4 py-2">
                  Enable 2FA
                </Link>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">2FA status unknown</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Link
                    to="/client/settings/totp"
                    className="px-4 py-2 text-xs border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all"
                  >
                    Setup / Update 2FA
                  </Link>
                  {!disableConfirm ? (
                    <button
                      onClick={() => setDisableConfirm(true)}
                      className="px-4 py-2 text-xs border border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                      Disable 2FA
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Are you sure?</span>
                      <button
                        onClick={handleDisable}
                        disabled={disabling}
                        className="px-3 py-1.5 text-xs bg-red-500 text-white hover:bg-red-600 transition-colors rounded"
                      >
                        {disabling ? 'Disabling…' : 'Yes, disable'}
                      </button>
                      <button
                        onClick={() => setDisableConfirm(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {disableError && <p className="mt-3 text-xs text-red-500">{disableError}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </ClientPortalLayout>
  )
}
