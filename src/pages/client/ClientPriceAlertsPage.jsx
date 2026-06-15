import { useEffect, useState } from 'react'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useApiError } from '../../context/ApiErrorContext'
import { clientPriceAlertService } from '../../services/priceAlertService'
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
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState({})

  useEffect(() => {
    setLoading(true)
    clientPriceAlertService.list()
      .then((res) => setAlerts(Array.isArray(res) ? res : (res.alerts ?? [])))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false))
  }, [])

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
        <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">Price Alerts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Vaše cjenovne notifikacije</p>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : alerts.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No price alerts. Set one on a listing detail page.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Hartija', 'Uslov', 'Prag', 'Notifikacija', 'Status', 'Datum', ''].map((h) => (
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
                          <span className="text-xs text-orange-600 dark:text-orange-400">Triggered</span>
                        ) : a.is_active ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">Active</span>
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
