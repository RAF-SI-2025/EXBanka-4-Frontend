import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useEmployees } from '../context/EmployeesContext'

export default function AdminEmployeesPage() {
  useWindowTitle('Employees | AnkaBanka Admin')
  const navigate = useNavigate()
  const { employees } = useEmployees()

  const [filters, setFilters] = useState({ firstName: '', lastName: '', email: '', position: '' })

  function handleFilter(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function clearFilters() {
    setFilters({ firstName: '', lastName: '', email: '', position: '' })
  }

  const filtered = useMemo(() => {
    const { firstName, lastName, email, position } = filters
    return employees.filter((emp) => {
      if (firstName && !emp.firstName.toLowerCase().includes(firstName.toLowerCase())) return false
      if (lastName  && !emp.lastName.toLowerCase().includes(lastName.toLowerCase()))   return false
      if (email     && !emp.email.toLowerCase().includes(email.toLowerCase()))         return false
      if (position  && !emp.position.toLowerCase().includes(position.toLowerCase()))   return false
      return true
    })
  }, [filters, employees])

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Admin</p>
        <div className="flex items-end justify-between mb-3">
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">Employees</h1>
          <Link to="/admin/employees/new" className="btn-primary">
            New Employee
          </Link>
        </div>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4">Filter</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FilterInput name="firstName" placeholder="First name"  value={filters.firstName} onChange={handleFilter} />
            <FilterInput name="lastName"  placeholder="Last name"   value={filters.lastName}  onChange={handleFilter} />
            <FilterInput name="email"     placeholder="Email"       value={filters.email}     onChange={handleFilter} />
            <FilterInput name="position"  placeholder="Position"    value={filters.position}  onChange={handleFilter} />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['First Name', 'Last Name', 'Email', 'Position', 'Phone', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No employees match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((emp, i) => (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/admin/employees/${emp.id}`)}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/10 ${
                        i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{emp.firstName}</td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white">{emp.lastName}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{emp.email}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{emp.position}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{emp.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
                          emp.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              Showing {filtered.length} of {employees.length} employees
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterInput({ name, placeholder, value, onChange }) {
  return (
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input-field"
    />
  )
}
