import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useEmployees } from '../../context/EmployeesContext'
import { PERMISSIONS } from '../../models/Employee'
import { actuaryService } from '../../services/actuaryService'
import { fmt } from '../../utils/formatting'

export default function EmployeeDetailPage() {
  const { id } = useParams()
  const { employees, loading, reload, updateEmployee } = useEmployees()

  useEffect(() => {
    if (employees.length === 0 && !loading) reload()
  }, [])

  const emp = employees.find((e) => e.id === Number(id))

  useWindowTitle(emp ? `${emp.fullName} | AnkaBanka` : 'Employee | AnkaBanka')

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})

  const [actuaryInfo, setActuaryInfo] = useState(null)
  useEffect(() => {
    if (!emp) return
    if (!emp.permissions?.isAgent && !emp.permissions?.isSupervisor) return
    actuaryService.getActuaries()
      .then((list) => setActuaryInfo(list.find((a) => a.employeeId === emp.id) ?? null))
      .catch(() => {})
  }, [emp?.id, emp?.permissions?.isAgent, emp?.permissions?.isSupervisor])

  if (!emp) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Not Found</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-6">Employee not found</h1>
        <Link to="/admin/employees" className="btn-primary">Back to List</Link>
      </div>
    )
  }

  function startEdit() {
    setForm({
      firstName:   emp.firstName,
      lastName:    emp.lastName,
      dateOfBirth: emp.dateOfBirth,
      gender:      emp.gender,
      jmbg:        emp.jmbg,
      email:       emp.email,
      phoneNumber: emp.phoneNumber,
      address:     emp.address,
      username:    emp.username,
      position:    emp.position,
      department:  emp.department,
      active:      emp.active,
      permissions: { ...emp.permissions },
    })
    setEditing(true)
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  function validate() {
    const errs = {}
    if (!form.firstName?.trim())  errs.firstName  = 'This field is required.'
    if (!form.lastName?.trim())   errs.lastName   = 'This field is required.'
    if (!form.email?.trim())      errs.email      = 'This field is required.'
    else if (!EMAIL_RE.test(form.email)) errs.email = 'Wrong email format.'
    if (!form.username?.trim())   errs.username   = 'This field is required.'
    if (!form.position?.trim())   errs.position   = 'This field is required.'
    if (!form.department?.trim()) errs.department = 'This field is required.'
    if (!/^\d{13}$/.test(form.jmbg)) errs.jmbg   = 'Must be exactly 13 digits.'
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

  const [fieldErrors, setFieldErrors] = useState({})
  const [adminConfirm, setAdminConfirm] = useState(false)
  const [pendingAdminValue, setPendingAdminValue] = useState(false)

  function handlePermissionChange(e) {
    const { name, checked } = e.target
    if (name === 'isAdmin' && checked) {
      setPendingAdminValue(true)
      setAdminConfirm(true)
      return
    }
    setForm((prev) => {
      const perms = { ...prev.permissions, [name]: checked }
      if (name === 'isAgent' && checked)      perms.isSupervisor = false
      if (name === 'isSupervisor' && checked) perms.isAgent = false
      return { ...prev, permissions: perms }
    })
  }

  function confirmAdmin() {
    setForm((prev) => ({ ...prev, permissions: { ...prev.permissions, isAdmin: pendingAdminValue, isSupervisor: true } }))
    setAdminConfirm(false)
  }

  function cancelAdmin() {
    setAdminConfirm(false)
  }

  async function handleSave() {
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setFieldErrors({})
    try {
      await updateEmployee(emp.id, form)
      setEditing(false)
    } catch {
      // keep editing open so user can retry
    }
  }

  function handleCancel() {
    setEditing(false)
  }

  return (
    <>
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
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">
          {emp.department}
        </p>
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">{emp.fullName}</h1>
          <span className={`inline-flex items-center px-3 py-1 text-xs font-medium tracking-wide rounded-full ${
            emp.active
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
          }`}>
            {emp.active ? 'Active' : 'Inactive'}
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
                <EditRow label="JMBG" name="jmbg" value={form.jmbg} onChange={handleChange} onBlur={handleBlur} maxLength={13} error={fieldErrors.jmbg} />
              </Section>

              <Section title="Contact">
                <EditRow label="Email"   name="email"       value={form.email}       onChange={handleChange} onBlur={handleBlur} type="email" error={fieldErrors.email} />
                <EditRow label="Phone"   name="phoneNumber" value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur} />
                <EditRow label="Address" name="address"     value={form.address}     onChange={handleChange} onBlur={handleBlur} />
              </Section>

              <Section title="Employment">
                <EditRow label="Username"   name="username"   value={form.username}   onChange={handleChange} onBlur={handleBlur} error={fieldErrors.username} />
                <EditRow label="Position"   name="position"   value={form.position}   onChange={handleChange} onBlur={handleBlur} error={fieldErrors.position} />
                <EditRow label="Department" name="department" value={form.department} onChange={handleChange} onBlur={handleBlur} error={fieldErrors.department} />
                <Row label="Employee ID" value={String(emp.id)} />
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

              <Section title="Permissions">
                {/* Admin — visually separated */}
                <div className="mb-3 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs tracking-widest uppercase text-amber-700 dark:text-amber-400 font-semibold">Admin</span>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Full system access — grants all privileges</p>
                  </div>
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={form.permissions?.isAdmin ?? false}
                    onChange={handlePermissionChange}
                    className="w-4 h-4 accent-amber-600"
                  />
                </div>
                {/* Supervisor — visually separated */}
                <div className="mb-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs tracking-widest uppercase text-blue-700 dark:text-blue-400 font-semibold">Supervisor</span>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Manages agents and their limits</p>
                  </div>
                  <input
                    type="checkbox"
                    name="isSupervisor"
                    checked={form.permissions?.isSupervisor ?? false}
                    onChange={handlePermissionChange}
                    disabled={form.permissions?.isAdmin ?? false}
                    className="w-4 h-4 accent-blue-600 disabled:opacity-50"
                  />
                </div>
                {/* Other permissions */}
                {Object.entries(PERMISSIONS).filter(([key]) => key !== 'isAdmin' && key !== 'isSupervisor').map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">{label}</span>
                    <input
                      type="checkbox"
                      name={key}
                      checked={form.permissions?.[key] ?? false}
                      onChange={handlePermissionChange}
                      className="w-4 h-4 accent-violet-600"
                    />
                  </div>
                ))}
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
                <Row label="First Name"    value={emp.firstName} />
                <Row label="Last Name"     value={emp.lastName} />
                <Row label="Date of Birth" value={emp.dateOfBirth} />
                <Row label="Gender"        value={emp.gender} />
                <Row label="JMBG"          value={emp.jmbg} />
              </Section>

              <Section title="Contact">
                <Row label="Email"   value={emp.email} />
                <Row label="Phone"   value={emp.phoneNumber} />
                <Row label="Address" value={emp.address} />
              </Section>

              <Section title="Employment">
                <Row label="Username"    value={emp.username} />
                <Row label="Position"    value={emp.position} />
                <Row label="Department"  value={emp.department} />
                <Row label="Employee ID" value={String(emp.id)} />
              </Section>

              <Section title="Permissions">
                {/* Admin row */}
                <div className="mb-3 rounded-lg border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs tracking-widest uppercase text-amber-700 dark:text-amber-400 font-semibold">Admin</span>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Full system access — grants all privileges</p>
                  </div>
                  <span className={`text-xs font-medium tracking-wide px-2 py-0.5 rounded-full ${
                    emp.permissions?.isAdmin
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {emp.permissions?.isAdmin ? 'Granted' : 'Denied'}
                  </span>
                </div>
                {/* Supervisor row */}
                <div className="mb-3 rounded-lg border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs tracking-widest uppercase text-blue-700 dark:text-blue-400 font-semibold">Supervisor</span>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">Manages agents and their limits</p>
                  </div>
                  <span className={`text-xs font-medium tracking-wide px-2 py-0.5 rounded-full ${
                    emp.permissions?.isSupervisor
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                  }`}>
                    {emp.permissions?.isSupervisor ? 'Granted' : 'Denied'}
                  </span>
                </div>
                {/* Other permissions */}
                {Object.entries(PERMISSIONS).filter(([key]) => key !== 'isAdmin' && key !== 'isSupervisor').map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">{label}</span>
                    <span className={`text-xs font-medium tracking-wide px-2 py-0.5 rounded-full ${
                      emp.permissions?.[key]
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                      {emp.permissions?.[key] ? 'Granted' : 'Denied'}
                    </span>
                  </div>
                ))}
              </Section>

              {(emp.permissions?.isAgent || emp.permissions?.isSupervisor) && (
                <Section title="Actuary">
                  {emp.permissions?.isAgent ? (
                    <>
                      <Row label="Limit"        value={actuaryInfo ? fmt(actuaryInfo.limit, 'RSD') : '—'} />
                      <Row label="Used Limit"   value={actuaryInfo ? fmt(actuaryInfo.usedLimit, 'RSD') : '—'} />
                      <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">Need Approval</span>
                        <span className={`text-xs font-medium tracking-wide px-2 py-0.5 rounded-full ${
                          actuaryInfo?.needApproval
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {actuaryInfo?.needApproval ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <Row label="Limit" value="No limit" />
                  )}
                </Section>
              )}

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

    {/* Admin confirmation modal */}
    {adminConfirm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
        <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-600 rounded-xl shadow-xl p-8 max-w-sm w-full">
          <p className="text-xs tracking-widest uppercase text-amber-600 dark:text-amber-400 mb-3">Warning</p>
          <h2 className="font-serif text-xl font-light text-slate-900 dark:text-white mb-3">Grant Admin access?</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Are you sure you want to make <span className="font-semibold text-slate-900 dark:text-white">{emp.fullName}</span> an Admin?
            This grants full system access and all privileges.
          </p>
          <div className="flex gap-3">
            <button
              onClick={confirmAdmin}
              className="px-5 py-2 text-xs tracking-widest uppercase bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              Yes, grant Admin
            </button>
            <button
              onClick={cancelAdmin}
              className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-500 dark:hover:border-amber-400 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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

function EditRow({ label, name, value, onChange, onBlur, type = 'text', maxLength, error }) {
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
          maxLength={maxLength}
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
