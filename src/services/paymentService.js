import { clientApiClient } from './clientApiClient'
import { paymentFromApi } from '../models/Payment'

function toPayment(p) {
  return paymentFromApi({
    id:               p.id,
    dateTime:         p.timestamp,
    fromAccount:      p.fromAccount,
    recipient:        p.recipient,
    recipientAccount: p.toAccount,
    amount:           p.finalAmount,
    fee:              p.fee,
    currency:         p.currency,
    status:           p.status?.toLowerCase(),
    reference:        p.referenceNumber,
    purpose:          p.purpose,
  })
}

export const paymentService = {
  async getPayments(filters = {}) {
    const params = {}
    if (filters.dateFrom)  params.date_from  = filters.dateFrom
    if (filters.dateTo)    params.date_to    = filters.dateTo
    if (filters.amountMin) params.amount_min = filters.amountMin
    if (filters.amountMax) params.amount_max = filters.amountMax
    if (filters.status)    params.status     = filters.status.toUpperCase()
    const { data } = await clientApiClient.get('/api/payments', { params })
    return data.map(toPayment)
  },

  async getPaymentById(id) {
    const { data } = await clientApiClient.get(`/api/payments/${id}`)
    return toPayment(data)
  },

  async createPayment({ fromAccount, recipientName, recipientAccount, amount, paymentCode, referenceNumber, purpose }) {
    const { data } = await clientApiClient.post('/api/payments/create', {
      fromAccount:      fromAccount.replace(/-/g, ''),
      recipientName,
      recipientAccount: recipientAccount.replace(/-/g, ''),
      amount,
      paymentCode,
      referenceNumber,
      purpose,
    })
    return data
  },
}
