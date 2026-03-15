import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useClientAuth } from '../context/ClientAuthContext'

const NAV_ITEMS = [
  { label: 'Home',      href: '/client',           icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { label: 'Accounts',  href: '/client/accounts',  icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Payments',  href: '/client/payments',  icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Transfers', href: '/client/transfers', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Exchange',  href: '/client/exchange',  icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
  { label: 'Cards',     href: '/client/cards',     icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { label: 'Loans',     href: '/client/loans',     icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
]

export default function ClientPortalLayout({ children }) {
  const { dark, toggle } = useTheme()
  const { clientUser, clientLogout } = useClientAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  async function handleLogout() {
    await clientLogout()
    navigate('/client')
  }

  const isActive = (href) =>
    href === '/client' ? location.pathname === '/client' : location.pathname.startsWith(href)

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-slate-900">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} shrink-0 flex flex-col transition-[width] duration-500 ease-in-out overflow-hidden bg-slate-100 dark:bg-slate-950 border-r border-slate-100 dark:border-slate-800`}>
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
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-light transition-colors
                ${isActive(item.href)
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

      {/* Right: navbar + content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between h-16 px-6">
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
              <button onClick={toggle} aria-label="Toggle dark mode" className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
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
              <button
                onClick={handleLogout}
                className="px-5 py-2 border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 text-xs tracking-widest uppercase font-medium hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
