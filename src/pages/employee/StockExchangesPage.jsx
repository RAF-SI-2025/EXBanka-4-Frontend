import { useEffect, useState } from 'react'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAuth } from '../../context/AuthContext'
import { stockExchangeService } from '../../services/stockExchangeService'

export default function StockExchangesPage() {
  useWindowTitle('Stock Exchanges | AnkaBanka')
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('ADMIN')

  const PAGE_SIZE = 10

  const [exchanges, setExchanges] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testMode, setTestMode] = useState(false)
  const [togglingTestMode, setTogglingTestMode] = useState(false)
  const [statuses, setStatuses] = useState({})
  const [statusRefreshKey, setStatusRefreshKey] = useState(0)

  // Fetch exchanges + test mode when page changes.
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [{ exchanges: exList, totalCount: total }, tm] = await Promise.all([
          stockExchangeService.getAll(page, PAGE_SIZE),
          isAdmin ? stockExchangeService.getTestMode() : Promise.resolve(false),
        ])
        setExchanges(exList)
        setTotalCount(total)
        setTestMode(tm)
        setError(null)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isAdmin, page])

  // Fetch statuses whenever the exchange list changes or test mode is toggled.
  useEffect(() => {
    if (exchanges.length === 0) return
    const current = exchanges
    async function fetchStatuses() {
      const statusEntries = await Promise.all(
        current.map(async (ex) => {
          try {
            const seg = await stockExchangeService.getStatus(ex.micCode)
            return [ex.micCode, seg]
          } catch {
            return [ex.micCode, 'closed']
          }
        })
      )
      setStatuses(Object.fromEntries(statusEntries))
    }
    fetchStatuses()
  }, [exchanges, statusRefreshKey])

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  function statusBadge(mic) {
    const seg = statuses[mic]
    const map = {
      regular:      { label: 'Working Hours', cls: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
      pre_market:   { label: 'Pre-Market',    cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
      post_market:  { label: 'Post-Market',   cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      test_mode:    { label: 'Test Mode',     cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      closed:       { label: 'Closed',        cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    }
    const { label, cls } = map[seg] ?? map.closed
    return (
      <span className={`inline-flex items-center justify-center min-w-[6rem] px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${cls}`}>
        {label}
      </span>
    )
  }

  async function handleToggleTestMode() {
    setTogglingTestMode(true)
    try {
      const next = await stockExchangeService.setTestMode(!testMode)
      setTestMode(next)
      setStatusRefreshKey(k => k + 1)
    } finally {
      setTogglingTestMode(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading stock exchanges…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load stock exchanges.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Stock Exchanges</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Test mode card — ADMIN only */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">Test Mode</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
                testMode
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {testMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <button
              onClick={handleToggleTestMode}
              disabled={togglingTestMode}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testMode ? 'Disable Test Mode' : 'Enable Test Mode'}
            </button>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Name', 'Acronym', 'MIC Code', 'Polity', 'Currency', 'Timezone', 'Status'].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap${h === 'Status' ? ' w-32' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exchanges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No stock exchanges found.
                    </td>
                  </tr>
                ) : (
                  exchanges.map((ex, i) => (
                    <tr
                      key={ex.id}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                        i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{ex.name}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono">{ex.acronym}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono tracking-wide">{ex.micCode}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{ex.polity}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{ex.currency}</td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{ex.timezone}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusBadge(ex.micCode)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalCount > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>Page {page} of {totalPages} · {totalCount} exchange{totalCount !== 1 ? 's' : ''}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="px-3 py-1 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
