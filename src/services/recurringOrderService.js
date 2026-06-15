import { apiClient } from './apiClient'
import { clientApiClient } from './clientApiClient'

export const recurringOrderService = {
  async create({ assetId, direction, mode, value, accountId, cadence }) {
    const { data } = await apiClient.post('/recurring-orders', {
      asset_id: assetId,
      direction,
      mode,
      value,
      account_id: accountId,
      cadence,
    })
    return data
  },
  async list() {
    const { data } = await apiClient.get('/recurring-orders')
    return data
  },
  async pause(id) {
    const { data } = await apiClient.put(`/recurring-orders/${id}/pause`)
    return data
  },
  async resume(id) {
    const { data } = await apiClient.put(`/recurring-orders/${id}/resume`)
    return data
  },
  async cancel(id) {
    const { data } = await apiClient.delete(`/recurring-orders/${id}`)
    return data
  },
}

export const clientRecurringOrderService = {
  async create({ assetId, direction, mode, value, accountId, cadence }) {
    const { data } = await clientApiClient.post('/recurring-orders', {
      asset_id: assetId,
      direction,
      mode,
      value,
      account_id: accountId,
      cadence,
    })
    return data
  },
  async list() {
    const { data } = await clientApiClient.get('/recurring-orders')
    return data
  },
  async pause(id) {
    const { data } = await clientApiClient.put(`/recurring-orders/${id}/pause`)
    return data
  },
  async resume(id) {
    const { data } = await clientApiClient.put(`/recurring-orders/${id}/resume`)
    return data
  },
  async cancel(id) {
    const { data } = await clientApiClient.delete(`/recurring-orders/${id}`)
    return data
  },
}
