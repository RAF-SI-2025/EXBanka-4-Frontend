import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useClientAuth } from '../../context/ClientAuthContext'
import { clientOtcService } from '../../services/clientOtcService'
import { clientSecuritiesService } from '../../services/clientSecuritiesService'
import { fmt, fmtDate, fmtDateTime } from '../../utils/formatting'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'

function getPriceColor(price, market) {
  if (!market) return 'text-slate-700 dark:text-slate-300'
  const dev = Math.abs((price - market) / market) * 100
  if (dev <= 5)  return 'text-emerald-600 dark:text-emerald-400'
  if (dev <= 20) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-500 dark:text-red-400'
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">{label}</p>
      <div className="text-sm text-slate-900 dark:text-white">{children}</div>
    </div>
  )
}

export default function ClientOtcNegotiationDetailPage() {
  useWindowTitle('Negotiation Detail | AnkaBanka')
  const { id }   = useParams()
  const navigate = useNavigate()
  const { clientUser } = useClientAuth()

  const [neg,         setNeg]         = useState(null)
  const [marketPrice, setMarketPrice] = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [acting,      setActing]      = useState(false)
  const [actionError, setActionError] = useState(null)

  const [counterQty,     setCounterQty]     = useState('')
  const [counterPrice,   setCounterPrice]   = useState('')
  const [counterDate,    setCounterDate]    = useState('')
  const [counterPremium, setCounterPremium] = useState('')
  const [showCounter,    setShowCounter]    = useState(false)
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false)

  const negRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    clientOtcService.getNegotiation(id)
      .then(data => {
        setNeg(data)
        negRef.current = data
        if (data?.ticker) {
          clientSecuritiesService.getListings({ ticker: data.ticker })
            .then(r => {
              const items = r?.items ?? r ?? []
              const first = Array.isArray(items) ? items[0] : null
              if (first?.price != null) setMarketPrice(first.price)
            })
            .catch(() => {})
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  // Poll every 10 s for cross-bank negotiations so counter-offers from the partner appear automatically.
  useEffect(() => {
    const interval = setInterval(() => {
      const current = negRef.current
      if (!current || (current.sellerType !== 'INTERBANK' && current.buyerType !== 'INTERBANK')) return
      clientOtcService.getNegotiation(id)
        .then(data => { setNeg(data); negRef.current = data })
        .catch(() => {})
    }, 10000)
    return () => clearInterval(interval)
  }, [id])

  const userId = clientUser?.id
  const isMyTurn = neg &&
    ((neg.status === 'PENDING_SELLER' && neg.sellerType === 'CLIENT' && neg.sellerId === userId) ||
     (neg.status === 'PENDING_BUYER'  && neg.buyerType  === 'CLIENT' && neg.buyerId  === userId))

  const [accepted, setAccepted] = useState(false)

  function apiError(err, fallback) {
    return err?.response?.data?.error || fallback
  }

  async function handleAccept() {
    setActing(true)
    setActionError(null)
    try {
      await clientOtcService.acceptNegotiation(id)
      setAccepted(true)
    } catch (err) {
      setActionError(apiError(err, 'Failed to accept negotiation.'))
    } finally {
      setActing(false)
      setShowAcceptConfirm(false)
    }
  }

  async function handleReject() {
    setActing(true)
    setActionError(null)
    try {
      await clientOtcService.rejectNegotiation(id)
      navigate('/client/otc/negotiations')
    } catch (err) {
      setActionError(apiError(err, 'Failed to reject negotiation.'))
    } finally {
      setActing(false)
    }
  }

  async function handleCounter(e) {
    e.preventDefault()
    if (!counterQty || !counterPrice || !counterDate) {
      setActionError('Quantity, price per share, and settlement date are required.')
      return
    }
    setActing(true)
    setActionError(null)
    try {
      await clientOtcService.counterOffer(id, {
        amount:         Number(counterQty),
        pricePerStock:  Number(counterPrice),
        settlementDate: counterDate,
        premium:        counterPremium ? Number(counterPremium) : 0,
      })
      navigate('/client/otc/negotiations')
    } catch (err) {
      setActionError(apiError(err, 'Failed to submit counter-offer.'))
    } finally {
      setActing(false)
    }
  }

  const priceColor = neg ? getPriceColor(neg.pricePerStock, marketPrice) : ''

  return (
    <ClientPortalLayout>
      <div className="p-6 max-w-3xl">
        <button
          onClick={() => navigate('/client/otc/negotiations')}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 flex items-center gap-1 transition-colors"
        >
          ← Back to Negotiations
        </button>

        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Client Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">Negotiation Detail</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {accepted && neg && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6 mb-6">
            <p className="text-emerald-700 dark:text-emerald-300 font-medium text-sm mb-1">Negotiation accepted.</p>
            {neg.buyerId === userId ? (
              <>
                <p className="text-emerald-600 dark:text-emerald-400 text-sm mb-3">
                  A contract has been created. You need to <strong>exercise</strong> it to receive the shares —
                  go to <strong>OTC Contracts</strong> and click Exercise before the settlement date ({fmtDate(neg.settlementDate)}).
                </p>
                <button
                  onClick={() => navigate('/client/otc/contracts')}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Go to OTC Contracts
                </button>
              </>
            ) : (
              <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                Waiting for the buyer to exercise the contract before the settlement date ({fmtDate(neg.settlementDate)}).
              </p>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading…</p>
        ) : error || !neg ? (
          <p className="text-red-500 text-sm">Failed to load negotiation.</p>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm p-6 mb-6">
              <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                <Field label="Ticker">
                  <span className="font-mono font-medium">{neg.ticker}</span>
                </Field>

                <Field label="Amount">
                  <span className="tabular-nums">{neg.amount}</span>
                </Field>

                <Field label="Price / Share">
                  <span className={`tabular-nums font-medium ${priceColor}`}>
                    {fmt(neg.pricePerStock)}
                    {marketPrice && (
                      <span className="ml-2 text-xs font-normal text-slate-400 dark:text-slate-500">
                        market {fmt(marketPrice)}
                      </span>
                    )}
                  </span>
                </Field>

                <Field label="Premium">
                  <span className="tabular-nums">{fmt(neg.premium)}</span>
                </Field>

                <Field label="Settlement Date">
                  {fmtDate(neg.settlementDate)}
                </Field>

                <Field label="Last Modified">
                  <div>{fmtDateTime(neg.lastModified)}</div>
                  {neg.modifiedByName && (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{neg.modifiedByName}</div>
                  )}
                </Field>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className={`text-xs font-medium ${
                  isMyTurn
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {isMyTurn ? 'Your turn' : 'Waiting for the other party'}
                </span>
                {(neg.sellerType === 'INTERBANK' || neg.buyerType === 'INTERBANK') && (
                  <span className="inline-block bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-xs px-2 py-0.5 rounded">
                    {neg.sellerName || 'Partner Bank'}
                  </span>
                )}
              </div>
            </div>

            {isMyTurn && !accepted && (
              <div className="space-y-4">
                {actionError && (
                  <p className="text-red-500 text-xs">{actionError}</p>
                )}

                {!showCounter && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowAcceptConfirm(true)}
                      disabled={acting}
                      className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleReject}
                      disabled={acting}
                      className="border border-red-400 text-red-500 px-5 py-2 text-sm hover:bg-red-500 hover:text-white transition-all duration-150 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setShowCounter(true)}
                      disabled={acting}
                      className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      Counter-offer
                    </button>
                  </div>
                )}

                {showAcceptConfirm && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">
                      Accept this offer? Premium payable: <strong>{fmt(neg.premium)}</strong>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">This action cannot be undone.</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAccept}
                        disabled={acting}
                        className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                      >
                        {acting ? 'Processing…' : 'Confirm Accept'}
                      </button>
                      <button
                        onClick={() => setShowAcceptConfirm(false)}
                        className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {showCounter && (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white mb-4">Counter-offer</h3>
                    <form onSubmit={handleCounter} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={counterQty}
                            onChange={e => setCounterQty(e.target.value)}
                            className="input-field w-full"
                            placeholder={neg.amount}
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">Price / Share</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={counterPrice}
                            onChange={e => setCounterPrice(e.target.value)}
                            className="input-field w-full"
                            placeholder={neg.pricePerStock}
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">Settlement Date</label>
                          <input
                            type="date"
                            value={counterDate}
                            min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                            onChange={e => setCounterDate(e.target.value)}
                            className="input-field w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">Premium</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={counterPremium}
                            onChange={e => setCounterPremium(e.target.value)}
                            className="input-field w-full"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-1">
                        <button
                          type="submit"
                          disabled={acting}
                          className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
                        >
                          {acting ? 'Submitting…' : 'Submit Counter-offer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowCounter(false); setActionError(null) }}
                          className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ClientPortalLayout>
  )
}
