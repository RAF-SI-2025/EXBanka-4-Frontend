import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAuth } from '../../context/AuthContext'
import { fundService } from '../../services/fundService'
import { accountService } from '../../services/accountService'
import { fmt } from '../../utils/formatting'

// ── Invest Modal ──────────────────────────────────────────────────────────────

function InvestModal({ fund, onClose, onSuccess }) {
  const [amount, setAmount]                   = useState('')
  const [sourceAccountId, setSourceAccountId] = useState('')
  const [accounts, setAccounts]               = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [amountError, setAmountError]         = useState('')
  const [submitting, setSubmitting]           = useState(false)

  useEffect(() => {
    accountService.getAccounts()
      .then(list => {
        setAccounts(list)
        if (list.length > 0) setSourceAccountId(String(list[0].id))
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false))
  }, [])

  function validateAmount(val) {
    const n = Number(val)
    if (!val || isNaN(n) || n <= 0) { setAmountError('Please enter a valid amount.'); return false }
    if (n < fund.minimumContribution) { setAmountError(`Minimum contribution is ${fmt(fund.minimumContribution, 'RSD')}.`); return false }
    setAmountError(''); return true
  }

  async function handleSubmit() {
    if (!validateAmount(amount)) return
    setSubmitting(true)
    try {
      await fundService.invest(fund.id, { sourceAccountId: Number(sourceAccountId), amount: Number(amount) })
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Invest</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fund.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (RSD) — minimum {fmt(fund.minimumContribution, 'RSD')}</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setAmountError('') }} onBlur={() => amount && validateAmount(amount)} placeholder={`${fund.minimumContribution}`} className={`input-field w-full text-sm${amountError ? ' input-error' : ''}`} />
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
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || accountsLoading || accounts.length === 0} className="btn-primary text-xs px-5 py-2 disabled:opacity-50">{submitting ? 'Investing…' : 'Invest'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Bank Deposit Modal ────────────────────────────────────────────────────────

function BankDepositModal({ fund, onClose, onSuccess }) {
  const [amount, setAmount]                   = useState('')
  const [bankAccountId, setBankAccountId]     = useState('')
  const [accounts, setAccounts]               = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [amountError, setAmountError]         = useState('')
  const [submitting, setSubmitting]           = useState(false)

  useEffect(() => {
    accountService.getBankAccounts()
      .then(list => {
        const rsd = list.filter(a => a.currencyCode === 'RSD')
        setAccounts(rsd)
        if (rsd.length > 0) setBankAccountId(String(rsd[0].id))
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false))
  }, [])

  async function handleSubmit() {
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) { setAmountError('Please enter a valid amount.'); return }
    if (n < fund.minimumContribution) { setAmountError(`Minimum contribution is ${fmt(fund.minimumContribution, 'RSD')}.`); return }
    setAmountError('')
    setSubmitting(true)
    try {
      await fundService.invest(fund.id, { sourceAccountId: Number(bankAccountId), amount: n })
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Bank Deposit</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fund.name}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (RSD) — minimum {fmt(fund.minimumContribution, 'RSD')}</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setAmountError('') }} placeholder={`${fund.minimumContribution}`} className={`input-field w-full text-sm${amountError ? ' input-error' : ''}`} />
            {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bank Account (RSD)</label>
            {accountsLoading ? <p className="text-xs text-slate-400">Loading accounts…</p> : accounts.length === 0 ? <p className="text-xs text-slate-400">No RSD bank accounts available.</p> : (
              <select value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className="input-field w-full text-sm">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName ?? a.currencyCode}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || accountsLoading || accounts.length === 0 || !amount} className="btn-primary text-xs px-5 py-2 disabled:opacity-50">{submitting ? 'Depositing…' : 'Deposit'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Withdraw Modal ────────────────────────────────────────────────────────────

function WithdrawModal({ fund, isSupervisor, onClose, onSuccess }) {
  const [amount, setAmount]                         = useState('')
  const [destinationAccountId, setDestinationAccountId] = useState('')
  const [accounts, setAccounts]                     = useState([])
  const [accountsLoading, setAccountsLoading]       = useState(true)
  const [amountError, setAmountError]               = useState('')
  const [submitting, setSubmitting]                 = useState(false)

  useEffect(() => {
    const fetch = isSupervisor ? accountService.getBankAccounts() : accountService.getAccounts()
    fetch
      .then(list => {
        const filtered = isSupervisor ? list.filter(a => a.currencyCode === 'RSD') : list
        setAccounts(filtered)
        if (filtered.length > 0) setDestinationAccountId(String(filtered[0].id))
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false))
  }, [isSupervisor])

  async function handleSubmit() {
    const n = Number(amount)
    if (!amount || isNaN(n) || n <= 0) { setAmountError('Please enter a valid amount.'); return }
    setAmountError('')
    setSubmitting(true)
    try {
      await fundService.withdraw(fund.id, { destinationAccountId: Number(destinationAccountId), amount: n })
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Withdraw</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fund.name}</h2>
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
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Destination Account{isSupervisor ? ' (RSD)' : ''}</label>
            {accountsLoading ? <p className="text-xs text-slate-400">Loading accounts…</p> : accounts.length === 0 ? <p className="text-xs text-slate-400">No accounts available.</p> : (
              <select value={destinationAccountId} onChange={e => setDestinationAccountId(e.target.value)} className="input-field w-full text-sm">
                {accounts.map(a => <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName ?? a.currencyCode}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || accountsLoading || accounts.length === 0} className="btn-primary text-xs px-5 py-2 disabled:opacity-50">{submitting ? 'Withdrawing…' : 'Withdraw'}</button>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, highlight }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
      <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">{label}</p>
      <p className={`text-2xl font-light tabular-nums ${highlight ?? 'text-slate-900 dark:text-white'}`}>{value}</p>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FundDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  useWindowTitle('Fund Detail | AnkaBanka')

  const [fund, setFund]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError]       = useState(false)
  const [modal, setModal]       = useState(null) // 'invest' | 'deposit' | 'withdraw'

  const isSupervisor = user?.permissions?.isSupervisor
  const isAgent      = user?.permissions?.isAgent

  const load = useCallback(async () => {
    setLoading(true)
    setNotFound(false)
    setError(false)
    try {
      const data = await fundService.getFund(id)
      setFund(data)
    } catch (e) {
      if (e?.response?.status === 404) setNotFound(true)
      else setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading fund…</p>
      </div>
    )
  }

  if (notFound || error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{notFound ? 'Fund not found.' : 'Failed to load fund.'}</p>
          <Link to="/investment/funds" className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:underline">← Back to Funds</Link>
        </div>
      </div>
    )
  }

  const profitColor = (fund.profit ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <Link to="/investment/funds" className="inline-flex items-center gap-1 text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-8">
          ← Investment Funds
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-2">Investment Fund</p>
            <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">{fund.name}</h1>
          </div>
          <span className={`mt-2 px-3 py-1 text-xs font-medium rounded-full ${fund.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            {fund.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-6" />

        {fund.description && (
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 max-w-2xl">{fund.description}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400 mb-8">
          {fund.managerName && <span>Manager: <span className="text-slate-900 dark:text-white font-medium">{fund.managerName}</span></span>}
          {fund.accountNumber && <span>Account: <span className="text-slate-900 dark:text-white font-mono text-xs">{fund.accountNumber}</span></span>}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Fund Value"           value={fmt(fund.fundValue   ?? 0, 'RSD')} />
          <StatCard label="Liquid Assets"        value={fmt(fund.liquidAssets ?? 0, 'RSD')} />
          <StatCard label="Profit"               value={`${(fund.profit ?? 0) >= 0 ? '+' : ''}${fmt(fund.profit ?? 0, 'RSD')}`} highlight={profitColor} />
          <StatCard label="Min. Contribution"    value={fmt(fund.minimumContribution ?? 0, 'RSD')} />
        </div>

        {/* Action buttons */}
        {(isAgent || isSupervisor) && (
          <div className="flex items-center gap-3 mb-8 flex-wrap">
            {isAgent && (
              <button onClick={() => setModal('invest')} className="btn-primary text-xs px-5 py-2">Invest</button>
            )}
            {isSupervisor && (
              <button
                onClick={() => setModal('deposit')}
                className="text-xs px-5 py-2 border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all duration-200"
              >
                Deposit
              </button>
            )}
            {(isAgent || isSupervisor) && (
              <button
                onClick={() => setModal('withdraw')}
                className="text-xs px-5 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
              >
                Withdraw
              </button>
            )}
          </div>
        )}

        {/* Securities stub */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-4">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-3">Securities Holdings</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Securities holdings will appear here once the fund portfolio API is available.</p>
        </div>

        {/* Performance stub */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-3">Performance History</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Fund performance history will appear here.</p>
        </div>

      </div>

      {modal === 'invest' && (
        <InvestModal fund={fund} onClose={() => setModal(null)} onSuccess={() => { setModal(null); load() }} />
      )}
      {modal === 'deposit' && (
        <BankDepositModal fund={fund} onClose={() => setModal(null)} onSuccess={() => { setModal(null); load() }} />
      )}
      {modal === 'withdraw' && (
        <WithdrawModal fund={fund} isSupervisor={isSupervisor} onClose={() => setModal(null)} onSuccess={() => { setModal(null); load() }} />
      )}
    </div>
  )
}
