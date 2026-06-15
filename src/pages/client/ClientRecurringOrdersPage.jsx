import { useEffect, useState } from 'react'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useApiError } from '../../context/ApiErrorContext'
import { clientRecurringOrderService } from '../../services/recurringOrderService'
import { fmt } from '../../utils/formatting'

const CADENCE_LABELS = { DAILY: 'Dnevno', WEEKLY: 'Sedmično', MONTHLY: 'Mesečno' }
const MODE_LABELS    = { BY_QUANTITY: 'Po količini', BY_AMOUNT: 'Po iznosu' }

export default function ClientRecurringOrdersPage() {
  const { addSuccess } = useApiError()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState({})

  function load() {
    setLoading(true)
    clientRecurringOrderService.list()
      .then((res) => setOrders(Array.isArray(res) ? res : (res.recurring_orders ?? res.orders ?? [])))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

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
        <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">Recurring Orders</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Vaši trajni nalozi</p>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Nema trajnih naloga.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Hartija', 'Smer', 'Način / Vrednost', 'Učestalost', 'Sledeće', 'Status', 'Akcije'].map((h) => (
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
                        <span className={`text-xs font-medium ${o.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                          {o.active ? 'Aktivan' : 'Pauziran'}
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
