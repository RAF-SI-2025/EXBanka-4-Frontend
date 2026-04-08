/**
 * ActuaryInfo model
 *
 * Represents actuary-specific data for an employee who is an agent or supervisor.
 */
export class ActuaryInfo {
  constructor({
    employeeId,   // number  — links to Employee.id
    limit,        // number  — spending limit in RSD (null for supervisors)
    usedLimit,    // number  — amount used so far in RSD
    needApproval, // boolean — whether transactions require supervisor approval
  }) {
    this.employeeId   = employeeId
    this.limit        = limit
    this.usedLimit    = usedLimit
    this.needApproval = needApproval
  }
}

/**
 * Creates an ActuaryInfo instance from a raw API response object.
 */
export function actuaryInfoFromApi(data) {
  return new ActuaryInfo({
    employeeId:   data.employee_id ?? data.employeeId,
    limit:        data.limit,
    usedLimit:    data.used_limit  ?? data.usedLimit,
    needApproval: data.need_approval ?? data.needApproval,
  })
}
