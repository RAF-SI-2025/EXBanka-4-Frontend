export class Payment {
  constructor({
    id,
    dateTime,
    fromAccount,
    recipient,
    recipientAccount,
    amount,
    fee,
    currency,
    status,
    reference,
    purpose,
  }) {
    this.id               = id
    this.dateTime         = dateTime
    this.fromAccount      = fromAccount
    this.recipient        = recipient
    this.recipientAccount = recipientAccount
    this.amount           = amount           ?? 0
    this.fee              = fee              ?? 0
    this.currency         = currency         ?? 'RSD'
    // 'completed' | 'pending' | 'processing' | 'failed'
    this.status           = status           ?? 'pending'
    this.reference        = reference
    this.purpose          = purpose          ?? ''
  }

  get isCredit() {
    return this.amount > 0
  }
}

export function paymentFromApi(data) {
  return new Payment({
    id:               data.id,
    dateTime:         data.dateTime       ?? data.date_time,
    fromAccount:      data.fromAccount,
    recipient:        data.recipient,
    recipientAccount: data.recipientAccount ?? data.recipient_account,
    amount:           data.amount,
    fee:              data.fee,
    currency:         data.currency,
    status:           data.status,
    reference:        data.reference,
    purpose:          data.purpose,
  })
}

// ─── Status helpers ────────────────────────────────────────────────────────────

export const PAYMENT_STATUSES = ['completed', 'pending', 'processing', 'failed']

export const PAYMENT_STATUS_STYLES = {
  completed:  'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  pending:    'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  processing: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  failed:     'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400',
}
