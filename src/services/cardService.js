import { clientApiClient } from './clientApiClient'
import { apiClient } from './apiClient'
import { cardFromApi } from '../models/Card'

// ── Client-facing calls ────────────────────────────────────────────────────────

export const cardService = {
  async getMyCards() {
    const { data } = await clientApiClient.get('/api/cards')
    return data.map(cardFromApi)
  },

  async requestCard({ accountNumber, authorizedPerson }) {
    const { data } = await clientApiClient.post('/api/cards/request', {
      accountNumber,
      ...(authorizedPerson && { authorizedPerson }),
    })
    return data // { requestId }
  },

  async confirmCardRequest(requestId, confirmationCode) {
    await clientApiClient.post('/api/cards/request/confirm', {
      requestId,
      confirmationCode,
    })
  },

  async blockCard(cardNumber) {
    await clientApiClient.put(`/api/cards/${cardNumber}/block`)
  },
}

// ── Employee-facing calls ──────────────────────────────────────────────────────

export const employeeCardService = {
  async getCardsByAccount(accountNumber) {
    const { data } = await apiClient.get(`/api/cards?accountNumber=${accountNumber}`)
    return data.map(cardFromApi)
  },

  async blockCard(cardNumber) {
    await apiClient.put(`/api/cards/${cardNumber}/block`)
  },

  async unblockCard(cardNumber) {
    await apiClient.put(`/api/cards/${cardNumber}/unblock`)
  },

  async deactivateCard(cardNumber) {
    await apiClient.put(`/api/cards/${cardNumber}/deactivate`)
  },

  async updateCardLimit(cardNumber, limit) {
    await apiClient.put(`/api/cards/${cardNumber}/limit`, { limit })
  },
}
