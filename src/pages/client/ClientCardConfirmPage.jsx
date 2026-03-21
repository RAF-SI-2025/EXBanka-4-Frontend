import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { cardService } from '../../services/cardService'
import { useApiError } from '../../context/ApiErrorContext'

export default function ClientCardConfirmPage() {
  useWindowTitle('Confirm Card Request | AnkaBanka')
  const navigate  = useNavigate()
  const location  = useLocation()
  const { addSuccess } = useApiError()

  const { requestId, accountNumber } = location.state ?? {}

  const [code, setCode]           = useState('')
  const [error, setError]         = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Guard: if navigated here without state, send back
  if (!requestId) {
    navigate('/client/cards')
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!code.trim()) { setError('Please enter the confirmation code.'); return }

    setSubmitting(true)
    setError(null)
    try {
      await cardService.confirmCardRequest(requestId, code.trim())
      addSuccess('Your card has been created successfully.', 'Card Created')
      navigate('/client/cards')
    } catch {
      setError('Invalid or expired confirmation code. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-md mx-auto w-full">

        <button
          onClick={() => navigate('/client/cards')}
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Cards
        </button>

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Confirmation</p>
        <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">Enter Code</h1>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-6" />

        <p className="text-sm text-slate-500 dark:text-slate-400 font-light mb-1">
          A confirmation code has been sent to your email address.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-8">
          The code expires in <span className="font-medium text-slate-600 dark:text-slate-300">15 minutes</span>.
        </p>

        {accountNumber && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
            Account: <span className="font-mono text-slate-600 dark:text-slate-300">{accountNumber}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">
              Confirmation Code *
            </label>
            <input
              autoFocus
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(null) }}
              placeholder="Enter your code"
              className={`input-field font-mono tracking-widest ${error ? 'input-error' : ''}`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Verifying…' : 'Confirm'}
          </button>
        </form>

      </div>
    </ClientPortalLayout>
  )
}
