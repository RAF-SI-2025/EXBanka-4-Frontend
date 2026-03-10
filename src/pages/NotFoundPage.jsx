import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center text-center px-6">
      <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-6">Error 404</p>
      <h1 className="font-serif text-8xl font-light text-slate-900 dark:text-white mb-4">404</h1>
      <div className="gold-divider" />
      <p className="text-slate-500 dark:text-slate-400 font-light mb-10">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary">
        Return to Home
      </Link>
    </div>
  )
}

export default NotFoundPage
