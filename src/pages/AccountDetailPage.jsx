import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useAccounts } from '../context/AccountsContext'

export default function AccountDetailPage() {
  const { id } = useParams()
  const { accounts, loading, reload } = useAccounts()

  useEffect(() => {
    if (accounts.length === 0 && !loading) reload()
  }, [])

  const account = accounts.find((a) => a.id === Number(id))

  useWindowTitle(account ? `${account.accountNumber} | AnkaBanka` : 'Account | AnkaBanka')

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Not Found</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-6">Account not found</h1>
        <Link to="/admin/accounts" className="btn-primary">Back to Accounts</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link
          to="/admin/accounts"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors mb-10"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Accounts
        </Link>

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Account</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3 font-mono tracking-wide">
          {account.accountNumber}
        </h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {/* Details card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm mb-6">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 pb-3">Account Info</p>

          <Row label="Account Number" value={account.accountNumber} mono />
          <Row label="Owner" value={account.ownerFullName} />
          <Row
            label="Type"
            value={
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
                account.type === 'personal'
                  ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {account.type === 'personal' ? 'Personal' : 'Business'}
              </span>
            }
          />
          <Row
            label="Currency"
            value={
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
                account.currencyType === 'current'
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                {account.currencyType === 'current' ? 'Current' : 'Foreign Currency'}
              </span>
            }
          />
        </div>

        {/* Cards section — placeholder until issue #41 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 pb-3">Cards</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">No cards linked to this account.</p>
        </div>

      </div>
    </div>
  )
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">{label}</span>
      {typeof value === 'string' ? (
        <span className={`text-sm text-slate-900 dark:text-white font-medium ${mono ? 'font-mono tracking-wide' : ''}`}>
          {value}
        </span>
      ) : (
        value
      )}
    </div>
  )
}
