import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useClientPayments } from '../../context/ClientPaymentsContext'
import { PAYMENT_STATUSES, PAYMENT_STATUS_STYLES } from '../../models/Payment'
import { fmt } from '../../utils/formatting'
import Spinner from '../../components/Spinner'

const STATUS_OPTIONS = ['all', ...PAYMENT_STATUSES]

function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-light capitalize ${PAYMENT_STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-400'}`}>
      {status}
    </span>
  )
}

export default function ClientPaymentsPage() {
  useWindowTitle('Payments | AnkaBanka')
  const navigate = useNavigate()
  const { payments, loading } = useClientPayments()

  const [filterDate,      setFilterDate]      = useState('')
  const [filterAmountMin, setFilterAmountMin] = useState('')
  const [filterAmountMax, setFilterAmountMax] = useState('')
  const [filterStatus,    setFilterStatus]    = useState('all')

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (filterDate && !p.dateTime.startsWith(filterDate)) return false
      if (filterStatus !== 'all' && p.status !== filterStatus) return false
      const abs = Math.abs(p.amount)
      if (filterAmountMin !== '' && abs < parseFloat(filterAmountMin)) return false
      if (filterAmountMax !== '' && abs > parseFloat(filterAmountMax)) return false
      return true
    })
  }, [filterDate, filterAmountMin, filterAmountMax, filterStatus])

  function clearFilters() {
    setFilterDate('')
    setFilterAmountMin('')
    setFilterAmountMax('')
    setFilterStatus('all')
  }

  const hasFilters = filterDate || filterAmountMin || filterAmountMax || filterStatus !== 'all'

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-4xl mx-auto w-full">

        <div className="flex items-center justify-between mb-1">
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white">Payments</h1>
          <button
            onClick={() => navigate('/client/payments/new')}
            className="btn-primary"
          >
            + New Payment
          </button>
        </div>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {loading ? <Spinner /> : <>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date */}
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="input-field"
              />
            </div>

            {/* Amount range */}
            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">Min amount</label>
              <input
                type="number"
                value={filterAmountMin}
                onChange={(e) => setFilterAmountMin(e.target.value)}
                placeholder="0"
                className="input-field"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">Max amount</label>
              <input
                type="number"
                value={filterAmountMax}
                onChange={(e) => setFilterAmountMax(e.target.value)}
                placeholder="∞"
                className="input-field"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1 min-w-[130px]">
              <label className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">Status</label>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-field appearance-none pr-10"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs tracking-widest uppercase text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors pb-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">No payments match your filters.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Date</th>
                  <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Recipient</th>
                  <th className="text-right text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Amount</th>
                  <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Currency</th>
                  <th className="text-left text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 px-5 py-3 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/client/payments/${p.id}`)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${i !== filtered.length - 1 ? 'border-b border-slate-100 dark:border-slate-800' : ''}`}
                  >
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 font-light whitespace-nowrap">{p.dateTime}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-900 dark:text-white font-light">{p.recipient}</td>
                    <td className={`px-5 py-3.5 text-sm font-medium text-right whitespace-nowrap ${p.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {p.amount > 0 ? '+' : ''}{fmt(p.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400 font-light">{p.currency}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-right">
          {filtered.length} of {payments.length} payments
        </p>
        </>}
      </div>
    </ClientPortalLayout>
  )
}
