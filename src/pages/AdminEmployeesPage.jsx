import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useEmployees } from '../context/EmployeesContext'
import { employeeService } from '../services/employeeService'
import { employeeFromApi } from '../models/Employee'

const EMPTY_FILTERS = { firstName: '', lastName: '', email: '', position: '' }

export default function AdminEmployeesPage() {
  useWindowTitle('Employees | AnkaBanka Admin')
  const navigate = useNavigate()
  const { employees, loading, error, reload } = useEmployees()

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [searchResults, setSearchResults] = useState(null)  // null = no active search
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef(null)

  // Load full list on mount (user is already authenticated at this point)
  useEffect(() => { reload() }, [])

  // Debounce filter changes → call search endpoint
  useEffect(() => {
    const hasFilters = Object.values(filters).some(Boolean)

    if (!hasFilters) {
      setSearchResults(null)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { employees: raw } = await employeeService.searchEmployees(filters)
        setSearchResults(raw.map(employeeFromApi))
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(debounceRef.current)
  }, [filters])

  function handleFilter(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  const hasFilters = Object.values(filters).some(Boolean)
  const displayed = searchResults ?? employees
  const isLoading = loading || searching

  if (loading && !hasFilters) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading employees…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load employees. Is the backend running?</p>
      </div>
    )
  }

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
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                      Searching…
                    </td>
                  </tr>
                ) : displayed.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No employees match the current filters.
                    </td>
                  </tr>
                ) : (
                  displayed.map((emp, i) => (
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
          {!isLoading && displayed.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              Showing {displayed.length}{hasFilters ? ` result${displayed.length !== 1 ? 's' : ''}` : ` of ${employees.length} employees`}
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
