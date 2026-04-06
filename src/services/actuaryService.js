import { apiClient } from './apiClient'
import { actuaryInfoFromApi } from '../models/ActuaryInfo'

export const actuaryService = {
  /**
   * Fetch all agents with their actuary limit info.
   */
  async getActuaries() {
    const { data } = await apiClient.get('/api/actuaries')
    return data.map(actuaryInfoFromApi)
  },

  /**
   * Set a new spending limit for an agent.
   */
  async setAgentLimit(agentId, limit) {
    const { data } = await apiClient.put(`/api/actuaries/${agentId}/limit`, { limit })
    return data
  },

  /**
   * Reset an agent's usedLimit to 0 (limit stays unchanged).
   */
  async resetAgentUsedLimit(agentId) {
    const { data } = await apiClient.post(`/api/actuaries/${agentId}/reset-used-limit`)
    return data
  },

  /**
   * Set whether an agent's transactions require supervisor approval.
   */
  async setNeedApproval(agentId, needApproval) {
    const { data } = await apiClient.put(`/api/actuaries/${agentId}/need-approval`, { need_approval: needApproval })
    return data
  },
}
