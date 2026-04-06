import { useEffect, useState } from 'react'
import CardBrand from './CardBrand'

const STATUS_STYLES = {
  ACTIVE:      'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  BLOCKED:     'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  DEACTIVATED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm text-slate-900 dark:text-white font-light">{value ?? '—'}</p>
    </div>
  )
}

function fmt(n, currency) {
  if (n == null) return '—'
  return new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) +
    (currency ? ' ' + currency : '')
}

function fmtDate(s) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('en-GB')
}

/**
 * CardDetailModal
 *
 * Props:
 *   card        — Card instance (from list, may have masked number)
 *   fetchCard   — async (id) => Card — fetches full card details
 *   onClose     — () => void
 *   actions     — optional ReactNode rendered at bottom (block/unblock/etc.)
 */
export default function CardDetailModal({ card, fetchCard, onClose, actions }) {
  const [full, setFull]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCard(card.id)
      .then(setFull)
      .catch(() => setFull(card))
      .finally(() => setLoading(false))
  }, [card.id])

  const c = full ?? card

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <CardBrand brand={c.cardName} size="md" />
            <div>
              <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">Card Details</p>
              <p className="font-mono text-sm text-slate-900 dark:text-white tracking-widest mt-0.5">
                {loading ? '···· ···· ···· ····' : c.cardNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Card Name"     value={c.cardName} />
          <Field label="Card Type"     value={c.cardType} />
          <Field label="Account"       value={c.accountNumber} />
          <Field label="Status"        value={
            <span className={`text-xs px-2.5 py-1 rounded-full font-light ${STATUS_STYLES[c.status] ?? STATUS_STYLES.DEACTIVATED}`}>
              {c.status?.charAt(0) + c.status?.slice(1).toLowerCase()}
            </span>
          } />
          <Field label="Limit"         value={fmt(c.cardLimit)} />
          <Field label="CVV"           value="•••" />
          <Field label="Created"       value={fmtDate(c.createdAt)} />
          <Field label="Expires"       value={fmtDate(c.expiryDate)} />
        </div>

        {/* Actions */}
        {actions && (
          <div className="px-6 pb-6 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
