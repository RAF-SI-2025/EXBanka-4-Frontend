import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ApiErrorContext = createContext(null)

let nextId = 0

export function ApiErrorProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((status, message) => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, status, message }])
    timers.current[id] = setTimeout(() => dismiss(id), 5000)
  }, [dismiss])

  useEffect(() => {
    function handleApiError(e) {
      addToast(e.detail.status, e.detail.message)
    }
    window.addEventListener('api:error', handleApiError)
    return () => window.removeEventListener('api:error', handleApiError)
  }, [addToast])

  // Clear all timers on unmount
  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout)
  }, [])

  return (
    <ApiErrorContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 w-80 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 shadow-lg px-4 py-3"
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                Error {toast.status}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-light mt-0.5">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ApiErrorContext.Provider>
  )
}

export function useApiError() {
  return useContext(ApiErrorContext)
}
