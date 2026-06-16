import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useApiError } from '../../context/ApiErrorContext'
import { clientWatchlistService } from '../../services/watchlistService'
import { fmt } from '../../utils/formatting'

export default function ClientWatchlistPage() {
  const navigate = useNavigate()
  const { addSuccess } = useApiError()

  const [watchlists, setWatchlists]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState({})
  const [items, setItems]             = useState({})
  const [loadingItems, setLoadingItems] = useState({})
  const [showCreate, setShowCreate]   = useState(false)
  const [newName, setNewName]         = useState('')
  const [creating, setCreating]       = useState(false)

  function load() {
    setLoading(true)
    clientWatchlistService.listWatchlists()
      .then((res) => setWatchlists(Array.isArray(res) ? res : (res.watchlists ?? [])))
      .catch(() => setWatchlists([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function toggleExpand(wl) {
    const id = wl.id
    if (expanded[id]) { setExpanded((p) => ({ ...p, [id]: false })); return }
    setExpanded((p) => ({ ...p, [id]: true }))
    if (items[id]) return
    setLoadingItems((p) => ({ ...p, [id]: true }))
    try {
      const res = await clientWatchlistService.getItems(id)
      setItems((p) => ({ ...p, [id]: Array.isArray(res) ? res : (res.items ?? []) }))
    } catch {
      setItems((p) => ({ ...p, [id]: [] }))
    } finally {
      setLoadingItems((p) => ({ ...p, [id]: false }))
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this watchlist?')) return
    try {
      await clientWatchlistService.deleteWatchlist(id)
      setWatchlists((p) => p.filter((w) => w.id !== id))
      addSuccess('Watchlist deleted.')
    } catch { }
  }

  async function handleRemoveItem(watchlistId, listingId) {
    try {
      await clientWatchlistService.removeItem(watchlistId, listingId)
      setItems((p) => ({ ...p, [watchlistId]: (p[watchlistId] ?? []).filter((i) => i.listing_id !== listingId) }))
      addSuccess('Removed from watchlist.')
    } catch { }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await clientWatchlistService.createWatchlist(newName.trim())
      setNewName(''); setShowCreate(false); load()
      addSuccess('Watchlist created.')
    } finally { setCreating(false) }
  }

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">Watchlists</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your watched securities</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-xs px-4 py-2">+ New</button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">New Watchlist</h2>
              </div>
              <div className="px-6 py-5">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} className="input-field w-full" placeholder="Name…" autoFocus />
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="text-xs px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">{creating ? 'Creating…' : 'Create'}</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center text-slate-400 text-sm py-12">Loading…</div>
        ) : watchlists.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12">No watchlists.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {watchlists.map((wl) => (
              <div key={wl.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <button onClick={() => toggleExpand(wl)} className="flex items-center gap-3 text-left flex-1">
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded[wl.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-slate-900 dark:text-white">{wl.name}</span>
                  </button>
                  <button onClick={() => handleDelete(wl.id)} className="text-xs text-red-500 hover:text-red-600 transition-colors">Delete</button>
                </div>
                {expanded[wl.id] && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {loadingItems[wl.id] ? (
                      <div className="px-5 py-4 text-sm text-slate-400">Loading…</div>
                    ) : (items[wl.id] ?? []).length === 0 ? (
                      <div className="px-5 py-4 text-sm text-slate-400">No items.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {['Ticker', 'Name', 'Price', 'Change', ''].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs tracking-widests uppercase text-slate-500 dark:text-slate-400 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(items[wl.id] ?? []).map((item, i) => {
                            const changePct = item.change_percent ?? (item.change && item.price ? (item.change / item.price * 100) : null)
                            return (
                              <tr key={item.id ?? item.listing_id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                                <td className="px-4 py-3 font-mono font-medium text-violet-600 dark:text-violet-400 cursor-pointer hover:underline" onClick={() => navigate(`/client/securities/${item.listing_id}`)}>{item.ticker ?? '—'}</td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.name ?? '—'}</td>
                                <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{item.price != null ? fmt(item.price) : '—'}</td>
                                <td className={`px-4 py-3 tabular-nums font-medium ${changePct == null ? '' : changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {changePct != null ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%` : '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <button onClick={() => handleRemoveItem(wl.id, item.listing_id)} className="text-xs text-red-500 hover:text-red-600 transition-colors">Remove</button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientPortalLayout>
  )
}
