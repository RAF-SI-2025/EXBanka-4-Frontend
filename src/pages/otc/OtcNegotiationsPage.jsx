import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAuth } from '../../context/AuthContext'
import { otcService } from '../../services/otcService'
import { securitiesService } from '../../services/securitiesService'
import { fmt } from '../../utils/formatting'

const SORT_COLS = ['pricePerStock', 'settlementDate', 'lastModified']

function getPriceColor(price, market) {
  if (!market) return 'text-slate-700 dark:text-slate-300'
  const dev = Math.abs((price - market) / market) * 100
  if (dev <= 5)  return 'text-emerald-600 dark:text-emerald-400'
  if (dev <= 20) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function getStatusLabel(neg, userId) {
  const myTurn =
    (neg.status === 'PENDING_SELLER' && neg.sellerId === userId) ||
    (neg.status === 'PENDING_BUYER'  && neg.buyerId  === userId)
  return myTurn ? 'Your turn' : 'Waiting for the other party'
}

export default function OtcNegotiationsPage() {
  useWindowTitle('OTC Negotiations | AnkaBanka')
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [negotiations, setNegotiations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [sortCol, setSortCol]           = useState(null)
  const [sortOrder, setSortOrder]       = useState('ASC')
  const [marketPrices, setMarketPrices] = useState({})

  const loadNegotiations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await otcService.getNegotiations()
      const list = Array.isArray(data) ? data : (data.negotiations ?? data.items ?? [])
      setNegotiations(list)
      fetchMarketPrices(list)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  async function fetchMarketPrices(list) {
    const tickers = [...new Set(list.map(n => n.ticker).filter(Boolean))]
    const results = await Promise.allSettled(
      tickers.map(ticker => securitiesService.getListings({ ticker }))
    )
    const prices = {}
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        const items = r.value?.items ?? r.value ?? []
        const first = Array.isArray(items) ? items[0] : null
        if (first?.price != null) prices[tickers[i]] = first.price
      }
    })
    setMarketPrices(prices)
  }

  useEffect(() => { loadNegotiations() }, [loadNegotiations])

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

  const sorted = [...negotiations].sort((a, b) => {
    if (!sortCol) return 0
    const va = a[sortCol]
    const vb = b[sortCol]
    if (va == null && vb == null) return 0
    if (va == null) return 1
    if (vb == null) return -1
    const cmp = typeof va === 'string' ? va.localeCompare(vb) : va - vb
    return sortOrder === 'ASC' ? cmp : -cmp
  })

  const userId = user?.id

  function thClass(sortable) {
    return `px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap${
      sortable ? ' cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors' : ''
    }`
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">OTC Negotiations</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading negotiations…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-red-500 text-sm">Failed to load negotiations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className={thClass(false)}>Ticker</th>
                    <th className={thClass(false)}>Amount</th>
                    <th className={thClass(true)} onClick={() => handleSort('pricePerStock')}>
                      Price / Share<SortIcon col="pricePerStock" />
                    </th>
                    <th className={thClass(true)} onClick={() => handleSort('settlementDate')}>
                      Settlement Date<SortIcon col="settlementDate" />
                    </th>
                    <th className={thClass(false)}>Premium</th>
                    <th className={thClass(true)} onClick={() => handleSort('lastModified')}>
                      Last Modified<SortIcon col="lastModified" />
                    </th>
                    <th className={thClass(false)}>Status</th>
                    <th className={thClass(false)} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        You have no active negotiations.
                      </td>
                    </tr>
                  ) : (
                    sorted.map((neg, i) => {
                      const marketPrice = marketPrices[neg.ticker]
                      const priceColor  = getPriceColor(neg.pricePerStock, marketPrice)
                      const statusLabel = getStatusLabel(neg, userId)
                      const isMyTurn    = statusLabel === 'Your turn'
                      return (
                        <tr
                          key={neg.id}
                          className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                            i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                            {neg.ticker}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                            {neg.amount}
                          </td>
                          <td className={`px-4 py-3 font-medium tabular-nums ${priceColor}`}>
                            {fmt(neg.pricePerStock)}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                            {neg.settlementDate ?? '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                            {fmt(neg.premium)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                            <div>{neg.lastModified ? new Date(neg.lastModified).toLocaleString() : '—'}</div>
                            {neg.modifiedByName && (
                              <div className="text-slate-400 dark:text-slate-500">{neg.modifiedByName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${
                              isMyTurn
                                ? 'text-violet-600 dark:text-violet-400'
                                : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate(`/otc/negotiations/${neg.id}`)}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              Open
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && sorted.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              {sorted.length} negotiation{sorted.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
