import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { useClientAuth } from '../../context/ClientAuthContext'
import { useClientAccounts } from '../../context/ClientAccountsContext'
import { fmt } from '../../utils/formatting'
import Spinner from '../../components/Spinner'

function Row({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">{label}</span>
      <span className={`text-sm font-light ${highlight ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-900 dark:text-white'}`}>
        {value}
      </span>
    </div>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      {title && <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">{title}</p>}
      {children}
    </div>
  )
}

export default function ClientAccountDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clientUser } = useClientAuth()
  const { accounts, loading } = useClientAccounts()

  const account = accounts.find((a) => a.id === Number(id))

  const [accountName, setAccountName] = useState(account?.accountName ?? '')
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(accountName)

  useWindowTitle(account ? `${accountName} | AnkaBanka` : 'Account | AnkaBanka')

  if (loading) {
    return (
      <ClientPortalLayout>
        <Spinner />
      </ClientPortalLayout>
    )
  }

  if (!account) {
    return (
      <ClientPortalLayout>
        <div className="px-8 py-8 max-w-3xl mx-auto w-full">
          <p className="text-slate-500 dark:text-slate-400">Account not found.</p>
        </div>
      </ClientPortalLayout>
    )
  }

  const reserved = account.balance - account.availableBalance

  function saveName() {
    if (nameInput.trim()) setAccountName(nameInput.trim())
    setEditingName(false)
  }

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-3xl mx-auto w-full space-y-6">

        {/* Back */}
        <button
          onClick={() => navigate('/client/accounts')}
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Accounts
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            {/* Editable account name */}
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false) }}
                  className="input-field text-2xl font-serif font-light py-1 px-2 max-w-xs"
                />
                <button onClick={saveName} className="text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button onClick={() => setEditingName(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white">{accountName}</h1>
                <button
                  onClick={() => { setNameInput(accountName); setEditingName(true) }}
                  className="text-slate-300 dark:text-slate-600 hover:text-violet-500 dark:hover:text-violet-400 transition-colors mt-1"
                  title="Change account name"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{account.accountNumber}</p>
          </div>
          <span className={`mt-1 shrink-0 text-xs px-3 py-1 rounded-full font-light
            ${account.status === 'active'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
            {account.status}
          </span>
        </div>

        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400" />

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => { setNameInput(accountName); setEditingName(true) }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Change Name
          </button>
          <button
            onClick={() => navigate('/client/payments/new')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            New Payment
          </button>
          <button
            onClick={() => navigate('/client/transfers')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs tracking-widest uppercase border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-400 dark:hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-400 rounded-lg transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Transfer
          </button>
        </div>

        {/* Balance */}
        <Card title="Balance">
          <Row label="Available balance" value={fmt(account.availableBalance, account.currency)} highlight />
          <Row label="Total balance"     value={fmt(account.balance, account.currency)} />
          <Row label="Reserved funds"    value={fmt(reserved, account.currency)} />
        </Card>

        {/* Account info */}
        <Card title="Account info">
          <Row label="Owner"    value={clientUser ? `${clientUser.firstName} ${clientUser.lastName}` : '—'} />
          <Row label="Currency" value={account.currency} />
          <Row label="Type"     value={`${account.type} · ${account.subtype}`} />
        </Card>

        {/* Limits & spending */}
        <Card title="Limits & spending">
          <Row label="Daily limit"     value={fmt(account.dailyLimit, account.currency)} />
          <Row label="Monthly limit"   value={fmt(account.monthlyLimit, account.currency)} />
          <Row label="Spent today"     value={fmt(account.dailySpending, account.currency)} />
          <Row label="Spent this month"value={fmt(account.monthlySpending, account.currency)} />
        </Card>

      </div>
    </ClientPortalLayout>
  )
}
