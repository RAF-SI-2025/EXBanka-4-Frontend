export function fmt(n, currency) {
  if (n == null || isNaN(n)) return '—'
  const formatted = Number(n).toLocaleString('sr-RS', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currency ? `${formatted} ${currency}` : formatted
}

export function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return value
  return d.toLocaleDateString('en-GB')
}

export function fmtDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d)) return value
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const FUND_ERROR_MESSAGES = {
  invest: {
    400: 'Insufficient account balance or invalid amount.',
    401: 'You are not authorized to perform this action.',
    403: 'You do not have permission to invest in this fund.',
    404: 'Fund not found.',
    422: 'Investment conditions not met — check the amount and your account balance.',
  },
  withdraw: {
    400: 'Invalid request — check the amount.',
    401: 'You are not authorized to perform this action.',
    403: 'You do not have permission to withdraw from this fund.',
    404: 'Fund or position not found.',
    422: 'Insufficient fund units or invalid amount.',
  },
}

export function fundErrorMessage(e, operation = 'invest') {
  const status = e?.response?.status
  const serverMsg = e?.response?.data?.message ?? e?.response?.data?.error
  if (serverMsg) return serverMsg
  return FUND_ERROR_MESSAGES[operation]?.[status] ?? 'Operation failed. Please try again.'
}
