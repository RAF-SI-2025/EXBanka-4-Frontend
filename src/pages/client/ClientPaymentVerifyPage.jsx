import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useApiError } from '../../context/ApiErrorContext'
import { paymentService } from '../../services/paymentService'
import { useClientPayments } from '../../context/ClientPaymentsContext'

const POLL_INTERVAL = 3000

function fmt(n, currency) {
  return n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${currency}`
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm font-light text-slate-900 dark:text-white">{value}</span>
    </div>
  )
}

export default function ClientPaymentVerifyPage() {
  useWindowTitle('Verify Payment | AnkaBanka')
  const navigate = useNavigate()
  const { state } = useLocation()
  const { addSuccess } = useApiError()
  const { reload: reloadPayments } = useClientPayments()
  // phase: 'creating' | 'waiting' | 'approved' | 'rejected' | 'expired' | 'error'
  const [phase, setPhase] = useState('creating')
  const [errorMsg, setErrorMsg] = useState('')
  const pollRef = useRef(null)

  useEffect(() => {
    if (!state) return

    let cancelled = false

    async function start() {
      try {
        const approval = await paymentService.createPaymentApproval({
          fromAccount:      state.fromAccount.accountNumber,
          recipientName:    state.recipientName,
          recipientAccount: state.recipientAccount,
          amount:           state.amount,
          paymentCode:      state.paymentCode,
          referenceNumber:  state.referenceNumber,
          purpose:          state.purpose,
        })
        if (cancelled) return
        const approvalId = approval.id
        setPhase('waiting')
        pollRef.current = setInterval(async () => {
          try {
            const result = await paymentService.pollApproval(approvalId)
            if (cancelled) return
            if (result.status === 'APPROVED') {
              clearInterval(pollRef.current)
              reloadPayments()
              addSuccess(`Payment to ${state.recipientName} has been submitted.`, 'Payment Confirmed')
              setPhase('approved')
            } else if (result.status === 'REJECTED') {
              clearInterval(pollRef.current)
              setPhase('rejected')
            } else if (result.status === 'EXPIRED') {
              clearInterval(pollRef.current)
              setPhase('expired')
            }
          } catch {
            // keep polling on transient errors
          }
        }, POLL_INTERVAL)
      } catch (err) {
        if (cancelled) return
        setErrorMsg(err?.response?.data?.error || 'Failed to create approval request.')
        setPhase('error')
      }
    }

    start()
    return () => {
      cancelled = true
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // If landed here directly without payment data, go back
  if (!state) {
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-2xl mx-auto w-full">
          <p className="text-slate-500 dark:text-slate-400">No payment to verify.</p>
          <button onClick={() => navigate('/client/payments/new')} className="btn-primary mt-4">New Payment</button>
        </div>
      </ClientPortalLayout>
    )
  }

  const { fromAccount, recipientName, recipientAccount, amount, paymentCode, referenceNumber, purpose } = state

  if (phase === 'approved') {
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-2xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mb-3">Payment Confirmed</p>
            <h2 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-2">
              {fmt(amount, fromAccount.currency)}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              Your payment to <span className="text-slate-700 dark:text-slate-300 font-medium">{recipientName}</span> has been submitted.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/client/payments/new')}
                className="px-5 py-2 text-xs tracking-widest uppercase border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white rounded-lg transition-colors"
              >
                New Payment
              </button>
              <button onClick={() => navigate('/client/payments')} className="btn-primary">
                All Payments
              </button>
            </div>
          </div>
        </div>
      </ClientPortalLayout>
    )
  }

  if (phase === 'rejected' || phase === 'expired' || phase === 'error') {
    const message = phase === 'rejected'
      ? 'Payment was rejected on your mobile app.'
      : phase === 'expired'
        ? 'The approval request expired. Please try again.'
        : errorMsg
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-2xl mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-xs tracking-widest uppercase text-red-600 dark:text-red-400 mb-3">Payment Not Completed</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{message}</p>
            <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
          </div>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-2xl mx-auto w-full space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        <div>
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">Verify Payment</h1>
          <div className="w-8 h-px bg-violet-500 dark:bg-violet-400" />
        </div>

        {/* Instruction banner */}
        <div className="flex items-start gap-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-5">
          <div className="shrink-0 w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-800/50 flex items-center justify-center mt-0.5">
            <svg className="w-5 h-5 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-violet-900 dark:text-violet-200 mb-1">Open the AnkaBanka mobile app</p>
            <p className="text-sm text-violet-700 dark:text-violet-400 font-light leading-relaxed">
              A confirmation request has been sent to your mobile app. Open it and tap <span className="font-medium">Confirm</span> to authorize this payment.
            </p>
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Payment summary</p>
          <Row label="From"             value={`${fromAccount.accountName} (${fromAccount.accountNumber})`} />
          <Row label="Recipient"        value={recipientName} />
          <Row label="Recipient account" value={recipientAccount} />
          <Row label="Amount"           value={fmt(amount, fromAccount.currency)} />
          <Row label="Payment code"     value={paymentCode} />
          {referenceNumber && <Row label="Reference" value={referenceNumber} />}
          <Row label="Purpose"          value={purpose} />
        </div>

        {/* Waiting indicator */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-light">
            {phase === 'creating' ? 'Sending request to mobile app…' : 'Waiting for approval on your mobile app…'}
          </p>
          <button
            disabled={phase === 'creating'}
            onClick={async () => {
              if (pollRef.current) clearInterval(pollRef.current)
              try {
                await paymentService.createPayment({
                  fromAccount: fromAccount.accountNumber,
                  recipientName, recipientAccount, amount, paymentCode, referenceNumber, purpose,
                })
                reloadPayments()
                addSuccess(`Payment to ${recipientName} has been submitted.`, 'Payment Confirmed')
                setPhase('approved')
              } catch {
                setPhase('error')
                setErrorMsg('Payment failed.')
              }
            }}
            className="text-xs tracking-widest uppercase text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors disabled:opacity-40"
          >
            Confirm without mobile app
          </button>
        </div>

      </div>
    </ClientPortalLayout>
  )
}
