import { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const linkClass = ({ isActive }) =>
    `relative text-xs tracking-widest uppercase font-medium pb-1 transition-colors duration-150 ${
      isActive
        ? 'text-violet-600 dark:text-violet-400 after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-violet-600 dark:after:bg-violet-400'
        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
    }`

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between py-5">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-7 h-7 border border-violet-500 dark:border-violet-400 flex items-center justify-center">
              <span className="text-violet-500 dark:text-violet-400 text-xs font-serif font-semibold">A</span>
            </div>
            <span className="text-slate-900 dark:text-white font-serif text-lg tracking-widest font-light">
              Anka<span className="text-violet-600 dark:text-violet-400">Banka</span>
            </span>
          </NavLink>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" className={linkClass} end>Home</NavLink>
            {user?.permissions?.canManageEmployees && (
              <NavLink to="/admin/employees" className={linkClass}>Employees</NavLink>
            )}
            {user?.permissions?.canViewClients && (
              <NavLink to="/admin/clients" className={linkClass}>Clients</NavLink>
            )}
            {user?.permissions?.canViewClients && (
              <NavLink to="/admin/accounts" className={linkClass}>Accounts</NavLink>
            )}
            {user?.permissions?.isAdmin && (
              <NavLink to="/admin/bank-accounts" className={linkClass}>Bank Accounts</NavLink>
            )}
            {user?.permissions?.canApproveLoans && (
              <NavLink to="/admin/loans/applications" className={linkClass}>Loan Applications</NavLink>
            )}
            {user?.permissions?.canApproveLoans && (
              <NavLink to="/admin/loans" className={linkClass}>Loans</NavLink>
            )}
            {user?.permissions?.isSupervisor && (
              <NavLink to="/admin/actuaries" className={linkClass}>Actuaries</NavLink>
            )}
            {(user?.permissions?.isAgent || user?.permissions?.isSupervisor) && (
              <NavLink to="/admin/stock-exchanges" className={linkClass}>Stock Exchanges</NavLink>
            )}
            {(user?.permissions?.isAgent || user?.permissions?.isSupervisor) && (
              <NavLink to="/securities" className={linkClass}>Securities</NavLink>
            )}
            {user?.permissions?.isSupervisor && (
              <NavLink to="/admin/orders" className={linkClass}>Orders</NavLink>
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
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
            {user ? (
              <button
                onClick={handleLogout}
                className="px-5 py-2 border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 text-xs tracking-widest uppercase font-medium hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all duration-200"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="px-5 py-2 border border-violet-600 dark:border-violet-400 text-violet-600 dark:text-violet-400 text-xs tracking-widest uppercase font-medium hover:bg-violet-600 dark:hover:bg-violet-500 hover:text-white transition-all duration-200"
              >
                Employee Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            onClick={() => setMenuOpen((p) => !p)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-800 py-4 flex flex-col gap-4">
            <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>Home</NavLink>
            {user?.permissions?.canManageEmployees && (
              <NavLink to="/admin/employees" className={linkClass} onClick={() => setMenuOpen(false)}>Employees</NavLink>
            )}
            {user?.permissions?.canViewClients && (
              <NavLink to="/admin/clients" className={linkClass} onClick={() => setMenuOpen(false)}>Clients</NavLink>
            )}
            {user?.permissions?.canViewClients && (
              <NavLink to="/admin/accounts" className={linkClass} onClick={() => setMenuOpen(false)}>Accounts</NavLink>
            )}
            {user?.permissions?.isAdmin && (
              <NavLink to="/admin/bank-accounts" className={linkClass} onClick={() => setMenuOpen(false)}>Bank Accounts</NavLink>
            )}
            {user?.permissions?.canApproveLoans && (
              <NavLink to="/admin/loans/applications" className={linkClass} onClick={() => setMenuOpen(false)}>Loan Applications</NavLink>
            )}
            {user?.permissions?.canApproveLoans && (
              <NavLink to="/admin/loans" className={linkClass} onClick={() => setMenuOpen(false)}>Loans</NavLink>
            )}
            {user?.permissions?.isSupervisor && (
              <NavLink to="/admin/actuaries" className={linkClass} onClick={() => setMenuOpen(false)}>Actuaries</NavLink>
            )}
            {(user?.permissions?.isAgent || user?.permissions?.isSupervisor) && (
              <NavLink to="/admin/stock-exchanges" className={linkClass} onClick={() => setMenuOpen(false)}>Stock Exchanges</NavLink>
            )}
            {(user?.permissions?.isAgent || user?.permissions?.isSupervisor) && (
              <NavLink to="/securities" className={linkClass} onClick={() => setMenuOpen(false)}>Securities</NavLink>
            )}
            {user?.permissions?.isSupervisor && (
              <NavLink to="/admin/orders" className={linkClass} onClick={() => setMenuOpen(false)}>Orders</NavLink>
            )}
            <div className="flex items-center gap-4">
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
              {user ? (
                <button
                  onClick={handleLogout}
                  className="text-xs tracking-widest uppercase font-medium text-violet-600 dark:text-violet-400"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  className="text-xs tracking-widest uppercase font-medium text-violet-600 dark:text-violet-400"
                  onClick={() => setMenuOpen(false)}
                >
                  Employee Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
