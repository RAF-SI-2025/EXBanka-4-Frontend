import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { loanService } from '../../services/loanService'
import { fmt } from '../../utils/formatting'
import Spinner from '../../components/Spinner'

const LOAN_TYPE_LABELS = {
  CASH:        'Cash',
  HOUSING:     'Housing',
  AUTO:        'Auto',
  REFINANCING: 'Refinancing',
  STUDENT:     'Student',
}

const INSTALLMENT_STATUS_STYLES = {
  PAID:   'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  UNPAID: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
  LATE:   'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm font-light text-slate-900 dark:text-white">{value ?? '—'}</span>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      {title && <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">{title}</p>}
      {children}
    </div>
  )
}

export default function ClientLoanDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loan, setLoan]       = useState(null)
  const [loading, setLoading] = useState(true)

  useWindowTitle(loan ? `Loan #${loan.loanNumber} | AnkaBanka` : 'Loan | AnkaBanka')

  useEffect(() => {
    loanService.getLoanById(id)
      .then(setLoan)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <ClientPortalLayout>
        <div className="flex items-center justify-center py-24"><Spinner /></div>
      </ClientPortalLayout>
    )
  }

  if (!loan) {
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-3xl mx-auto w-full">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loan not found.</p>
        </div>
      </ClientPortalLayout>
    )
  }

  const installments = loan.installments ?? []

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-3xl mx-auto w-full space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate('/client/loans')}
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Loans
        </button>

        {/* Header */}
        <div>
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-2">
            {LOAN_TYPE_LABELS[loan.loanType] ?? loan.loanType} Loan
          </p>
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white font-mono">
            #{loan.loanNumber}
          </h1>
          <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mt-3" />
        </div>

        {/* Overview */}
        <Card title="Loan Details">
          <Row label="Loan Number"       value={`#${loan.loanNumber}`} />
          <Row label="Type"              value={LOAN_TYPE_LABELS[loan.loanType] ?? loan.loanType} />
          <Row label="Interest Rate Type" value={loan.interestRateType} />
          <Row label="Currency"          value={loan.currency} />
          <Row label="Total Amount"      value={fmt(loan.amount, loan.currency)} />
          <Row label="Repayment Period"  value={`${loan.repaymentPeriod} months`} />
          <Row label="Nominal Rate"      value={loan.nominalRate != null ? `${loan.nominalRate.toFixed(2)}%` : null} />
          <Row label="Effective Rate"    value={loan.effectiveRate != null ? `${loan.effectiveRate.toFixed(2)}%` : null} />
          <Row label="Agreement Date"    value={loan.agreedDate} />
          <Row label="Maturity Date"     value={loan.maturityDate} />
        </Card>

        {/* Current status */}
        <Card title="Current Status">
          <Row label="Remaining Debt"         value={fmt(loan.remainingDebt, loan.currency)} />
          <Row label="Next Installment"       value={fmt(loan.nextInstallmentAmount, loan.currency)} />
          <Row label="Next Installment Date"  value={loan.nextInstallmentDate} />
        </Card>

        {/* Installments table */}
        <Card title={`Installments (${installments.length})`}>
          {installments.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No installments found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="text-left py-2 pr-4 text-slate-400 dark:text-slate-500 font-normal tracking-widest uppercase">Due Date</th>
                    <th className="text-left py-2 pr-4 text-slate-400 dark:text-slate-500 font-normal tracking-widest uppercase">Paid Date</th>
                    <th className="text-right py-2 pr-4 text-slate-400 dark:text-slate-500 font-normal tracking-widest uppercase">Amount</th>
                    <th className="text-right py-2 pr-4 text-slate-400 dark:text-slate-500 font-normal tracking-widest uppercase">Rate</th>
                    <th className="text-right py-2 text-slate-400 dark:text-slate-500 font-normal tracking-widest uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {installments.map((inst) => (
                    <tr key={inst.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="py-3 pr-4 text-slate-700 dark:text-slate-300">{inst.expectedDueDate}</td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">{inst.actualDueDate || '—'}</td>
                      <td className="py-3 pr-4 text-right text-slate-700 dark:text-slate-300">
                        {fmt(inst.installmentAmount, inst.currency)}
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-500 dark:text-slate-400">
                        {inst.interestRate != null ? `${inst.interestRate.toFixed(2)}%` : '—'}
                      </td>
                      <td className="py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full ${INSTALLMENT_STATUS_STYLES[inst.status] ?? INSTALLMENT_STATUS_STYLES.UNPAID}`}>
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </ClientPortalLayout>
  )
}
