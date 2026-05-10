import { clientApiClient } from './clientApiClient'
import { listingFromApi } from '../models/Listing'

export const clientSecuritiesService = {
  async getListings({ type, exchange, ticker, name, page, pageSize, sortBy, sortOrder } = {}) {
    const params = {}
    if (type)       params.type      = type
    if (exchange)   params.exchange  = exchange
    if (ticker)     params.ticker    = ticker
    if (name)       params.name      = name
    if (page        != null) params.page     = page
    if (pageSize    != null) params.pageSize = pageSize
    if (sortBy)     params.sortBy    = sortBy
    if (sortOrder)  params.sortOrder = sortOrder
    const { data } = await clientApiClient.get('/securities', { params })
    return {
      ...data,
      items: (data.listings ?? data.items ?? data).map(listingFromApi),
    }
  },

  async getListing(id) {
    const { data } = await clientApiClient.get(`/securities/${id}`)
    return {
      listing:      listingFromApi(data.summary ?? data),
      detail:       data.detail ?? null,
      priceHistory: data.priceHistory ?? [],
    }
  },

  async getListingHistory(id, from, to) {
    const params = {}
    if (from) params.from = from
    if (to)   params.to   = to
    const { data } = await clientApiClient.get(`/securities/${id}/history`, { params })
    return data
  },

  async getStocks(opts = {}) {
    return this.getListings({ ...opts, type: 'STOCK' })
  },

  async getFutures(opts = {}) {
    return this.getListings({ ...opts, type: 'FUTURES_CONTRACT' })
  },
}
