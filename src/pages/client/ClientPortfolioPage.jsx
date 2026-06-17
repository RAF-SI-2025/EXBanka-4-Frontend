import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { clientPortfolioService } from '../../services/clientPortfolioService'
import { clientAccountService } from '../../services/clientAccountService'
import { clientDividendService } from '../../services/dividendService'
import { fmt, fundErrorMessage } from '../../utils/formatting'

const TABS = [
  { label: 'All Securities',    key: 'all' },
  { label: 'Public Securities', key: 'public' },
  { label: 'My Funds',         key: 'funds' },
  { label: 'Dividends',        key: 'dividends' },
]

function TypeBadge({ type }) {
  return (
    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded font-mono">
      {type || '—'}
    </span>
  )
}

// ── Client Invest Modal ───────────────────────────────────────────────────────

function ClientInvestModal({ position, onClose, onSuccess }) {
  const [amount, setAmount]                   = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [accounts, setAccounts]               = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [amountError, setAmountError]         = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [success, setSuccess]                 = useState(false)
  const [submitError, setSubmitError]         = useState('')

  useEffect(() => {
    clientAccountService.getMyAccounts()
      .then(list => {
        setAccounts(list)
        if (list.length > 0) setSourceAccountId(String(list[0].id))
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false))
  }, [])

  async function handleSubmit() {
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) { setAmountError('Please enter a valid amount.'); return }
    setAmountError('')
    setSubmitting(true)
    try {
      await clientPortfolioService.investInFund(position.fundId ?? position.id, { sourceAccountId: Number(sourceAccountId), amount: n })
      setSuccess(true)
    } catch (e) {
      setSubmitError(fundErrorMessage(e, 'invest'))
    } finally {
      setSubmitting(false)
    }
  }

  const fundName = position.fundName ?? position.name ?? 'Fund'

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs tracking-widest uppercase text-emerald-500 mb-0.5">Success</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fundName}</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-slate-600 dark:text-slate-300">Investment successful.</p>
          </div>
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button onClick={onSuccess} className="btn-primary text-xs px-5 py-2">OK</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Invest</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fundName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (RSD)</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setAmountError('') }} placeholder="0.00" className={`input-field w-full text-sm${amountError ? ' input-error' : ''}`} />
            {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Source Account</label>
            {accountsLoading ? <p className="text-xs text-slate-400">Loading accounts…</p> : accounts.length === 0 ? <p className="text-xs text-slate-400">No accounts available.</p> : (
              <select value={sourceAccountId} onChange={e => setSourceAccountId(e.target.value)} className="input-field w-full text-sm">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName ?? a.currencyCode}</option>)}
              </select>
            )}
          </div>
        </div>
        {submitError && <p className="px-6 pb-2 text-xs text-red-500">{submitError}</p>}
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || accountsLoading || accounts.length === 0} className="btn-primary text-xs px-5 py-2 disabled:opacity-50">{submitting ? 'Investing…' : 'Invest'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Client Withdraw Modal ─────────────────────────────────────────────────────

function ClientWithdrawModal({ position, onClose, onSuccess }) {
  const [amount, setAmount]                           = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [accounts, setAccounts]                       = useState([])
  const [accountsLoading, setAccountsLoading]         = useState(true)
  const [amountError, setAmountError]                 = useState('')
  const [submitting, setSubmitting]                   = useState(false)
  const [success, setSuccess]                         = useState(false)
  const [pending, setPending]                         = useState(false)
  const [commission, setCommission]                   = useState(null)
  const [submitError, setSubmitError]                 = useState('')

  useEffect(() => {
    clientAccountService.getMyAccounts()
      .then(list => {
        setAccounts(list)
        if (list.length > 0) setDestinationAccountId(String(list[0].id))
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false))
  }, [])

  async function handleSubmit() {
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) { setAmountError('Please enter a valid amount.'); return }
    setAmountError('')
    setSubmitting(true)
    try {
      const result = await clientPortfolioService.withdrawFromFund(position.fundId ?? position.id, { destinationAccountId: Number(destinationAccountId), amount: n })
      if (result?.pending) {
        setPending(true)
      } else {
        if (result?.commission != null) setCommission(result.commission)
        setSuccess(true)
      }
    } catch (e) {
      setSubmitError(fundErrorMessage(e, 'withdraw'))
    } finally {
      setSubmitting(false)
    }
  }

  const fundName = position.fundName ?? position.name ?? 'Fund'

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs tracking-widest uppercase text-emerald-500 mb-0.5">Success</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fundName}</h2>
          </div>
          <div className="px-6 py-5 flex flex-col gap-2">
            <p className="text-sm text-slate-600 dark:text-slate-300">Withdrawal successful.</p>
            {commission != null && (
              <p className="text-sm text-slate-600 dark:text-slate-300">Commission: {fmt(commission, 'RSD')}</p>
            )}
          </div>
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button onClick={onSuccess} className="btn-primary text-xs px-5 py-2">OK</button>
          </div>
        </div>
      </div>
    )
  }

  if (pending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs tracking-widest uppercase text-amber-500 mb-0.5">Payment in Progress</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fundName}</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-slate-600 dark:text-slate-300">The fund does not have sufficient liquid assets. Your withdrawal is being processed — funds will be transferred shortly.</p>
          </div>
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button onClick={onSuccess} className="btn-primary text-xs px-5 py-2">OK</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Withdraw</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fundName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (RSD)</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setAmountError('') }} placeholder="0.00" className={`input-field w-full text-sm${amountError ? ' input-error' : ''}`} />
            {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Destination Account</label>
            {accountsLoading ? <p className="text-xs text-slate-400">Loading accounts…</p> : accounts.length === 0 ? <p className="text-xs text-slate-400">No accounts available.</p> : (
              <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)} className="input-field w-full text-sm">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName ?? a.currencyCode}</option>)}
              </select>
            )}
          </div>
        </div>
        {submitError && <p className="px-6 pb-2 text-xs text-red-500">{submitError}</p>}
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || accountsLoading || accounts.length === 0} className="btn-primary text-xs px-5 py-2 disabled:opacity-50">{submitting ? 'Withdrawing…' : 'Withdraw'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ClientPortfolioPage() {
  useWindowTitle('Portfolio | AnkaBanka')
  const navigate = useNavigate()
  const location = useLocation()

  const [holdings,     setHoldings]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [activeTab,    setActiveTab]    = useState(TABS[0])
  const [pendingSells, setPendingSells] = useState(new Set())
  const [profit,       setProfit]       = useState(null)
  const [toggling,     setToggling]     = useState(new Set())

  async function handleTogglePublic(ticker, currentIsPublic) {
    if (toggling.has(ticker)) return
    const next = !currentIsPublic
    setToggling(prev => new Set([...prev, ticker]))
    setHoldings(prev => prev.map(h => (h.ticker === ticker ? { ...h, is_public: next } : h)))
    try {
      await clientPortfolioService.setPublicMode(ticker, next)
    } catch {
      setHoldings(prev => prev.map(h => (h.ticker === ticker ? { ...h, is_public: currentIsPublic } : h)))
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(ticker); return s })
    }
  }

  const [myFunds, setMyFunds]           = useState([])
  const [myFundsLoading, setMyFundsLoading] = useState(false)
  const [myFundsError, setMyFundsError] = useState(null)
  const [fundModal, setFundModal]       = useState(null) // { type: 'invest'|'withdraw', position }

  useEffect(() => {
    if (location.state?.pendingSell) {
      setPendingSells(prev => new Set([...prev, location.state.pendingSell]))
    }
  }, [location.state])

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      clientPortfolioService.getPortfolio(),
      clientPortfolioService.getProfit(),
    ])
      .then(([portfolioData, profitData]) => {
        const fresh = portfolioData.portfolio ?? []
        setHoldings(fresh)
        setPendingSells(prev => {
          if (prev.size === 0) return prev
          const tickers = new Set(fresh.map(h => h.ticker || String(h.listingId)))
          const updated = new Set([...prev].filter(t => tickers.has(t)))
          return updated.size === prev.size ? prev : updated
        })
        setProfit(profitData?.totalProfit ?? profitData?.profit ?? profitData ?? null)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [location.key])

  const loadMyFunds = useCallback(async () => {
    setMyFundsLoading(true)
    setMyFundsError(null)
    try {
      const data = await clientPortfolioService.getMyFundPositions()
      setMyFunds(Array.isArray(data) ? data : [])
    } catch {
      setMyFundsError(true)
    } finally {
      setMyFundsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab.key === 'funds') loadMyFunds()
  }, [activeTab.key, loadMyFunds])

  const [dividends, setDividends]         = useState([])
  const [dividendsLoading, setDivLoading] = useState(false)
  const [dividendsError, setDivError]     = useState(null)

  const loadDividends = useCallback(async () => {
    setDivLoading(true)
    setDivError(null)
    try {
      const res = await clientDividendService.getMyDividends()
      setDividends(Array.isArray(res) ? res : (res?.dividends ?? res?.payouts ?? []))
    } catch {
      setDivError(true)
    } finally {
      setDivLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab.key === 'dividends') loadDividends()
  }, [activeTab.key, loadDividends])

  const displayed = activeTab.key === 'public'
    ? holdings.filter(h => h.is_public)
    : holdings

  return (
    <ClientPortalLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">My Portfolio</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Current holdings and profit/loss</p>
          </div>
          {profit !== null && (
            <div className="text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm px-5 py-3 min-w-[140px]">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">Total Profit</p>
              <p className={`text-lg font-semibold tabular-nums ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {profit >= 0 ? '+' : ''}{fmt(profit)}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-slate-200 dark:border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors border-b-2 -mb-px ${
                activeTab.key === tab.key
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── My Funds tab ── */}
        {activeTab.key === 'funds' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            {myFundsLoading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading funds…</p>
              </div>
            ) : myFundsError ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-red-500 text-sm">Failed to load funds.</p>
              </div>
            ) : myFunds.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-slate-400 dark:text-slate-500 text-sm">You have no fund investments.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {['Fund Name', 'Fund Value', 'Invested', 'Current Value', 'Profit', '% Share', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myFunds.map((pos, i) => {
                      const profitVal = pos.myProfit ?? pos.profit ?? 0
                      const profitColor = profitVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      return (
                        <tr key={pos.fundId ?? pos.id ?? i} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                          <td className="px-4 py-3">
                            <Link to={`/client/investment/funds/${pos.fundId ?? pos.id}`} className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                              {pos.fundName ?? pos.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(pos.fundValue ?? 0, 'RSD')}</td>
                          <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(pos.totalInvestedAmount ?? pos.myInvestedAmount ?? 0, 'RSD')}</td>
                          <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(pos.currentPositionValue ?? pos.myCurrentValue ?? 0, 'RSD')}</td>
                          <td className={`px-4 py-3 tabular-nums font-medium ${profitColor}`}>
                            {profitVal >= 0 ? '+' : ''}{fmt(profitVal, 'RSD')}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                            {(pos.fundPercentage ?? pos.sharePercentage ?? 0).toFixed(2)}%
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button onClick={() => setFundModal({ type: 'invest', position: pos })} className="btn-primary text-xs px-3 py-1">
                                Invest
                              </button>
                              <button onClick={() => setFundModal({ type: 'withdraw', position: pos })} className="text-xs px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                                Withdraw
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!myFundsLoading && !myFundsError && myFunds.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                {myFunds.length} fund{myFunds.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        {/* ── Dividende tab ── */}
        {activeTab.key === 'dividends' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            {dividendsLoading ? (
              <div className="flex items-center justify-center py-20"><p className="text-slate-500 text-sm">Loading dividends…</p></div>
            ) : dividendsError ? (
              <div className="flex items-center justify-center py-20"><p className="text-red-500 text-sm">Failed to load dividends.</p></div>
            ) : dividends.length === 0 ? (
              <div className="flex items-center justify-center py-20"><p className="text-slate-400 text-sm">No dividend payouts yet.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {['Ticker', 'Date', 'Quantity', 'Gross Amount', 'Tax (RSD)', 'Net Amount', 'Currency'].map(h => (
                        <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dividends.map((d, i) => (
                      <tr key={d.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{d.ticker ?? d.stock_listing_id ?? '—'}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{d.payment_date ?? '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{d.quantity != null ? Number(d.quantity).toFixed(4) : '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{d.gross_amount != null ? fmt(d.gross_amount) : '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-amber-600 dark:text-amber-400">{d.tax_rsd != null ? fmt(d.tax_rsd) : '—'}</td>
                        <td className="px-4 py-3 tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{d.net_amount != null ? fmt(d.net_amount) : '—'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{d.currency ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Securities tabs ── */}
        {activeTab.key !== 'funds' && activeTab.key !== 'dividends' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading holdings…</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-red-500 text-sm">Failed to load portfolio.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {['Type', 'Ticker', 'Amount', 'Price', 'Profit', 'Last Modified', 'Public'].map(h => (
                        <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                      ))}
                      <th className="px-4 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                          {activeTab.key === 'public' ? 'No public holdings.' : 'No holdings found.'}
                        </td>
                      </tr>
                    ) : (
                      displayed.map((h, i) => (
                        <tr
                          key={h.id}
                          className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}
                        >
                          <td className="px-4 py-3"><TypeBadge type={h.asset_type} /></td>
                          <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{h.ticker || h.listingId}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{h.amount}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{fmt(h.price ?? 0)}</td>
                          <td className={`px-4 py-3 font-medium tabular-nums ${(h.profit ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {(h.profit ?? 0) >= 0 ? '+' : ''}{fmt(h.profit ?? 0)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{h.last_modified}</td>
                          <td className="px-4 py-3">
                            {h.asset_type === 'STOCK' ? (
                              <button
                                onClick={() => handleTogglePublic(h.ticker, h.is_public)}
                                disabled={toggling.has(h.ticker)}
                                className={`text-xs px-2 py-1 rounded border transition-colors ${
                                  h.is_public
                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400'
                                    : 'bg-slate-50 border-slate-300 text-slate-500 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {h.is_public ? 'Visible on OTC market' : 'Private'}
                              </button>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {pendingSells.has(h.ticker || String(h.listingId)) ? (
                              <span className="text-xs px-3 py-1 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed">
                                Pending…
                              </span>
                            ) : (
                              <button
                                onClick={() => navigate(`/client/orders/new?ticker=${encodeURIComponent(h.ticker || h.listingId)}&direction=SELL&maxAmount=${h.amount}`)}
                                className="border border-red-400 text-red-500 text-xs px-3 py-1 hover:bg-red-500 hover:text-white transition-all duration-150"
                              >
                                Sell
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && displayed.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                {displayed.length} holding{displayed.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

      </div>

      {fundModal?.type === 'invest' && (
        <ClientInvestModal position={fundModal.position} onClose={() => setFundModal(null)} onSuccess={() => { setFundModal(null); loadMyFunds() }} />
      )}
      {fundModal?.type === 'withdraw' && (
        <ClientWithdrawModal position={fundModal.position} onClose={() => setFundModal(null)} onSuccess={() => { setFundModal(null); loadMyFunds() }} />
      )}
    </ClientPortalLayout>
  )
}
