import { apiClient } from './apiClient'
import { clientApiClient } from './clientApiClient'

export const orderService = {
  /**
   * Place a new order.
   */
  async createOrder({ assetId, quantity, direction, limitValue, stopValue, isAon, isMargin, accountId }) {
    const { data } = await apiClient.post('/orders', {
      assetId,
      quantity,
      direction,
      limitValue,
      stopValue,
      isAon,
      isMargin,
      accountId,
    })
    return data
  },

  async createClientOrder({ assetId, quantity, direction, limitValue, stopValue, isAon, isMargin, accountId }) {
    const { data } = await clientApiClient.post('/client/orders', {
      assetId, quantity, direction, limitValue, stopValue, isAon, isMargin, accountId,
    })
    return data
  },

  /**
   * Fetch a list of orders with optional filters.
   */
  async getOrders({ status, assetId, page, pageSize } = {}) {
    const params = {}
    if (status)       params.status    = status
    if (assetId)      params.asset_id  = assetId
    if (page     != null) params.page      = page
    if (pageSize != null) params.page_size = pageSize
    const { data } = await apiClient.get('/orders', { params })
    return data
  },

  /**
   * Fetch a single order by ID.
   */
  async getOrderById(id) {
    const { data } = await apiClient.get(`/orders/${id}`)
    return data
  },

  /**
   * Approve a pending order (supervisor action).
   */
  async approveOrder(id) {
    const { data } = await apiClient.put(`/orders/${id}/approve`)
    return data
  },

  /**
   * Decline a pending order (supervisor action).
   */
  async declineOrder(id) {
    const { data } = await apiClient.put(`/orders/${id}/decline`)
    return data
  },

  /**
   * Cancel an active order.
   */
  async cancelOrder(id) {
    const { data } = await apiClient.delete(`/orders/${id}`)
    return data
  },

  /**
   * Cancel remaining unfilled portions of an order.
   */
  async cancelOrderPortions(id) {
    const { data } = await apiClient.delete(`/orders/${id}/portions`)
    return data
  },
}
