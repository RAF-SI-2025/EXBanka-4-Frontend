import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useClientAccounts } from '../../context/ClientAccountsContext'
import { transferService } from '../../services/transferService'
import { fmt } from '../../utils/formatting'
import { useApiError } from '../../context/ApiErrorContext'

const EMPTY_FORM = {
  fromAccountId: '',
  toAccountId:   '',
  amount:        '',
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function ClientTransfersPage() {
  useWindowTitle('Transfer | AnkaBanka')
  const navigate = useNavigate()
  const { accounts, reload: reloadAccounts } = useClientAccounts()
  const { addSuccess } = useApiError()

  const [form, setForm]       = useState(EMPTY_FORM)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)

  const [history, setHistory]           = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)

  const loadHistory = useCallback(async () => {
    try {
      const data = await transferService.getTransfers()
      setHistory(data)
    } catch {
      // silently ignore — history is non-critical
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const fromAccount = accounts.find((a) => a.id === Number(form.fromAccountId))
  const toAccount   = accounts.find((a) => a.id === Number(form.toAccountId))

  const accountNameByNumber = (number) =>
    accounts.find((a) => a.accountNumber === number)?.accountName ?? number

  const accountCurrencyByNumber = (number) =>
    accounts.find((a) => a.accountNumber === number)?.currency ?? ''

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!form.fromAccountId)
      errs.fromAccountId = 'Please select an account.'
    if (!form.toAccountId)
      errs.toAccountId = 'Please select an account.'
    if (form.fromAccountId && form.toAccountId && form.fromAccountId === form.toAccountId)
      errs.toAccountId = 'Source and destination accounts must be different.'
    if (!form.amount)
      errs.amount = 'Amount is required.'
    else if (parseFloat(form.amount) <= 0)
      errs.amount = 'Amount must be greater than 0.'
    else if (fromAccount && parseFloat(form.amount) > fromAccount.availableBalance)
      errs.amount = `Insufficient funds. Available: ${fmt(fromAccount.availableBalance, fromAccount.currency)}`
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await transferService.createTransfer({
        fromAccount: fromAccount.accountNumber,
        toAccount:   toAccount.accountNumber,
        amount:      parseFloat(form.amount),
      })
      await reloadAccounts()
      await loadHistory()
      addSuccess(`${fmt(parseFloat(form.amount), fromAccount.currency)} transferred to ${toAccount.accountName}.`, 'Transfer Successful')
      setSuccess({
        from:   fromAccount,
        to:     toAccount,
        amount: parseFloat(form.amount),
      })
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setForm(EMPTY_FORM)
    setErrors({})
    setSuccess(null)
  }

  // ─── Success screen ───────────────────────────────────────────────────────────

  if (success) {
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-2xl mx-auto w-full flex flex-col items-center text-center gap-6 pt-20">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-2">Transfer initiated</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
              {fmt(success.amount, success.from.currency)} from{' '}
              <span className="text-slate-900 dark:text-white">{success.from.accountName}</span> to{' '}
              <span className="text-slate-900 dark:text-white">{success.to.accountName}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="btn-primary">New transfer</button>
            <button
              onClick={() => navigate('/client/accounts')}
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
            >
              My accounts
            </button>
          </div>
        </div>
      </ClientPortalLayout>
    )
  }

  // ─── Form ─────────────────────────────────────────────────────────────────────

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-4xl mx-auto w-full">

        <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">Transfer</h1>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <form onSubmit={handleSubmit} noValidate className="space-y-6 max-w-2xl">

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Accounts</p>

            {/* From */}
            <Field label="From *" error={errors.fromAccountId}>
              <div className="relative">
                <select
                  name="fromAccountId"
                  value={form.fromAccountId}
                  onChange={handleChange}
                  className={`input-field appearance-none pr-10 ${errors.fromAccountId ? 'input-error' : ''}`}
                >
                  <option value="">Select account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} — {a.accountNumber}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {fromAccount && (
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Available: <span className="text-slate-600 dark:text-slate-300">{fmt(fromAccount.availableBalance, fromAccount.currency)}</span>
                </p>
              )}
            </Field>

            {/* Arrow */}
            <div className="flex justify-center text-slate-300 dark:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* To */}
            <Field label="To *" error={errors.toAccountId}>
              <div className="relative">
                <select
                  name="toAccountId"
                  value={form.toAccountId}
                  onChange={handleChange}
                  className={`input-field appearance-none pr-10 ${errors.toAccountId ? 'input-error' : ''}`}
                >
                  <option value="">Select account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} — {a.accountNumber}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {toAccount && (
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  Balance: <span className="text-slate-600 dark:text-slate-300">{fmt(toAccount.availableBalance, toAccount.currency)}</span>
                </p>
              )}
            </Field>
          </div>

          {/* Amount */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Amount</p>
            <Field label="Amount *" error={errors.amount}>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className={`input-field pr-16 ${errors.amount ? 'input-error' : ''}`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
                  {fromAccount?.currency ?? 'RSD'}
                </span>
              </div>
            </Field>

            {/* Cross-currency commission notice */}
            {fromAccount && toAccount && fromAccount.currency !== toAccount.currency && (
              <div className="flex items-start gap-2 py-3 px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg">
                <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-light">
                  Currency conversion applies ({fromAccount.currency} → {toAccount.currency}).
                  A <span className="font-medium">0.5% commission</span> will be charged
                  {parseFloat(form.amount) > 0
                    ? <> — approximately <span className="font-medium">{fmt(Math.round(parseFloat(form.amount) * 0.005 * 100) / 100, fromAccount.currency)}</span></>
                    : null
                  }.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing…' : 'Transfer'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/client/accounts')}
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

        </form>

        {/* Transfer history */}
        <div className="mt-10">
          <h2 className="font-serif text-xl font-light text-slate-900 dark:text-white mb-1">History</h2>
          <div className="w-6 h-px bg-violet-500 dark:bg-violet-400 mb-5" />

          {historyLoading ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No transfers yet.</p>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Date</th>
                    <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">From</th>
                    <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">To</th>
                    <th className="text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Amount</th>
                    <th className="text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Fee</th>
                    <th className="text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`${i !== history.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                    >
                      <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 font-light whitespace-nowrap">
                        {new Date(t.timestamp).toLocaleString('sr-RS')}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 font-light">{accountNameByNumber(t.fromAccount)}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-700 dark:text-slate-300 font-light">{accountNameByNumber(t.toAccount)}</td>
                      <td className="px-5 py-3.5 text-sm text-right whitespace-nowrap">
                        <span className="text-slate-900 dark:text-white font-medium">{fmt(t.initialAmount)} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">{accountCurrencyByNumber(t.fromAccount)}</span></span>
                        {t.initialAmount !== t.finalAmount && (
                          <span className="ml-1 text-slate-400 dark:text-slate-500 text-xs">→ {fmt(t.finalAmount)} {accountCurrencyByNumber(t.toAccount)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right text-slate-500 dark:text-slate-400 font-light whitespace-nowrap">
                        {t.fee > 0 ? `${fmt(t.fee)} ${accountCurrencyByNumber(t.fromAccount)}` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-right text-slate-500 dark:text-slate-400 font-light whitespace-nowrap">
                        {t.exchangeRate !== 1 ? t.exchangeRate.toFixed(4) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </ClientPortalLayout>
  )
}
