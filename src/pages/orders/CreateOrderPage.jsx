import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { usePermission } from '../../hooks/usePermission'
import { securitiesService } from '../../services/securitiesService'
import { orderService } from '../../services/orderService'
import { apiClient } from '../../services/apiClient'
import { fmt } from '../../utils/formatting'

function determineOrderType(limitValue, stopValue) {
  const hasLimit = limitValue !== '' && limitValue != null && limitValue !== undefined
  const hasStop  = stopValue  !== '' && stopValue  != null && stopValue  !== undefined
  if (!hasLimit && !hasStop) return 'MARKET'
  if (hasLimit  && !hasStop) return 'LIMIT'
  if (!hasLimit && hasStop)  return 'STOP'
  return 'STOP_LIMIT'
}

function orderTypeLabel(orderType, isAon, isMargin) {
  const typeNames = {
    MARKET:     'Market Order',
    LIMIT:      'Limit Order',
    STOP:       'Stop Order',
    STOP_LIMIT: 'Stop-Limit Order',
  }
  const prefix = [isAon && 'AON', isMargin && 'Margin'].filter(Boolean).join(' ')
  const name   = typeNames[orderType] ?? orderType
  return prefix ? `${prefix} ${name}` : name
}

export default function CreateOrderPage() {
  useWindowTitle('New Order | AnkaBanka')
  const { canAny } = usePermission()
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  if (!canAny(['isAgent', 'isSupervisor', 'isAdmin'])) return <Navigate to="/" replace />

  const ticker    = searchParams.get('ticker')    ?? ''
  const direction = searchParams.get('direction') ?? 'BUY'

  const [listing,     setListing]     = useState(null)
  const [accounts,    setAccounts]    = useState([])
  const [loadingInit, setLoadingInit] = useState(true)
  const [initError,   setInitError]   = useState(false)

  // Form state
  const [quantity,   setQuantity]   = useState(1)
  const [limitValue, setLimitValue] = useState('')
  const [stopValue,  setStopValue]  = useState('')
  const [isAon,      setIsAon]      = useState(false)
  const [isMargin,   setIsMargin]   = useState(false)
  const [accountId,  setAccountId]  = useState('')

  // UI state
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitted,   setSubmitted]   = useState(false)

  useEffect(() => {
    if (!ticker) { setLoadingInit(false); return }

    async function init() {
      try {
        const { items } = await securitiesService.getListings({ ticker })
        const found = items.find((l) => l.ticker === ticker) ?? items[0] ?? null
        setListing(found)
      } catch {
        setInitError(true)
        setLoadingInit(false)
        return
      }

      try {
        const fetchAccounts = apiClient.get('/api/bank-accounts').then((r) => r.data)
        const accs = await fetchAccounts
        setAccounts(Array.isArray(accs) ? accs : [])
        if (accs.length > 0) setAccountId(String(accs[0].id ?? accs[0].accountId))
      } catch {
        // accounts failed — page still loads, user just won't have a pre-selected account
      } finally {
        setLoadingInit(false)
      }
    }
    init()
  }, [ticker])

  const orderType = determineOrderType(limitValue, stopValue)

  function approxPrice() {
    if (!listing) return 0
    const contractSize = listing.futuresDetail?.contractSize ?? listing.optionDetail?.contractSize ?? 1
    const qty = Number(quantity) || 0
    let ppu
    if (orderType === 'MARKET')     ppu = listing.price
    else if (orderType === 'STOP')  ppu = Number(stopValue)  || 0
    else                            ppu = Number(limitValue) || 0
    return contractSize * ppu * qty
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await orderService.createOrder({
        assetId:    listing.id,
        quantity:   Number(quantity),
        direction,
        limitValue: limitValue !== '' ? Number(limitValue) : undefined,
        stopValue:  stopValue  !== '' ? Number(stopValue)  : undefined,
        isAon,
        isMargin,
        accountId:  Number(accountId),
      })
      setSubmitted(true)
      setShowConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInit) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load listing data.</p>
      </div>
    )
  }

  if (!ticker || !listing) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {!ticker ? 'No ticker specified.' : `No listing found for "${ticker}".`}
        </p>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs tracking-widest uppercase text-emerald-600 dark:text-emerald-400 mb-2">Order submitted</p>
          <h2 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-6">Your order is being processed.</h2>
          <button onClick={() => navigate(-1)} className="btn-primary">Go Back</button>
        </div>
      </div>
    )
  }

  const canSubmit = Number(quantity) >= 1 && accountId !== ''

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-xl mx-auto">

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">
          {direction === 'BUY' ? 'Securities Portal' : 'My Portfolio'}
        </p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-1">
          {direction === 'BUY' ? 'Buy' : 'Sell'} {listing.ticker}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light mb-3">{listing.name}</p>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-10" />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-5">

          {/* Current price */}
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400">Current Price</span>
            <span className="font-mono text-slate-900 dark:text-white">{fmt(listing.price)}</span>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            If you leave limit/stop fields empty, market price is taken into account.
          </p>

          {/* Quantity */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input-field w-full"
            />
          </div>

          {/* Limit Value */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Limit Value <span className="normal-case font-light">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={limitValue}
              onChange={(e) => setLimitValue(e.target.value)}
              placeholder="Leave empty for market price"
              className="input-field w-full"
            />
          </div>

          {/* Stop Value */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Stop Value <span className="normal-case font-light">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={stopValue}
              onChange={(e) => setStopValue(e.target.value)}
              placeholder="Leave empty for market price"
              className="input-field w-full"
            />
          </div>

          {/* Checkboxes */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAon}
                onChange={(e) => setIsAon(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-violet-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">All or None</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isMargin}
                onChange={(e) => setIsMargin(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-violet-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Margin</span>
            </label>
          </div>

          {/* Account selector */}
          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-2">
              Account
            </label>
            {accounts.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">No accounts available.</p>
            ) : (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="input-field w-full"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountName || acc.accountNumber} — {acc.currency}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Order type preview */}
          <div className="flex justify-between text-xs pt-1">
            <span className="tracking-widest uppercase text-slate-500 dark:text-slate-400">Order Type</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {orderTypeLabel(orderType, isAon, isMargin)}
            </span>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={!canSubmit}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review Order
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 max-w-sm w-full shadow-xl">
            <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-1">Confirm Order</p>
            <h2 className="font-serif text-2xl font-light text-slate-900 dark:text-white mb-6">
              {direction} {listing.ticker}
            </h2>

            <div className="space-y-3 mb-6 border border-slate-100 dark:border-slate-800 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Quantity:</span>
                <span className="text-slate-900 dark:text-white font-medium">{quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Order Type:</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {orderTypeLabel(orderType, isAon, isMargin)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Approximate Price:</span>
                <span className="text-slate-900 dark:text-white font-medium">{fmt(approxPrice())}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {submitting ? '…' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
