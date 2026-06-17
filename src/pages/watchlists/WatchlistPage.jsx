import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useApiError } from '../../context/ApiErrorContext'
import { watchlistService } from '../../services/watchlistService'
import { securitiesService } from '../../services/securitiesService'
import { fmt } from '../../utils/formatting'

function formatAssetType(t) {
  if (!t) return '—'
  return t.toLowerCase().split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')
}

export default function WatchlistPage() {
  useWindowTitle('Watchlists | AnkaBanka')
  const navigate = useNavigate()
  const { addSuccess, addToast } = useApiError()

  const [watchlists, setWatchlists]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState({})
  const [items, setItems]             = useState({})
  const [loadingItems, setLoadingItems] = useState({})
  const [showCreate, setShowCreate]   = useState(false)
  const [newName, setNewName]         = useState('')
  const [creating, setCreating]       = useState(false)

  // Add security modal
  const [addModal, setAddModal]           = useState(null) // watchlist id or null
  const [addSearch, setAddSearch]         = useState('')
  const [addResults, setAddResults]       = useState([])
  const [addSearchLoading, setAddSearchLoading] = useState(false)
  const [addBusy, setAddBusy]             = useState(false)
  const searchTimeout                     = useRef(null)

  function load() {
    setLoading(true)
    watchlistService.listWatchlists()
      .then((res) => setWatchlists(Array.isArray(res) ? res : (res.watchlists ?? [])))
      .catch(() => setWatchlists([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function toggleExpand(wl) {
    const id = wl.id
    if (expanded[id]) {
      setExpanded((p) => ({ ...p, [id]: false }))
      return
    }
    setExpanded((p) => ({ ...p, [id]: true }))
    if (items[id]) return
    setLoadingItems((p) => ({ ...p, [id]: true }))
    try {
      const res = await watchlistService.getItems(id)
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
      await watchlistService.deleteWatchlist(id)
      setWatchlists((p) => p.filter((w) => w.id !== id))
      addSuccess('Watchlist deleted.')
    } catch { /* error toast from interceptor */ }
  }

  async function handleRemoveItem(watchlistId, listingId) {
    try {
      await watchlistService.removeItem(watchlistId, listingId)
      setItems((p) => ({ ...p, [watchlistId]: (p[watchlistId] ?? []).filter((i) => i.listing_id !== listingId) }))
      addSuccess('Removed from watchlist.')
    } catch { /* error toast */ }
  }

  function openAddModal(wlId) {
    setAddModal(wlId)
    setAddSearch('')
    setAddResults([])
  }

  function handleAddSearch(val) {
    setAddSearch(val)
    clearTimeout(searchTimeout.current)
    if (!val.trim()) { setAddResults([]); return }
    setAddSearchLoading(true)
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await securitiesService.getListings({ ticker: val.trim(), pageSize: 8 })
        setAddResults(res.items ?? [])
      } catch { setAddResults([]) }
      finally { setAddSearchLoading(false) }
    }, 350)
  }

  async function handleAddItem(listing) {
    setAddBusy(true)
    try {
      await watchlistService.addItem(addModal, listing.id)
      // refresh items for this watchlist
      const res = await watchlistService.getItems(addModal)
      setItems((p) => ({ ...p, [addModal]: Array.isArray(res) ? res : (res.items ?? []) }))
      addSuccess(`${listing.ticker} added to watchlist.`)
      setAddModal(null)
    } catch { /* error toast */ }
    finally { setAddBusy(false) }
  }

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await watchlistService.createWatchlist(newName.trim())
      setNewName('')
      setShowCreate(false)
      load()
      addSuccess('Watchlist created.')
    } catch {
      /* error toast from interceptor */
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-widests uppercase text-violet-600 dark:text-violet-400 mb-1">Portal</p>
            <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">Watchlists</h1>
            <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mt-2" />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-xs px-5 py-2.5"
          >
            + New Watchlist
          </button>
        </div>

        {/* Add security modal */}
        {addModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setAddModal(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">Add Security</h2>
              </div>
              <div className="px-6 py-5">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Search by ticker</label>
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => handleAddSearch(e.target.value)}
                  className="input-field w-full"
                  placeholder="e.g. AAPL"
                  autoFocus
                />
                <div className="mt-3 flex flex-col gap-1 max-h-52 overflow-y-auto">
                  {addSearchLoading && <p className="text-xs text-slate-400 py-2 text-center">Searching…</p>}
                  {!addSearchLoading && addResults.length === 0 && addSearch.trim() && (
                    <p className="text-xs text-slate-400 py-2 text-center">No results.</p>
                  )}
                  {addResults.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleAddItem(l)}
                      disabled={addBusy}
                      className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left transition-colors disabled:opacity-50"
                    >
                      <span className="font-mono font-medium text-sm text-violet-700 dark:text-violet-400">{l.ticker}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate ml-3">{l.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-5 flex justify-end">
                <button onClick={() => setAddModal(null)} className="text-xs px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Create modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">New Watchlist</h2>
              </div>
              <div className="px-6 py-5">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="input-field w-full"
                  placeholder="e.g. Tech stocks"
                  autoFocus
                />
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button onClick={() => setShowCreate(false)} className="text-xs px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !newName.trim()} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Watchlist list */}
        {loading ? (
          <div className="text-center text-slate-400 text-sm py-12">Loading…</div>
        ) : watchlists.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-12">No watchlists. Create your first one.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {watchlists.map((wl) => (
              <div key={wl.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    onClick={() => toggleExpand(wl)}
                    className="flex items-center gap-3 text-left flex-1"
                  >
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded[wl.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-slate-900 dark:text-white">{wl.name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{wl.item_count != null ? `${wl.item_count} items` : ''}</span>
                  </button>
                  <button
                    onClick={() => handleDelete(wl.id)}
                    className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>

                {expanded[wl.id] && (
                  <div className="border-t border-slate-100 dark:border-slate-800">
                    {loadingItems[wl.id] ? (
                      <div className="px-5 py-4 text-sm text-slate-400">Loading items…</div>
                    ) : (items[wl.id] ?? []).length === 0 ? (
                      <div className="px-5 py-4 flex items-center justify-between">
                        <span className="text-sm text-slate-400">No items.</span>
                        <button onClick={() => openAddModal(wl.id)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">+ Add Security</button>
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-slate-800">
                            {['Ticker', 'Name', 'Type', 'Price', 'Change', 'Volume', ''].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs tracking-widests uppercase text-slate-500 dark:text-slate-400 font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(items[wl.id] ?? []).map((item, i) => {
                            const changePct = item.change_percent ?? (item.change && item.price ? (item.change / item.price * 100) : null)
                            return (
                              <tr key={item.id ?? item.listing_id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                                <td className="px-4 py-3 font-mono font-medium text-violet-600 dark:text-violet-400 cursor-pointer hover:underline" onClick={() => navigate(`/securities/${item.listing_id}`)}>
                                  {item.ticker ?? '—'}
                                </td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.name ?? '—'}</td>
                                <td className="px-4 py-3">
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-1.5 py-0.5 rounded font-mono">{formatAssetType(item.asset_type)}</span>
                                </td>
                                <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{item.price != null ? fmt(item.price) : '—'}</td>
                                <td className={`px-4 py-3 tabular-nums font-medium ${changePct == null ? '' : changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                  {changePct != null ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%` : '—'}
                                </td>
                                <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">{item.volume ?? '—'}</td>
                                <td className="px-4 py-3">
                                  <button onClick={() => handleRemoveItem(wl.id, item.listing_id)} className="text-xs text-red-500 hover:text-red-600 transition-colors">Remove</button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                    {!loadingItems[wl.id] && (items[wl.id] ?? []).length > 0 && (
                      <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                        <button onClick={() => openAddModal(wl.id)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">+ Add Security</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
