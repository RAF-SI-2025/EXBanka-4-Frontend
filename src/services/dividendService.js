import { apiClient } from './apiClient'
import { clientApiClient } from './clientApiClient'

export const dividendService = {
  async getMyDividends({ listingId, fromDate, toDate, page = 1, pageSize = 20 } = {}) {
    const url = listingId ? `/dividends/my/${listingId}` : '/dividends/my'
    const params = { page, page_size: pageSize }
    if (fromDate) params.from_date = fromDate
    if (toDate)   params.to_date   = toDate
    const { data } = await apiClient.get(url, { params })
    return data
  },
}

export const clientDividendService = {
  async getMyDividends({ listingId, fromDate, toDate, page = 1, pageSize = 20 } = {}) {
    const url = listingId ? `/dividends/my/${listingId}` : '/dividends/my'
    const params = { page, page_size: pageSize }
    if (fromDate) params.from_date = fromDate
    if (toDate)   params.to_date   = toDate
    const { data } = await clientApiClient.get(url, { params })
    return data
  },
}
