import { apiClient } from './apiClient'
import { clientApiClient } from './clientApiClient'

export const watchlistService = {
  async createWatchlist(name) {
    const { data } = await apiClient.post('/watchlists', { name })
    return data
  },
  async listWatchlists() {
    const { data } = await apiClient.get('/watchlists')
    return data
  },
  async deleteWatchlist(id) {
    const { data } = await apiClient.delete(`/watchlists/${id}`)
    return data
  },
  async addItem(watchlistId, listingId) {
    const { data } = await apiClient.post(`/watchlists/${watchlistId}/items`, { listing_id: listingId })
    return data
  },
  async removeItem(watchlistId, listingId) {
    const { data } = await apiClient.delete(`/watchlists/${watchlistId}/items/${listingId}`)
    return data
  },
  async getItems(watchlistId) {
    const { data } = await apiClient.get(`/watchlists/${watchlistId}/items`)
    return data
  },
  async getQuick() {
    const { data } = await apiClient.get('/watchlists/quick')
    return data
  },
}

export const clientWatchlistService = {
  async createWatchlist(name) {
    const { data } = await clientApiClient.post('/watchlists', { name })
    return data
  },
  async listWatchlists() {
    const { data } = await clientApiClient.get('/watchlists')
    return data
  },
  async deleteWatchlist(id) {
    const { data } = await clientApiClient.delete(`/watchlists/${id}`)
    return data
  },
  async addItem(watchlistId, listingId) {
    const { data } = await clientApiClient.post(`/watchlists/${watchlistId}/items`, { listing_id: listingId })
    return data
  },
  async removeItem(watchlistId, listingId) {
    const { data } = await clientApiClient.delete(`/watchlists/${watchlistId}/items/${listingId}`)
    return data
  },
  async getItems(watchlistId) {
    const { data } = await clientApiClient.get(`/watchlists/${watchlistId}/items`)
    return data
  },
  async getQuick() {
    const { data } = await clientApiClient.get('/watchlists/quick')
    return data
  },
}
