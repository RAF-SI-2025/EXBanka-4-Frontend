import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAuth } from '../../context/AuthContext'
import { securitiesService } from '../../services/securitiesService'
import { fmt } from '../../utils/formatting'

const TABS = [
  { label: 'Stocks',      type: 'STOCK' },
  { label: 'Futures',     type: 'FUTURES_CONTRACT' },
  { label: 'Forex Pairs', type: 'FOREX_PAIR' },
]

const SORT_COLS = [
  { key: 'price',              label: 'Price' },
  { key: 'volume',             label: 'Volume' },
  { key: 'maintenance_margin', label: 'Initial Margin Cost' },
]

const REFRESH_INTERVAL = 60_000

function FilterInput({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field w-full text-sm"
      />
    </div>
  )
}

function RangeFilter({ label, min, max, onMin, onMax }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <div className="flex gap-1">
        <input type="number" value={min} onChange={e => onMin(e.target.value)} placeholder="Min"
          className="input-field w-full text-sm" />
        <input type="number" value={max} onChange={e => onMax(e.target.value)} placeholder="Max"
          className="input-field w-full text-sm" />
      </div>
    </div>
  )
}

export default function SecuritiesPage() {
  useWindowTitle('Securities | AnkaBanka')
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState(TABS[0])
  const [listings, setListings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [refreshingId, setRefreshingId] = useState(null)

  // Sort
  const [sortBy, setSortBy]       = useState(null)
  const [sortOrder, setSortOrder] = useState('ASC')

  // Search
  const [searchQuery, setSearchQuery]       = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimer = useRef(null)

  // Filters
  const [filters, setFilters] = useState({
    exchange: '',
    priceMin: '', priceMax: '',
    askMin: '',   askMax: '',
    bidMin: '',   bidMax: '',
    volumeMin: '', volumeMax: '',
    settlementMin: '', settlementMax: '',
  })

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }))
  }

  // Debounce search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchQuery), 400)
    return () => clearTimeout(searchTimer.current)
  }, [searchQuery])

  // Load listings
  const loadListings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await securitiesService.getListings({
        type: activeTab.type,
        ...(sortBy ? { sortBy, sortOrder } : {}),
      })
      setListings(result.items ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [activeTab, sortBy, sortOrder])

  useEffect(() => { loadListings() }, [loadListings])

  // Auto-refresh
  useEffect(() => {
    const timer = setInterval(loadListings, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [loadListings])

  // Per-row refresh
  async function handleRefreshRow(listing) {
    setRefreshingId(listing.id)
    try {
      const result = await securitiesService.getListing(listing.id)
      const updated = result.listing
      setListings(prev => prev.map(l => l.id === updated.id ? updated : l))
    } finally {
      setRefreshingId(null)
    }
  }

  // Sort column click
  function handleSort(key) {
    if (sortBy === key) {
      setSortOrder(o => o === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(key)
      setSortOrder('ASC')
    }
  }

  // Client-side filtering
  const filtered = listings.filter(l => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      if (!l.ticker.toLowerCase().includes(q) && !l.name.toLowerCase().includes(q)) return false
    }
    if (filters.exchange && !l.exchangeAcronym.toLowerCase().startsWith(filters.exchange.toLowerCase())) return false
    if (filters.priceMin  !== '' && l.price  < Number(filters.priceMin))  return false
    if (filters.priceMax  !== '' && l.price  > Number(filters.priceMax))  return false
    if (filters.askMin    !== '' && l.ask    < Number(filters.askMin))    return false
    if (filters.askMax    !== '' && l.ask    > Number(filters.askMax))    return false
    if (filters.bidMin    !== '' && l.bid    < Number(filters.bidMin))    return false
    if (filters.bidMax    !== '' && l.bid    > Number(filters.bidMax))    return false
    if (filters.volumeMin !== '' && l.volume < Number(filters.volumeMin)) return false
    if (filters.volumeMax !== '' && l.volume > Number(filters.volumeMax)) return false
    if (activeTab.type === 'FUTURES_CONTRACT') {
      const sd = l.futuresDetail?.settlementDate
      if (filters.settlementMin && sd && sd < filters.settlementMin) return false
      if (filters.settlementMax && sd && sd > filters.settlementMax) return false
    }
    return true
  })

  function SortIcon({ col }) {
    if (sortBy !== col) return <span className="text-slate-300 dark:text-slate-600 ml-1">↕</span>
    return <span className="text-violet-500 ml-1">{sortOrder === 'ASC' ? '↑' : '↓'}</span>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Securities</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by ticker or name…"
            className="input-field w-full max-w-sm text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.type}
              onClick={() => { setActiveTab(tab); setSortBy(null) }}
              className={`px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors border-b-2 -mb-px ${
                activeTab.type === tab.type
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6 items-start">

          {/* Left: Filters */}
          <aside className="w-56 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col gap-4">
            <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">Filters</p>

            <FilterInput
              label="Exchange"
              value={filters.exchange}
              onChange={v => setFilter('exchange', v)}
              placeholder="Prefix…"
            />
            <RangeFilter
              label="Price"
              min={filters.priceMin} max={filters.priceMax}
              onMin={v => setFilter('priceMin', v)} onMax={v => setFilter('priceMax', v)}
            />
            <RangeFilter
              label="Ask"
              min={filters.askMin} max={filters.askMax}
              onMin={v => setFilter('askMin', v)} onMax={v => setFilter('askMax', v)}
            />
            <RangeFilter
              label="Bid"
              min={filters.bidMin} max={filters.bidMax}
              onMin={v => setFilter('bidMin', v)} onMax={v => setFilter('bidMax', v)}
            />
            <RangeFilter
              label="Volume"
              min={filters.volumeMin} max={filters.volumeMax}
              onMin={v => setFilter('volumeMin', v)} onMax={v => setFilter('volumeMax', v)}
            />

            {activeTab.type === 'FUTURES_CONTRACT' && (
              <>
                <div className="border-t border-slate-100 dark:border-slate-800" />
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Settlement Date</label>
                  <div className="flex flex-col gap-1">
                    <input type="date" value={filters.settlementMin}
                      onChange={e => setFilter('settlementMin', e.target.value)}
                      className="input-field w-full text-sm" />
                    <input type="date" value={filters.settlementMax}
                      onChange={e => setFilter('settlementMax', e.target.value)}
                      className="input-field w-full text-sm" />
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => setFilters({ exchange: '', priceMin: '', priceMax: '', askMin: '', askMax: '', bidMin: '', bidMax: '', volumeMin: '', volumeMax: '', settlementMin: '', settlementMax: '' })}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-left"
            >
              Clear filters
            </button>
          </aside>

          {/* Right: Table */}
          <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading {activeTab.label.toLowerCase()}…</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <p className="text-red-500 text-sm">Failed to load listings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {['Ticker', 'Name'].map(h => (
                        <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      {SORT_COLS.map(col => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap cursor-pointer select-none hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          {col.label}<SortIcon col={col.key} />
                        </th>
                      ))}
                      <th className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        Change
                      </th>
                      <th className="px-4 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                          No listings found.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((l, i) => (
                        <tr
                          key={l.id}
                          className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                            i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-medium">
                            <button
                              onClick={() => navigate(`/securities/${l.id}`)}
                              className="text-violet-600 dark:text-violet-400 hover:underline"
                            >
                              {l.ticker}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{l.name}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{fmt(l.price)}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{fmt(l.volume)}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{fmt(l.initialMarginCost)}</td>
                          <td className={`px-4 py-3 font-medium tabular-nums ${
                            l.changePercent >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {l.changePercent >= 0 ? '+' : ''}{l.changePercent.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => navigate(`/orders/new?ticker=${l.ticker}&direction=BUY`)}
                                className="btn-primary text-xs px-3 py-1"
                              >
                                Buy
                              </button>
                              <button
                                onClick={() => handleRefreshRow(l)}
                                disabled={refreshingId === l.id}
                                title="Refresh"
                                className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-40 transition-colors"
                              >
                                <svg className={`w-4 h-4 ${refreshingId === l.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
