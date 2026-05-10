import { useState, useEffect } from 'react'
import useWindowTitle from '../../hooks/useWindowTitle'
import { actuaryService } from '../../services/actuaryService'
import { ActuaryInfo } from '../../models/ActuaryInfo'
import { fmt } from '../../utils/formatting'
import PermissionGate from '../../components/PermissionGate'
import { PERM } from '../../utils/permissions'

const EMPTY_FILTERS = { firstName: '', lastName: '', email: '', position: '' }

export default function ActuaryManagementPage() {
  useWindowTitle('Actuaries | AnkaBanka Admin')

  const [actuaries, setActuaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [editingLimit, setEditingLimit] = useState(null) // { agentId, value }

  useEffect(() => {
    actuaryService.getActuaries()
      .then(setActuaries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hasFilters = Object.values(filters).some(Boolean)
  const displayed = hasFilters
    ? actuaries.filter((a) => {
        const f = filters
        return (
          (!f.firstName || a.firstName.toLowerCase().includes(f.firstName.toLowerCase())) &&
          (!f.lastName  || a.lastName.toLowerCase().includes(f.lastName.toLowerCase()))   &&
          (!f.email     || a.email.toLowerCase().includes(f.email.toLowerCase()))         &&
          (!f.position  || a.position.toLowerCase().includes(f.position.toLowerCase()))
        )
      })
    : actuaries

  function handleFilter(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS)
  }

  async function handleSetLimit(agentId) {
    const val = parseFloat(editingLimit.value)
    if (isNaN(val) || val <= 0) return
    try {
      await actuaryService.setAgentLimit(agentId, val)
      setActuaries((prev) =>
        prev.map((a) => a.employeeId === agentId ? new ActuaryInfo({ ...a, limit: val }) : a)
      )
      setEditingLimit(null)
    } catch {
      // keep input open so user can retry
    }
  }

  async function handleResetUsedLimit(agentId) {
    try {
      await actuaryService.resetAgentUsedLimit(agentId)
      setActuaries((prev) =>
        prev.map((a) => a.employeeId === agentId ? new ActuaryInfo({ ...a, usedLimit: 0 }) : a)
      )
    } catch {
      // error dispatched by apiClient interceptor
    }
  }

  return (
    <PermissionGate
      permission={PERM.IS_SUPERVISOR}
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Access Denied</p>
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">Supervisors only</h1>
        </div>
      }
    >
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Admin</p>
          <div className="flex items-end justify-between mb-3">
            <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">Actuaries</h1>
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
                    {['Name', 'Email', 'Position', 'Limit (RSD)', 'Used Limit (RSD)', 'Actions'].map((h) => (
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
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        Loading…
                      </td>
                    </tr>
                  ) : displayed.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No agents match the current filters.
                      </td>
                    </tr>
                  ) : (
                    displayed.map((actuary, i) => (
                      <tr
                        key={actuary.employeeId}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <td className="px-6 py-4 text-slate-900 dark:text-white font-medium whitespace-nowrap">
                          {actuary.fullName}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{actuary.email}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{actuary.position}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white whitespace-nowrap">
                          {actuary.limit != null ? fmt(actuary.limit, 'RSD') : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white whitespace-nowrap">
                          {actuary.usedLimit != null ? fmt(actuary.usedLimit, 'RSD') : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            {editingLimit?.agentId === actuary.employeeId ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editingLimit.value}
                                  onChange={(e) => setEditingLimit((prev) => ({ ...prev, value: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSetLimit(actuary.employeeId); if (e.key === 'Escape') setEditingLimit(null) }}
                                  className="input-field w-32 text-sm"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSetLimit(actuary.employeeId)}
                                  className="text-xs tracking-widest uppercase text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingLimit(null)}
                                  className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-slate-400 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingLimit({ agentId: actuary.employeeId, value: actuary.limit ?? '' })}
                                className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors"
                              >
                                Set limit
                              </button>
                            )}
                            <button
                              onClick={() => handleResetUsedLimit(actuary.employeeId)}
                              className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                            >
                              Reset used
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && displayed.length > 0 && (
              <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                Showing {displayed.length}{hasFilters ? ` result${displayed.length !== 1 ? 's' : ''}` : ` of ${actuaries.length} agents`}
              </div>
            )}
          </div>

        </div>
      </div>
    </PermissionGate>
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
