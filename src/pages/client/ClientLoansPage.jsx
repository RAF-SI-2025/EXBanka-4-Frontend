import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { loanService } from '../../services/loanService'
import { fmt } from '../../utils/formatting'
import Spinner from '../../components/Spinner'

const LOAN_TYPE_LABELS = {
  CASH:         'Cash',
  HOUSING:      'Housing',
  AUTO:         'Auto',
  REFINANCING:  'Refinancing',
  STUDENT:      'Student',
}

const STATUS_STYLES = {
  ACTIVE:    'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  PAID_OFF:  'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  REJECTED:  'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  PENDING:   'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
}

export default function ClientLoansPage() {
  useWindowTitle('Loans | AnkaBanka')
  const navigate = useNavigate()

  const [loans, setLoans]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loanService.getMyLoans()
      .then((data) => setLoans([...data].sort((a, b) => b.amount - a.amount)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-4xl mx-auto w-full">

        <div className="flex items-end justify-between mb-1">
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white">Loans</h1>
          <button onClick={() => navigate('/client/loans/apply')} className="btn-primary">
            Apply for Loan
          </button>
        </div>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {loading ? (
          <Spinner />
        ) : loans.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-3">No loans</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">You don't have any active loans.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-5 shadow-sm flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {LOAN_TYPE_LABELS[loan.loanType] ?? loan.loanType} Loan
                    </span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-light ${STATUS_STYLES[loan.status] ?? STATUS_STYLES.PENDING}`}>
                      {loan.status.charAt(0) + loan.status.slice(1).toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 dark:text-slate-500">#{loan.loanNumber}</p>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {fmt(loan.amount, loan.currency)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {loan.repaymentPeriod} months
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/client/loans/${loan.id}`)}
                    className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 transition-colors"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </ClientPortalLayout>
  )
}
