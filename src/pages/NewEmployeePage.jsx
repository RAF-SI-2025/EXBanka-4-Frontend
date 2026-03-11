import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useEmployees } from '../context/EmployeesContext'
import { DEFAULT_PERMISSIONS } from '../models/Employee'

const EMPTY_FORM = {
  firstName:   '',
  lastName:    '',
  dateOfBirth: '',
  gender:      '',
  email:       '',
  phoneNumber: '',
  address:     '',
  username:    '',
  position:    '',
  department:  '',
  active:      true,
  permissions: { ...DEFAULT_PERMISSIONS },
}

const REQUIRED = ['firstName', 'lastName', 'email', 'username', 'position', 'department']

export default function NewEmployeePage() {
  useWindowTitle('New Employee | AnkaBanka Admin')
  const navigate = useNavigate()
  const { addEmployee } = useEmployees()

  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: false }))
  }

  function validate() {
    const next = {}
    REQUIRED.forEach((field) => {
      if (!form[field].trim()) next[field] = true
    })
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    try {
      await addEmployee(form)
      navigate('/admin/employees')
    } catch {
      setErrors((prev) => ({ ...prev, _submit: true }))
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          to="/admin/employees"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-10"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Employees
        </Link>

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Admin</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">New Employee</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          The employee will set their password upon activation.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm space-y-8">

            {/* Personal */}
            <FormSection title="Personal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name *" error={errors.firstName}>
                  <input className={`input-field${errors.firstName ? ' input-error' : ''}`} name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" />
                </Field>
                <Field label="Last Name *" error={errors.lastName}>
                  <input className={`input-field${errors.lastName ? ' input-error' : ''}`} name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" />
                </Field>
                <Field label="Date of Birth">
                  <input className="input-field" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
                </Field>
                <Field label="Gender">
                  <select className="input-field" name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
              </div>
            </FormSection>

            {/* Contact */}
            <FormSection title="Contact">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Email *" error={errors.email}>
                  <input className={`input-field${errors.email ? ' input-error' : ''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="email@ankabanka.com" />
                </Field>
                <Field label="Phone">
                  <input className="input-field" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="+381..." />
                </Field>
              </div>
              <Field label="Address">
                <input className="input-field" name="address" value={form.address} onChange={handleChange} placeholder="Street, City" />
              </Field>
            </FormSection>

            {/* Employment */}
            <FormSection title="Employment">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Username *" error={errors.username}>
                  <input className={`input-field${errors.username ? ' input-error' : ''}`} name="username" value={form.username} onChange={handleChange} placeholder="firstname.lastname" />
                </Field>
                <Field label="Position *" error={errors.position}>
                  <input className={`input-field${errors.position ? ' input-error' : ''}`} name="position" value={form.position} onChange={handleChange} placeholder="e.g. Teller" />
                </Field>
                <Field label="Department *" error={errors.department}>
                  <input className={`input-field${errors.department ? ' input-error' : ''}`} name="department" value={form.department} onChange={handleChange} placeholder="e.g. Retail Banking" />
                </Field>
                <Field label="Active">
                  <div className="flex items-center h-[46px] px-4 border border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      name="active"
                      id="active"
                      checked={form.active}
                      onChange={handleChange}
                      className="w-4 h-4 accent-violet-600"
                    />
                    <label htmlFor="active" className="ml-2 text-sm text-slate-600 dark:text-slate-300 select-none">
                      Active account
                    </label>
                  </div>
                </Field>
              </div>
            </FormSection>

          </div>

          {errors._submit && (
            <p className="mt-4 text-xs text-red-500">Failed to create employee. Please try again.</p>
          )}
          <div className="flex gap-3 mt-6">
            <button type="submit" className="btn-primary">
              Create Employee
            </button>
            <Link
              to="/admin/employees"
              className="inline-flex items-center justify-center px-7 py-3 text-sm font-medium tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormSection({ title, children }) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">{title}</p>
      <div className="space-y-4">{children}</div>
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
