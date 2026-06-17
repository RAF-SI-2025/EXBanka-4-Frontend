import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { usePermission } from '../../hooks/usePermission'
import { auditService } from '../../services/auditService'

const ACTION_OPTIONS = [
  '', 'ORDER_APPROVED', 'ORDER_DECLINED', 'LIMIT_CHANGE', 'RESET_USED_LIMIT',
  'PERMISSION_CHANGE', 'MANUAL_TAX',
]

const ACTION_BADGE = {
  ORDER_APPROVED:   'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ORDER_DECLINED:   'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  LIMIT_CHANGE:     'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  RESET_USED_LIMIT: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  PERMISSION_CHANGE:'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  MANUAL_TAX:       'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function AuditLogPage() {
  useWindowTitle('Audit Log | AnkaBanka')
  const { canAny } = usePermission()
  if (!canAny(['isSupervisor', 'isAdmin'])) return <Navigate to="/" replace />

  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [actionFilter, setAction] = useState('')
  const [actorId, setActorId]     = useState('')
  const [fromDate, setFromDate]   = useState('')
  const [toDate, setToDate]       = useState('')
  const [page, setPage]           = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const PAGE_SIZE = 20

  function load(p = page) {
    setLoading(true)
    auditService.getAuditLogs({
      action:   actionFilter,
      actorId:  actorId ? Number(actorId) : undefined,
      fromDate,
      toDate,
      page:     p,
      pageSize: PAGE_SIZE,
    })
      .then((res) => {
        const items = Array.isArray(res) ? res : (res.entries ?? res.logs ?? res.items ?? [])
        setLogs(items)
        setTotalPages(res.total_pages ?? 1)
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1); load(1) }, [actionFilter, actorId, fromDate, toDate])

  function handlePage(next) { setPage(next); load(next) }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Supervisor Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-1">Audit Log</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 mb-6 shadow-sm">
          <p className="text-xs tracking-widests uppercase text-slate-500 dark:text-slate-400 mb-4">Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Action</label>
              <select value={actionFilter} onChange={(e) => setAction(e.target.value)} className="input-field w-full">
                {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a || 'All'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Actor ID</label>
              <input type="number" value={actorId} onChange={(e) => setActorId(e.target.value)} placeholder="Employee ID…" className="input-field w-full" />
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
          ) : logs.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No audit events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Time', 'Performed By', 'Action', 'Target', 'Old Value', 'New Value'].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'}`}>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-medium text-slate-900 dark:text-white">{log.actor_name ?? log.actor_id ?? '—'}</span>
                        {log.actor_type && (
                          <span className="ml-1.5 text-xs text-slate-400 dark:text-slate-500">{log.actor_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${ACTION_BADGE[log.action] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {log.action ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {log.target_name ?? (log.target_id ? `#${log.target_id}` : '—')}
                        {log.target_type && <span className="ml-1 text-xs text-slate-400">({log.target_type})</span>}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 max-w-[160px] truncate" title={log.old_value}>
                        {log.old_value ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-400 max-w-[160px] truncate" title={log.new_value}>
                        {log.new_value ?? '—'}
                      </td>
                    </tr>
                  ))}
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
    </div>
  )
}
