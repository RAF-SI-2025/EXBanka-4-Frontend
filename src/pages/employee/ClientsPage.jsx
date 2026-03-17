import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useClients } from '../../context/ClientsContext'
import { useAccounts } from '../../context/AccountsContext'

export default function ClientsPage() {
  useWindowTitle('Clients | AnkaBanka')
  const navigate = useNavigate()
  const { clients, loading, error, reload } = useClients()
  const { accounts, reload: reloadAccounts } = useAccounts()

  const [query, setQuery] = useState('')

  useEffect(() => { reload(); reloadAccounts() }, [])

  const sorted = [...clients].sort((a, b) => a.lastName.localeCompare(b.lastName, 'sr'))

  const displayed = query.trim()
    ? sorted.filter((c) => {
        const q = query.trim().toLowerCase()
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        )
      })
    : sorted

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading clients…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load clients.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <div className="mb-3">
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">Clients</h1>
        </div>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4">Search</p>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="input-field flex-1"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-500 transition-colors shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Full Name', 'Email', 'Phone', 'Status'].map((h) => (
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
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                      No clients match your search.
                    </td>
                  </tr>
                ) : (
                  displayed.map((client, i) => (
                    <tr
                      key={client.id}
                      onClick={() => navigate(`/admin/clients/${client.id}`)}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/10 ${
                        i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">
                        <span className="flex items-center gap-2">
                          {client.fullName}
                          {!accounts.some((a) => a.ownerId === client.id) && (
                            <span title="No accounts linked" className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold leading-none shrink-0">!</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{client.email}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{client.phoneNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
                          client.active
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {displayed.length > 0 && (
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              Showing {displayed.length}{query ? ` result${displayed.length !== 1 ? 's' : ''}` : ` of ${clients.length} clients`}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
