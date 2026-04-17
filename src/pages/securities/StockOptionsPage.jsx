import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { securitiesService } from '../../services/securitiesService'
import { fmt } from '../../utils/formatting'

const today = new Date()
today.setHours(0, 0, 0, 0)

function daysUntil(dateStr) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.round((d - today) / 86_400_000)
}

function OptionCell({ option }) {
  if (!option) {
    return (
      <>
        <td className="px-3 py-2 text-slate-300 dark:text-slate-600 text-center">—</td>
        <td className="px-3 py-2 text-slate-300 dark:text-slate-600 text-center">—</td>
        <td className="px-3 py-2 text-slate-300 dark:text-slate-600 text-center">—</td>
        <td className="px-3 py-2 text-slate-300 dark:text-slate-600 text-center">—</td>
        <td className="px-3 py-2 text-slate-300 dark:text-slate-600 text-center">—</td>
      </>
    )
  }
  const changeColor = option.changePercent >= 0
    ? 'text-emerald-600 dark:text-emerald-400'
    : 'text-red-500 dark:text-red-400'
  const approxChange = option.price * option.changePercent / 100

  return (
    <>
      <td className="px-3 py-2 tabular-nums text-center">{fmt(option.price)}</td>
      <td className={`px-3 py-2 tabular-nums text-center ${changeColor}`}>
        {approxChange >= 0 ? '+' : ''}{fmt(approxChange)}
      </td>
      <td className={`px-3 py-2 tabular-nums text-center ${changeColor}`}>
        {option.changePercent >= 0 ? '+' : ''}{option.changePercent.toFixed(2)}%
      </td>
      <td className="px-3 py-2 tabular-nums text-center">{fmt(option.volume)}</td>
      <td className="px-3 py-2 tabular-nums text-center">{option.openInterest.toLocaleString()}</td>
    </>
  )
}

export default function StockOptionsPage() {
  const { id } = useParams()
  const [stock, setStock]     = useState(null)
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const [selectedDate, setSelectedDate]     = useState(null)
  const [strikesCount, setStrikesCount]     = useState('')
  const [showITMOnly, setShowITMOnly]       = useState(false)
  const [showDateTable, setShowDateTable]   = useState(true)

  useWindowTitle(stock ? `${stock.ticker} Options | AnkaBanka` : 'Options | AnkaBanka')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    securitiesService.getStockOptions(id)
      .then(({ stock, options }) => {
        if (cancelled) return
        setStock(stock)
        setOptions(options)
      })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  // Sorted unique settlement dates
  const settlementDates = useMemo(() => {
    const set = new Set(options.map(o => o.settlementDate).filter(Boolean))
    return [...set].sort()
  }, [options])

  // Options for the selected date
  const optionsForDate = useMemo(() => {
    if (!selectedDate) return []
    return options.filter(o => o.settlementDate === selectedDate)
  }, [options, selectedDate])

  // Build strike → { call, put } map
  const byStrike = useMemo(() => {
    const map = {}
    for (const o of optionsForDate) {
      if (!map[o.strikePrice]) map[o.strikePrice] = { call: null, put: null }
      if (o.optionType === 'CALL') map[o.strikePrice].call = o
      else if (o.optionType === 'PUT') map[o.strikePrice].put = o
    }
    return map
  }, [optionsForDate])

  const stockPrice = stock?.price ?? 0

  // All strikes sorted ascending
  const allStrikes = useMemo(
    () => Object.keys(byStrike).map(Number).sort((a, b) => a - b),
    [byStrike],
  )

  // Filter strikes around current price
  const filteredStrikes = useMemo(() => {
    const n = parseInt(strikesCount, 10)
    if (!n || isNaN(n)) return allStrikes

    // Find index of strike closest to current price
    let closest = 0
    let minDiff = Infinity
    allStrikes.forEach((s, i) => {
      const diff = Math.abs(s - stockPrice)
      if (diff < minDiff) { minDiff = diff; closest = i }
    })
    return allStrikes.slice(Math.max(0, closest - n), closest + n + 1)
  }, [allStrikes, strikesCount, stockPrice])

  // Apply ITM filter
  const visibleStrikes = useMemo(() => {
    if (!showITMOnly) return filteredStrikes
    return filteredStrikes.filter(s => s < stockPrice || s > stockPrice)
  }, [filteredStrikes, showITMOnly, stockPrice])

  function selectDate(date) {
    setSelectedDate(date)
    setShowDateTable(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading options…</p>
      </div>
    )
  }

  if (error || !stock) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-red-500 text-sm">Failed to load options.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white">
              {stock.ticker} <span className="text-slate-400 dark:text-slate-500 text-2xl">Options</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {stock.name} · Current price: <span className="font-medium text-slate-700 dark:text-slate-300">{fmt(stockPrice)}</span>
            </p>
          </div>
          <Link to={`/securities/${id}`} className="text-sm text-violet-600 dark:text-violet-400 hover:underline mt-2">
            ← Back to {stock.ticker}
          </Link>
        </div>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />

        {/* Settlement date list */}
        {showDateTable && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">
                Settlement Dates
              </p>
            </div>
            {settlementDates.length === 0 ? (
              <p className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">No options available.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    {['Settlement Date', 'Days Until Expiry', ''].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {settlementDates.map((date, i) => {
                    const days = daysUntil(date)
                    return (
                      <tr
                        key={date}
                        className={`border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-violet-50 dark:hover:bg-violet-900/10 cursor-pointer transition-colors ${
                          i % 2 !== 0 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''
                        }`}
                        onClick={() => selectDate(date)}
                      >
                        <td className="px-6 py-3 font-mono text-slate-700 dark:text-slate-300">{date}</td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                          <span className={days <= 7 ? 'text-red-500' : days <= 30 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}>
                            {days} day{days !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-violet-600 dark:text-violet-400 text-right">
                          View options →
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Options table */}
        {selectedDate && (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Date selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium">
                  Settlement Date
                </label>
                <select
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="input-field text-sm py-1.5"
                >
                  {settlementDates.map(d => (
                    <option key={d} value={d}>{d} ({daysUntil(d)}d)</option>
                  ))}
                </select>
              </div>

              {/* Strike filter */}
              <div className="flex items-center gap-2">
                <label className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">
                  Strikes ±
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="All"
                  value={strikesCount}
                  onChange={e => setStrikesCount(e.target.value)}
                  className="input-field text-sm py-1.5 w-20"
                />
              </div>

              {/* ITM toggle */}
              <button
                onClick={() => setShowITMOnly(v => !v)}
                className={`px-4 py-1.5 text-xs tracking-widest uppercase font-medium rounded transition-colors ${
                  showITMOnly
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400'
                }`}
              >
                In The Money
              </button>

              {/* Back to date list */}
              <button
                onClick={() => setShowDateTable(v => !v)}
                className="ml-auto text-xs text-violet-600 dark:text-violet-400 hover:underline"
              >
                {showDateTable ? 'Hide' : 'Show'} date list
              </button>
            </div>

            {/* Shared Price banner */}
            <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-lg px-6 py-3 mb-4 flex items-center gap-3">
              <span className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 font-medium">Shared Price</span>
              <span className="text-lg font-semibold text-slate-900 dark:text-white">{fmt(stockPrice)}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">· Strikes below are ITM for Calls, above are ITM for Puts</span>
            </div>

            {/* Options table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      {/* Calls headers */}
                      <th colSpan={5} className="px-3 py-3 text-center text-xs tracking-widest uppercase text-emerald-600 dark:text-emerald-400 font-medium border-r border-slate-200 dark:border-slate-700">
                        Calls
                      </th>
                      {/* Strike */}
                      <th className="px-4 py-3 text-center text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 font-medium border-r border-slate-200 dark:border-slate-700">
                        Strike
                      </th>
                      {/* Puts headers */}
                      <th colSpan={5} className="px-3 py-3 text-center text-xs tracking-widest uppercase text-red-500 dark:text-red-400 font-medium">
                        Puts
                      </th>
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      {['Last', 'Change', '%Change', 'Vol', 'OI'].map(h => (
                        <th key={`c-${h}`} className="px-3 py-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">{h}</th>
                      ))}
                      <th className="px-4 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-x border-slate-200 dark:border-slate-700">
                        $ Price
                      </th>
                      {['Last', 'Change', '%Change', 'Vol', 'OI'].map(h => (
                        <th key={`p-${h}`} className="px-3 py-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleStrikes.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                          No options for this date.
                        </td>
                      </tr>
                    ) : (
                      visibleStrikes.map((strike, i) => {
                        const { call, put } = byStrike[strike] ?? {}
                        const isCallITM = strike < stockPrice
                        const isPutITM  = strike > stockPrice
                        const isATM     = strike === stockPrice

                        return (
                          <tr
                            key={strike}
                            className={`border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm ${
                              isATM ? 'bg-violet-50 dark:bg-violet-900/20' : ''
                            }`}
                          >
                            {/* Call cells */}
                            <td colSpan={5} className={`border-r border-slate-200 dark:border-slate-700 ${
                              isCallITM ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : ''
                            }`}>
                              <table className="w-full"><tbody><tr>
                                <OptionCell option={call} />
                              </tr></tbody></table>
                            </td>

                            {/* Strike price */}
                            <td className={`px-4 py-2 text-center font-semibold tabular-nums border-x border-slate-200 dark:border-slate-700 ${
                              isATM
                                ? 'text-violet-600 dark:text-violet-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {fmt(strike)}
                            </td>

                            {/* Put cells */}
                            <td colSpan={5} className={
                              isPutITM ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : ''
                            }>
                              <table className="w-full"><tbody><tr>
                                <OptionCell option={put} />
                              </tr></tbody></table>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {visibleStrikes.length > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
                  {visibleStrikes.length} strike{visibleStrikes.length !== 1 ? 's' : ''} shown
                  {strikesCount ? ` (±${strikesCount} around ${fmt(stockPrice)})` : ''}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  )
}
