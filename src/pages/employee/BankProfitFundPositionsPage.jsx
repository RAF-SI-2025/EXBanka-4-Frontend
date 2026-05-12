import { useEffect, useState } from 'react'
import { Link, NavLink, Navigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { usePermission } from '../../hooks/usePermission'
import { bankProfitService } from '../../services/bankProfitService'
import { fundService } from '../../services/fundService'
import { accountService } from '../../services/accountService'
import { fmt } from '../../utils/formatting'

// ── Deposit Modal ─────────────────────────────────────────────────────────────

function DepositModal({ position, onClose, onSuccess }) {
  const [amount, setAmount]       = useState('')
  const [accountId, setAccountId] = useState('')
  const [accounts, setAccounts]   = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [amountError, setAmountError] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => {
    accountService.getBankAccounts()
      .then(list => {
        const rsd = list.filter(a => a.currencyCode === 'RSD')
        setAccounts(rsd)
        if (rsd.length > 0) setAccountId(String(rsd[0].id))
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
      await bankProfitService.bankInvest(position.fundId, { accountId: Number(accountId), amount: n })
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
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Deposit</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{position.fundName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (RSD)</label>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setAmountError('') }}
              placeholder="0.00"
              className={`input-field w-full text-sm${amountError ? ' input-error' : ''}`}
            />
            {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bank Account (RSD)</label>
            {accountsLoading ? (
              <p className="text-xs text-slate-400">Loading accounts…</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-slate-400">No RSD bank accounts available.</p>
            ) : (
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input-field w-full text-sm">
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName ?? a.currencyCode}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || accountsLoading || accounts.length === 0 || !amount}
            className="btn-primary text-xs px-5 py-2 disabled:opacity-50"
          >
            {submitting ? 'Depositing…' : 'Deposit'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Withdraw Modal ────────────────────────────────────────────────────────────

function WithdrawModal({ position, onClose, onSuccess }) {
  const [amount, setAmount]       = useState('')
  const [accountId, setAccountId] = useState('')
  const [accounts, setAccounts]   = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [amountError, setAmountError] = useState('')
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => {
    accountService.getBankAccounts()
      .then(list => {
        const rsd = list.filter(a => a.currencyCode === 'RSD')
        setAccounts(rsd)
        if (rsd.length > 0) setAccountId(String(rsd[0].id))
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
      await bankProfitService.bankRedeem(position.fundId, { accountId: Number(accountId), amount: n })
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
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{position.fundName}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (RSD)</label>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setAmountError('') }}
              placeholder="0.00"
              className={`input-field w-full text-sm${amountError ? ' input-error' : ''}`}
            />
            {amountError && <p className="text-xs text-red-500 mt-1">{amountError}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bank Account (RSD)</label>
            {accountsLoading ? (
              <p className="text-xs text-slate-400">Loading accounts…</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-slate-400">No RSD bank accounts available.</p>
            ) : (
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className="input-field w-full text-sm">
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.accountNumber} — {a.accountName ?? a.currencyCode}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={submitting || accountsLoading || accounts.length === 0 || !amount}
            className="btn-primary text-xs px-5 py-2 disabled:opacity-50"
          >
            {submitting ? 'Withdrawing…' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BankProfitFundPositionsPage() {
  useWindowTitle('Fund Positions | AnkaBanka')
  const { can } = usePermission()

  if (!can('isSupervisor')) return <Navigate to="/" replace />

  const [positions,  setPositions]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(false)
  const [modal,      setModal]      = useState(null) // { type: 'deposit'|'withdraw', position }

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const [funds, bankPositions] = await Promise.all([
        fundService.getFunds(),
        bankProfitService.getBankFundPositions(),
      ])
      const posMap = new Map(bankPositions.map(p => [p.fundId, p]))
      const rows = (Array.isArray(funds) ? funds : [])
        .filter(f => f.active)
        .map(f => {
          const pos = posMap.get(f.id)
          return {
            fundId:           f.id,
            fundName:         f.name,
            managerName:      f.managerName ?? pos?.managerName ?? '—',
            bankSharePercent: pos?.bankSharePercent ?? 0,
            bankShareRSD:     pos?.bankShareRSD     ?? 0,
            profitRSD:        pos?.profitRSD        ?? 0,
          }
        })
      setPositions(rows)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleModalSuccess() {
    setModal(null)
    load()
  }

  const tabClass = ({ isActive }) =>
    `px-5 py-2.5 text-xs tracking-widest uppercase font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-violet-500 text-violet-700 dark:text-violet-300'
        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
    }`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-6xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Bank Profit Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-1">Fund Positions</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light mb-3">Bank positions in investment funds</p>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {/* Sub-tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-8">
          <NavLink to="/admin/bank-profit/actuaries" className={tabClass}>
            Actuary Performances
          </NavLink>
          <NavLink to="/admin/bank-profit/fund-positions" className={tabClass}>
            Fund Positions
          </NavLink>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-red-500 text-sm">Failed to load fund positions.</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-slate-400 dark:text-slate-500 text-sm">No bank positions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Fund', 'Manager', 'Bank Share %', 'Bank Share (RSD)', 'Profit (RSD)', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((pos, i) => (
                    <tr
                      key={pos.fundId ?? i}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                        i % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/investment/funds/${pos.fundId}`}
                          className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
                        >
                          {pos.fundName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{pos.managerName ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                        {pos.bankSharePercent != null ? `${pos.bankSharePercent.toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                        {pos.bankShareRSD != null ? fmt(pos.bankShareRSD, 'RSD') : '—'}
                      </td>
                      <td className={`px-4 py-3 font-medium tabular-nums ${
                        (pos.profitRSD ?? 0) >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-500 dark:text-red-400'
                      }`}>
                        {pos.profitRSD != null ? fmt(pos.profitRSD, 'RSD') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setModal({ type: 'deposit', position: pos })}
                            className="px-3 py-1.5 text-xs tracking-widest uppercase font-medium bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors"
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => setModal({ type: 'withdraw', position: pos })}
                            className="px-3 py-1.5 text-xs tracking-widest uppercase font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                          >
                            Withdraw
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {modal?.type === 'deposit' && (
        <DepositModal
          position={modal.position}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
      {modal?.type === 'withdraw' && (
        <WithdrawModal
          position={modal.position}
          onClose={() => setModal(null)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  )
}
