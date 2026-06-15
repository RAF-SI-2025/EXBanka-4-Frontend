import { apiClient } from './apiClient'
import { clientApiClient } from './clientApiClient'

export const priceAlertService = {
  async create({ listingId, condition, threshold, notificationType = 'BOTH' }) {
    const { data } = await apiClient.post('/price-alerts', {
      listing_id: listingId,
      condition,
      threshold,
      notification_type: notificationType,
    })
    return data
  },
  async list() {
    const { data } = await apiClient.get('/price-alerts')
    return data
  },
  async delete(id) {
    const { data } = await apiClient.delete(`/price-alerts/${id}`)
    return data
  },
}

export const clientPriceAlertService = {
  async create({ listingId, condition, threshold, notificationType = 'BOTH' }) {
    const { data } = await clientApiClient.post('/price-alerts', {
      listing_id: listingId,
      condition,
      threshold,
      notification_type: notificationType,
    })
    return data
  },
  async list() {
    const { data } = await clientApiClient.get('/price-alerts')
    return data
  },
  async delete(id) {
    const { data } = await clientApiClient.delete(`/price-alerts/${id}`)
    return data
  },
}
