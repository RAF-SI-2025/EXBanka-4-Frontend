/**
 * System permissions available to employees.
 * Each key maps to a human-readable label.
 */
export const PERMISSIONS = {
  canViewClients:        'View Clients',
  canCreateAccounts:     'Create Accounts',
  canApproveLoans:       'Approve Loans',
  canProcessTransactions:'Process Transactions',
  canManageEmployees:    'Manage Employees',
  canViewReports:        'View Reports',
}

export const DEFAULT_PERMISSIONS = {
  canViewClients:         false,
  canCreateAccounts:      false,
  canApproveLoans:        false,
  canProcessTransactions: false,
  canManageEmployees:     false,
  canViewReports:         false,
}

/**
 * Employee model
 *
 * Represents a bank employee as returned by the API.
 * Fields marked "immutable" are set at creation and never changed.
 * Fields marked "rarely changes" may be updated via profile/admin endpoints.
 */
export class Employee {
  constructor({
    id,           // number  — immutable
    firstName,    // string  — immutable
    lastName,     // string  — rarely changes
    dateOfBirth,  // string  — ISO 8601 date (YYYY-MM-DD), immutable
    gender,       // string  — rarely changes ('M' | 'F' | ...)
    email,        // string  — immutable
    phoneNumber,  // string  — rarely changes
    address,      // string  — rarely changes
    username,     // string  — immutable
    password,     // string  — hashed, rarely changes
    saltPassword, // string  — immutable
    position,     // string  — rarely changes (e.g. 'Manager')
    department,   // string  — rarely changes (e.g. 'Finance')
    active,       // boolean — rarely changes
    permissions,  // object  — system access permissions
  }) {
    this.id           = id
    this.firstName    = firstName
    this.lastName     = lastName
    this.dateOfBirth  = dateOfBirth
    this.gender       = gender
    this.email        = email
    this.phoneNumber  = phoneNumber
    this.address      = address
    this.username     = username
    this.password     = password
    this.saltPassword = saltPassword
    this.position     = position
    this.department   = department
    this.active       = active
    this.permissions  = { ...DEFAULT_PERMISSIONS, ...permissions }
  }

  /** Full display name */
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

/**
 * Creates an Employee instance from a raw API response object.
 * Adjust field mapping here if the API uses different naming conventions.
 */
export function employeeFromApi(data) {
  return new Employee({
    id:           data.id,
    firstName:    data.firstName,
    lastName:     data.lastName,
    dateOfBirth:  data.dateOfBirth,
    gender:       data.gender,
    email:        data.email,
    phoneNumber:  data.phoneNumber,
    address:      data.address,
    username:     data.username,
    password:     data.password,
    saltPassword: data.saltPassword,
    position:     data.position,
    department:   data.department,
    active:       data.active,
    permissions:  data.permissions,
  })
}
