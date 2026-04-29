import { useEffect, useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { usePermission } from '../../hooks/usePermission'
import { taxService } from '../../services/taxService'
import { fmt } from '../../utils/formatting'

const TYPE_FILTERS = ['ALL', 'CLIENT', 'ACTUARY']

const TYPE_BADGE = {
  CLIENT:  'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  ACTUARY: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export default function TaxTrackingPage() {
  useWindowTitle('Tax Tracking | AnkaBanka')
  const { canAny } = usePermission()
  if (!canAny(['isSupervisor', 'isAdmin'])) return <Navigate to="/" replace />

  const [entries,    setEntries]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [collecting, setCollecting] = useState(false)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [nameInput,  setNameInput]  = useState('')
  const [nameFilter, setNameFilter] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setNameFilter(nameInput.trim()), 300)
    return () => clearTimeout(id)
  }, [nameInput])

  function load() {
    setLoading(true)
    taxService.getTaxList()
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const displayed = useMemo(() => entries.filter((e) => {
    const typeMatch = typeFilter === 'ALL' || e.type === typeFilter
    const nameMatch = !nameFilter || (e.fullName ?? '').toLowerCase().includes(nameFilter.toLowerCase())
    return typeMatch && nameMatch
  }), [entries, typeFilter, nameFilter])

  async function handleCollect() {
    setCollecting(true)
    try {
      await taxService.collectTax()
      load()
    } finally {
      setCollecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-5xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Supervisor Portal</p>
        <div className="flex items-start justify-between mb-1">
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">Tax Tracking</h1>
          <button
            onClick={handleCollect}
            disabled={collecting || loading}
            className="btn-primary px-5 py-2 text-xs tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {collecting ? 'Running…' : 'Run Tax Collection'}
          </button>
        </div>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Type filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-4 py-1.5 text-xs tracking-widest uppercase rounded-full transition-colors ${
                typeFilter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400 dark:hover:border-violet-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Name search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4">Search</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Filter by name…"
            className="input-field w-full"
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">Loading…</div>
          ) : displayed.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-1">No results</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                No users match the current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Name', 'Type', 'Debt (RSD)'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((entry, i) => (
                    <tr
                      key={entry.userId}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                        i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium whitespace-nowrap">
                        {entry.fullName ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${TYPE_BADGE[entry.type] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">
                        {fmt(entry.debtRsd ?? 0, 'RSD')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
