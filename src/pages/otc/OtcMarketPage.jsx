import useWindowTitle from '../../hooks/useWindowTitle'

export default function OtcMarketPage() {
  useWindowTitle('OTC Market | AnkaBanka')
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-4">Employee Portal</p>
        <h1 className="font-serif text-4xl font-light text-slate-900 dark:text-white mb-3">OTC Market</h1>
        <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Coming soon.</p>
      </div>
    </div>
  )
}
