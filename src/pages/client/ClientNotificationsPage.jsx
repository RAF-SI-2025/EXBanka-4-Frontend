import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import useWindowTitle from '../../hooks/useWindowTitle'
import { clientNotificationService } from '../../services/clientNotificationService'

const PAGE_SIZE = 15

const TYPE_ICONS = {
  PAYMENT:      'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
  CARD_BLOCKED: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  LOAN_APPROVED:'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  ORDER_DONE:   'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  PRICE_ALERT:  'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  DEFAULT:      'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
}

function iconPath(type) {
  return TYPE_ICONS[type] ?? TYPE_ICONS.DEFAULT
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function ClientNotificationsPage() {
  useWindowTitle('Notifications | AnkaBanka')

  const [notifications, setNotifications] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p, unread) => {
    setLoading(true)
    try {
      const data = await clientNotificationService.getNotifications({
        unreadOnly: unread,
        page: p,
        pageSize: PAGE_SIZE,
      })
      const list = Array.isArray(data?.notifications) ? data.notifications : []
      setNotifications(list)
      if (data.total_pages) setTotalPages(data.total_pages)
      else setTotalPages(list.length < PAGE_SIZE ? p : p + 1)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(page, unreadOnly)
  }, [page, unreadOnly, load])

  async function handleMarkRead(id) {
    try {
      await clientNotificationService.markRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
    } catch {
      // silent
    }
  }

  async function handleMarkAll() {
    try {
      await clientNotificationService.markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch {
      // silent
    }
  }

  function handleFilterChange(unread) {
    setUnreadOnly(unread)
    setPage(1)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-6">
      <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/client" className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 mb-3 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
            Back
          </Link>
          <p className="text-xs tracking-widest uppercase text-violet-600 dark:text-violet-400 mb-1">Inbox</p>
          <h1 className="font-serif text-3xl font-light text-slate-900 dark:text-white">Notifications</h1>
        </div>
        <button
          onClick={handleMarkAll}
          className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-900 rounded-lg p-1 w-fit">
        {[{ label: 'All', value: false }, { label: 'Unread', value: true }].map(({ label, value }) => (
          <button
            key={label}
            onClick={() => handleFilterChange(value)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              unreadOnly === value
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-4 p-4 rounded-xl border transition-colors ${
                n.is_read
                  ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  : 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30'
              }`}
            >
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                n.is_read ? 'bg-slate-100 dark:bg-slate-800' : 'bg-violet-100 dark:bg-violet-800/30'
              }`}>
                <svg className={`w-4 h-4 ${n.is_read ? 'text-slate-400' : 'text-violet-600 dark:text-violet-400'}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={iconPath(n.type)} />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium leading-tight ${
                    n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                  }`}>
                    {n.title}
                  </p>
                  <span className="shrink-0 text-[10px] text-slate-400 mt-0.5">{timeAgo(n.created_at)}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{n.message}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="shrink-0 self-start text-[10px] text-violet-600 dark:text-violet-400 hover:underline mt-0.5"
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:border-violet-400 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:border-violet-400 transition-colors"
          >
            Next
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
