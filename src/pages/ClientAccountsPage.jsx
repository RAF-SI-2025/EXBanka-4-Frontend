import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useAccounts } from '../context/AccountsContext'

export default function ClientAccountsPage() {
  useWindowTitle('Accounts | AnkaBanka')
  const navigate = useNavigate()
  const { accounts, loading, error, reload } = useAccounts()
  const [filters, setFilters] = useState({ owner: '', accountNumber: '' })

  useEffect(() => { reload() }, [])

  const sorted = [...accounts].sort((a, b) =>
    a.ownerLastName.localeCompare(b.ownerLastName, 'sr')
  )

  const displayed = sorted.filter((a) => {
    const ownerMatch = !filters.owner.trim() ||
      a.ownerFullName.toLowerCase().includes(filters.owner.trim().toLowerCase())
    const numMatch = !filters.accountNumber.trim() ||
      a.accountNumber.toLowerCase().includes(filters.accountNumber.trim().toLowerCase())
    return ownerMatch && numMatch
  })

  const hasFilters = filters.owner || filters.accountNumber

  function handleFilter(e) {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function clearFilters() {
    setFilters({ owner: '', accountNumber: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading accounts…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load accounts.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <div className="mb-3">
          <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">Client Accounts</h1>
        </div>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        {/* Filter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-4">Filter</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              name="owner"
              value={filters.owner}
              onChange={handleFilter}
              placeholder="Owner name"
              className="input-field"
            />
            <input
              type="text"
              name="accountNumber"
              value={filters.accountNumber}
              onChange={handleFilter}
              placeholder="Account number"
              className="input-field"
            />
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
                  {['Account Number', 'Owner', 'Type', 'Currency'].map((h) => (
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
                      No accounts match your search.
                    </td>
                  </tr>
                ) : (
                  displayed.map((account, i) => (
                    <tr
                      key={account.id}
                      onClick={() => navigate(`/admin/accounts/${account.id}`)}
                      className={`border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer transition-colors hover:bg-violet-50 dark:hover:bg-violet-900/10 ${
                        i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                      }`}
                    >
                      <td className="px-6 py-4 text-slate-900 dark:text-white font-medium font-mono tracking-wide">
                        {account.accountNumber}
                      </td>
                      <td className="px-6 py-4 text-slate-900 dark:text-white">
                        {account.ownerFullName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
                          account.type === 'personal'
                            ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {account.type === 'personal' ? 'Personal' : 'Business'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
                          account.currencyType === 'current'
                            ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        }`}>
                          {account.currencyType === 'current' ? 'Current' : 'Foreign Currency'}
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
              Showing {displayed.length}{hasFilters ? ` result${displayed.length !== 1 ? 's' : ''}` : ` of ${accounts.length} accounts`}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
