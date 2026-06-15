import { apiClient } from './apiClient'

export const auditService = {
  async getAuditLogs({ action, actorId, fromDate, toDate, page = 1, pageSize = 20 } = {}) {
    const params = { page, page_size: pageSize }
    if (action)  params.action   = action
    if (actorId) params.actor_id = actorId
    if (fromDate) params.from_date = fromDate
    if (toDate)   params.to_date   = toDate
    const { data } = await apiClient.get('/audit-logs', { params })
    return data
  },
}
