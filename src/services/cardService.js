import { clientApiClient } from './clientApiClient'
import { apiClient } from './apiClient'
import { cardFromApi } from '../models/Card'

// ── Client-facing calls ────────────────────────────────────────────────────────

export const cardService = {
  async getMyCards() {
    const { data } = await clientApiClient.get('/api/cards')
    return data.map(cardFromApi)
  },

  async getCardById(id) {
    const { data } = await clientApiClient.get(`/api/cards/id/${id}`)
    return cardFromApi(data)
  },

  async requestCard({ accountNumber, cardName, forSelf, authorizedPerson }) {
    const { data } = await clientApiClient.post('/api/cards/request', {
      accountNumber,
      cardName,
      forSelf,
      ...(authorizedPerson && { authorizedPerson }),
    })
    return data // { requestToken }
  },

  async confirmCardRequest(requestToken, code) {
    await clientApiClient.post('/api/cards/request/confirm', {
      requestToken,
      code,
    })
  },

  async blockCard(cardId) {
    await clientApiClient.put(`/api/cards/${cardId}/block`)
  },
}

// ── Employee-facing calls ──────────────────────────────────────────────────────

export const employeeCardService = {
  async getCardsByAccount(accountNumber) {
    const { data } = await apiClient.get(`/api/cards/by-account/${accountNumber}`)
    return data.map(cardFromApi)
  },

  async getCardById(id) {
    const { data } = await apiClient.get(`/api/cards/id/${id}`)
    return cardFromApi(data)
  },

  async blockCard(cardId) {
    await apiClient.put(`/api/cards/${cardId}/block`)
  },

  async unblockCard(cardId) {
    await apiClient.put(`/api/cards/${cardId}/unblock`)
  },

  async deactivateCard(cardId) {
    await apiClient.put(`/api/cards/${cardId}/deactivate`)
  },

  async updateCardLimit(cardId, limit) {
    await apiClient.put(`/api/cards/${cardId}/limit`, { newLimit: limit })
  },
}
