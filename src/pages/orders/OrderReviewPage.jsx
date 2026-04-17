import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { usePermission } from '../../hooks/usePermission'
import { orderService } from '../../services/orderService'
import { fmt } from '../../utils/formatting'

const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'DECLINED', 'DONE']

const STATUS_BADGE = {
  PENDING:  'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DECLINED: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  DONE:     'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

const ORDER_TYPE_LABELS = {
  MARKET:     'Market',
  LIMIT:      'Limit',
  STOP:       'Stop',
  STOP_LIMIT: 'Stop-Limit',
}

function orderTypeLabel(order) {
  const type   = ORDER_TYPE_LABELS[order.order_type ?? order.orderType] ?? order.order_type ?? order.orderType
  const isAon  = order.is_aon    ?? order.isAon
  const isMrgn = order.is_margin ?? order.isMargin
  const prefix = [isAon && 'AON', isMrgn && 'Margin'].filter(Boolean).join(' ')
  return prefix ? `${prefix} ${type}` : type
}

function statusLabel(order) {
  const isDone = order.is_done ?? order.isDone
  if (isDone) return 'DONE'
  return order.status ?? '—'
}

function isExpired(order) {
  const date = order.settlement_date ?? order.settlementDate
  if (!date) return false
  return new Date(date) < new Date()
}

export default function OrderReviewPage() {
  useWindowTitle('Order Review | AnkaBanka')
  const { canAny } = usePermission()
  if (!canAny(['isSupervisor', 'isAdmin'])) return <Navigate to="/" replace />

  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  // tracks one-time approve/decline per order: { [id]: 'approved' | 'declined' }
  const [actioned,     setActioned]     = useState({})
  const [busy,         setBusy]         = useState({})

  function load() {
    setLoading(true)
    orderService.getOrders()
      .then((data) => setOrders(Array.isArray(data) ? data : (data.orders ?? data.items ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const displayed = orders.filter((o) => {
    if (statusFilter === 'ALL')  return true
    if (statusFilter === 'DONE') return o.is_done ?? o.isDone
    return o.status === statusFilter
  })

  async function handle(id, action) {
    setBusy((p) => ({ ...p, [id]: true }))
    try {
      if      (action === 'approve')        await orderService.approveOrder(id)
      else if (action === 'decline')        await orderService.declineOrder(id)
      else if (action === 'cancel')         await orderService.cancelOrder(id)
      else if (action === 'cancelPortions') await orderService.cancelOrderPortions(id)

      if (action === 'approve' || action === 'decline') {
        const newStatus = action === 'approve' ? 'APPROVED' : 'DECLINED'
        setActioned((p) => ({ ...p, [id]: action === 'approve' ? 'approved' : 'declined' }))
        setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o))
      } else {
        load()
      }
    } finally {
      setBusy((p) => ({ ...p, [id]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Supervisor Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-1">Order Review</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Status filter pills */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 text-xs tracking-widest uppercase rounded-full transition-colors ${
                statusFilter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400 dark:hover:border-violet-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">Loading…</div>
          ) : displayed.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-xs tracking-widests uppercase text-slate-400 dark:text-slate-500 mb-1">No orders</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
                {statusFilter !== 'ALL' ? 'No orders match the selected filter.' : 'There are no orders yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Agent', 'Order Type', 'Asset', 'Qty', 'Contract Size', 'Price / Unit', 'Direction', 'Remaining', 'Status', 'Actions'].map((h) => (
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
                  {displayed.map((order, i) => {
                    const expired   = isExpired(order)
                    const isBusy    = busy[order.id]
                    const done      = actioned[order.id]
                    const sl        = statusLabel(order)
                    const isDone    = order.is_done ?? order.isDone
                    const direction = order.direction
                    const pricePerUnit = order.price_per_unit ?? order.pricePerUnit
                    const contractSize = order.contract_size  ?? order.contractSize  ?? 1
                    const remaining    = order.remaining_portions ?? order.remainingPortions
                    const ticker       = order.ticker ?? order.asset_id ?? order.assetId

                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium whitespace-nowrap">
                          {order.agent_name ?? order.agentName ?? order.user_id ?? order.userId ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {orderTypeLabel(order)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {ticker}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {order.quantity}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {contractSize}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-mono">
                          {pricePerUnit != null ? fmt(pricePerUnit) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                            direction === 'BUY'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {direction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                          {remaining ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${STATUS_BADGE[sl] ?? STATUS_BADGE.DONE}`}>
                            {sl}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            {order.status === 'PENDING' && !isDone && (
                              <>
                                {!expired && (
                                  <button
                                    onClick={() => handle(order.id, 'approve')}
                                    disabled={isBusy || !!done}
                                    className="px-3 py-1 text-xs tracking-widest uppercase rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    {done === 'approved' ? 'Approved' : 'Approve'}
                                  </button>
                                )}
                                <button
                                  onClick={() => handle(order.id, 'decline')}
                                  disabled={isBusy || !!done}
                                  className="px-3 py-1 text-xs tracking-widest uppercase rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  {done === 'declined' ? 'Declined' : 'Decline'}
                                </button>
                              </>
                            )}
                            {order.status === 'APPROVED' && !isDone && (
                              <>
                                <button
                                  onClick={() => handle(order.id, 'cancel')}
                                  disabled={isBusy}
                                  className="px-3 py-1 text-xs tracking-widest uppercase rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handle(order.id, 'cancelPortions')}
                                  disabled={isBusy}
                                  className="px-3 py-1 text-xs tracking-widest uppercase rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  Cancel Portions
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
