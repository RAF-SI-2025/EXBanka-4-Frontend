import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useClients } from '../context/ClientsContext'

const EMPTY_FORM = {
  firstName:   '',
  lastName:    '',
  jmbg:        '',
  email:       '',
  phoneNumber: '',
  address:     '',
  dateOfBirth: '',
  gender:      'M',
  username:    '',
}

const REQUIRED = ['firstName', 'lastName', 'email', 'phoneNumber', 'address', 'dateOfBirth', 'username']

export default function NewClientPage() {
  useWindowTitle('New Client | AnkaBanka')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo')
  const { clients, addClient } = useClients()

  const [form, setForm]     = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(null)

  function handleChange(e) {
    const { name, value } = e.target
    setErrors((prev) => ({ ...prev, [name]: null }))
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const errs = {}
    REQUIRED.forEach((f) => { if (!form[f].trim()) errs[f] = 'This field is required.' })
    if (!/^\d{13}$/.test(form.jmbg)) errs.jmbg = 'Must be exactly 13 digits.'
    const emailUsed = clients.some(
      (c) => c.email.toLowerCase() === form.email.trim().toLowerCase()
    )
    if (!errs.email && emailUsed) errs.email = 'This email is already in use.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    try {
      const created = await addClient({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        jmbg:        form.jmbg.trim(),
        email:       form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address:     form.address.trim(),
        dateOfBirth: form.dateOfBirth,
        gender:      form.gender,
        username:    form.username.trim(),
      })
      setSuccess(created)
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
            <p className="text-xs tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mb-3">Client Created</p>
            <h2 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-2">
              {success.fullName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              A welcome email has been sent to <span className="font-medium text-slate-700 dark:text-slate-300">{success.email}</span>.
            </p>
            <div className="flex gap-3 justify-center">
              {returnTo ? (
                <button
                  onClick={() => navigate(`${returnTo}?clientId=${success.id}`)}
                  className="px-5 py-2 text-xs tracking-widest uppercase bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  Create Account
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setForm(EMPTY_FORM); setSuccess(null) }}
                    className="px-5 py-2 text-xs tracking-widest uppercase border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white rounded-lg transition-colors"
                  >
                    New Client
                  </button>
                  <button
                    onClick={() => navigate('/admin/clients')}
                    className="px-5 py-2 text-xs tracking-widest uppercase bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                  >
                    All Clients
                  </button>
                </>
              )}
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
          to="/admin/clients"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-10"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Clients
        </Link>

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">New Client</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Personal Info</p>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="First Name *" error={errors.firstName}>
                  <input name="firstName" value={form.firstName} onChange={handleChange}
                    className={`input-field${errors.firstName ? ' input-error' : ''}`} />
                </Field>
                <Field label="Last Name *" error={errors.lastName}>
                  <input name="lastName" value={form.lastName} onChange={handleChange}
                    className={`input-field${errors.lastName ? ' input-error' : ''}`} />
                </Field>
              </div>
              <Field label="JMBG *" error={errors.jmbg}>
                <input name="jmbg" value={form.jmbg} onChange={handleChange}
                  maxLength={13} placeholder="13 digits"
                  className={`input-field font-mono${errors.jmbg ? ' input-error' : ''}`} />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Date of Birth *" error={errors.dateOfBirth}>
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
                    className={`input-field${errors.dateOfBirth ? ' input-error' : ''}`} />
                </Field>
                <Field label="Gender *">
                  <div className="flex gap-4 pt-1">
                    {[{ value: 'M', label: 'Male' }, { value: 'F', label: 'Female' }].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value={value}
                          checked={form.gender === value} onChange={handleChange}
                          className="accent-violet-600" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Contact</p>
            <div className="space-y-5">
              <Field label="Email *" error={errors.email}>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className={`input-field${errors.email ? ' input-error' : ''}`} />
              </Field>
              <Field label="Phone Number *" error={errors.phoneNumber}>
                <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange}
                  placeholder="+381…"
                  className={`input-field${errors.phoneNumber ? ' input-error' : ''}`} />
              </Field>
              <Field label="Address *" error={errors.address}>
                <input name="address" value={form.address} onChange={handleChange}
                  className={`input-field${errors.address ? ' input-error' : ''}`} />
              </Field>
            </div>
          </div>

          {/* Account */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Account</p>
            <Field label="Username *" error={errors.username}>
              <input name="username" value={form.username} onChange={handleChange}
                className={`input-field${errors.username ? ' input-error' : ''}`} />
            </Field>
          </div>

          {errors._submit && (
            <p className="text-sm text-red-500">Something went wrong. Please try again.</p>
          )}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Create Client</button>
            <Link
              to="/admin/clients"
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
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
