import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { clientSecuritiesService } from '../../services/clientSecuritiesService'
import { fmt } from '../../utils/formatting'

const PERIODS = [
  { label: 'Day',     days: 1    },
  { label: 'Week',    days: 7    },
  { label: 'Month',   days: 30   },
  { label: 'Year',    days: 365  },
  { label: '5 Years', days: 1825 },
  { label: 'All',     days: null },
]

function InfoRow({ label, children }) {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 last:border-0">
      <td className="px-5 py-3 text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium w-48 whitespace-nowrap">{label}</td>
      <td className="px-5 py-3 text-slate-900 dark:text-white">{children}</td>
    </tr>
  )
}

export default function ClientListingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing]               = useState(null)
  const [detail, setDetail]                 = useState(null)
  const [history, setHistory]               = useState([])
  const [period, setPeriod]                 = useState(PERIODS[2])
  const [loading, setLoading]               = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [error, setError]                   = useState(null)
  const skipInitialPeriod                   = useRef(true)

  useWindowTitle(listing ? `${listing.ticker} | AnkaBanka` : 'Securities | AnkaBanka')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    clientSecuritiesService.getListing(id)
      .then(result => {
        if (cancelled) return
        setListing(result.listing)
        setDetail(result.detail)
        setHistory(result.priceHistory)
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (skipInitialPeriod.current) {
      skipInitialPeriod.current = false
      return
    }
    const to = new Date()
    const from = period.days
      ? new Date(to.getTime() - period.days * 86_400_000)
      : new Date('1970-01-01')
    setHistoryLoading(true)
    clientSecuritiesService
      .getListingHistory(id, from.toISOString().slice(0, 10), to.toISOString().slice(0, 10))
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false))
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center py-32">
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>
        </div>
      </ClientPortalLayout>
    )
  }

  if (error || !listing) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center py-32">
          <p className="text-red-500 text-sm">Failed to load listing.</p>
        </div>
      </ClientPortalLayout>
    )
  }

  const sortedHistory = [...history].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-4xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white">
              {listing.ticker}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{listing.name}</p>
          </div>
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={() => navigate(`/client/orders/new?ticker=${encodeURIComponent(listing.ticker)}&direction=BUY`)}
              className="btn-primary"
            >
              Buy
            </button>

            <Link to="/client/securities" className="text-sm text-violet-600 dark:text-violet-400 hover:underline">
              ← Back
            </Link>
          </div>
        </div>

        {/* Price chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-5">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-4">Price Chart</p>
          {history.length === 0 ? (
            <div className="flex items-center justify-center min-h-[180px]">
              <p className="text-slate-400 dark:text-slate-500 text-sm">No data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart
                data={[...history]
                  .sort((a, b) => (a.date < b.date ? -1 : 1))
                  .map(r => ({ date: String(r.date).slice(0, 10), price: r.price ?? 0 }))}
                margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => fmt(v)}
                  width={80}
                />
                <Tooltip
                  formatter={(v) => [fmt(v), 'Price']}
                  contentStyle={{
                    fontSize: 12,
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    background: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Period selector */}
        <div className="flex gap-1 flex-wrap mb-5">
          {PERIODS.map(p => (
            <button
              key={p.label}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs tracking-widest uppercase font-medium rounded transition-colors ${
                period.label === p.label
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400 dark:hover:border-violet-500'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Base info */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-5 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">Overview</p>
          </div>
          <table className="w-full text-sm">
            <tbody>
              <InfoRow label="Ticker">{listing.ticker}</InfoRow>
              <InfoRow label="Name">{listing.name}</InfoRow>
              <InfoRow label="Exchange">{listing.exchangeAcronym || '—'}</InfoRow>
              <InfoRow label="Price">{fmt(listing.price)}</InfoRow>
              <InfoRow label="Ask">{fmt(listing.ask)}</InfoRow>
              <InfoRow label="Bid">{fmt(listing.bid)}</InfoRow>
              <InfoRow label="Change">
                <span className={listing.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}>
                  {listing.changePercent >= 0 ? '+' : ''}{listing.changePercent.toFixed(2)}%
                </span>
              </InfoRow>
              <InfoRow label="Volume">{fmt(listing.volume)}</InfoRow>
              <InfoRow label="Initial Margin Cost">{fmt(listing.initialMarginCost)}</InfoRow>
            </tbody>
          </table>
        </div>

        {/* Stock-specific */}
        {detail?.type === 'STOCK' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-5 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">Stock Details</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <InfoRow label="Outstanding Shares">
                  {detail.outstandingShares ? detail.outstandingShares.toLocaleString() : '—'}
                </InfoRow>
                <InfoRow label="Dividend Yield">
                  {detail.dividendYield ? `${(detail.dividendYield * 100).toFixed(2)}%` : '—'}
                </InfoRow>
              </tbody>
            </table>
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/client/securities/${id}/options`}
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
              >
                View Options →
              </Link>
            </div>
          </div>
        )}

        {/* Futures-specific */}
        {detail?.type === 'FUTURES_CONTRACT' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl mb-5 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">Futures Details</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <InfoRow label="Contract Size">{detail.contractSize?.toLocaleString() ?? '—'}</InfoRow>
                <InfoRow label="Contract Unit">{detail.contractUnit}</InfoRow>
                <InfoRow label="Settlement Date">{detail.settlementDate}</InfoRow>
              </tbody>
            </table>
          </div>
        )}

        {/* Price history table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">Price History</p>
            {historyLoading && <p className="text-xs text-slate-400 dark:text-slate-500">Loading…</p>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Date', 'Close', 'High (Ask)', 'Low (Bid)', 'Change', 'Volume'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No history available.
                    </td>
                  </tr>
                ) : (
                  sortedHistory.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                        i % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''
                      }`}
                    >
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 font-mono">{String(row.date).slice(0, 10)}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{fmt(row.price ?? 0)}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{fmt(row.ask ?? 0)}</td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{fmt(row.bid ?? 0)}</td>
                      <td className={`px-4 py-2.5 font-medium tabular-nums ${
                        (row.change ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
                      }`}>
                        {(row.change ?? 0) >= 0 ? '+' : ''}{fmt(row.change ?? 0)}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{fmt(row.volume ?? 0)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {sortedHistory.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              {sortedHistory.length} row{sortedHistory.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

      </div>
    </ClientPortalLayout>
  )
}
