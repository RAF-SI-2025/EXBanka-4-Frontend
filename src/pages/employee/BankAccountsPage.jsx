import { useEffect, useState } from 'react'
import useWindowTitle from '../../hooks/useWindowTitle'
import { apiClient } from '../../services/apiClient'
import { fmt } from '../../utils/formatting'

export default function BankAccountsPage() {
  useWindowTitle('Bank Accounts | AnkaBanka')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)

  useEffect(() => {
    apiClient.get('/api/bank-accounts')
      .then(({ data }) => setAccounts(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load bank accounts.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-4xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-10">Bank Accounts</h1>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-normal">Account</th>
                <th className="text-left px-6 py-4 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-normal">Currency</th>
                <th className="text-right px-6 py-4 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-normal">Balance</th>
                <th className="text-right px-6 py-4 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 font-normal">Available</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.accountNumber} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-slate-900 dark:text-white tracking-widest">{a.accountNumber}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{a.accountName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400">
                      {a.currencyCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-light text-slate-900 dark:text-white">
                    {fmt(a.balance, a.currencyCode)}
                  </td>
                  <td className="px-6 py-4 text-right font-light text-slate-900 dark:text-white">
                    {fmt(a.availableBalance, a.currencyCode)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
