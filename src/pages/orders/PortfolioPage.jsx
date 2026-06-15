import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAuth } from '../../context/AuthContext'
import { portfolioService } from '../../services/portfolioService'
import { fundService } from '../../services/fundService'
import { dividendService } from '../../services/dividendService'
import { fmt } from '../../utils/formatting'
import { InvestModal, BankDepositModal, WithdrawModal } from '../../components/funds/FundModals'

function TypeBadge({ type }) {
  return (
    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded font-mono">
      {type || '—'}
    </span>
  )
}

function ActiveBadge({ active }) {
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export default function PortfolioPage() {
  useWindowTitle('Portfolio | AnkaBanka')
  const navigate = useNavigate()
  const { user } = useAuth()

  const isSupervisor = user?.permissions?.isSupervisor
  const isAgent      = user?.permissions?.isAgent

  const TABS = [
    { label: 'All Securities',    key: 'all' },
    { label: 'Public Securities', key: 'public' },
    ...(isAgent || isSupervisor ? [{ label: 'My Funds', key: 'funds' }] : []),
    ...(isAgent || isSupervisor ? [{ label: 'Dividends', key: 'dividends' }] : []),
  ]

  const [holdings, setHoldings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [profit, setProfit]       = useState(null)
  const [tax, setTax]             = useState(null)
  const [toggling, setToggling]   = useState(new Set())

  async function handleTogglePublic(ticker, currentIsPublic) {
    if (toggling.has(ticker)) return
    const next = !currentIsPublic
    setToggling(prev => new Set([...prev, ticker]))
    setHoldings(prev => prev.map(h => (h.ticker === ticker ? { ...h, is_public: next } : h)))
    try {
      await portfolioService.setPublicMode(ticker, next)
    } catch {
      setHoldings(prev => prev.map(h => (h.ticker === ticker ? { ...h, is_public: currentIsPublic } : h)))
    } finally {
      setToggling(prev => { const s = new Set(prev); s.delete(ticker); return s })
    }
  }

  const [myFunds, setMyFunds]           = useState([])
  const [myFundsLoading, setMyFundsLoading] = useState(false)
  const [myFundsError, setMyFundsError] = useState(null)
  const [fundModal, setFundModal]       = useState(null) // { type, fund }

  const [dividends, setDividends]           = useState([])
  const [dividendsLoading, setDivLoading]   = useState(false)
  const [dividendsError, setDivError]       = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      portfolioService.getPortfolio(),
      portfolioService.getProfit(),
      portfolioService.getMyTax().catch(() => null),
    ])
      .then(([portfolioData, profitData, taxData]) => {
        setHoldings(portfolioData.portfolio ?? [])
        setProfit(profitData?.totalProfit ?? null)
        setTax(taxData ?? null)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const loadMyFunds = useCallback(async () => {
    setMyFundsLoading(true)
    setMyFundsError(null)
    try {
      let data
      if (isSupervisor) {
        data = await fundService.getManagedFunds(user?.id)
      } else {
        data = await fundService.getMyPositions()
      }
      setMyFunds(Array.isArray(data) ? data : [])
    } catch {
      setMyFundsError(true)
    } finally {
      setMyFundsLoading(false)
    }
  }, [isSupervisor, user?.id])

  useEffect(() => {
    if (activeTab.key === 'funds') loadMyFunds()
  }, [activeTab.key, loadMyFunds])

  const loadDividends = useCallback(async () => {
    setDivLoading(true)
    setDivError(null)
    try {
      const res = await dividendService.getMyDividends()
      setDividends(Array.isArray(res) ? res : (res.dividends ?? res.payouts ?? []))
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
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">My Portfolio</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Current holdings and profit/loss</p>
        </div>
        <div className="flex gap-3">
          {profit !== null && (
            <div className="text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm px-5 py-3 min-w-[140px]">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">Total Profit</p>
              <p className={`text-lg font-semibold tabular-nums ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                {profit >= 0 ? '+' : ''}{fmt(profit)}
              </p>
            </div>
          )}
          {tax !== null && (
            <div className="text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm px-5 py-3 min-w-[160px]">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-2">Tax</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Paid this year</span>
                  <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-300">{fmt(tax.paidThisYear, 'RSD')}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Unpaid this month</span>
                  <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">{fmt(tax.unpaidThisMonth, 'RSD')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
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
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                {isSupervisor ? 'You manage no funds.' : 'You have no fund positions.'}
              </p>
            </div>
          ) : isSupervisor ? (
            /* Supervisor: managed funds */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Fund Name', 'Description', 'Fund Value', 'Liquid Assets', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myFunds.map((f, i) => (
                    <tr key={f.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                      <td className="px-4 py-3">
                        <Link to={`/investment/funds/${f.id}`} className="text-violet-600 dark:text-violet-400 hover:underline font-medium">{f.name}</Link>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{f.description || '—'}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(f.fundValue ?? 0, 'RSD')}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(f.liquidAssets ?? 0, 'RSD')}</td>
                      <td className="px-4 py-3"><ActiveBadge active={f.active} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setFundModal({ type: 'deposit', fund: f })} className="btn-primary text-xs px-3 py-1">
                            Invest
                          </button>
                          <button onClick={() => setFundModal({ type: 'withdraw', fund: f })} className="text-xs px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
                            Withdraw
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Agent: my positions */
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Fund Name', 'Description', 'Fund Value', 'Invested', 'Current Value', 'Profit', '% Share', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myFunds.map((pos, i) => {
                    const fundObj = { id: pos.fundId ?? pos.id, name: pos.fundName ?? pos.name, minimumContribution: pos.minimumContribution ?? 0 }
                    const profitColor = (pos.myProfit ?? pos.profit ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                    const profitVal = pos.myProfit ?? pos.profit ?? 0
                    return (
                      <tr key={pos.fundId ?? pos.id ?? i} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                        <td className="px-4 py-3">
                          <Link to={`/investment/funds/${fundObj.id}`} className="text-violet-600 dark:text-violet-400 hover:underline font-medium">{fundObj.name}</Link>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">{pos.description || '—'}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(pos.fundValue ?? 0, 'RSD')}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(pos.myInvestedAmount ?? pos.investedAmount ?? 0, 'RSD')}</td>
                        <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{fmt(pos.myCurrentValue ?? pos.currentValue ?? 0, 'RSD')}</td>
                        <td className={`px-4 py-3 tabular-nums font-medium ${profitColor}`}>
                          {profitVal >= 0 ? '+' : ''}{fmt(profitVal, 'RSD')}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                          {((pos.sharePercentage ?? pos.share ?? 0)).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => setFundModal({ type: 'invest', fund: fundObj })} className="btn-primary text-xs px-3 py-1">
                              Invest
                            </button>
                            <button onClick={() => setFundModal({ type: 'withdraw', fund: fundObj })} className="text-xs px-3 py-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200">
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
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widests uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dividends.map((d, i) => (
                    <tr key={d.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{d.ticker ?? d.stock_listing_id ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{d.payment_date ?? '—'}</td>
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
                      <tr key={h.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
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
                          <button
                            onClick={() => navigate(`/orders/new?ticker=${encodeURIComponent(h.ticker)}&direction=SELL`)}
                            className="border border-red-400 text-red-500 text-xs px-3 py-1 hover:bg-red-500 hover:text-white transition-all duration-150"
                          >
                            Sell
                          </button>
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

      {fundModal?.type === 'invest' && (
        <InvestModal fund={fundModal.fund} onClose={() => setFundModal(null)} onSuccess={() => { setFundModal(null); loadMyFunds() }} />
      )}
      {fundModal?.type === 'deposit' && (
        <BankDepositModal fund={fundModal.fund} onClose={() => setFundModal(null)} onSuccess={() => { setFundModal(null); loadMyFunds() }} />
      )}
      {fundModal?.type === 'withdraw' && (
        <WithdrawModal fund={fundModal.fund} isSupervisor={isSupervisor} onClose={() => setFundModal(null)} onSuccess={() => { setFundModal(null); loadMyFunds() }} />
      )}
    </div>
  )
}
