import { useEffect, useState } from 'react'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useClientAuth } from '../../context/ClientAuthContext'
import { clientOtcService } from '../../services/clientOtcService'
import { fmt, fmtDate } from '../../utils/formatting'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'

const TABS = [
  { label: 'Valid',   key: 'ACTIVE' },
  { label: 'Expired', key: 'EXPIRED' },
]

function ExerciseModal({ contract, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)
  const total = (contract.strikePrice ?? 0) * (contract.amount ?? 0)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(contract.id)
      onClose()
    } catch {
      setError('Failed to exercise contract. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-sm mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl font-light text-slate-900 dark:text-white mb-4">Exercise Contract</h2>

        <div className="space-y-2 mb-5 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Ticker</span>
            <span className="font-mono font-medium text-slate-900 dark:text-white">{contract.ticker}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Amount</span>
            <span className="text-slate-700 dark:text-slate-300 tabular-nums">{contract.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Strike Price</span>
            <span className="text-slate-700 dark:text-slate-300 tabular-nums">{fmt(contract.strikePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Premium</span>
            <span className="text-slate-700 dark:text-slate-300 tabular-nums">{fmt(contract.premium)}</span>
          </div>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-medium">
            <span className="text-slate-700 dark:text-slate-300">Total Payment</span>
            <span className="text-slate-900 dark:text-white tabular-nums">{fmt(total)} {contract.currency ?? ''}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
          >
            {submitting ? 'Processing…' : 'Confirm Exercise'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClientOtcContractsPage() {
  useWindowTitle('OTC Contracts | AnkaBanka')
  const { clientUser } = useClientAuth()

  const [contracts,    setContracts]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState(null)
  const [activeTab,    setActiveTab]    = useState(TABS[0])
  const [exerciseItem, setExerciseItem] = useState(null)

  async function loadContracts(tab) {
    setLoading(true)
    setError(null)
    try {
      if (tab.key === 'ACTIVE') {
        const data = await clientOtcService.getContracts('ACTIVE')
        setContracts(Array.isArray(data) ? data : (data.contracts ?? data.items ?? []))
      } else {
        const [expired, exercised] = await Promise.all([
          clientOtcService.getContracts('EXPIRED').then(d => Array.isArray(d) ? d : (d.contracts ?? d.items ?? [])),
          clientOtcService.getContracts('EXERCISED').then(d => Array.isArray(d) ? d : (d.contracts ?? d.items ?? [])),
        ])
        setContracts([...expired, ...exercised])
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadContracts(activeTab) }, [activeTab])

  async function handleExercise(id) {
    await clientOtcService.exerciseContract(id, undefined)
    await loadContracts(activeTab)
  }

  function thClass() {
    return 'px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap'
  }

  return (
    <ClientPortalLayout>
      <div className="p-6">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Client Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">OTC Contracts</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <div className="flex gap-1 mb-5 border-b border-slate-200 dark:border-slate-700">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs tracking-widest uppercase font-medium transition-colors border-b-2 -mb-px ${
                activeTab.key === tab.key
                  ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading contracts…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-red-500 text-sm">Failed to load contracts.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className={thClass()}>Stock</th>
                    <th className={thClass()}>Amount</th>
                    <th className={thClass()}>Strike Price</th>
                    <th className={thClass()}>Premium</th>
                    <th className={thClass()}>Settlement Date</th>
                    <th className={thClass()}>Seller</th>
                    <th className={thClass()}>Status</th>
                    <th className={thClass()}>Profit</th>
                    <th className={thClass()} />
                  </tr>
                </thead>
                <tbody>
                  {contracts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No {activeTab.label.toLowerCase()} contracts found.
                      </td>
                    </tr>
                  ) : (
                    contracts.map((c, i) => (
                      <tr
                        key={c.id ?? i}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{c.ticker}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{c.amount}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{fmt(c.strikePrice)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{fmt(c.premium)}</td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{fmtDate(c.settlementDate)}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">
                          <div>{c.sellerName ?? '—'}</div>
                        </td>
                        <td className="px-4 py-3 text-xs font-medium tracking-wide text-slate-500 dark:text-slate-400">
                          {c.status ?? '—'}
                        </td>
                        <td className={`px-4 py-3 font-medium tabular-nums ${
                          c.profit == null
                            ? 'text-slate-400 dark:text-slate-500'
                            : c.profit >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-500 dark:text-red-400'
                        }`}>
                          {c.profit != null ? `${c.profit >= 0 ? '+' : ''}${fmt(c.profit)}` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {c.status === 'ACTIVE' && c.buyerType === 'CLIENT' && c.buyerId === clientUser?.id && (
                            <button
                              onClick={() => setExerciseItem(c)}
                              className="btn-primary text-xs px-3 py-1"
                            >
                              Exercise
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && contracts.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              {contracts.length} contract{contracts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {exerciseItem && (
        <ExerciseModal
          contract={exerciseItem}
          onClose={() => setExerciseItem(null)}
          onConfirm={handleExercise}
        />
      )}
    </ClientPortalLayout>
  )
}
