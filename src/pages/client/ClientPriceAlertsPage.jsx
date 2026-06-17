import { useEffect, useRef, useState } from 'react'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useApiError } from '../../context/ApiErrorContext'
import { clientPriceAlertService } from '../../services/priceAlertService'
import { clientSecuritiesService } from '../../services/clientSecuritiesService'
import { fmt } from '../../utils/formatting'

const CONDITION_LABELS = {
  ABOVE:           'Above',
  BELOW:           'Below',
  CHANGE_PCT_UP:   '% Up',
  CHANGE_PCT_DOWN: '% Down',
}

const CONDITION_BADGE = {
  ABOVE:           'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BELOW:           'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  CHANGE_PCT_UP:   'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CHANGE_PCT_DOWN: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function ClientPriceAlertsPage() {
  const { addSuccess } = useApiError()
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [deleting, setDeleting] = useState({})

  const [showNew, setShowNew]           = useState(false)
  const [newSearch, setNewSearch]       = useState('')
  const [newResults, setNewResults]     = useState([])
  const [newSearchLoading, setNewSearchLoading] = useState(false)
  const [newListing, setNewListing]     = useState(null)
  const [newCondition, setNewCondition] = useState('ABOVE')
  const [newThreshold, setNewThreshold] = useState('')
  const [newNotifType, setNewNotifType] = useState('BOTH')
  const [newCreating, setNewCreating]   = useState(false)
  const searchTimeout                   = useRef(null)

  function load() {
    setLoading(true)
    clientPriceAlertService.list()
      .then((res) => setAlerts(Array.isArray(res) ? res : (res.alerts ?? [])))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setShowNew(true)
    setNewSearch('')
    setNewResults([])
    setNewListing(null)
    setNewCondition('ABOVE')
    setNewThreshold('')
    setNewNotifType('BOTH')
  }

  function handleSearchChange(val) {
    setNewSearch(val)
    setNewListing(null)
    clearTimeout(searchTimeout.current)
    if (!val.trim()) { setNewResults([]); return }
    setNewSearchLoading(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await clientSecuritiesService.getListings({ ticker: val.trim(), pageSize: 8 })
        setNewResults(res.items ?? [])
      } catch { setNewResults([]) }
      finally { setNewSearchLoading(false) }
    }, 350)
  }

  async function handleCreate() {
    if (!newListing || !newThreshold) return
    setNewCreating(true)
    try {
      await clientPriceAlertService.create({
        listingId: newListing.id,
        condition: newCondition,
        threshold: Number(newThreshold),
        notificationType: newNotifType,
      })
      addSuccess('Price alert created.')
      setShowNew(false)
      load()
    } catch { /* error toast */ }
    finally { setNewCreating(false) }
  }

  async function handleDelete(id) {
    setDeleting((p) => ({ ...p, [id]: true }))
    try {
      await clientPriceAlertService.delete(id)
      setAlerts((p) => p.filter((a) => a.id !== id))
      addSuccess('Alert deleted.')
    } finally {
      setDeleting((p) => ({ ...p, [id]: false }))
    }
  }

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">Price Alerts</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your price notifications</p>
          </div>
          <button onClick={openNew} className="btn-primary text-xs px-4 py-2">+ New Alert</button>
        </div>

        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowNew(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">New Price Alert</h2>
              </div>
              <div className="px-6 py-5 flex flex-col gap-4">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Security</label>
                  {newListing ? (
                    <div className="flex items-center justify-between px-3 py-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
                      <span className="font-mono font-medium text-sm text-violet-700 dark:text-violet-400">{newListing.ticker}</span>
                      <button onClick={() => { setNewListing(null); setNewSearch('') }} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={newSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="input-field w-full"
                        placeholder="Search ticker…"
                        autoFocus
                      />
                      <div className="mt-1 flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                        {newSearchLoading && <p className="text-xs text-slate-400 py-1 text-center">Searching…</p>}
                        {!newSearchLoading && newResults.length === 0 && newSearch.trim() && (
                          <p className="text-xs text-slate-400 py-1 text-center">No results.</p>
                        )}
                        {newResults.map((l) => (
                          <button key={l.id} onClick={() => { setNewListing(l); setNewThreshold(l.price != null ? String(l.price) : '') }} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left">
                            <span className="font-mono text-sm text-violet-700 dark:text-violet-400 font-medium">{l.ticker}</span>
                            <span className="text-xs text-slate-500 ml-2 truncate">{l.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Condition</label>
                  <select value={newCondition} onChange={(e) => setNewCondition(e.target.value)} className="input-field w-full">
                    <option value="ABOVE">Price Above</option>
                    <option value="BELOW">Price Below</option>
                    <option value="CHANGE_PCT_UP">Change % Up</option>
                    <option value="CHANGE_PCT_DOWN">Change % Down</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Threshold</label>
                  <input
                    type="number"
                    value={newThreshold}
                    onChange={(e) => setNewThreshold(e.target.value)}
                    className="input-field w-full"
                    placeholder="e.g. 150.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Notification</label>
                  <select value={newNotifType} onChange={(e) => setNewNotifType(e.target.value)} className="input-field w-full">
                    <option value="BOTH">Email + In-app</option>
                    <option value="EMAIL">Email only</option>
                    <option value="IN_APP">In-app only</option>
                  </select>
                </div>
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="text-xs px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={newCreating || !newListing || !newThreshold}
                  className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                >
                  {newCreating ? 'Creating…' : 'Create Alert'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : alerts.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No price alerts. Click <strong>+ New Alert</strong> to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Security', 'Condition', 'Threshold', 'Notification', 'Status', 'Date', ''].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widests uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a, i) => (
                    <tr key={a.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{a.ticker ?? a.listing_id ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${CONDITION_BADGE[a.condition] ?? 'bg-slate-100 text-slate-600'}`}>
                          {CONDITION_LABELS[a.condition] ?? a.condition}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-mono text-slate-700 dark:text-slate-300">{a.threshold != null ? fmt(a.threshold) : '—'}</td>
                      <td className="px-4 py-3"><span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded">{a.notification_type ?? '—'}</span></td>
                      <td className="px-4 py-3">
                        {a.triggered_at ? (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400" />
                            Triggered
                          </span>
                        ) : a.is_active ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDelete(a.id)} disabled={deleting[a.id]} className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ClientPortalLayout>
  )
}
