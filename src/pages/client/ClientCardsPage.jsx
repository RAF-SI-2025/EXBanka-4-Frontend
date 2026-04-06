import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import ClientPortalLayout from '../../layouts/ClientPortalLayout'
import { cardService } from '../../services/cardService'
import CardBrand from '../../components/CardBrand'
import CardDetailModal from '../../components/CardDetailModal'
import Spinner from '../../components/Spinner'

const STATUS_STYLES = {
  ACTIVE:      'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  BLOCKED:     'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  DEACTIVATED: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
}

export default function ClientCardsPage() {
  useWindowTitle('Cards | AnkaBanka')
  const navigate = useNavigate()

  const [cards, setCards]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => {
    cardService.getMyCards()
      .then(setCards)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <ClientPortalLayout>
      <div className="px-8 py-8 max-w-4xl mx-auto w-full">

        <div className="flex items-center justify-between mb-1">
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white">Cards</h1>
          <button
            onClick={() => navigate('/client/cards/request')}
            className="btn-primary"
          >
            Request Card
          </button>
        </div>
        <div className="w-8 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {loading ? (
          <Spinner />
        ) : cards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-3">No cards</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-light">You don't have any cards yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <CardRow
                key={card.cardNumber}
                card={card}
                onBlock={(updated) => setCards((prev) => prev.map((c) => c.cardNumber === updated.cardNumber ? updated : c))}
                onClick={() => setSelectedCard(card)}
              />
            ))}
          </div>
        )}

      </div>

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          fetchCard={(id) => cardService.getCardById(id)}
          onClose={() => setSelectedCard(null)}
          actions={selectedCard.isActive && (
            <BlockAction
              card={selectedCard}
              onBlock={(updated) => {
                setCards((prev) => prev.map((c) => c.cardNumber === updated.cardNumber ? updated : c))
                setSelectedCard(null)
              }}
            />
          )}
        />
      )}
    </ClientPortalLayout>
  )
}

function CardRow({ card, onBlock, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white dark:bg-slate-900 border rounded-xl px-6 py-5 shadow-sm flex items-center justify-between gap-4 transition-colors hover:border-violet-300 dark:hover:border-violet-700 ${
        card.isDeactivated
          ? 'border-slate-100 dark:border-slate-800 opacity-60'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <CardBrand brand={card.cardName} />
        <div className="min-w-0">
          <p className="font-mono text-sm text-slate-900 dark:text-white tracking-widest">{card.cardNumber}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{card.accountNumber}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs px-2.5 py-1 rounded-full font-light ${STATUS_STYLES[card.status] ?? STATUS_STYLES.DEACTIVATED}`}>
          {card.status.charAt(0) + card.status.slice(1).toLowerCase()}
        </span>
        {card.isBlocked && (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">Contact a bank employee to unblock</p>
        )}
      </div>
    </button>
  )
}

function BlockAction({ card, onBlock }) {
  const [blocking, setBlocking]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleBlock() {
    setBlocking(true)
    try {
      await cardService.blockCard(card.id)
      onBlock({ ...card, status: 'BLOCKED', isBlocked: true, isActive: false })
    } finally {
      setBlocking(false)
      setShowConfirm(false)
    }
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="text-xs tracking-widest uppercase text-amber-600 dark:text-amber-400 hover:text-amber-700 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-1.5 transition-colors"
      >
        Block Card
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 dark:text-slate-400">Block this card?</span>
      <button
        onClick={handleBlock}
        disabled={blocking}
        className="text-xs tracking-widest uppercase text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
      >
        {blocking ? 'Blocking…' : 'Confirm'}
      </button>
      <button
        onClick={() => setShowConfirm(false)}
        className="text-xs tracking-widest uppercase text-slate-400 hover:text-slate-600 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
