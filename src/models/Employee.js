/**
 * System permissions available to employees.
 * Each key maps to a human-readable label.
 */
export const PERMISSIONS = {
  isAdmin:               'Admin',
  canViewClients:        'View Clients',
  canCreateAccounts:     'Create Accounts',
  canApproveLoans:       'Approve Loans',
  canProcessTransactions:'Process Transactions',
  canManageEmployees:    'Manage Employees',
  canViewReports:        'View Reports',
}

export const DEFAULT_PERMISSIONS = {
  isAdmin:                false,
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
    jmbg,         // string  — 13-digit personal ID
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
    this.jmbg         = jmbg ?? ''
  }

  /** Full display name */
  get fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

// Maps frontend permission keys to their backend dozvole string equivalents.
const DOZVOLE_MAP = {
  isAdmin:                'ADMIN',
  canViewClients:         'READ',
  canCreateAccounts:      'WRITE',
  canApproveLoans:        'LOANS',
  canProcessTransactions: 'TRANSACTIONS',
  canManageEmployees:     'EMPLOYEES',
  canViewReports:         'REPORTS',
}

/**
 * Convert a dozvole string array (backend) to a permissions boolean object (frontend).
 */
export function permissionsFromDozvole(dozvole = []) {
  const upper = dozvole.map((d) => d.toUpperCase())
  return Object.fromEntries(
    Object.entries(DOZVOLE_MAP).map(([key, str]) => [key, upper.includes(str)])
  )
}

/**
 * Convert a permissions boolean object (frontend) back to a dozvole string array (backend).
 */
export function dozvoleFromPermissions(permissions = {}) {
  return Object.entries(DOZVOLE_MAP)
    .filter(([key]) => permissions[key])
    .map(([, str]) => str)
}

/**
 * Creates an Employee instance from a raw API response object.
 * Maps Serbian backend field names to English camelCase frontend fields.
 */
export function employeeFromApi(data) {
  return new Employee({
    id:           data.id,
    firstName:    data.first_name,
    lastName:     data.last_name,
    dateOfBirth:  data.date_of_birth,
    gender:       data.gender,
    email:        data.email,
    phoneNumber:  data.phone_number,
    address:      data.address,
    username:     data.username,
    password:     '',
    saltPassword: '',
    position:     data.position,
    department:   data.department,
    active:       data.active,
    permissions:  permissionsFromDozvole(data.permissions),
    jmbg:         data.jmbg,
  })
}
