import { useEffect, useState } from 'react'
import useWindowTitle from '../../hooks/useWindowTitle'
import { employeeLoanService } from '../../services/loanService'
import { fmt } from '../../utils/formatting'

const LOAN_TYPES = ['CASH', 'HOUSING', 'AUTO', 'REFINANCING', 'STUDENT']

const LOAN_TYPE_LABELS = {
  CASH: 'Cash', HOUSING: 'Housing', AUTO: 'Auto', REFINANCING: 'Refinancing', STUDENT: 'Student',
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 shrink-0">{label}</span>
      <span className="text-sm text-slate-800 dark:text-slate-200 text-right">{value ?? '—'}</span>
    </div>
  )
}

function ApplicationCard({ app, onApprove, onReject }) {
  const [confirming, setConfirming] = useState(null) // 'approve' | 'reject' | null
  const [busy, setBusy] = useState(false)

  async function handle(action) {
    setBusy(true)
    try {
      await (action === 'approve' ? onApprove(app.id) : onReject(app.id))
    } finally {
      setBusy(false)
      setConfirming(null)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-1">
            {LOAN_TYPE_LABELS[app.loanType] ?? app.loanType} Loan
          </p>
          <p className="font-mono text-slate-900 dark:text-white font-medium">#{app.loanNumber}</p>
        </div>
        <span className="text-lg font-serif font-light text-slate-900 dark:text-white">
          {fmt(app.amount, app.currency)}
        </span>
      </div>

      <div className="space-y-0 mb-5">
        <InfoRow label="Account"          value={app.accountNumber} />
        <InfoRow label="Interest Rate"    value={app.interestRateType} />
        <InfoRow label="Repayment Period" value={app.repaymentPeriod ? `${app.repaymentPeriod} months` : null} />
        <InfoRow label="Purpose"          value={app.purpose} />
        <InfoRow label="Monthly Salary"   value={app.monthlySalary ? fmt(app.monthlySalary, app.currency) : null} />
        <InfoRow label="Employment"       value={app.employmentStatus} />
        <InfoRow label="Empl. Period"     value={app.employmentPeriod ? `${app.employmentPeriod} months` : null} />
        <InfoRow label="Contact Phone"    value={app.contactPhone} />
        <InfoRow label="Agreement Date"   value={app.agreedDate} />
      </div>

      {confirming ? (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {confirming === 'approve' ? 'Approve this application?' : 'Reject this application?'}
          </span>
          <button
            onClick={() => handle(confirming)}
            disabled={busy}
            className={`px-4 py-1.5 text-xs tracking-widest uppercase rounded-lg text-white transition-colors ${
              confirming === 'approve'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {busy ? '…' : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(null)}
            disabled={busy}
            className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={() => setConfirming('approve')}
            className="px-4 py-1.5 text-xs tracking-widest uppercase rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
          >
            Approve
          </button>
          <button
            onClick={() => setConfirming('reject')}
            className="px-4 py-1.5 text-xs tracking-widest uppercase rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

export default function EmployeeLoanApplicationsPage() {
  useWindowTitle('Loan Applications | AnkaBanka')

  const [applications, setApplications] = useState([])
  const [loading, setLoading]           = useState(true)
  const [filters, setFilters]           = useState({ loanType: '', accountNumber: '' })
  const [toast, setToast]               = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function load() {
    setLoading(true)
    employeeLoanService.getLoanApplications()
      .then(setApplications)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleApprove(id) {
    await employeeLoanService.approveLoan(id)
    setApplications((prev) => prev.filter((a) => a.id !== id))
    showToast('Loan approved.')
  }

  async function handleReject(id) {
    await employeeLoanService.rejectLoan(id)
    setApplications((prev) => prev.filter((a) => a.id !== id))
    showToast('Loan rejected.')
  }

  const displayed = applications.filter((a) => {
    const typeMatch = !filters.loanType || a.loanType === filters.loanType
    const accMatch  = !filters.accountNumber.trim() ||
      a.accountNumber?.toLowerCase().includes(filters.accountNumber.trim().toLowerCase())
    return typeMatch && accMatch
  })

  const hasFilters = filters.loanType || filters.accountNumber

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-4xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-1">Loan Applications</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4">Filter</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>
          {hasFilters && (
            <button
              onClick={() => setFilters({ loanType: '', accountNumber: '' })}
              className="mt-4 text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-2">No applications</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
              {hasFilters ? 'No applications match your filters.' : 'There are no pending loan applications.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </div>
        )}

      </div>

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm shadow-lg text-white transition-all ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
