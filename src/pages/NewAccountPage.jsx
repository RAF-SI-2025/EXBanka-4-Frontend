import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useAccounts } from '../context/AccountsContext'
import { useClients } from '../context/ClientsContext'
import { useAuth } from '../context/AuthContext'

const FOREIGN_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD']

const EMPTY_FORM = {
  ownerId:      '',
  type:         'personal',
  currencyType: 'current',
  currency:     'RSD',
}

export default function NewAccountPage() {
  useWindowTitle('New Account | AnkaBanka')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addAccount } = useAccounts()
  const { clients, loading: clientsLoading, reload: reloadClients } = useClients()
  const { user } = useAuth()

  const [form, setForm]     = useState({ ...EMPTY_FORM, ownerId: searchParams.get('clientId') ?? '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (clients.length === 0) reloadClients()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: false }))

    if (name === 'currencyType') {
      setForm((prev) => ({
        ...prev,
        currencyType: value,
        currency: value === 'current' ? 'RSD' : '',
      }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errs = {}
    if (!form.ownerId) errs.ownerId = true
    if (form.currencyType === 'foreign' && !form.currency) errs.currency = true
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    const owner = clients.find((c) => c.id === Number(form.ownerId))

    try {
      const created = await addAccount({
        ownerId:             owner.id,
        ownerFirstName:      owner.firstName,
        ownerLastName:       owner.lastName,
        type:                form.type,
        currencyType:        form.currencyType,
        currency:            form.currency,
        createdByEmployeeId: user?.id ?? null,
      })
      setSuccess({ accountNumber: created.accountNumber, ownerEmail: owner.email, ownerName: owner.fullName })
    } catch {
      setErrors((prev) => ({ ...prev, _submit: true }))
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-700 rounded-xl p-12 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-xs tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mb-3">Account Created</p>
            <h2 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-2 font-mono tracking-wide">
              {success.accountNumber}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              A confirmation email has been sent to <span className="font-medium text-slate-700 dark:text-slate-300">{success.ownerName}</span> at {success.ownerEmail}.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setForm(EMPTY_FORM); setSuccess(null) }}
                className="px-5 py-2 text-xs tracking-widest uppercase border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white rounded-lg transition-colors"
              >
                New Account
              </button>
              <button
                onClick={() => navigate('/admin/accounts')}
                className="px-5 py-2 text-xs tracking-widest uppercase bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
              >
                All Accounts
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          to="/admin/accounts"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-10"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Accounts
        </Link>

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">New Account</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Client */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Account Owner</p>
            <Field label="Client *" error={errors.ownerId}>
              {clientsLoading ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">Loading clients…</p>
              ) : (
                <select
                  name="ownerId"
                  value={form.ownerId}
                  onChange={handleChange}
                  className={`input-field${errors.ownerId ? ' input-error' : ''}`}
                >
                  <option value="">Select a client…</option>
                  {[...clients]
                    .sort((a, b) => a.lastName.localeCompare(b.lastName, 'sr'))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName} — {c.email}
                      </option>
                    ))}
                </select>
              )}
            </Field>
            <div className="mt-3">
              <Link
                to="/admin/clients/new?returnTo=/admin/accounts/new"
                className="inline-flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create a new client
              </Link>
            </div>
          </div>

          {/* Account details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Account Details</p>

            <div className="space-y-5">
              <Field label="Account Type *">
                <div className="flex gap-4">
                  {[
                    { value: 'personal', label: 'Personal' },
                    { value: 'business', label: 'Business' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={value}
                        checked={form.type === value}
                        onChange={handleChange}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Currency Type *">
                <div className="flex gap-4">
                  {[
                    { value: 'current', label: 'Current (RSD)' },
                    { value: 'foreign', label: 'Foreign Currency' },
                  ].map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="currencyType"
                        value={value}
                        checked={form.currencyType === value}
                        onChange={handleChange}
                        className="accent-violet-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                    </label>
                  ))}
                </div>
              </Field>

              {form.currencyType === 'current' ? (
                <Field label="Currency">
                  <input
                    type="text"
                    value="RSD"
                    disabled
                    className="input-field opacity-50 cursor-not-allowed"
                  />
                </Field>
              ) : (
                <Field label="Currency *" error={errors.currency}>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className={`input-field${errors.currency ? ' input-error' : ''}`}
                  >
                    <option value="">Select currency…</option>
                    {FOREIGN_CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </div>

          {errors._submit && (
            <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
          )}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Create Account
            </button>
            <Link
              to="/admin/accounts"
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">This field is required.</p>}
    </div>
  )
}
