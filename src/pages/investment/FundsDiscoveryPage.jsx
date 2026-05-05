import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAuth } from '../../context/AuthContext'
import { fundService } from '../../services/fundService'
import { accountService } from '../../services/accountService'
import { fmt } from '../../utils/formatting'

function truncate(s, n = 80) {
  return s?.length > n ? s.slice(0, n) + '…' : (s ?? '—')
}

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
    if (!val || isNaN(n) || n <= 0) {
      setAmountError('Please enter a valid amount.')
      return false
    }
    if (n < fund.minimumContribution) {
      setAmountError(`Minimum contribution is ${fmt(fund.minimumContribution, 'RSD')}.`)
      return false
    }
    setAmountError('')
    return true
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Invest</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fund.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
              Amount (RSD) — minimum {fmt(fund.minimumContribution, 'RSD')}
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => { setAmount(e.target.value); setAmountError('') }}
              onBlur={() => amount && validateAmount(amount)}
              placeholder={`${fund.minimumContribution}`}
              className={`input-field w-full text-sm${amountError ? ' input-error' : ''}`}
            />
            {amountError && (
              <p className="text-xs text-red-500 mt-1">{amountError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Source Account</label>
            {accountsLoading ? (
              <p className="text-xs text-slate-400">Loading accounts…</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-slate-400">No accounts available.</p>
            ) : (
              <select
                value={sourceAccountId}
                onChange={e => setSourceAccountId(e.target.value)}
                className="input-field w-full text-sm"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} — {a.accountName ?? a.currencyCode}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || accountsLoading || accounts.length === 0}
            className="btn-primary text-xs px-5 py-2 disabled:opacity-50"
          >
            {submitting ? 'Investing…' : 'Invest'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bank Deposit Modal ────────────────────────────────────────────────────────

function BankDepositModal({ fund, onClose, onSuccess }) {
  const [amount, setAmount]           = useState('')
  const [bankAccountId, setBankAccountId] = useState('')
  const [accounts, setAccounts]       = useState([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [submitting, setSubmitting]   = useState(false)

  useEffect(() => {
    accountService.getAccounts()
      .then(list => {
        const rsd = list.filter(a => a.currencyCode === 'RSD')
        setAccounts(rsd)
        if (rsd.length > 0) setBankAccountId(String(rsd[0].id))
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false))
  }, [])

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) return
    setSubmitting(true)
    try {
      // POST /investment/funds/:id/invest (bank deposit uses same endpoint with bank account)
      await fundService.invest(fund.id, { sourceAccountId: Number(bankAccountId), amount: Number(amount) })
      onSuccess()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-0.5">Bank Deposit</p>
            <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">{fund.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Amount (RSD)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="input-field w-full text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Bank Account (RSD)</label>
            {accountsLoading ? (
              <p className="text-xs text-slate-400">Loading accounts…</p>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-slate-400">No RSD bank accounts available.</p>
            ) : (
              <select
                value={bankAccountId}
                onChange={e => setBankAccountId(e.target.value)}
                className="input-field w-full text-sm"
              >
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.accountNumber} — {a.accountName ?? a.currencyCode}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-xs tracking-widest uppercase font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-4 py-2"
          >
            Cancel
          </button>
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

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FundsDiscoveryPage() {
  useWindowTitle('Investment Funds | AnkaBanka')
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [funds, setFunds]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [search, setSearch]       = useState('')
  const [sortCol, setSortCol]     = useState(null)
  const [sortOrder, setSortOrder] = useState('ASC')
  const [investModal, setInvestModal]   = useState(null)
  const [depositModal, setDepositModal] = useState(null)

  const isSupervisor = user?.permissions?.isSupervisor
  const isAgent      = user?.permissions?.isAgent

  const loadFunds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fundService.getFunds()
      setFunds(Array.isArray(data) ? data : (data.funds ?? data.items ?? []))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFunds() }, [loadFunds])

  function handleSort(col) {
    if (sortCol === col) {
      setSortOrder(o => o === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortCol(col)
      setSortOrder('ASC')
    }
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <span className="text-slate-300 dark:text-slate-600 ml-1">↕</span>
    return <span className="text-violet-500 ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
  }

  const filtered = funds.filter(f =>
    !search || f.name?.toLowerCase().includes(search.toLowerCase())
  )

  const sorted = [...filtered].sort((a, b) => {
    if (!sortCol) return 0
    const va = a[sortCol]
    const vb = b[sortCol]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    const cmp = va - vb
    return sortOrder === 'ASC' ? cmp : -cmp
  })

  function thClass(sortable) {
    return `px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap${
      sortable ? ' cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors' : ''
    }`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Investment Funds</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by fund name…"
            className="input-field w-full max-w-sm text-sm"
          />
          {isSupervisor && (
            <button
              onClick={() => navigate('/investment/funds/new')}
              className="btn-primary text-xs px-5 py-2 shrink-0"
            >
              + Create Fund
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading funds…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-red-500 text-sm">Failed to load funds.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className={thClass(false)}>Fund Name</th>
                    <th className={thClass(false)}>Description</th>
                    <th className={thClass(true)} onClick={() => handleSort('fundValue')}>
                      Fund Value<SortIcon col="fundValue" />
                    </th>
                    <th className={thClass(true)} onClick={() => handleSort('profit')}>
                      Profit<SortIcon col="profit" />
                    </th>
                    <th className={thClass(true)} onClick={() => handleSort('minimumContribution')}>
                      Min. Contribution<SortIcon col="minimumContribution" />
                    </th>
                    {(isAgent || isSupervisor) && (
                      <th className={thClass(false)}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No funds found.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((fund, i) => (
                      <tr
                        key={fund.id}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/investment/funds/${fund.id}`)}
                            className="text-violet-600 dark:text-violet-400 hover:underline font-medium text-left"
                          >
                            {fund.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs">
                          {truncate(fund.description)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                          {fmt(fund.fundValue, 'RSD')}
                        </td>
                        <td className={`px-4 py-3 font-medium tabular-nums ${
                          (fund.profit ?? 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}>
                          {(fund.profit ?? 0) >= 0 ? '+' : ''}{fmt(fund.profit ?? 0, 'RSD')}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                          {fmt(fund.minimumContribution, 'RSD')}
                        </td>
                        {(isAgent || isSupervisor) && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isAgent && (
                                <button
                                  onClick={() => setInvestModal(fund)}
                                  className="btn-primary text-xs px-3 py-1"
                                >
                                  Invest
                                </button>
                              )}
                              {isSupervisor && (
                                <button
                                  onClick={() => setDepositModal(fund)}
                                  className="text-xs px-3 py-1 border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all duration-200"
                                >
                                  Deposit
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && sorted.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              {sorted.length} fund{sorted.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

      </div>

      {investModal && (
        <InvestModal
          fund={investModal}
          onClose={() => setInvestModal(null)}
          onSuccess={() => { setInvestModal(null); loadFunds() }}
        />
      )}
      {depositModal && (
        <BankDepositModal
          fund={depositModal}
          onClose={() => setDepositModal(null)}
          onSuccess={() => { setDepositModal(null); loadFunds() }}
        />
      )}
    </div>
  )
}
