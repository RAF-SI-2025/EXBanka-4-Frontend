/**
 * Transfer service (mock)
 *
 * Replace the body of `createTransfer` with a real API call when backend is ready:
 *   POST /api/transfers
 */

import { clientAccountService } from './clientAccountService'

export const transferService = {
  async createTransfer({ fromAccountId, toAccountId, amount }) {
    await clientAccountService.applyTransfer({ fromAccountId, toAccountId, amount })
    return {
      id:            Math.floor(Math.random() * 100000),
      fromAccountId,
      toAccountId,
      amount,
      createdAt:     new Date().toISOString(),
    }
  },
}
