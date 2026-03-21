import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAccounts } from '../../context/AccountsContext'
import { useClients } from '../../context/ClientsContext'
import { useAuth } from '../../context/AuthContext'
import { PERSONAL_SUBTYPES, BUSINESS_SUBTYPES } from '../../models/BankAccount'

const FOREIGN_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD']

const ACTIVITY_CODES = [
  '01.1', '10.1', '41.2', '45.1', '46.1', '47.1', '56.1',
  '62.01', '62.02', '64.19', '69.1', '70.2', '85.3', '86.1', '96.0',
]

const EMPTY_FORM = {
  ownerId:      '',
  type:         'personal',
  subtype:      '',
  accountName:  '',
  currencyType: 'current',
  currency:     'RSD',
}

const EMPTY_COMPANY = {
  name:               '',
  registrationNumber: '',
  pib:                '',
  activityCode:       '',
  address:            '',
}

const EMPTY_LIMITS = {
  dailyLimit:   '',
  monthlyLimit: '',
}

function defaultName(type, subtype) {
  const list = type === 'personal' ? PERSONAL_SUBTYPES : BUSINESS_SUBTYPES
  const found = list.find((s) => s.value === subtype)
  return found ? `${found.label} Account` : ''
}

function defaultLimits(type, subtype) {
  if (type === 'business') {
    if (subtype === 'foundation') return { dailyLimit: '100000', monthlyLimit: '1000000' }
    return { dailyLimit: '500000', monthlyLimit: '5000000' }
  }
  switch (subtype) {
    case 'standard':   return { dailyLimit: '250000', monthlyLimit: '1000000' }
    case 'savings':    return { dailyLimit: '50000',  monthlyLimit: '200000'  }
    case 'pensioner':  return { dailyLimit: '50000',  monthlyLimit: '200000'  }
    case 'youth':      return { dailyLimit: '25000',  monthlyLimit: '100000'  }
    case 'student':    return { dailyLimit: '25000',  monthlyLimit: '100000'  }
    case 'unemployed': return { dailyLimit: '10000',  monthlyLimit: '50000'   }
    default:           return { dailyLimit: '250000', monthlyLimit: '1000000' }
  }
}

export default function NewAccountPage() {
  useWindowTitle('New Account | AnkaBanka')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { addAccount } = useAccounts()
  const { clients, loading: clientsLoading, reload: reloadClients } = useClients()
  const { user } = useAuth()

  const [form, setForm]         = useState({ ...EMPTY_FORM, ownerId: searchParams.get('clientId') ?? '' })
  const [company, setCompany]   = useState(EMPTY_COMPANY)
  const [limits, setLimits]     = useState(EMPTY_LIMITS)
  const [createCard, setCreateCard] = useState(false)
  const [errors, setErrors]     = useState({})
  const [success, setSuccess]   = useState(null)

  useEffect(() => {
    if (clients.length === 0) reloadClients()
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: false }))

    if (name === 'type') {
      setForm((prev) => ({
        ...prev,
        type:         value,
        subtype:      '',
        accountName:  '',
        currencyType: 'current',
        currency:     'RSD',
      }))
      setCompany(EMPTY_COMPANY)
      setLimits(EMPTY_LIMITS)
      return
    }

    if (name === 'subtype') {
      setForm((prev) => ({
        ...prev,
        subtype:     value,
        accountName: defaultName(prev.type, value),
      }))
      setLimits(defaultLimits(form.type, value))
      return
    }

    if (name === 'currencyType') {
      setForm((prev) => ({
        ...prev,
        currencyType: value,
        currency:     value === 'current' ? 'RSD' : '',
      }))
      return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleCompanyChange(e) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [`company_${name}`]: false }))
    setCompany((prev) => ({ ...prev, [name]: value }))
  }

  function handleLimitsChange(e) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: false }))
    setLimits((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errs = {}
    if (!form.ownerId)            errs.ownerId     = true
    if (!form.subtype)            errs.subtype     = true
    if (!form.accountName.trim()) errs.accountName = true
    if (form.type === 'personal' && form.currencyType === 'foreign' && !form.currency) errs.currency = true

    if (form.type === 'business') {
      if (!company.name.trim())               errs.company_name               = true
      if (!company.registrationNumber.trim()) errs.company_registrationNumber = true
      if (!company.pib.trim())               errs.company_pib               = true
    }

    const daily   = parseFloat(limits.dailyLimit)
    const monthly = parseFloat(limits.monthlyLimit)
    if (!limits.dailyLimit   || isNaN(daily)   || daily   <= 0) errs.dailyLimit   = true
    if (!limits.monthlyLimit || isNaN(monthly) || monthly <= 0) errs.monthlyLimit = true
    if (!errs.dailyLimit && !errs.monthlyLimit && daily > monthly) errs.dailyLimit = true

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
        subtype:             form.subtype,
        accountName:         form.accountName.trim(),
        currencyType:        form.currencyType,
        currency:            form.currency,
        createdByEmployeeId: user?.id ?? null,
        dailyLimit:          parseFloat(limits.dailyLimit),
        monthlyLimit:        parseFloat(limits.monthlyLimit),
        createCard,
        ...(form.type === 'business' && {
          companyData: {
            name:               company.name.trim(),
            registrationNumber: company.registrationNumber.trim(),
            pib:                company.pib.trim(),
            activityCode:       company.activityCode || null,
            address:            company.address.trim() || null,
          },
        }),
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
                onClick={() => { setForm(EMPTY_FORM); setCompany(EMPTY_COMPANY); setLimits(EMPTY_LIMITS); setCreateCard(false); setSuccess(null) }}
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

  const subtypeOptions = form.type === 'personal' ? PERSONAL_SUBTYPES : BUSINESS_SUBTYPES

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
                <div className="relative">
                  <select
                    name="ownerId"
                    value={form.ownerId}
                    onChange={handleChange}
                    className={`input-field appearance-none pr-10${errors.ownerId ? ' input-error' : ''}`}
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
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
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

          {/* Account Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Account Details</p>

            <div className="space-y-5">

              {/* Type */}
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

              {/* Subtype */}
              <Field label="Account Subtype *" error={errors.subtype}>
                <div className="relative">
                  <select
                    name="subtype"
                    value={form.subtype}
                    onChange={handleChange}
                    className={`input-field appearance-none pr-10${errors.subtype ? ' input-error' : ''}`}
                  >
                    <option value="">Select subtype…</option>
                    {subtypeOptions.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </Field>

              {/* Account name */}
              <Field label="Account Name *" error={errors.accountName}>
                <input
                  type="text"
                  name="accountName"
                  value={form.accountName}
                  onChange={handleChange}
                  placeholder="Select a subtype to auto-fill"
                  className={`input-field${errors.accountName ? ' input-error' : ''}`}
                />
              </Field>

              {/* Currency type */}
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

              {form.currencyType === 'current' && (
                <Field label="Currency">
                  <input type="text" value="RSD" disabled className="input-field opacity-50 cursor-not-allowed" />
                </Field>
              )}

              {form.currencyType === 'foreign' && (
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

          {/* Company Details — business accounts only */}
          {form.type === 'business' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
              <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Company Details</p>
              <div className="space-y-5">

                <Field label="Company Name *" error={errors.company_name}>
                  <input
                    type="text"
                    name="name"
                    value={company.name}
                    onChange={handleCompanyChange}
                    placeholder="e.g. Acme d.o.o."
                    className={`input-field${errors.company_name ? ' input-error' : ''}`}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Registration Number *" error={errors.company_registrationNumber}>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={company.registrationNumber}
                      onChange={handleCompanyChange}
                      placeholder="e.g. 12345678"
                      className={`input-field font-mono${errors.company_registrationNumber ? ' input-error' : ''}`}
                    />
                  </Field>

                  <Field label="PIB *" error={errors.company_pib}>
                    <input
                      type="text"
                      name="pib"
                      value={company.pib}
                      onChange={handleCompanyChange}
                      placeholder="e.g. 123456789"
                      className={`input-field font-mono${errors.company_pib ? ' input-error' : ''}`}
                    />
                  </Field>
                </div>

                <Field label="Activity Code">
                  <div className="relative">
                    <select
                      name="activityCode"
                      value={company.activityCode}
                      onChange={handleCompanyChange}
                      className="input-field appearance-none pr-10"
                    >
                      <option value="">Select activity code…</option>
                      {ACTIVITY_CODES.map((code) => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </Field>

                <Field label="Address">
                  <input
                    type="text"
                    name="address"
                    value={company.address}
                    onChange={handleCompanyChange}
                    placeholder="Street, City"
                    className="input-field"
                  />
                </Field>

              </div>
            </div>
          )}

          {/* Limits */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-1">Transaction Limits</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              Auto-filled based on account subtype. You can override these values.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Daily Limit *" error={errors.dailyLimit}>
                <div className="relative">
                  <input
                    type="number"
                    name="dailyLimit"
                    value={limits.dailyLimit}
                    onChange={handleLimitsChange}
                    placeholder="250000"
                    min="1"
                    step="1"
                    className={`input-field pr-14${errors.dailyLimit ? ' input-error' : ''}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
                    RSD
                  </span>
                </div>
              </Field>

              <Field label="Monthly Limit *" error={errors.monthlyLimit}>
                <div className="relative">
                  <input
                    type="number"
                    name="monthlyLimit"
                    value={limits.monthlyLimit}
                    onChange={handleLimitsChange}
                    placeholder="1000000"
                    min="1"
                    step="1"
                    className={`input-field pr-14${errors.monthlyLimit ? ' input-error' : ''}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
                    RSD
                  </span>
                </div>
              </Field>
            </div>
          </div>

          {/* Create card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Card</p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createCard}
                onChange={(e) => setCreateCard(e.target.checked)}
                className="w-4 h-4 accent-violet-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Create a card for this account</span>
            </label>
            <p className="mt-2 ml-7 text-xs text-slate-400 dark:text-slate-500">
              A card will be automatically generated — no email confirmation required.
            </p>
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
              className="inline-flex items-center justify-center px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
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
