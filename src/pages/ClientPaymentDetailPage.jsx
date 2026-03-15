import { useParams, useNavigate } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import ClientPortalLayout from '../layouts/ClientPortalLayout'
import { MOCK_PAYMENTS } from '../mocks/payments'
import { PAYMENT_STATUS_STYLES } from '../models/Payment'

function fmt(n) {
  return n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm font-light text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

export default function ClientPaymentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const payment = MOCK_PAYMENTS.find((p) => p.id === Number(id))

  useWindowTitle(payment ? `Payment ${payment.reference} | AnkaBanka` : 'Payment | AnkaBanka')

  if (!payment) {
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-2xl mx-auto w-full">
          <p className="text-slate-500 dark:text-slate-400">Payment not found.</p>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-2xl mx-auto w-full space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate('/client/payments')}
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Payments
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">{payment.recipient}</h1>
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{payment.reference}</p>
          </div>
          <span className={`mt-1 shrink-0 text-xs px-3 py-1 rounded-full font-light capitalize ${PAYMENT_STATUS_STYLES[payment.status] ?? 'bg-slate-100 text-slate-400'}`}>
            {payment.status}
          </span>
        </div>

        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400" />

        {/* Amount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Amount</p>
          <p className={`font-serif text-4xl font-light leading-none ${payment.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
            {payment.amount > 0 ? '+' : ''}{fmt(payment.amount)}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">{payment.currency}</p>
        </div>

        {/* Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Details</p>
          <Row label="Recipient"         value={payment.recipient} />
          <Row label="Recipient account" value={payment.recipientAccount} />
          <Row label="Payment purpose"   value={payment.purpose} />
          <Row label="Reference number"  value={payment.reference} />
          <Row label="Date & time"       value={payment.dateTime} />
          <Row label="Fee"               value={payment.fee > 0 ? `${fmt(payment.fee)} ${payment.currency}` : 'No fee'} />
          <Row label="Status"            value={
            <span className={`text-xs px-2.5 py-1 rounded-full font-light capitalize ${PAYMENT_STATUS_STYLES[payment.status] ?? 'bg-slate-100 text-slate-400'}`}>
              {payment.status}
            </span>
          } />
        </div>

      </div>
    </ClientPortalLayout>
  )
}
