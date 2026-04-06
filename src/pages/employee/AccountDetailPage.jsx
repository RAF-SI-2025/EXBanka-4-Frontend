import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useAccounts } from '../../context/AccountsContext'
import { accountService } from '../../services/accountService'
import { employeeCardService } from '../../services/cardService'
import { BankAccount, formatAccountType } from '../../models/BankAccount'
import { Card as CardModel } from '../../models/Card'
import { fmt } from '../../utils/formatting'
import Spinner from '../../components/Spinner'
import CardBrand from '../../components/CardBrand'
import CardDetailModal from '../../components/CardDetailModal'
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
  const navigate = useNavigate()
  const { addSuccess, addToast } = useApiError()
  const { accounts, loading: listLoading, reload } = useAccounts()
  const [detail, setDetail]             = useState(null)
  const [editingLimits, setEditingLimits] = useState(false)
  const [limitForm, setLimitForm]       = useState({ dailyLimit: '', monthlyLimit: '' })
  const [limitErrors, setLimitErrors]   = useState({})
  const [limitsLoading, setLimitsLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  const account = detail ?? accounts.find((a) => a.id === Number(id))

  useWindowTitle(account ? `${account.accountNumber} | AnkaBanka` : 'Account | AnkaBanka')

  useEffect(() => {
    if (accounts.length === 0 && !listLoading) reload()
  }, [])

  useEffect(() => {
    accountService.getAccountById(Number(id))
      .then((d) => {
        setDetail(d)
        setLimitForm({ dailyLimit: String(d.dailyLimit), monthlyLimit: String(d.monthlyLimit) })
      })
      .catch(() => {})
  }, [id])

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

  async function handleDelete() {
    setDeleting(true)
    try {
      await accountService.deleteAccount(account.id)
      reload()
      addSuccess(`Account ${account.accountNumber} has been deleted.`, 'Account Deleted')
      navigate('/admin/accounts')
    } catch (err) {
      addToast(err?.response?.data?.error || 'Failed to delete account.', 'error', 'Delete Failed')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
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
          <Row label="Subtype"  value={formatAccountType(account.subtype)} />
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
        {account.accountNumber && (
          <AccountCards accountNumber={account.accountNumber} currency={account.currency} />
        )}

        {/* Delete account */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          {confirmDelete ? (
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">Are you sure you want to delete this account? This action cannot be undone.</p>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs tracking-widest uppercase bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="px-4 py-2 text-xs tracking-widest uppercase bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Delete Account
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

const CARD_STATUS_STYLES = {
  ACTIVE:      'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  BLOCKED:     'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  DEACTIVATED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
}

function AccountCards({ accountNumber, currency = 'RSD' }) {
  const { addSuccess } = useApiError()
  const [cards, setCards]           = useState(null) // null = loading
  const [error, setError]           = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => {
    employeeCardService.getCardsByAccount(accountNumber)
      .then(setCards)
      .catch(() => { setCards([]); setError(true) })
  }, [accountNumber])

  function updateCard(updated) {
    setCards((prev) => prev.map((c) => c.cardNumber === updated.cardNumber ? updated : c))
  }

  return (
    <>
      <Card title="Cards">
        {cards === null ? (
          <Spinner />
        ) : error ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Could not load cards.</p>
        ) : cards.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">No cards linked to this account.</p>
        ) : (
          <div className="space-y-3 pt-1">
            {cards.map((card) => (
              <EmployeeCardRow
                key={card.cardNumber}
                card={card}
                currency={currency}
                onUpdate={updateCard}
                addSuccess={addSuccess}
                onClick={() => setSelectedCard(card)}
              />
            ))}
          </div>
        )}
      </Card>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          fetchCard={(id) => employeeCardService.getCardById(id)}
          onClose={() => setSelectedCard(null)}
          actions={
            <EmployeeCardActions
              card={selectedCard}
              currency={currency}
              onUpdate={(updated) => { updateCard(updated); setSelectedCard(null) }}
              addSuccess={addSuccess}
            />
          }
        />
      )}
    </>
  )
}

function EmployeeCardRow({ card, currency = 'RSD', onUpdate, addSuccess, onClick }) {
  const [busy, setBusy]                           = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [editingLimit, setEditingLimit]           = useState(false)
  const [limitInput, setLimitInput]               = useState(String(card.cardLimit))
  const [limitError, setLimitError]               = useState(null)
  const [limitBusy, setLimitBusy]                 = useState(false)

  async function doAction(action, label) {
    setBusy(true)
    try {
      await action()
      addSuccess(`Card ${card.cardNumber} ${label}.`)
    } finally {
      setBusy(false)
      setConfirmDeactivate(false)
    }
  }

  async function handleBlock() {
    await doAction(async () => {
      await employeeCardService.blockCard(card.id)
      onUpdate(new CardModel({ ...card, status: 'BLOCKED' }))
    }, 'blocked')
  }

  async function handleUnblock() {
    await doAction(async () => {
      await employeeCardService.unblockCard(card.id)
      onUpdate(new CardModel({ ...card, status: 'ACTIVE' }))
    }, 'unblocked')
  }

  async function handleDeactivate() {
    await doAction(async () => {
      await employeeCardService.deactivateCard(card.id)
      onUpdate(new CardModel({ ...card, status: 'DEACTIVATED' }))
    }, 'deactivated')
  }

  async function handleSaveLimit() {
    const value = parseFloat(limitInput)
    if (!limitInput || isNaN(value) || value <= 0) {
      setLimitError('Must be a positive number.')
      return
    }
    setLimitBusy(true)
    setLimitError(null)
    try {
      await employeeCardService.updateCardLimit(card.id, value)
      onUpdate(new CardModel({ ...card, cardLimit: value }))
      setEditingLimit(false)
      addSuccess(`Card limit updated to ${value}.`)
    } finally {
      setLimitBusy(false)
    }
  }

  return (
    <div className={`py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 ${card.isDeactivated ? 'opacity-60' : ''}`}>
      {/* Top row: brand + number + status + actions */}
      <div className="flex items-center justify-between gap-4">
        <button onClick={onClick} className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity">
          <CardBrand brand={card.cardName} size="sm" />
          <div className="min-w-0">
            <p className="font-mono text-sm text-slate-900 dark:text-white tracking-widest">{card.cardNumber}</p>
            {card.expiryDate && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Expires {card.expiryDate}</p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-3 shrink-0">
          <span className={`text-xs px-2.5 py-1 rounded-full font-light ${CARD_STATUS_STYLES[card.status] ?? CARD_STATUS_STYLES.DEACTIVATED}`}>
            {card.status.charAt(0) + card.status.slice(1).toLowerCase()}
          </span>

          {!card.isDeactivated && !confirmDeactivate && (
            <div className="flex items-center gap-2">
              {card.isActive && (
                <button onClick={handleBlock} disabled={busy}
                  className="text-xs tracking-widest uppercase text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                  Block
                </button>
              )}
              {card.isBlocked && (
                <button onClick={handleUnblock} disabled={busy}
                  className="text-xs tracking-widest uppercase text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  Unblock
                </button>
              )}
              <button onClick={() => setConfirmDeactivate(true)} disabled={busy}
                className="text-xs tracking-widest uppercase text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                Deactivate
              </button>
            </div>
          )}

          {confirmDeactivate && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Permanently deactivate?</span>
              <button onClick={handleDeactivate} disabled={busy}
                className="text-xs tracking-widest uppercase text-red-500 dark:text-red-400 hover:text-red-700 transition-colors">
                {busy ? 'Deactivating…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmDeactivate(false)}
                className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Limit row */}
      <div className="mt-2 ml-[52px] flex items-center gap-3">
        {editingLimit ? (
          <>
            <div className="relative">
              <input
                type="number"
                value={limitInput}
                onChange={(e) => { setLimitInput(e.target.value); setLimitError(null) }}
                min="1"
                step="1"
                className={`input-field py-1 text-xs w-36 pr-10 ${limitError ? 'input-error' : ''}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">{currency}</span>
            </div>
            {limitError && <p className="text-xs text-red-500">{limitError}</p>}
            <button onClick={handleSaveLimit} disabled={limitBusy}
              className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors">
              {limitBusy ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => { setEditingLimit(false); setLimitInput(String(card.cardLimit)); setLimitError(null) }}
              className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors">
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Limit: <span className="text-slate-600 dark:text-slate-300">{card.cardLimit.toLocaleString('sr-RS')} {currency}</span>
            </span>
            {!card.isDeactivated && (
              <button onClick={() => { setLimitInput(String(card.cardLimit)); setEditingLimit(true) }}
                className="text-xs tracking-widest uppercase text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
                Edit limit
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EmployeeCardActions({ card, currency = 'RSD', onUpdate, addSuccess }) {
  const [busy, setBusy]                           = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [editingLimit, setEditingLimit]           = useState(false)
  const [limitInput, setLimitInput]               = useState(String(card.cardLimit))
  const [limitError, setLimitError]               = useState(null)
  const [limitBusy, setLimitBusy]                 = useState(false)

  async function doAction(action, label) {
    setBusy(true)
    try {
      await action()
      addSuccess(`Card ${card.cardNumber} ${label}.`)
    } finally {
      setBusy(false)
      setConfirmDeactivate(false)
    }
  }

  async function handleBlock() {
    await doAction(async () => {
      await employeeCardService.blockCard(card.id)
      onUpdate(new CardModel({ ...card, status: 'BLOCKED' }))
    }, 'blocked')
  }

  async function handleUnblock() {
    await doAction(async () => {
      await employeeCardService.unblockCard(card.id)
      onUpdate(new CardModel({ ...card, status: 'ACTIVE' }))
    }, 'unblocked')
  }

  async function handleDeactivate() {
    await doAction(async () => {
      await employeeCardService.deactivateCard(card.id)
      onUpdate(new CardModel({ ...card, status: 'DEACTIVATED' }))
    }, 'deactivated')
  }

  async function handleSaveLimit() {
    const value = parseFloat(limitInput)
    if (!limitInput || isNaN(value) || value <= 0) { setLimitError('Must be a positive number.'); return }
    setLimitBusy(true); setLimitError(null)
    try {
      await employeeCardService.updateCardLimit(card.id, value)
      onUpdate(new CardModel({ ...card, cardLimit: value }))
      addSuccess(`Card limit updated to ${value}.`)
    } finally {
      setLimitBusy(false)
    }
  }

  if (card.isDeactivated) return null

  return (
    <div className="flex flex-wrap gap-2 w-full">
      {!confirmDeactivate && (
        <>
          {card.isActive && (
            <button onClick={handleBlock} disabled={busy}
              className="text-xs tracking-widest uppercase text-amber-600 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
              Block
            </button>
          )}
          {card.isBlocked && (
            <button onClick={handleUnblock} disabled={busy}
              className="text-xs tracking-widest uppercase text-emerald-600 border border-emerald-300 dark:border-emerald-700 rounded-lg px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
              Unblock
            </button>
          )}
          <button onClick={() => setConfirmDeactivate(true)} disabled={busy}
            className="text-xs tracking-widest uppercase text-red-500 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Deactivate
          </button>
        </>
      )}
      {confirmDeactivate && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Permanently deactivate?</span>
          <button onClick={handleDeactivate} disabled={busy}
            className="text-xs tracking-widest uppercase text-red-500 hover:text-red-700 transition-colors">
            {busy ? 'Deactivating…' : 'Confirm'}
          </button>
          <button onClick={() => setConfirmDeactivate(false)}
            className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      )}
      <div className="w-full border-t border-slate-100 dark:border-slate-800 pt-2 mt-1 flex items-center gap-2">
        {editingLimit ? (
          <>
            <input type="number" value={limitInput} onChange={(e) => { setLimitInput(e.target.value); setLimitError(null) }}
              min="1" className={`input-field py-1 text-xs w-32 ${limitError ? 'input-error' : ''}`} />
            {limitError && <span className="text-xs text-red-500">{limitError}</span>}
            <button onClick={handleSaveLimit} disabled={limitBusy}
              className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors">
              {limitBusy ? 'Saving…' : 'Save limit'}
            </button>
            <button onClick={() => { setEditingLimit(false); setLimitInput(String(card.cardLimit)); setLimitError(null) }}
              className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors">
              Cancel
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Limit: <span className="text-slate-600 dark:text-slate-300">{card.cardLimit.toLocaleString('sr-RS')} {currency}</span>
            </span>
            <button onClick={() => { setLimitInput(String(card.cardLimit)); setEditingLimit(true) }}
              className="text-xs tracking-widest uppercase text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              Edit limit
            </button>
          </>
        )}
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
