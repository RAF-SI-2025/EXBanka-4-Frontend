import { apiClient } from './apiClient'
import { listingFromApi } from '../models/Listing'

export const securitiesService = {
  /**
   * Fetch paginated list of listings.
   */
  async getListings({ type, exchange, ticker, name, page, pageSize, sortBy, sortOrder } = {}) {
    const params = {}
    if (type)       params.type        = type
    if (exchange)   params.exchange    = exchange
    if (ticker)     params.ticker      = ticker
    if (name)       params.name        = name
    if (page        != null) params.page       = page
    if (pageSize    != null) params.pageSize   = pageSize
    if (sortBy)     params.sortBy      = sortBy
    if (sortOrder)  params.sortOrder   = sortOrder
    const { data } = await apiClient.get('/securities', { params })
    return {
      ...data,
      items: (data.listings ?? data.items ?? data).map(listingFromApi),
    }
  },

  /**
   * Fetch full listing detail: summary, type-specific detail, and embedded 30-day history.
   * Returns { listing, detail, priceHistory }.
   */
  async getListing(id) {
    const { data } = await apiClient.get(`/securities/${id}`)
    return {
      listing:      listingFromApi(data.summary ?? data),
      detail:       data.detail ?? null,
      priceHistory: data.priceHistory ?? [],
    }
  },

  /**
   * @deprecated Use getListing() instead.
   */
  async getListingById(id) {
    const { data } = await apiClient.get(`/securities/${id}`)
    return listingFromApi(data.summary ?? data)
  },

  /**
   * Fetch daily price history for a listing within a date range.
   * @param {string} from - YYYY-MM-DD
   * @param {string} to   - YYYY-MM-DD
   */
  async getListingHistory(id, from, to) {
    const params = {}
    if (from) params.from = from
    if (to)   params.to   = to
    const { data } = await apiClient.get(`/securities/${id}/history`, { params })
    return data
  },

  async getStocks(opts = {}) {
    return this.getListings({ ...opts, type: 'STOCK' })
  },

  async getFutures(opts = {}) {
    return this.getListings({ ...opts, type: 'FUTURES_CONTRACT' })
  },

  async getForex(opts = {}) {
    return this.getListings({ ...opts, type: 'FOREX_PAIR' })
  },
}
