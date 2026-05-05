import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/',
    exact: true,
    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
    show: () => true,
  },
  {
    label: 'Employees',
    href: '/admin/employees',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    show: (p) => p?.canManageEmployees,
  },
  {
    label: 'Clients',
    href: '/admin/clients',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    show: (p) => p?.canViewClients,
  },
  {
    label: 'Accounts',
    href: '/admin/accounts',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    show: (p) => p?.canViewClients,
  },
  {
    label: 'Bank Accounts',
    href: '/admin/bank-accounts',
    icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
    show: (p) => p?.isAdmin,
  },
  {
    label: 'Loan Applications',
    href: '/admin/loans/applications',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    show: (p) => p?.canApproveLoans,
  },
  {
    label: 'Loans',
    href: '/admin/loans',
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    show: (p) => p?.canApproveLoans,
  },
  {
    label: 'Actuaries',
    href: '/admin/actuaries',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    show: (p) => p?.isSupervisor,
  },
  {
    label: 'Stock Exchanges',
    href: '/admin/stock-exchanges',
    icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9',
    show: (p) => p?.isAgent || p?.isSupervisor,
  },
  {
    label: 'Securities',
    href: '/securities',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    show: (p) => p?.isAgent || p?.isSupervisor,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    show: (p) => p?.isSupervisor,
  },
  {
    label: 'Portfolio',
    href: '/portfolio',
    icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    show: (p) => p?.isAgent || p?.isSupervisor,
  },
  {
    label: 'Tax',
    href: '/admin/tax',
    icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    show: (p) => p?.isSupervisor || p?.isAdmin,
  },
  {
    label: 'OTC Trading',
    href: '/otc/negotiations',
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    show: (p) => p?.isAgent || p?.isSupervisor || p?.isAdmin,
  },
  {
    label: 'Investment Funds',
    href: '/investment/funds',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    show: () => true,
  },
]

export default function EmployeePortalLayout() {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  function handleLogout() {
    logout()
    navigate('/')
  }

  const isActive = (href, exact) =>
    exact ? location.pathname === href : location.pathname.startsWith(href)

  const visibleItems = NAV_ITEMS.filter(item => item.show(user?.permissions))

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
        <nav className="flex-1 py-4 overflow-y-auto">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              title={!sidebarOpen ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-light transition-colors
                ${isActive(item.href, item.exact)
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

      {/* Right: topbar + content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between h-16 px-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-7 h-7 border border-violet-500 dark:border-violet-400 flex items-center justify-center">
                <span className="text-violet-500 dark:text-violet-400 text-xs font-serif font-semibold">A</span>
              </div>
              <span className="text-slate-900 dark:text-white font-serif text-lg tracking-widest font-light">
                Anka<span className="text-violet-600 dark:text-violet-400">Banka</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm text-slate-500 dark:text-slate-400 font-light hidden sm:block">
                  Welcome back, <span className="text-slate-900 dark:text-white font-medium">{user.firstName} {user.lastName}</span>
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

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
