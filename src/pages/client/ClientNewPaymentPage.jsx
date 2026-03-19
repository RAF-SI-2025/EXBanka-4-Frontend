import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useClientAccounts } from '../../context/ClientAccountsContext'
import { fmt } from '../../utils/formatting'
import { isValidAccountNumber, formatAccountNumberInput } from '../../models/Recipient'

const EMPTY_FORM = {
  fromAccountId:    '',
  recipientName:    '',
  recipientAccount: '',
  amount:           '',
  paymentCode:      '',
  referenceNumber:  '',
  purpose:          '',
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function ClientNewPaymentPage() {
  useWindowTitle('New Payment | AnkaBanka')
  const navigate = useNavigate()
  const location = useLocation()
  const { accounts } = useClientAccounts()

  const prefilledRecipient = location.state?.recipient

  const [form, setForm]     = useState(() => ({
    ...EMPTY_FORM,
    recipientName:    prefilledRecipient?.name          ?? '',
    recipientAccount: prefilledRecipient?.accountNumber ?? '',
  }))
  const [errors, setErrors] = useState({})

  const selectedAccount = accounts.find((a) => a.id === Number(form.fromAccountId))

  function handleChange(e) {
    const { name, value } = e.target
    const formatted = name === 'recipientAccount' ? formatAccountNumberInput(value) : value
    setForm((prev) => ({ ...prev, [name]: formatted }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function handleBlur(e) {
    const { name } = e.target
    const errs = validate()
    if (errs[name]) setErrors((prev) => ({ ...prev, [name]: errs[name] }))
  }

  function validate() {
    const errs = {}
    if (!form.fromAccountId)    errs.fromAccountId    = 'Please select an account.'
    if (!form.recipientName.trim())    errs.recipientName    = 'Recipient name is required.'
    if (!form.recipientAccount.trim())                        errs.recipientAccount = 'Recipient account number is required.'
    else if (!isValidAccountNumber(form.recipientAccount))    errs.recipientAccount = 'Invalid account number format (e.g. 265-0000000000000-00).'
    if (!form.amount)                                         errs.amount = 'Amount is required.'
    else if (parseFloat(form.amount) <= 0)                    errs.amount = 'Amount must be greater than 0.'
    else if (selectedAccount && parseFloat(form.amount) > selectedAccount.availableBalance)
      errs.amount = `Insufficient funds. Available: ${fmt(selectedAccount.availableBalance, selectedAccount.currency)}`
    if (!form.paymentCode.trim())      errs.paymentCode      = 'Payment code is required.'
    if (!form.purpose.trim())          errs.purpose          = 'Payment purpose is required.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    // Pass payment data to verification page via router state
    navigate('/client/payments/verify', {
      state: {
        fromAccount:      selectedAccount,
        recipientName:    form.recipientName.trim(),
        recipientAccount: form.recipientAccount.trim(),
        amount:           parseFloat(form.amount),
        paymentCode:      form.paymentCode.trim(),
        referenceNumber:  form.referenceNumber.trim(),
        purpose:          form.purpose.trim(),
      },
    })
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-2xl mx-auto w-full">

        <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">New Payment</h1>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* From account */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-5">From</p>
            <Field label="Account *" error={errors.fromAccountId}>
              <div className="relative">
                <select
                  name="fromAccountId"
                  value={form.fromAccountId}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`input-field appearance-none pr-10 ${errors.fromAccountId ? 'input-error' : ''}`}
                >
                  <option value="">Select account…</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} — {a.accountNumber}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Field>
            {selectedAccount && (
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                Available: <span className="text-slate-600 dark:text-slate-300">{fmt(selectedAccount.availableBalance, selectedAccount.currency)}</span>
              </p>
            )}
          </div>

          {/* Recipient */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-5">Recipient</p>
            <div className="space-y-4">
              <Field label="Recipient name *" error={errors.recipientName}>
                <input
                  name="recipientName"
                  value={form.recipientName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Full name or company"
                  className={`input-field ${errors.recipientName ? 'input-error' : ''}`}
                />
              </Field>
              <Field label="Recipient account number *" error={errors.recipientAccount}>
                <input
                  name="recipientAccount"
                  value={form.recipientAccount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="265-0000000000000-00"
                  className={`input-field font-mono ${errors.recipientAccount ? 'input-error' : ''}`}
                />
              </Field>
            </div>
          </div>

          {/* Payment details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-5">Payment details</p>
            <div className="space-y-4">
              <Field label="Amount *" error={errors.amount}>
                <div className="relative">
                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className={`input-field pr-16 ${errors.amount ? 'input-error' : ''}`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
                    {selectedAccount?.currency ?? 'RSD'}
                  </span>
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Payment code *" error={errors.paymentCode}>
                  <input
                    name="paymentCode"
                    value={form.paymentCode}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="289"
                    maxLength={3}
                    className={`input-field font-mono ${errors.paymentCode ? 'input-error' : ''}`}
                  />
                </Field>
                <Field label="Reference number" error={errors.referenceNumber}>
                  <input
                    name="referenceNumber"
                    value={form.referenceNumber}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="input-field"
                  />
                </Field>
              </div>
              <Field label="Payment purpose *" error={errors.purpose}>
                <input
                  name="purpose"
                  value={form.purpose}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Rent, Invoice #123…"
                  className={`input-field ${errors.purpose ? 'input-error' : ''}`}
                />
              </Field>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Continue
            </button>
            <button
              type="button"
              onClick={() => navigate('/client/payments')}
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </ClientPortalLayout>
  )
}
