import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useClients } from '../../context/ClientsContext'
import { useAccounts } from '../../context/AccountsContext'

export default function ClientDetailPage() {
  const { id } = useParams()
  const { clients, loading, reload, updateClient } = useClients()
  const { accounts, reload: reloadAccounts } = useAccounts()

  useEffect(() => {
    if (clients.length === 0 && !loading) reload()
    if (accounts.length === 0) reloadAccounts()
  }, [])

  const client = clients.find((c) => c.id === Number(id))
  const clientAccounts = accounts.filter((a) => a.ownerId === Number(id))

  useWindowTitle(client ? `${client.fullName} | AnkaBanka` : 'Client | AnkaBanka')

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Not Found</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-6">Client not found</h1>
        <Link to="/admin/clients" className="btn-primary">Back to List</Link>
      </div>
    )
  }

  function startEdit() {
    setForm({
      firstName:   client.firstName,
      lastName:    client.lastName,
      dateOfBirth: client.dateOfBirth,
      gender:      client.gender,
      email:       client.email,
      phoneNumber: client.phoneNumber,
      address:     client.address,
      username:    client.username,
      active:      client.active,
    })
    setFieldErrors({})
    setEditing(true)
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function validate() {
    const errs = {}
    if (!form.firstName?.trim())  errs.firstName  = 'This field is required.'
    if (!form.lastName?.trim())   errs.lastName   = 'This field is required.'
    if (!form.email?.trim())      errs.email      = 'This field is required.'
    else if (!EMAIL_RE.test(form.email)) errs.email = 'Wrong email format.'
    else {
      const duplicate = clients.find(
        (c) => c.id !== client.id && c.email.toLowerCase() === form.email.trim().toLowerCase()
      )
      if (duplicate) errs.email = 'This email is already in use.'
    }
    if (!form.username?.trim())   errs.username   = 'This field is required.'
    if (form.dateOfBirth && new Date(form.dateOfBirth) >= new Date()) errs.dateOfBirth = 'Date of birth cannot be in the future.'
    return errs
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleBlur(e) {
    const { name } = e.target
    const errs = validate()
    if (errs[name]) setFieldErrors((prev) => ({ ...prev, [name]: errs[name] }))
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    try {
      await updateClient(client.id, form)
      setEditing(false)
    } catch {
      // keep editing open so user can retry
    }
  }

  function handleCancel() {
    setEditing(false)
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
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Client</p>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">{client.fullName}</h1>
          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium tracking-wide rounded-full ${
            client.active
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}>
            {client.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {/* Details card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm space-y-1">

          {editing ? (
            <>
              <Section title="Personal">
                <EditRow label="First Name"    name="firstName"   value={form.firstName}   onChange={handleChange} onBlur={handleBlur} error={fieldErrors.firstName} />
                <EditRow label="Last Name"     name="lastName"    value={form.lastName}    onChange={handleChange} onBlur={handleBlur} error={fieldErrors.lastName} />
                <EditRow label="Date of Birth" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} onBlur={handleBlur} type="date" error={fieldErrors.dateOfBirth} />
                <SelectRow label="Gender" name="gender" value={form.gender} onChange={handleChange} options={['Male', 'Female', 'Other']} />
                {/* JMBG is never editable */}
                <Row label="JMBG" value={client.jmbg} />
              </Section>

              <Section title="Contact">
                <EditRow label="Email"   name="email"       value={form.email}       onChange={handleChange} onBlur={handleBlur} type="email" error={fieldErrors.email} />
                <EditRow label="Phone"   name="phoneNumber" value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur} />
                <EditRow label="Address" name="address"     value={form.address}     onChange={handleChange} onBlur={handleBlur} />
              </Section>

              <Section title="Account">
                <EditRow label="Username" name="username" value={form.username} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.username} />
                <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">Active</span>
                  <input
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    className="w-4 h-4 accent-violet-600"
                  />
                </div>
              </Section>

              <Section title="Bank Accounts">
                {clientAccounts.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 py-3">No accounts linked.</p>
                ) : (
                  clientAccounts.map((acc) => (
                    <Row key={acc.id} label={acc.accountName ?? acc.accountNumber} value={acc.accountNumber} />
                  ))
                )}
              </Section>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="px-5 py-2 text-xs tracking-widest uppercase bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <Section title="Personal">
                <Row label="First Name"    value={client.firstName} />
                <Row label="Last Name"     value={client.lastName} />
                <Row label="Date of Birth" value={client.dateOfBirth} />
                <Row label="Gender"        value={client.gender} />
                <Row label="JMBG"          value={client.jmbg} />
              </Section>

              <Section title="Contact">
                <Row label="Email"   value={client.email} />
                <Row label="Phone"   value={client.phoneNumber} />
                <Row label="Address" value={client.address} />
              </Section>

              <Section title="Account">
                <Row label="Username"  value={client.username} />
                <Row label="Client ID" value={String(client.id)} />
              </Section>

              <Section title="Bank Accounts">
                {clientAccounts.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 py-3">No accounts linked.</p>
                ) : (
                  clientAccounts.map((acc) => (
                    <Row key={acc.id} label={acc.accountName ?? acc.accountNumber} value={acc.accountNumber} />
                  ))
                )}
              </Section>

              <div className="pt-4">
                <button
                  onClick={startEdit}
                  className="px-5 py-2 text-xs tracking-widest uppercase bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                >
                  Edit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="pb-4">
      <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 pt-6 pb-3">{title}</p>
      <div className="space-y-0">{children}</div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm text-slate-900 dark:text-white font-medium">{value}</span>
    </div>
  )
}

function EditRow({ label, name, value, onChange, onBlur, type = 'text', error }) {
  return (
    <div className="py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="text-sm text-right bg-transparent border-b border-violet-300 dark:border-violet-600 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 w-full max-w-xs"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500 text-right">{error}</p>}
    </div>
  )
}

function SelectRow({ label, name, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 gap-4">
      <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="text-sm text-right bg-transparent border-b border-violet-300 dark:border-violet-600 text-slate-900 dark:text-white focus:outline-none focus:border-violet-500 w-full max-w-xs"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}
