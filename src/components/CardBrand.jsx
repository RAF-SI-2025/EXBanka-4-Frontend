/**
 * CardBrand
 * Displays a styled brand label for a card based on the card_name field.
 * Supports: VISA, MASTERCARD, DINACARD, AMERICAN_EXPRESS
 */

const BRANDS = {
  VISA: {
    label: 'VISA',
    className: 'bg-blue-600 text-white',
    style: { fontStyle: 'italic', letterSpacing: '0.05em' },
  },
  MASTERCARD: {
    label: 'MC',
    className: 'bg-gradient-to-r from-red-500 to-amber-400 text-white',
    style: {},
  },
  DINACARD: {
    label: 'DINA',
    className: 'bg-red-700 text-white',
    style: {},
  },
  AMERICAN_EXPRESS: {
    label: 'AMEX',
    className: 'bg-slate-700 text-white',
    style: {},
  },
}

export default function CardBrand({ brand, size = 'md' }) {
  const config = BRANDS[brand?.toUpperCase()]
  const sizeClass = size === 'sm' ? 'w-10 h-6 text-[10px]' : 'w-12 h-8 text-xs'

  if (!config) {
    return (
      <div className={`${sizeClass} rounded flex items-center justify-center bg-slate-100 dark:bg-slate-800`}>
        <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={`${sizeClass} rounded flex items-center justify-center font-bold shrink-0 ${config.className}`}
      style={config.style}
    >
      {config.label}
    </div>
  )
}
