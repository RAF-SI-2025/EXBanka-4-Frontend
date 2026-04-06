import { useEffect, useState } from 'react'
import useWindowTitle from '../../hooks/useWindowTitle'
import { employeeLoanService } from '../../services/loanService'
import { fmt } from '../../utils/formatting'

const LOAN_TYPES = ['CASH', 'HOUSING', 'AUTO', 'REFINANCING', 'STUDENT']
const STATUSES   = ['PENDING', 'APPROVED', 'REJECTED', 'PAID_OFF', 'IN_DELAY']

const LOAN_TYPE_LABELS = {
  CASH: 'Cash', HOUSING: 'Housing', AUTO: 'Auto', REFINANCING: 'Refinancing', STUDENT: 'Student',
}

const STATUS_STYLES = {
  PENDING:  'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  REJECTED: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  PAID_OFF: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  IN_DELAY: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
}

function statusLabel(s) {
  if (!s) return s
  return s.charAt(0) + s.slice(1).toLowerCase().replace('_', ' ')
}

export default function EmployeeLoansPage() {
  useWindowTitle('All Loans | AnkaBanka')

  const [loans, setLoans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ loanType: '', accountNumber: '', status: '' })

  useEffect(() => {
    employeeLoanService.getAllLoans()
      .then((data) => setLoans([...data].sort((a, b) =>
        (a.accountNumber ?? '').localeCompare(b.accountNumber ?? '')
      )))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const displayed = loans.filter((l) => {
    const typeMatch   = !filters.loanType || l.loanType === filters.loanType
    const accMatch    = !filters.accountNumber.trim() ||
      l.accountNumber?.toLowerCase().includes(filters.accountNumber.trim().toLowerCase())
    const statusMatch = !filters.status || l.status === filters.status
    return typeMatch && accMatch && statusMatch
  })

  const hasFilters = filters.loanType || filters.accountNumber || filters.status

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-1">All Loans</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4">Filter</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={filters.loanType}
              onChange={(e) => setFilters((p) => ({ ...p, loanType: e.target.value }))}
              className="input-field"
            >
              <option value="">All loan types</option>
              {LOAN_TYPES.map((t) => <option key={t} value={t}>{LOAN_TYPE_LABELS[t]}</option>)}
            </select>
            <input
              type="text"
              value={filters.accountNumber}
              onChange={(e) => setFilters((p) => ({ ...p, accountNumber: e.target.value }))}
              placeholder="Account number"
              className="input-field"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="input-field"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button
              onClick={() => setFilters({ loanType: '', accountNumber: '', status: '' })}
              className="mt-4 text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Account', 'Loan Type', 'Int. Rate', 'Agreement', 'Period', 'Amount', 'Remaining', 'Status'].map((h) => (
                      <th key={h} className="px-5 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        {hasFilters ? 'No loans match your filters.' : 'No loans found.'}
                      </td>
                    </tr>
                  ) : (
                    displayed.map((loan, i) => (
                      <tr
                        key={loan.id}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <td className="px-5 py-4 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {loan.accountNumber}
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {LOAN_TYPE_LABELS[loan.loanType] ?? loan.loanType}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {loan.interestRateType}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {loan.agreedDate ?? '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {loan.repaymentPeriod ? `${loan.repaymentPeriod} mo` : '—'}
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {fmt(loan.amount, loan.currency)}
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {loan.remainingDebt != null ? fmt(loan.remainingDebt, loan.currency) : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full ${STATUS_STYLES[loan.status] ?? STATUS_STYLES.PENDING}`}>
                            {statusLabel(loan.status)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {displayed.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                Showing {displayed.length}{hasFilters ? ` result${displayed.length !== 1 ? 's' : ''}` : ` of ${loans.length} loans`}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
