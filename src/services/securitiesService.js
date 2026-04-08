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
    if (pageSize    != null) params.page_size  = pageSize
    if (sortBy)     params.sort_by     = sortBy
    if (sortOrder)  params.sort_order  = sortOrder
    const { data } = await apiClient.get('/securities', { params })
    return {
      ...data,
      items: (data.items ?? data).map(listingFromApi),
    }
  },

  /**
   * Fetch full listing detail including type-specific fields and 30-day history.
   */
  async getListingById(id) {
    const { data } = await apiClient.get(`/securities/${id}`)
    return listingFromApi(data)
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
}
