import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { clientOtcService } from '../../services/clientOtcService'
import { fmt, fmtDateTime } from '../../utils/formatting'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'

function OfferModal({ item, onClose, onSubmit }) {
  const [quantity,       setQuantity]       = useState('')
  const [pricePerShare,  setPricePerShare]  = useState('')
  const [premium,        setPremium]        = useState('')
  const [settlementDate, setSettlementDate] = useState('')
  const [submitting,     setSubmitting]     = useState(false)
  const [error,          setError]          = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!quantity || !pricePerShare || !settlementDate) {
      setError('Quantity, price per share, and settlement date are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        ticker:         item.ticker,
        amount:         Number(quantity),
        pricePerStock:  Number(pricePerShare),
        premium:        premium ? Number(premium) : 0,
        settlementDate,
        sellerId:       item.ownerId,
        sellerType:     item.ownerType,
        currency:       item.currency,
      })
      onClose()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to submit offer. Please try again.')
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
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-serif text-xl font-light text-slate-900 dark:text-white mb-1">Make Offer</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{item.ticker}</span>
          {' — '}{item.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max={item.amount}
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="input-field w-full"
              placeholder={`Max ${item.amount}`}
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">
              Price per Share
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricePerShare}
              onChange={e => setPricePerShare(e.target.value)}
              className="input-field w-full"
              placeholder={fmt(item.pricePerStock)}
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">
              Premium
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={premium}
              onChange={e => setPremium(e.target.value)}
              className="input-field w-full"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">
              Settlement Date
            </label>
            <input
              type="date"
              value={settlementDate}
              min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
              onChange={e => setSettlementDate(e.target.value)}
              className="input-field w-full"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm py-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ClientOtcMarketPage() {
  useWindowTitle('OTC Market | AnkaBanka')
  const navigate = useNavigate()

  const [items,      setItems]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState(null)
  const [offerItem,  setOfferItem]  = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    clientOtcService.getMarket()
      .then(data => setItems(Array.isArray(data) ? data : (data.items ?? [])))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  async function handleOffer(payload) {
    await clientOtcService.createNegotiation(payload)
    navigate('/client/otc/negotiations')
  }

  function thClass() {
    return 'px-4 py-4 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap'
  }

  return (
    <ClientPortalLayout>
      <div className="p-6">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Client Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">OTC Market</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Loading market…</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-red-500 text-sm">Failed to load OTC market.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className={thClass()}>Type</th>
                    <th className={thClass()}>Name</th>
                    <th className={thClass()}>Symbol</th>
                    <th className={thClass()}>Amount</th>
                    <th className={thClass()}>Price</th>
                    <th className={thClass()}>Last Updated</th>
                    <th className={thClass()}>Owner</th>
                    <th className={thClass()} />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No stocks available on the OTC market.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, i) => (
                      <tr
                        key={`${item.ticker}-${i}`}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded font-mono">
                            {item.securityType ?? 'STOCK'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{item.name ?? '—'}</td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{item.ticker}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">{item.amount}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 tabular-nums">
                          {fmt(item.pricePerStock)} {item.currency && <span className="text-xs text-slate-400">{item.currency}</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                          {fmtDateTime(item.lastUpdated)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">
                          <div>{item.ownerName ?? '—'}</div>
                          {item.ownerBank && (
                            <div className="text-slate-400 dark:text-slate-500">{item.ownerBank}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setOfferItem(item)}
                            className="btn-primary text-xs px-3 py-1"
                          >
                            Offer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && !error && items.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              {items.length} stock{items.length !== 1 ? 's' : ''} available
            </div>
          )}
        </div>
      </div>

      {offerItem && (
        <OfferModal
          item={offerItem}
          onClose={() => setOfferItem(null)}
          onSubmit={handleOffer}
        />
      )}
    </ClientPortalLayout>
  )
}
