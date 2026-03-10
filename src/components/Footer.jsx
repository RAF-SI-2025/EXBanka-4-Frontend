import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6 max-w-7xl py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Links */}
          <div className="flex items-center gap-8">
            {['Home', 'Login'].map((label) => (
              <Link
                key={label}
                to={label === 'Home' ? '/' : `/${label.toLowerCase()}`}
                className="text-xs tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-slate-500 dark:text-slate-400 text-xs tracking-wide">
            &copy; {new Date().getFullYear()} AnkaBanka
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
