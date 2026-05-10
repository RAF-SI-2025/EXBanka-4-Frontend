/**
 * ActuaryInfo model
 *
 * Represents actuary-specific data for an employee who is an agent or supervisor.
 */
export class ActuaryInfo {
  constructor({
    employeeId,   // number  — links to Employee.id
    firstName,    // string
    lastName,     // string
    email,        // string
    position,     // string
    limit,        // number  — spending limit in RSD (null for supervisors)
    usedLimit,    // number  — amount used so far in RSD
    needApproval, // boolean — whether transactions require supervisor approval
  }) {
    this.employeeId   = employeeId
    this.firstName    = firstName ?? ''
    this.lastName     = lastName  ?? ''
    this.email        = email     ?? ''
    this.position     = position  ?? ''
    this.limit        = limit
    this.usedLimit    = usedLimit
    this.needApproval = needApproval
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

/**
 * Creates an ActuaryInfo instance from a raw API response object.
 */
export function actuaryInfoFromApi(data) {
  return new ActuaryInfo({
    employeeId:   data.employee_id  ?? data.employeeId,
    firstName:    data.first_name   ?? data.firstName,
    lastName:     data.last_name    ?? data.lastName,
    email:        data.email,
    position:     data.position,
    limit:        data.limit,
    usedLimit:    data.used_limit   ?? data.usedLimit,
    needApproval: data.need_approval ?? data.needApproval,
  })
}
