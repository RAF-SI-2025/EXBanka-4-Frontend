import { useState, useEffect } from 'react'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import Spinner from '../../components/Spinner'
import { exchangeService } from '../../services/exchangeService'
import { useClientAccounts } from '../../context/ClientAccountsContext'
import { useClientAuth } from '../../context/ClientAuthContext'
import { fmt } from '../../utils/formatting'

const CURRENCY_META = {
  EUR: { name: 'Euro',              symbol: '€'   },
  CHF: { name: 'Swiss Franc',       symbol: 'Fr'  },
  USD: { name: 'US Dollar',         symbol: '$'   },
  GBP: { name: 'British Pound',     symbol: '£'   },
  JPY: { name: 'Japanese Yen',      symbol: '¥'   },
  CAD: { name: 'Canadian Dollar',   symbol: 'CA$' },
  AUD: { name: 'Australian Dollar', symbol: 'AU$' },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function StepIndicator({ current }) {
  const steps = ['Accounts', 'Amount', 'Confirm']
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((label, i) => {
        const idx = i + 1
        const done    = idx < current
        const active  = idx === current
        return (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors
              ${done   ? 'bg-emerald-500 text-white'
              : active ? 'bg-violet-600 text-white'
              :          'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}>
              {done ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : idx}
            </div>
            <span className={`text-xs font-light ${active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${done ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function DetailRow({ label, value, highlight }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-light">{label}</span>
      <span className={`text-sm font-light ${highlight ? 'text-violet-700 dark:text-violet-300 font-medium' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientExchangePage() {
  useWindowTitle('Exchange | AnkaBanka')
  const { accounts, loading: accountsLoading, reload: reloadAccounts } = useClientAccounts()
  const { clientUser } = useClientAuth()

  // ── Rates table state ────────────────────────────────────────────────────────
  const [rates, setRates]         = useState([])
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesError, setRatesError]     = useState(null)

  useEffect(() => {
    exchangeService.getRates()
      .then(setRates)
      .catch(() => setRatesError('Failed to load exchange rates.'))
      .finally(() => setRatesLoading(false))
  }, [])

  // ── History state ────────────────────────────────────────────────────────────
  const [history, setHistory]               = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError]     = useState(null)

  function loadHistory() {
    setHistoryLoading(true)
    exchangeService.getHistory()
      .then(setHistory)
      .catch(() => setHistoryError('Failed to load transaction history.'))
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => { loadHistory() }, [])

  // ── Exchange form state ──────────────────────────────────────────────────────
  const [step, setStep]             = useState(1) // 1 | 2 | 3 | 'success'
  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId]     = useState('')
  const [amount, setAmount]         = useState('')
  const [errors, setErrors]         = useState({})
  const [preview, setPreview]       = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitLoading, setSubmitLoading]   = useState(false)
  const [submitError, setSubmitError]       = useState(null)
  const [successTx, setSuccessTx]   = useState(null)

  const fromAccount = accounts.find(a => String(a.id) === fromAccountId)
  const toAccount   = accounts.find(a => String(a.id) === toAccountId)

  // Accounts eligible as "to" — must differ in currency from selected "from" account
  const toOptions = fromAccount
    ? accounts.filter(a => a.currency !== fromAccount.currency)
    : accounts

  // Account eligibility check
  const hasRsd     = accounts.some(a => a.currency === 'RSD')
  const hasForeign = accounts.some(a => a.currency !== 'RSD')
  const canExchange = hasRsd && hasForeign

  // Live estimate on amount step (uses selling rate already fetched for the table)
  const estimatedReceive = (() => {
    if (!fromAccount || !toAccount || !amount || !rates.length) return null
    const amtNum = parseFloat(amount)
    if (!amtNum || amtNum <= 0) return null
    const COMMISSION = 0.005

    const getRate = (code) => {
      if (code === 'RSD') return 1.0
      return rates.find(r => r.currencyCode === code)?.sellingRate ?? null
    }
    const fromR = getRate(fromAccount.currency)
    const toR   = getRate(toAccount.currency)
    if (!fromR || !toR) return null

    let to
    if (fromAccount.currency === 'RSD')      to = (amtNum / toR) * (1 - COMMISSION)
    else if (toAccount.currency === 'RSD')   to = amtNum * fromR * (1 - COMMISSION)
    else {
      const rsd = amtNum * fromR * (1 - COMMISSION)
      to = (rsd / toR) * (1 - COMMISSION)
    }
    return Math.round(to * 100) / 100
  })()

  function resetForm() {
    setStep(1)
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
    setErrors({})
    setPreview(null)
    setSubmitError(null)
    setSuccessTx(null)
  }

  // Step 1 → 2
  function handleAccountsNext() {
    const errs = {}
    if (!fromAccountId) errs.fromAccountId = 'Please select an account.'
    if (!toAccountId)   errs.toAccountId   = 'Please select an account.'
    if (fromAccountId && toAccountId && fromAccountId === toAccountId)
      errs.toAccountId = 'Source and destination accounts must be different.'
    if (fromAccount && toAccount && fromAccount.currency === toAccount.currency)
      errs.toAccountId = 'Accounts must have different currencies.'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(2)
  }

  // Step 2 → 3: fetch exact preview
  async function handleAmountNext() {
    const errs = {}
    const amtNum = parseFloat(amount)
    if (!amount || isNaN(amtNum) || amtNum <= 0)
      errs.amount = 'Please enter a valid amount greater than 0.'
    else if (fromAccount && amtNum > fromAccount.availableBalance)
      errs.amount = `Insufficient funds. Available: ${fmt(fromAccount.availableBalance, fromAccount.currency)}`
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})

    setPreviewLoading(true)
    try {
      const data = await exchangeService.preview({
        fromCurrency: fromAccount.currency,
        toCurrency:   toAccount.currency,
        amount:       amtNum,
      })
      setPreview(data)
      setStep(3)
    } catch {
      setErrors({ amount: 'Could not fetch conversion preview. Please try again.' })
    } finally {
      setPreviewLoading(false)
    }
  }

  // Step 3: submit
  async function handleConfirm() {
    setSubmitError(null)
    setSubmitLoading(true)
    try {
      const tx = await exchangeService.convert({
        fromAccount: fromAccount.accountNumber,
        toAccount:   toAccount.accountNumber,
        amount:      parseFloat(amount),
      })
      await reloadAccounts()
      loadHistory()
      setSuccessTx(tx)
      setStep('success')
    } catch (err) {
      setSubmitError(err.response?.data?.error ?? 'Conversion failed. Please try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  // ─── Account eligibility notices ─────────────────────────────────────────────
  const eligibilityNotice = !accountsLoading && (
    !hasRsd ? (
      <div className="mb-6 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4">
        <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <p className="text-sm text-amber-700 dark:text-amber-300 font-light">
          You don't have an RSD account. An RSD account is required to use the exchange service.
          Please contact your bank to open one.
        </p>
      </div>
    ) : !hasForeign ? (
      <div className="mb-6 flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-xl p-4">
        <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-blue-700 dark:text-blue-300 font-light">
          You don't have any foreign currency accounts. To exchange currencies, you need a foreign
          currency account in addition to your RSD account. Please contact your bank to open one.
        </p>
      </div>
    ) : null
  )

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-4xl mx-auto w-full">
        <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">Exchange</h1>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {eligibilityNotice}

        {/* ── Rates table ───────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-10">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-light">Today's rates vs RSD</p>
          </div>
          {ratesLoading ? (
            <div className="py-12"><Spinner /></div>
          ) : ratesError ? (
            <div className="px-6 py-8 text-sm text-red-500 text-center">{ratesError}</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-3 text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Currency</th>
                  <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Buying</th>
                  <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Middle</th>
                  <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Selling</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const owned = rates.filter(r => accounts.some(a => a.currency === r.currencyCode))
                  const other = rates.filter(r => !accounts.some(a => a.currency === r.currencyCode))
                  const renderRow = (rate) => {
                    const meta = CURRENCY_META[rate.currencyCode] ?? { name: rate.currencyCode, symbol: rate.currencyCode }
                    const isOwned = accounts.some(a => a.currency === rate.currencyCode)
                    return (
                      <tr key={rate.currencyCode} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 flex items-center justify-center rounded-full bg-violet-50 dark:bg-violet-900/30 text-sm font-semibold text-violet-600 dark:text-violet-400 shrink-0">
                              {meta.symbol}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{rate.currencyCode}</p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 font-light">{meta.name}</p>
                            </div>
                            {isOwned && (
                              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-light">owned</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{rate.buyingRate.toFixed(4)}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm font-medium text-slate-900 dark:text-white">{rate.middleRate.toFixed(4)}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-700 dark:text-slate-300">{rate.sellingRate.toFixed(4)}</td>
                      </tr>
                    )
                  }
                  return (
                    <>
                      {owned.map(renderRow)}
                      {owned.length > 0 && other.length > 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50">
                            <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Other currencies</p>
                          </td>
                        </tr>
                      )}
                      {other.map(renderRow)}
                    </>
                  )
                })()}
              </tbody>
            </table>
          )}
          {rates.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-light text-right">Rates as of {rates[0].date}</p>
            </div>
          )}
        </div>

        {/* ── Exchange form ─────────────────────────────────────────────────────── */}
        <div className="max-w-2xl">
          <h2 className="font-serif text-xl font-light text-slate-900 dark:text-white mb-1">Currency conversion</h2>
          <div className="w-6 h-px bg-violet-500 dark:bg-violet-400 mb-6" />

          {/* Success screen */}
          {step === 'success' && successTx && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center text-center gap-5">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">Conversion complete</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                  {fmt(successTx.fromAmount, successTx.fromCurrency)} converted to{' '}
                  <span className="text-slate-900 dark:text-white">{fmt(successTx.toAmount, successTx.toCurrency)}</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">Transaction #{successTx.transactionId}</p>
              </div>
              <button onClick={resetForm} className="btn-primary">New conversion</button>
            </div>
          )}

          {/* Multi-step form */}
          {step !== 'success' && (
            <>
              {!canExchange && !accountsLoading ? null : (
                <>
                  {typeof step === 'number' && <StepIndicator current={step} />}

                  {/* ── Step 1: Account selection ─────────────────────────────────── */}
                  {step === 1 && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5">
                      <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Select accounts</p>

                      <Field label="From account *" error={errors.fromAccountId}>
                        <div className="relative">
                          <select
                            value={fromAccountId}
                            onChange={e => { setFromAccountId(e.target.value); setToAccountId(''); setErrors({}) }}
                            className={`input-field appearance-none pr-10 ${errors.fromAccountId ? 'input-error' : ''}`}
                          >
                            <option value="">Select account…</option>
                            {accounts.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.accountName} ({a.currency}) — {a.accountNumber}
                              </option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {fromAccount && (
                          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                            Available: <span className="text-slate-600 dark:text-slate-300">{fmt(fromAccount.availableBalance, fromAccount.currency)}</span>
                          </p>
                        )}
                      </Field>

                      <div className="flex justify-center text-slate-300 dark:text-slate-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </div>

                      <Field label="To account *" error={errors.toAccountId}>
                        <div className="relative">
                          <select
                            value={toAccountId}
                            onChange={e => { setToAccountId(e.target.value); setErrors(p => ({ ...p, toAccountId: undefined })) }}
                            disabled={!fromAccountId}
                            className={`input-field appearance-none pr-10 ${errors.toAccountId ? 'input-error' : ''} disabled:opacity-50`}
                          >
                            <option value="">Select account…</option>
                            {toOptions.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.accountName} ({a.currency}) — {a.accountNumber}
                              </option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                        {toAccount && (
                          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                            Balance: <span className="text-slate-600 dark:text-slate-300">{fmt(toAccount.availableBalance, toAccount.currency)}</span>
                          </p>
                        )}
                      </Field>

                      <div className="pt-2">
                        <button onClick={handleAccountsNext} className="btn-primary">Next</button>
                      </div>
                    </div>
                  )}

                  {/* ── Step 2: Amount entry ──────────────────────────────────────── */}
                  {step === 2 && (
                    <div className="space-y-4">
                      {/* Account summary */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Accounts</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 text-center">
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">From</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{fromAccount.accountName}</p>
                            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{fromAccount.currency}</p>
                          </div>
                          <svg className="w-5 h-5 text-slate-300 dark:text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <div className="flex-1 text-center">
                            <p className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">To</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{toAccount.accountName}</p>
                            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{toAccount.currency}</p>
                          </div>
                        </div>
                      </div>

                      {/* Amount input */}
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
                        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Amount</p>
                        <Field label={`Amount in ${fromAccount.currency} *`} error={errors.amount}>
                          <div className="relative">
                            <input
                              type="number"
                              value={amount}
                              onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: undefined })) }}
                              placeholder="0.00"
                              min="0.01"
                              step="0.01"
                              className={`input-field pr-16 ${errors.amount ? 'input-error' : ''}`}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
                              {fromAccount.currency}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                            Available: <span className="text-slate-600 dark:text-slate-300">{fmt(fromAccount.availableBalance, fromAccount.currency)}</span>
                          </p>
                        </Field>

                        {/* Live estimate */}
                        {estimatedReceive !== null && (
                          <div className="flex items-center gap-2 py-3 px-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                            <svg className="w-4 h-4 text-violet-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-violet-700 dark:text-violet-300 font-light">
                              Estimated: <span className="font-medium">{fmt(estimatedReceive, toAccount.currency)}</span>
                              <span className="ml-1 text-violet-500 dark:text-violet-400">(indicative, includes commission)</span>
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button onClick={handleAmountNext} disabled={previewLoading} className="btn-primary">
                          {previewLoading ? 'Loading…' : 'Review'}
                        </button>
                        <button
                          onClick={() => { setStep(1); setErrors({}) }}
                          className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── Step 3: Confirmation ──────────────────────────────────────── */}
                  {step === 3 && preview && (
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Review conversion</p>

                        {clientUser && (
                          <DetailRow
                            label="Client"
                            value={`${clientUser.firstName} ${clientUser.lastName}`}
                          />
                        )}
                        <DetailRow label="From account" value={fromAccount.accountNumber} />
                        <DetailRow label="From currency" value={preview.fromCurrency} />
                        <DetailRow label="Amount" value={fmt(preview.fromAmount, preview.fromCurrency)} />
                        <DetailRow label="To account"   value={toAccount.accountNumber} />
                        <DetailRow label="To currency"  value={preview.toCurrency} />
                        <DetailRow label="Rate"         value={`1 ${preview.fromCurrency} = ${preview.rate.toFixed(4)} ${preview.toCurrency}`} />
                        <DetailRow label="Commission"   value={fmt(preview.commission, preview.fromCurrency)} />
                        <DetailRow label="You receive"  value={fmt(preview.toAmount, preview.toCurrency)} highlight />
                      </div>

                      {submitError && (
                        <p className="text-sm text-red-500 text-center">{submitError}</p>
                      )}

                      <div className="flex gap-3">
                        <button onClick={handleConfirm} disabled={submitLoading} className="btn-primary">
                          {submitLoading ? 'Processing…' : 'Confirm'}
                        </button>
                        <button
                          onClick={resetForm}
                          className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Transaction history ───────────────────────────────────────────────── */}
        <div className="mt-12">
          <h2 className="font-serif text-xl font-light text-slate-900 dark:text-white mb-1">Transaction history</h2>
          <div className="w-6 h-px bg-violet-500 dark:bg-violet-400 mb-6" />

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {historyLoading ? (
              <div className="py-12"><Spinner /></div>
            ) : historyError ? (
              <div className="px-6 py-8 text-sm text-red-500 text-center">{historyError}</div>
            ) : history.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-slate-400 dark:text-slate-500 font-light">
                No exchange transactions yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-3 text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Date</th>
                    <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">From</th>
                    <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">To</th>
                    <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Rate</th>
                    <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Commission</th>
                    <th className="px-6 py-3 text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-light">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((tx) => {
                    const date = new Date(tx.timestamp).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })
                    const statusColor =
                      tx.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : tx.status === 'PENDING'   ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      :                             'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-light whitespace-nowrap">{date}</td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-slate-900 dark:text-white">
                          {fmt(tx.fromAmount, tx.fromCurrency)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          {fmt(tx.toAmount, tx.toCurrency)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          {tx.rate.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                          {fmt(tx.commission, tx.fromCurrency)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-light ${statusColor}`}>
                            {tx.status.toLowerCase()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
            {history.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-light">{history.length} transaction{history.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </ClientPortalLayout>
  )
}
