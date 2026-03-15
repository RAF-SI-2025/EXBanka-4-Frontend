import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useTheme } from '../context/ThemeContext'
import { useClientAuth } from '../context/ClientAuthContext'

// ─── Mock data (swap for real API calls later) ────────────────────────────────

const MOCK_ACCOUNT = {
  accountNumber: '265-0000000123456-78',
  availableBalance: 121_234.00,
  balance: 123_456.00,
  currency: 'RSD',
}

const MOCK_TRANSACTIONS = [
  { id: 1, description: 'Coffee Shop',      amount: -350,   date: '2026-03-14' },
  { id: 2, description: 'Salary',           amount:  85000, date: '2026-03-13' },
  { id: 3, description: 'Electricity bill', amount: -4200,  date: '2026-03-12' },
  { id: 4, description: 'Online purchase',  amount: -2800,  date: '2026-03-11' },
  { id: 5, description: 'ATM Withdrawal',   amount: -5000,  date: '2026-03-10' },
]

const MOCK_RECIPIENTS = [
  { id: 1, name: 'Ivan Petrović' },
  { id: 2, name: 'Ignjat Nikolić' },
  { id: 3, name: 'Andrija Jovanović' },
]

const EXCHANGE_RATE = 117.35

const NAV_ITEMS = [
  { label: 'Home',      href: '/client',           icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'Accounts',  href: '/client/accounts',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Payments',  href: '/client/payments',  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Transfers', href: '/client/transfers', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Exchange',  href: '/client/exchange',  icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { label: 'Cards',     href: '/client/cards',     icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Loans',     href: '/client/loans',     icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
]

function fmt(n) {
  return n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function ClientHomePage() {
  useWindowTitle('AnkaBanka')
  const { dark, toggle } = useTheme()
  const { clientUser, clientLogout } = useClientAuth()
  const navigate = useNavigate()
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [rsd, setRsd] = useState('')
  const [eur, setEur] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    const handleMouse = (e) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      setOffset({
        x: -((e.clientX - cx) / cx) * 45,
        y: -((e.clientY - cy) / cy) * 30,
      })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  async function handleLogout() {
    await clientLogout()
    navigate('/client')
  }

  function onRsdChange(e) {
    const v = e.target.value
    setRsd(v)
    setEur(v === '' ? '' : (parseFloat(v) / EXCHANGE_RATE).toFixed(2))
  }
  function onEurChange(e) {
    const v = e.target.value
    setEur(v)
    setRsd(v === '' ? '' : (parseFloat(v) * EXCHANGE_RATE).toFixed(2))
  }

  return (
    <div className={clientUser ? 'flex h-screen overflow-hidden bg-white dark:bg-slate-900' : 'min-h-screen flex flex-col bg-white dark:bg-slate-900'}>

      {/* Sidebar — logged-in only */}
      {clientUser && (
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} shrink-0 flex flex-col transition-all duration-300 overflow-hidden bg-slate-100 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800`}>
          {/* Hamburger */}
          <div className="flex items-center justify-center h-16 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-2"
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          {/* Nav items */}
          <nav className="flex-1 py-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-light transition-colors
                  ${item.href === '/client'
                    ? 'text-violet-700 dark:text-white bg-violet-100 dark:bg-violet-600/25 border-r-2 border-violet-500'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                <span className={`whitespace-nowrap transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* Right side: navbar + content */}
      <div className={clientUser ? 'flex-1 flex flex-col overflow-hidden' : 'flex flex-col flex-1'}>

      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex items-center justify-between py-5">
            <Link to="/client" className="flex items-center gap-3">
              <div className="w-7 h-7 border border-violet-500 dark:border-violet-400 flex items-center justify-center">
                <span className="text-violet-500 dark:text-violet-400 text-xs font-serif font-semibold">A</span>
              </div>
              <span className="text-slate-900 dark:text-white font-serif text-lg tracking-widest font-light">
                Anka<span className="text-violet-600 dark:text-violet-400">Banka</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {clientUser && (
                <span className="text-sm text-slate-500 dark:text-slate-400 font-light hidden sm:block">
                  Welcome back, <span className="text-slate-900 dark:text-white font-medium">{clientUser.firstName} {clientUser.lastName}</span>
                </span>
              )}
              <button
                onClick={toggle}
                aria-label="Toggle dark mode"
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                {dark ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {clientUser ? (
                <button
                  onClick={handleLogout}
                  className="px-5 py-2 border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 text-xs tracking-widest uppercase font-medium hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all duration-200"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/client/login"
                  className="px-5 py-2 border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 text-xs tracking-widest uppercase font-medium hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all duration-200"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-10 w-full">
        <div className="relative min-h-[520px]">

          {/* Blobs */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute w-[538px] h-[650px]"
              style={{
                top: '-10%', left: '10%',
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(18deg)`,
                transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                background: dark
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(126, 71, 255, 0.55) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(138, 92, 246, 0.65) 0%, transparent 70%)',
                filter: 'blur(64px)',
              }}
            />
            <div
              className="absolute w-[500px] h-[420px]"
              style={{
                top: '5%', left: '32%',
                transform: `translate(${offset.x * 0.75}px, ${offset.y * 0.75}px) rotate(6deg)`,
                transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                background: dark
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.5) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(244, 114, 182, 0.55) 0%, transparent 70%)',
                filter: 'blur(68px)',
              }}
            />
            <div
              className="absolute w-[700px] h-[375px]"
              style={{
                top: '30%', left: '45%',
                transform: `translate(${offset.x * 0.55}px, ${offset.y * 0.55}px) rotate(-12deg)`,
                transition: 'transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                background: dark
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(31, 132, 255, 0.7) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(96, 165, 250, 0.7) 0%, transparent 70%)',
                filter: 'blur(70px)',
              }}
            />
          </div>

          {/* Hero / Dashboard */}
          <section className="relative pt-8 pb-4">

            {clientUser ? (
              /* ── Logged-in dashboard ── */
              <>
                {/* Dashboard cards — grid-template-areas layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gridTemplateRows: 'auto auto',
                  gridTemplateAreas: `"balance      transactions"
                                      "quickpay     transactions"
                                      "quickpay     exchange"`,
                  gap: '1rem',
                }}>

                  {/* ① Balance — compact top-left */}
                  <div style={{ gridArea: 'balance' }} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-4">Balance</p>
                    <p className="font-serif text-3xl font-light text-slate-900 dark:text-white leading-none">
                      {fmt(MOCK_ACCOUNT.availableBalance)}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">{MOCK_ACCOUNT.currency} available</p>
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Total <span className="text-slate-600 dark:text-slate-300">{fmt(MOCK_ACCOUNT.balance)} RSD</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate" title={MOCK_ACCOUNT.accountNumber}>
                        {MOCK_ACCOUNT.accountNumber}
                      </p>
                    </div>
                  </div>

                  {/* ② Recent transactions — tall, spans both left rows */}
                  <div style={{ gridArea: 'transactions' }} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">Recent transactions</p>
                      <button className="text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors" title="Switch account">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-1">
                      {MOCK_TRANSACTIONS.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-light truncate">{tx.description}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{tx.date}</p>
                          </div>
                          <span className={`text-sm font-medium ml-4 shrink-0 ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{fmt(tx.amount)} RSD
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ③ Quick payment — below balance */}
                  <div style={{ gridArea: 'quickpay' }} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col">
                    <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-4">Quick payment</p>
                    <div className="flex-1 space-y-2">
                      {MOCK_RECIPIENTS.map((r) => (
                        <button
                          key={r.id}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/60 dark:hover:bg-violet-900/20 transition-all text-left"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <span className="text-xs text-slate-500 dark:text-slate-400">{r.name[0]}</span>
                          </div>
                          <span className="text-sm text-slate-700 dark:text-slate-300 font-light">{r.name}</span>
                        </button>
                      ))}
                    </div>
                    <button className="mt-3 w-full py-2 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs tracking-widest uppercase text-slate-400 hover:border-violet-400 hover:text-violet-500 dark:hover:border-violet-600 dark:hover:text-violet-400 transition-all">
                      + Add recipient
                    </button>
                  </div>

                  {/* ④ Exchange calculator — full width bottom row */}
                  <div style={{ gridArea: 'exchange' }} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500">Exchange calculator</p>
                      <span className="text-xs text-slate-400 dark:text-slate-500">1 EUR = {EXCHANGE_RATE} RSD</span>
                    </div>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <label className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">RSD</label>
                        <input type="number" value={rsd} onChange={onRsdChange} placeholder="0.00" className="input-field" />
                      </div>
                      <div className="pb-2 text-slate-300 dark:text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-1.5 block">EUR</label>
                        <input type="number" value={eur} onChange={onEurChange} placeholder="0.00" className="input-field" />
                      </div>
                      <button className="btn-primary shrink-0">Convert</button>
                    </div>
                  </div>

                </div>
              </>
            ) : (
              /* ── Logged-out landing ── */
              <>
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-slate-900 dark:text-white leading-tight mb-6">
                  AnkaBanka
                </h1>
                <div className="w-10 h-px bg-violet-500 dark:bg-violet-400 mb-8" />
                <p className="text-slate-500 dark:text-slate-400 text-lg font-light max-w-lg mb-10 leading-relaxed">
                  Access your accounts, view transactions, and manage your finances.
                </p>
                <Link to="/client/login" className="btn-primary">
                  Sign In
                </Link>
              </>
            )}
          </section>

        </div>
        </div> {/* end max-w-5xl centering wrapper */}
      </main>
      </div> {/* end right-side flex column */}
    </div>
  )
}
