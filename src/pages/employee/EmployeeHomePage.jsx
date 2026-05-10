import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar'
import { NAV_ITEMS } from '../../layouts/EmployeePortalLayout'

const PERMISSION_META = {
  isAdmin: {
    label: 'Administrator',
    description: 'Full system access with all privileges across every module.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    accent: 'amber',
  },
  canViewClients: {
    label: 'View Clients',
    description: 'Browse and search client profiles and account summaries.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-4.5 0 2.625 2.625 0 014.5 0z" />
      </svg>
    ),
    accent: 'violet',
  },
  canCreateAccounts: {
    label: 'Create Accounts',
    description: 'Open new bank accounts and configure account settings.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: 'violet',
  },
  canApproveLoans: {
    label: 'Approve Loans',
    description: 'Review and approve or reject loan applications.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    accent: 'violet',
  },
  canProcessTransactions: {
    label: 'Process Transactions',
    description: 'Execute transfers, payments, and other financial transactions.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    accent: 'violet',
  },
  canManageEmployees: {
    label: 'Manage Employees',
    description: 'Add, edit, and manage employee records and permissions.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    accent: 'violet',
  },
  canViewReports: {
    label: 'View Reports',
    description: 'Access financial and operational reports and analytics.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    accent: 'violet',
  },
}

const ACCENT = {
  amber:  'border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  violet: 'border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
}

function EmployeeHomePage() {
  useWindowTitle('AnkaBanka — Employee Portal')
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (user) return
    const handleMouse = (e) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      setOffset({ x: -((e.clientX - cx) / cx) * 45, y: -((e.clientY - cy) / cy) * 30 })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [user])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const isActive = (href, exact) =>
    exact ? location.pathname === href : location.pathname.startsWith(href)

  const visibleItems = NAV_ITEMS.filter(item => item.show(user?.permissions))

  const grantedPermissions = user
    ? Object.entries(user.permissions).filter(([, granted]) => granted)
    : []

  // ── Logged-in: full sidebar layout ──────────────────────────────────────────
  if (user) {
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
                <span className="text-sm text-slate-500 dark:text-slate-400 font-light hidden sm:block">
                  Welcome back, <span className="text-slate-900 dark:text-white font-medium">{user.firstName} {user.lastName}</span>
                </span>
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

          <main className="flex-1 overflow-auto">
            <div className="max-w-5xl mx-auto px-6 py-10 w-full">
              <p className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-6">
                Your access
              </p>
              {grantedPermissions.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  You have no permissions assigned. Contact an administrator.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grantedPermissions.map(([key]) => {
                    const meta = PERMISSION_META[key]
                    if (!meta) return null
                    const accentClass = ACCENT[meta.accent]
                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-5 flex gap-4 items-start ${accentClass}`}
                      >
                        <div className="mt-0.5 shrink-0">{meta.icon}</div>
                        <div>
                          <p className="text-sm font-semibold tracking-wide mb-1">{meta.label}</p>
                          <p className="text-xs font-light leading-relaxed opacity-80">{meta.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    )
  }

  // ── Logged-out: landing page ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <Navbar />
      <main className="flex-1 container mx-auto px-6 py-16 max-w-7xl">
        <div className="relative min-h-[680px] space-y-20">

          {/* Blobs */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div
              className="absolute w-[538px] h-[650px]"
              style={{
                top: '-10%', left: '10%',
                transform: `translate(${offset.x}px, ${offset.y}px) rotate(18deg)`,
                transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                background: dark
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(126, 71, 255, 0.75) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(138, 92, 246, 0.87) 0%, transparent 70%)',
                filter: 'blur(64px)',
              }}
            />
            <div
              className="absolute w-[700px] h-[375px]"
              style={{
                top: '48px', left: '30%',
                transform: `translate(${offset.x * 0.55}px, ${offset.y * 0.55}px) rotate(-12deg)`,
                transition: 'transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                background: dark
                  ? 'radial-gradient(ellipse at 50% 50%, rgba(31, 132, 255, 0.9) 0%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 50%, rgba(96, 165, 250, 0.88) 0%, transparent 70%)',
                filter: 'blur(70px)',
              }}
            />
          </div>

          {/* Hero */}
          <section className="relative pt-8 pb-4">
            <p className="section-label mb-6">Employee Portal</p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-slate-900 dark:text-white leading-tight mb-6">
              AnkaBanka Internal
            </h1>
            <div className="gold-divider mx-0" />
            <p className="text-slate-500 dark:text-slate-400 text-lg font-light max-w-lg mb-10 leading-relaxed">
              Internal tools and systems for AnkaBanka staff. Sign in with your employee credentials to continue.
            </p>
            <Link to="/login" className="btn-primary">
              Employee Login
            </Link>
          </section>

        </div>
      </main>
    </div>
  )
}

export default EmployeeHomePage
