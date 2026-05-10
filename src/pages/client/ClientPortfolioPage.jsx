import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { clientPortfolioService } from '../../services/clientPortfolioService'
import { fmt } from '../../utils/formatting'

const TABS = [
  { label: 'All Securities',    key: 'all' },
  { label: 'Public Securities', key: 'public' },
]

function TypeBadge({ type }) {
  return (
    <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded font-mono">
      {type || '—'}
    </span>
  )
}

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

  const displayed = activeTab.key === 'public'
    ? holdings.filter(h => h.isPublic)
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
              <p className={`text-lg font-semibold tabular-nums ${
                profit >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-500 dark:text-red-400'
              }`}>
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

        {/* Table card */}
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
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
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
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <td className="px-4 py-3"><TypeBadge type={h.assetType} /></td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{h.ticker || h.listingId}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{h.amount}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{fmt(h.price ?? 0)}</td>
                        <td className={`px-4 py-3 font-medium tabular-nums ${
                          (h.profit ?? 0) >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}>
                          {(h.profit ?? 0) >= 0 ? '+' : ''}{fmt(h.profit ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{h.lastModified}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 tabular-nums">
                          {h.assetType === 'STOCK' ? h.publicAmount : '—'}
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
      </div>
    </ClientPortalLayout>
  )
}
