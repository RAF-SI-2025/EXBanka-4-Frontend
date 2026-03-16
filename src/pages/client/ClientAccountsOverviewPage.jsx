import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useClientAccounts } from '../../context/ClientAccountsContext'
import { fmt } from '../../utils/formatting'
import Spinner from '../../components/Spinner'

export default function ClientAccountsOverviewPage() {
  useWindowTitle('Accounts | AnkaBanka')
  const navigate = useNavigate()
  const { accounts, loading } = useClientAccounts()

  const sorted = [...accounts].sort((a, b) => b.availableBalance - a.availableBalance)

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-4xl mx-auto w-full">

        <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white mb-1">Accounts</h1>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {loading ? <Spinner /> : <div className="space-y-3">
          {sorted.map((account) => (
            <button
              key={account.id}
              onClick={() => navigate(`/client/accounts/${account.id}`)}
              className="w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                {/* Left: name + number */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-medium text-slate-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                      {account.accountName}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-light
                      ${account.status === 'active'
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                      {account.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{account.accountNumber}</p>
                </div>

                {/* Right: balance */}
                <div className="text-right">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Available balance</p>
                  <p className="font-serif text-2xl font-light text-slate-900 dark:text-white">
                    {fmt(account.availableBalance)}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{account.currency}</p>
                </div>
              </div>

              {/* Footer: type + chevron */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{account.type}</span>
                  <span className="text-slate-200 dark:text-slate-700">·</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{account.subtype}</span>
                </div>
                <svg className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>}
      </div>
    </ClientPortalLayout>
  )
}
