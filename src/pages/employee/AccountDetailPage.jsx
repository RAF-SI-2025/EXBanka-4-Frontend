import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAccounts } from '../../context/AccountsContext'
import { accountService } from '../../services/accountService'
import { BankAccount } from '../../models/BankAccount'
// TODO: replace with employee-scoped endpoint once backend adds GET /api/admin/accounts/:id
import { fmt } from '../../utils/formatting'
import Spinner from '../../components/Spinner'
import { useApiError } from '../../context/ApiErrorContext'

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

function Card({ title, children, action }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 shadow-sm">
      <div className="flex items-center justify-between pb-3">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function AccountDetailPage() {
  const { id } = useParams()
  const { addSuccess } = useApiError()
  const { accounts, loading: listLoading, reload } = useAccounts()
  const [detail, setDetail]             = useState(null)
  const [editingLimits, setEditingLimits] = useState(false)
  const [limitForm, setLimitForm]       = useState({ dailyLimit: '', monthlyLimit: '' })
  const [limitErrors, setLimitErrors]   = useState({})
  const [limitsLoading, setLimitsLoading] = useState(false)

  const account = detail ?? accounts.find((a) => a.id === Number(id))

  useWindowTitle(account ? `${account.accountNumber} | AnkaBanka` : 'Account | AnkaBanka')

  useEffect(() => {
    if (accounts.length === 0 && !listLoading) reload()
  }, [])

  useEffect(() => {
    if (account && !detail) {
      setLimitForm({ dailyLimit: String(account.dailyLimit), monthlyLimit: String(account.monthlyLimit) })
    }
  }, [account])

  if (listLoading && !account) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Not Found</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-6">Account not found</h1>
        <Link to="/admin/accounts" className="btn-primary">Back to Accounts</Link>
      </div>
    )
  }

  const reserved = account.balance - account.availableBalance

  function validateLimits() {
    const errs = {}
    const daily   = parseFloat(limitForm.dailyLimit)
    const monthly = parseFloat(limitForm.monthlyLimit)
    if (!limitForm.dailyLimit   || isNaN(daily)   || daily   <= 0) errs.dailyLimit   = 'Must be a positive number.'
    if (!limitForm.monthlyLimit || isNaN(monthly) || monthly <= 0) errs.monthlyLimit = 'Must be a positive number.'
    if (!errs.dailyLimit && !errs.monthlyLimit && daily > monthly)
      errs.dailyLimit = 'Daily limit cannot exceed the monthly limit.'
    return errs
  }

  async function saveLimits() {
    const errs = validateLimits()
    if (Object.keys(errs).length) { setLimitErrors(errs); return }
    setLimitsLoading(true)
    try {
      await accountService.updateAccountLimits(account.id, {
        dailyLimit:   parseFloat(limitForm.dailyLimit),
        monthlyLimit: parseFloat(limitForm.monthlyLimit),
      })
      setDetail(new BankAccount({
        ...account,
        dailyLimit:   parseFloat(limitForm.dailyLimit),
        monthlyLimit: parseFloat(limitForm.monthlyLimit),
      }))
      setEditingLimits(false)
      setLimitErrors({})
      addSuccess('Account limits updated successfully.', 'Saved')
    } finally {
      setLimitsLoading(false)
    }
  }

  function startEditingLimits() {
    setLimitForm({ dailyLimit: String(account.dailyLimit), monthlyLimit: String(account.monthlyLimit) })
    setLimitErrors({})
    setEditingLimits(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back */}
        <Link
          to="/admin/accounts"
          className="inline-flex items-center gap-2 text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          All Accounts
        </Link>

        {/* Header */}
        <div>
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Account</p>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white font-mono tracking-wide">
              {account.accountNumber}
            </h1>
            <span className={`mt-2 shrink-0 text-xs px-3 py-1 rounded-full font-light ${
              account.isActive
                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}>
              {account.status}
            </span>
          </div>
          <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mt-3" />
        </div>

        {/* Account Info */}
        <Card title="Account Info">
          <Row label="Account Number" value={account.accountNumber} mono />
          <Row label="Account Name"   value={account.accountName ?? '—'} />
          <Row label="Owner"          value={account.ownerFullName} />
          <Row label="Type" value={
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
              account.type === 'personal'
                ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {account.type === 'personal' ? 'Personal' : 'Business'}
            </span>
          } />
          <Row label="Subtype"  value={account.subtype ?? '—'} />
          <Row label="Currency" value={account.currency} />
          <Row label="Currency Type" value={
            <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium tracking-wide rounded-full ${
              account.currencyType === 'current'
                ? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            }`}>
              {account.currencyType === 'current' ? 'Current' : 'Foreign Currency'}
            </span>
          } />
          {account.maintenanceFee > 0 && (
            <Row label="Maintenance Fee" value={fmt(account.maintenanceFee, account.currency) + ' / month'} />
          )}
          {account.createdAt && <Row label="Created"  value={new Date(account.createdAt).toLocaleDateString('sr-RS')} />}
          {account.expiresAt && <Row label="Expires"  value={new Date(account.expiresAt).toLocaleDateString('sr-RS')} />}
        </Card>

        {/* Balance */}
        <Card title="Balance">
          <Row label="Available Balance" value={fmt(account.availableBalance, account.currency)} />
          <Row label="Total Balance"     value={fmt(account.balance, account.currency)} />
          <Row label="Reserved Funds"    value={fmt(reserved, account.currency)} />
        </Card>

        {/* Limits & Spending */}
        <Card
          title="Limits & Spending"
          action={
            !editingLimits && (
              <button
                onClick={startEditingLimits}
                className="text-xs tracking-widest uppercase text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                Edit
              </button>
            )
          }
        >
          {editingLimits ? (
            <div className="space-y-4 pt-1">
              <LimitField
                label="Daily Limit *"
                currency={account.currency}
                value={limitForm.dailyLimit}
                error={limitErrors.dailyLimit}
                onChange={(v) => { setLimitForm((p) => ({ ...p, dailyLimit: v })); setLimitErrors((p) => ({ ...p, dailyLimit: undefined })) }}
              />
              <LimitField
                label="Monthly Limit *"
                currency={account.currency}
                value={limitForm.monthlyLimit}
                error={limitErrors.monthlyLimit}
                onChange={(v) => { setLimitForm((p) => ({ ...p, monthlyLimit: v })); setLimitErrors((p) => ({ ...p, monthlyLimit: undefined })) }}
              />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveLimits}
                  disabled={limitsLoading}
                  className="btn-primary"
                >
                  {limitsLoading ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditingLimits(false); setLimitErrors({}) }}
                  className="px-5 py-2 text-xs tracking-widest uppercase border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500 dark:hover:border-violet-400 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <Row label="Daily Limit"      value={fmt(account.dailyLimit, account.currency)} />
              <Row label="Monthly Limit"    value={fmt(account.monthlyLimit, account.currency)} />
              <Row label="Spent Today"      value={fmt(account.dailySpending, account.currency)} />
              <Row label="Spent This Month" value={fmt(account.monthlySpending, account.currency)} />
            </>
          )}
        </Card>

        {/* Company Info — business accounts only */}
        {account.type === 'business' && account.company && (
          <Card title="Company Info">
            <Row label="Company Name"        value={account.company.name ?? '—'} />
            <Row label="Registration Number" value={account.company.registrationNumber ?? '—'} />
            <Row label="PIB"                 value={account.company.pib ?? '—'} />
            <Row label="Activity Code"       value={account.company.activityCode ?? '—'} />
            <Row label="Address"             value={account.company.address ?? '—'} />
          </Card>
        )}

        {/* Cards */}
        <Card title="Cards">
          <p className="text-sm text-slate-400 dark:text-slate-500">No cards linked to this account.</p>
        </Card>

      </div>
    </div>
  )
}

function LimitField({ label, currency, value, error, onChange }) {
  return (
    <div>
      <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min="1"
          step="1"
          className={`input-field pr-16 ${error ? 'input-error' : ''}`}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 dark:text-slate-500 pointer-events-none">
          {currency}
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
