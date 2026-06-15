import { useEffect, useState } from 'react'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { orderService } from '../../services/orderService'
import { fmt } from '../../utils/formatting'

const STATUS_FILTERS    = ['ALL', 'PENDING', 'APPROVED', 'DECLINED', 'DONE']
const ASSET_TYPE_OPTIONS = ['', 'STOCK', 'FOREX', 'FUTURES', 'OPTION']
const DIRECTION_OPTIONS  = ['', 'BUY', 'SELL']

const STATUS_BADGE = {
  PENDING:  'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DECLINED: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  DONE:     'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  CANCELLED:'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

export default function ClientMyOrdersPage() {
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatus]   = useState('ALL')
  const [assetType, setAssetType]   = useState('')
  const [direction, setDirection]   = useState('')
  const [fromDate, setFromDate]     = useState('')
  const [toDate, setToDate]         = useState('')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 20

  function load(p = page) {
    setLoading(true)
    orderService.getClientOrders({
      status:    statusFilter === 'ALL' ? '' : statusFilter,
      assetType,
      direction,
      fromDate,
      toDate,
      page:     p,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        const items = Array.isArray(res) ? res : (res.orders ?? res.items ?? [])
        setOrders(items)
        setTotalPages(res.total_pages ?? 1)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load(1) }, [statusFilter, assetType, direction, fromDate, toDate])

  function handlePage(next) { setPage(next); load(next) }

  function effectiveStatus(o) {
    if (o.is_done ?? o.isDone) return 'DONE'
    return o.status ?? '—'
  }

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">My Orders</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your order history</p>

        {/* Status pills */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`px-4 py-1.5 text-xs tracking-widest uppercase rounded-full transition-colors ${
                statusFilter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Extra filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Asset Type</label>
              <select value={assetType} onChange={(e) => setAssetType(e.target.value)} className="input-field w-full">
                {ASSET_TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t || 'All'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Direction</label>
              <select value={direction} onChange={(e) => setDirection(e.target.value)} className="input-field w-full">
                {DIRECTION_OPTIONS.map((d) => <option key={d} value={d}>{d || 'All'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input-field w-full" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input-field w-full" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No orders found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Tip', 'Hartija', 'Smer', 'Količina', 'Cijena', 'Status', 'Datum', 'Komisija'].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => {
                    const sl = effectiveStatus(o)
                    const ticker = o.ticker ?? o.asset_ticker ?? o.asset_id ?? '—'
                    const atype  = o.asset_type ?? '—'
                    return (
                      <tr key={o.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded font-mono">
                            {o.order_type ?? o.orderType ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono font-medium text-slate-900 dark:text-white">{ticker}</span>
                          {' '}
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs px-1.5 py-0.5 rounded">{atype}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            o.direction === 'BUY'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {o.direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">{o.quantity}</td>
                        <td className="px-4 py-3 tabular-nums font-mono text-slate-700 dark:text-slate-300">
                          {o.price_per_unit != null ? fmt(o.price_per_unit) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${STATUS_BADGE[sl] ?? STATUS_BADGE.DONE}`}>
                            {sl}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {o.last_modification ? new Date(o.last_modification).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                          {o.commission_paid != null ? fmt(o.commission_paid) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => handlePage(page - 1)} disabled={page <= 1} className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Prev</button>
                <button onClick={() => handlePage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ClientPortalLayout>
  )
}
