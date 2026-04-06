import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useClientAccounts } from '../../context/ClientAccountsContext'
import { loanService } from '../../services/loanService'
import { fmt } from '../../utils/formatting'

const LOAN_TYPES = [
  { value: 'CASH',        label: 'Cash' },
  { value: 'HOUSING',     label: 'Housing' },
  { value: 'AUTO',        label: 'Auto' },
  { value: 'REFINANCING', label: 'Refinancing' },
  { value: 'STUDENT',     label: 'Student' },
]

const INTEREST_RATE_TYPES = [
  { value: 'FIXED',    label: 'Fixed' },
  { value: 'VARIABLE', label: 'Variable' },
]

const EMPLOYMENT_STATUSES = [
  { value: 'PERMANENT',   label: 'Permanent' },
  { value: 'TEMPORARY',   label: 'Temporary' },
  { value: 'UNEMPLOYED',  label: 'Unemployed' },
]

const REPAYMENT_OPTIONS = {
  HOUSING: [60, 120, 180, 240, 300, 360],
  DEFAULT: [12, 24, 36, 48, 60, 72, 84],
}

const CURRENCIES = ['RSD', 'EUR', 'USD', 'GBP', 'CHF']

const EMPTY_FORM = {
  loanType:         '',
  interestRateType: '',
  amount:           '',
  currency:         'RSD',
  repaymentPeriod:  '',
  purpose:          '',
  monthlySalary:    '',
  employmentStatus: '',
  employmentPeriod: '',
  contactPhone:     '',
  accountNumber:    '',
}

function Field({ label, error, hint, children }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default function ClientLoanApplyPage() {
  useWindowTitle('Apply for Loan | AnkaBanka')
  const navigate = useNavigate()
  const { accounts } = useClientAccounts()

  const [form, setForm]         = useState(EMPTY_FORM)
  const [errors, setErrors]     = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]     = useState(null) // { loanId, loanNumber, monthlyInstallment }

  const repaymentOptions = form.loanType === 'HOUSING'
    ? REPAYMENT_OPTIONS.HOUSING
    : REPAYMENT_OPTIONS.DEFAULT

  // Only show accounts matching the selected currency
  const eligibleAccounts = accounts.filter(
    (a) => !form.currency || a.currency === form.currency
  )

  function handleChange(e) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: undefined }))

    if (name === 'loanType') {
      // Reset repayment period when loan type changes (options differ for housing)
      setForm((prev) => ({ ...prev, loanType: value, repaymentPeriod: '' }))
      return
    }
    if (name === 'currency') {
      // Reset account selection when currency changes
      setForm((prev) => ({ ...prev, currency: value, accountNumber: '' }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errs = {}
    if (!form.loanType)         errs.loanType         = 'Required.'
    if (!form.interestRateType) errs.interestRateType = 'Required.'
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      errs.amount = 'Must be a positive number.'
    if (!form.currency)         errs.currency         = 'Required.'
    if (!form.repaymentPeriod)  errs.repaymentPeriod  = 'Required.'
    if (!form.accountNumber)    errs.accountNumber    = 'Required.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const data = await loanService.applyForLoan({
        loanType:         form.loanType,
        interestRateType: form.interestRateType,
        amount:           parseFloat(form.amount),
        currency:         form.currency,
        repaymentPeriod:  parseInt(form.repaymentPeriod),
        accountNumber:    form.accountNumber,
        ...(form.purpose          && { purpose:          form.purpose }),
        ...(form.monthlySalary    && { monthlySalary:    parseFloat(form.monthlySalary) }),
        ...(form.employmentStatus && { employmentStatus: form.employmentStatus }),
        ...(form.employmentPeriod && { employmentPeriod: parseInt(form.employmentPeriod) }),
        ...(form.contactPhone     && { contactPhone:     form.contactPhone }),
      })
      setResult(data)
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (result) {
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-md mx-auto w-full">
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 rounded-xl p-10 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mb-3">Application Submitted</p>
            <h2 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-1">
              Loan #{result.loanNumber}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">Your application is pending employee review.</p>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg px-6 py-4 mb-8">
              <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-1">Estimated Monthly Installment</p>
              <p className="font-serif text-3xl font-light text-slate-900 dark:text-white">
                {fmt(result.monthlyInstallment, form.currency)}
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/client/loans')}
                className="btn-primary"
              >
                My Loans
              </button>
              <button
                onClick={() => { setForm(EMPTY_FORM); setResult(null) }}
                className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
              >
                New Application
              </button>
            </div>
          </div>
        </div>
      </ClientPortalLayout>
    )
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-xl mx-auto w-full">

        <button
          onClick={() => navigate('/client/loans')}
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Loans
        </button>

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">New Application</p>
        <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">Apply for a Loan</h1>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Loan details */}
          <div className="space-y-5">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Loan Details</p>

            <Field label="Loan Type *" error={errors.loanType}>
              <div className="grid grid-cols-3 gap-2">
                {LOAN_TYPES.map(({ value, label }) => (
                  <label key={value} className={`flex items-center justify-center px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    form.loanType === value
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300'
                  }`}>
                    <input type="radio" name="loanType" value={value} checked={form.loanType === value}
                      onChange={handleChange} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
              {errors.loanType && <p className="mt-1 text-xs text-red-500">{errors.loanType}</p>}
            </Field>

            <Field label="Interest Rate Type *" error={errors.interestRateType}>
              <div className="flex gap-3">
                {INTEREST_RATE_TYPES.map(({ value, label }) => (
                  <label key={value} className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    form.interestRateType === value
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-300'
                  }`}>
                    <input type="radio" name="interestRateType" value={value} checked={form.interestRateType === value}
                      onChange={handleChange} className="sr-only" />
                    {label}
                  </label>
                ))}
              </div>
              {errors.interestRateType && <p className="mt-1 text-xs text-red-500">{errors.interestRateType}</p>}
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount *" error={errors.amount}>
                <input
                  type="number" name="amount" value={form.amount} onChange={handleChange}
                  min="1" step="any" placeholder="0"
                  className={`input-field ${errors.amount ? 'input-error' : ''}`}
                />
              </Field>
              <Field label="Currency *" error={errors.currency}>
                <select name="currency" value={form.currency} onChange={handleChange}
                  className={`input-field ${errors.currency ? 'input-error' : ''}`}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>

            <Field
              label="Repayment Period *"
              error={errors.repaymentPeriod}
              hint={!form.loanType ? 'Select a loan type first.' : undefined}
            >
              <select
                name="repaymentPeriod" value={form.repaymentPeriod} onChange={handleChange}
                disabled={!form.loanType}
                className={`input-field ${errors.repaymentPeriod ? 'input-error' : ''}`}
              >
                <option value="">Select period…</option>
                {repaymentOptions.map((m) => (
                  <option key={m} value={m}>{m} months</option>
                ))}
              </select>
            </Field>

            <Field label="Purpose">
              <input type="text" name="purpose" value={form.purpose} onChange={handleChange}
                placeholder="e.g. Home renovation" className="input-field" />
            </Field>
          </div>

          {/* Account */}
          <div className="space-y-5">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Account</p>
            <Field
              label="Linked Account *"
              error={errors.accountNumber}
              hint={eligibleAccounts.length === 0 ? `No ${form.currency} accounts found.` : undefined}
            >
              <select name="accountNumber" value={form.accountNumber} onChange={handleChange}
                className={`input-field ${errors.accountNumber ? 'input-error' : ''}`}>
                <option value="">Select an account…</option>
                {eligibleAccounts.map((a) => (
                  <option key={a.accountNumber} value={a.accountNumber}>
                    {a.accountName ?? a.accountNumber} — {a.accountNumber}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {/* Financial info (optional) */}
          <div className="space-y-5">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Financial Info <span className="normal-case text-slate-400 dark:text-slate-500 font-light">(optional)</span></p>

            <Field label="Monthly Salary">
              <input type="number" name="monthlySalary" value={form.monthlySalary} onChange={handleChange}
                min="0" step="any" placeholder="0" className="input-field" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Employment Status">
                <select name="employmentStatus" value={form.employmentStatus} onChange={handleChange}
                  className="input-field">
                  <option value="">Select…</option>
                  {EMPLOYMENT_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Employment Period (months)">
                <input type="number" name="employmentPeriod" value={form.employmentPeriod} onChange={handleChange}
                  min="0" step="1" placeholder="0" className="input-field" />
              </Field>
            </div>

            <Field label="Contact Phone">
              <input type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange}
                placeholder="+381 60 000 0000" className="input-field" />
            </Field>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
            <button type="button" onClick={() => navigate('/client/loans')}
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </ClientPortalLayout>
  )
}
