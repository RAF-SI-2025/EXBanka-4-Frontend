import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useClientAccounts } from '../../context/ClientAccountsContext'
import { cardService } from '../../services/cardService'

const EMPTY_AUTHORIZED = {
  firstName:   '',
  lastName:    '',
  dateOfBirth: '',
  gender:      '',
  email:       '',
  phoneNumber: '',
  address:     '',
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

export default function ClientCardRequestPage() {
  useWindowTitle('Request Card | AnkaBanka')
  const navigate = useNavigate()
  const { accounts } = useClientAccounts()

  const [accountNumber, setAccountNumber] = useState('')
  const [forSelf, setForSelf]             = useState(true)
  const [authorized, setAuthorized]       = useState(EMPTY_AUTHORIZED)
  const [errors, setErrors]               = useState({})
  const [submitting, setSubmitting]       = useState(false)

  const selectedAccount = accounts.find((a) => a.accountNumber === accountNumber)
  const isBusiness      = selectedAccount?.type === 'business'

  function handleAuthorizedChange(e) {
    const { name, value } = e.target
    setAuthorized((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  function validate() {
    const errs = {}
    if (!accountNumber) errs.accountNumber = 'Please select an account.'
    if (isBusiness && !forSelf) {
      if (!authorized.firstName)   errs.firstName   = 'Required.'
      if (!authorized.lastName)    errs.lastName    = 'Required.'
      if (!authorized.dateOfBirth) errs.dateOfBirth = 'Required.'
      if (!authorized.gender)      errs.gender      = 'Required.'
      if (!authorized.email)       errs.email       = 'Required.'
      if (!authorized.phoneNumber) errs.phoneNumber = 'Required.'
      if (!authorized.address)     errs.address     = 'Required.'
    }
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    try {
      const payload = { accountNumber }
      if (isBusiness && !forSelf) payload.authorizedPerson = authorized

      const result = await cardService.requestCard(payload)
      navigate('/client/cards/confirm', { state: { requestId: result.requestId, accountNumber } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-xl mx-auto w-full">

        <button
          onClick={() => navigate('/client/cards')}
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-6"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Cards
        </button>

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">New Card</p>
        <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">Request a Card</h1>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Account selector */}
          <Field label="Account *" error={errors.accountNumber}>
            <select
              value={accountNumber}
              onChange={(e) => { setAccountNumber(e.target.value); setErrors((p) => ({ ...p, accountNumber: undefined })) }}
              className={`input-field ${errors.accountNumber ? 'input-error' : ''}`}
            >
              <option value="">Select an account</option>
              {accounts.map((a) => (
                <option key={a.accountNumber} value={a.accountNumber}>
                  {a.accountName ?? a.accountNumber} — {a.accountNumber}
                </option>
              ))}
            </select>
          </Field>

          {/* Business account: card for self vs authorized person */}
          {isBusiness && (
            <Field label="Card holder">
              <div className="flex gap-6 mt-1">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={forSelf}
                    onChange={() => setForSelf(true)}
                    className="accent-violet-600"
                  />
                  Card for myself
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    checked={!forSelf}
                    onChange={() => setForSelf(false)}
                    className="accent-violet-600"
                  />
                  Card for authorized person
                </label>
              </div>
            </Field>
          )}

          {/* Authorized person fields */}
          {isBusiness && !forSelf && (
            <div className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">Authorized Person</p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name *" error={errors.firstName}>
                  <input name="firstName" value={authorized.firstName} onChange={handleAuthorizedChange}
                    className={`input-field ${errors.firstName ? 'input-error' : ''}`} />
                </Field>
                <Field label="Last Name *" error={errors.lastName}>
                  <input name="lastName" value={authorized.lastName} onChange={handleAuthorizedChange}
                    className={`input-field ${errors.lastName ? 'input-error' : ''}`} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of Birth *" error={errors.dateOfBirth}>
                  <input type="date" name="dateOfBirth" value={authorized.dateOfBirth} onChange={handleAuthorizedChange}
                    className={`input-field ${errors.dateOfBirth ? 'input-error' : ''}`} />
                </Field>
                <Field label="Gender *" error={errors.gender}>
                  <select name="gender" value={authorized.gender} onChange={handleAuthorizedChange}
                    className={`input-field ${errors.gender ? 'input-error' : ''}`}>
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
              </div>

              <Field label="Email *" error={errors.email}>
                <input type="email" name="email" value={authorized.email} onChange={handleAuthorizedChange}
                  className={`input-field ${errors.email ? 'input-error' : ''}`} />
              </Field>

              <Field label="Phone Number *" error={errors.phoneNumber}>
                <input name="phoneNumber" value={authorized.phoneNumber} onChange={handleAuthorizedChange}
                  className={`input-field ${errors.phoneNumber ? 'input-error' : ''}`} />
              </Field>

              <Field label="Address *" error={errors.address}>
                <input name="address" value={authorized.address} onChange={handleAuthorizedChange}
                  className={`input-field ${errors.address ? 'input-error' : ''}`} />
              </Field>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting…' : 'Request Card'}
            </button>
            <button type="button" onClick={() => navigate('/client/cards')}
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors">
              Cancel
            </button>
          </div>

        </form>
      </div>
    </ClientPortalLayout>
  )
}
