import { useEffect, useRef, useState } from 'react'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useApiError } from '../../context/ApiErrorContext'
import { clientRecurringOrderService } from '../../services/recurringOrderService'
import { clientSecuritiesService } from '../../services/clientSecuritiesService'
import { clientApiClient } from '../../services/clientApiClient'
import { fmt } from '../../utils/formatting'

const CADENCE_LABELS = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' }
const MODE_LABELS    = { BY_QUANTITY: 'By Quantity', BY_AMOUNT: 'By Amount' }

export default function ClientRecurringOrdersPage() {
  const { addSuccess } = useApiError()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState({})

  const [showNew, setShowNew]           = useState(false)
  const [newSearch, setNewSearch]       = useState('')
  const [newResults, setNewResults]     = useState([])
  const [newSearchLoading, setNewSearchLoading] = useState(false)
  const [newListing, setNewListing]     = useState(null)
  const [newDirection, setNewDirection] = useState('BUY')
  const [newMode, setNewMode]           = useState('BY_AMOUNT')
  const [newValue, setNewValue]         = useState('')
  const [newCadence, setNewCadence]     = useState('MONTHLY')
  const [newAccountId, setNewAccountId] = useState('')
  const [accounts, setAccounts]         = useState([])
  const [newCreating, setNewCreating]   = useState(false)
  const searchTimeout                   = useRef(null)

  function load() {
    setLoading(true)
    clientRecurringOrderService.list()
      .then((res) => setOrders(Array.isArray(res) ? res : (res.recurring_orders ?? res.orders ?? [])))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function openNew() {
    setShowNew(true)
    setNewSearch('')
    setNewResults([])
    setNewListing(null)
    setNewDirection('BUY')
    setNewMode('BY_AMOUNT')
    setNewValue('')
    setNewCadence('MONTHLY')
    setNewAccountId('')
    try {
      const accs = await clientApiClient.get('/api/accounts/my').then((r) => r.data)
      const list = Array.isArray(accs) ? accs : (accs.accounts ?? [])
      setAccounts(list)
      if (list.length > 0) setNewAccountId(String(list[0].id ?? list[0].accountId ?? ''))
    } catch { setAccounts([]) }
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
    if (!newListing || !newValue || !newAccountId) return
    setNewCreating(true)
    try {
      await clientRecurringOrderService.create({
        assetId:   newListing.id,
        direction: newDirection,
        mode:      newMode,
        value:     Number(newValue),
        accountId: Number(newAccountId),
        cadence:   newCadence,
      })
      addSuccess('Recurring order created.')
      setShowNew(false)
      load()
    } catch { /* error toast */ }
    finally { setNewCreating(false) }
  }

  async function handlePause(id) {
    setBusy((p) => ({ ...p, [id]: true }))
    try {
      await clientRecurringOrderService.pause(id)
      setOrders((p) => p.map((o) => o.id === id ? { ...o, active: false } : o))
      addSuccess('Recurring order paused.')
    } finally { setBusy((p) => ({ ...p, [id]: false })) }
  }

  async function handleResume(id) {
    setBusy((p) => ({ ...p, [id]: true }))
    try {
      await clientRecurringOrderService.resume(id)
      setOrders((p) => p.map((o) => o.id === id ? { ...o, active: true } : o))
      addSuccess('Recurring order resumed.')
    } finally { setBusy((p) => ({ ...p, [id]: false })) }
  }

  async function handleCancel(id) {
    if (!window.confirm('Cancel this recurring order?')) return
    setBusy((p) => ({ ...p, [id]: true }))
    try {
      await clientRecurringOrderService.cancel(id)
      setOrders((p) => p.filter((o) => o.id !== id))
      addSuccess('Recurring order cancelled.')
    } finally { setBusy((p) => ({ ...p, [id]: false })) }
  }

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">Recurring Orders</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your recurring orders</p>
          </div>
          <button onClick={openNew} className="btn-primary text-xs px-4 py-2">+ New Recurring Order</button>
        </div>

        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowNew(false)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-serif text-lg font-light text-slate-900 dark:text-white">New Recurring Order</h2>
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
                      <div className="mt-1 flex flex-col gap-0.5 max-h-36 overflow-y-auto">
                        {newSearchLoading && <p className="text-xs text-slate-400 py-1 text-center">Searching…</p>}
                        {!newSearchLoading && newResults.length === 0 && newSearch.trim() && (
                          <p className="text-xs text-slate-400 py-1 text-center">No results.</p>
                        )}
                        {newResults.map((l) => (
                          <button key={l.id} onClick={() => setNewListing(l)} className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20 text-left">
                            <span className="font-mono text-sm text-violet-700 dark:text-violet-400 font-medium">{l.ticker}</span>
                            <span className="text-xs text-slate-500 ml-2 truncate">{l.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Direction</label>
                  <select value={newDirection} onChange={(e) => setNewDirection(e.target.value)} className="input-field w-full">
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Mode</label>
                  <select value={newMode} onChange={(e) => setNewMode(e.target.value)} className="input-field w-full">
                    <option value="BY_AMOUNT">By Amount (currency)</option>
                    <option value="BY_QUANTITY">By Quantity (shares)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {newMode === 'BY_AMOUNT' ? 'Amount' : 'Quantity'}
                  </label>
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="input-field w-full"
                    placeholder={newMode === 'BY_AMOUNT' ? 'e.g. 500' : 'e.g. 5'}
                    min="1"
                    step={newMode === 'BY_AMOUNT' ? '0.01' : '1'}
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Frequency</label>
                  <select value={newCadence} onChange={(e) => setNewCadence(e.target.value)} className="input-field w-full">
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Account</label>
                  {accounts.length > 0 ? (
                    <select value={newAccountId} onChange={(e) => setNewAccountId(e.target.value)} className="input-field w-full">
                      {accounts.map((a) => (
                        <option key={a.id ?? a.accountId} value={a.id ?? a.accountId}>
                          {a.accountNumber ?? a.account_number ?? `Account #${a.id ?? a.accountId}`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={newAccountId}
                      onChange={(e) => setNewAccountId(e.target.value)}
                      className="input-field w-full"
                      placeholder="Account ID"
                    />
                  )}
                </div>
              </div>
              <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button onClick={() => setShowNew(false)} className="text-xs px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={newCreating || !newListing || !newValue || !newAccountId}
                  className="btn-primary text-xs px-4 py-2 disabled:opacity-50"
                >
                  {newCreating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No recurring orders. Click <strong>+ New Recurring Order</strong> to create one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Security', 'Direction', 'Mode / Value', 'Frequency', 'Next Run', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widests uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                      <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{o.ticker ?? o.asset_id ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          o.direction === 'BUY'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{o.direction}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{MODE_LABELS[o.mode] ?? o.mode} — {fmt(o.value)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{CADENCE_LABELS[o.cadence] ?? o.cadence}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{o.next_run ? new Date(o.next_run).toLocaleString() : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${o.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${o.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {o.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {o.active ? (
                            <button onClick={() => handlePause(o.id)} disabled={busy[o.id]} className="px-3 py-1 text-xs rounded border border-yellow-400 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-50">Pause</button>
                          ) : (
                            <button onClick={() => handleResume(o.id)} disabled={busy[o.id]} className="px-3 py-1 text-xs rounded border border-emerald-400 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50">Resume</button>
                          )}
                          <button onClick={() => handleCancel(o.id)} disabled={busy[o.id]} className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">Cancel</button>
                        </div>
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
