/**
 * Account subtypes
 *
 * Personal:  'standard' | 'savings' | 'pensioner' | 'youth' | 'student' | 'unemployed'
 * Business:  'doo' | 'ad' | 'foundation'
 */

export class BankAccount {
  constructor({
    id,
    accountNumber,
    accountName,
    ownerId,
    ownerFirstName,
    ownerLastName,
    createdByEmployeeId,
    createdAt,
    expiresAt,
    currency,
    type,
    subtype,
    status,
    balance,
    availableBalance,
    maintenanceFee,
    dailyLimit,
    monthlyLimit,
    dailySpending,
    monthlySpending,
    company,
  }) {
    this.id                  = id
    this.accountNumber       = accountNumber
    this.accountName         = accountName         ?? null          // e.g. "Devizni račun 1"
    this.ownerId             = ownerId
    this.ownerFirstName      = ownerFirstName
    this.ownerLastName       = ownerLastName
    this.createdByEmployeeId = createdByEmployeeId ?? null
    this.createdAt           = createdAt           ?? null
    this.expiresAt           = expiresAt           ?? null

    // Current accounts are always RSD; foreign accounts carry their own currency code
    this.currency            = currency            ?? 'RSD'

    // 'personal' | 'business'
    this.type                = type

    // Personal subtypes: 'standard' | 'savings' | 'pensioner' | 'youth' | 'student' | 'unemployed'
    // Business subtypes: 'doo' | 'ad' | 'foundation'
    this.subtype             = subtype             ?? null

    // 'active' | 'inactive'
    this.status              = status              ?? 'active'

    this.balance             = balance             ?? 0    // current balance
    this.availableBalance    = availableBalance    ?? 0    // balance minus reserved funds
    this.maintenanceFee      = maintenanceFee      ?? 0    // monthly maintenance fee
    this.dailyLimit          = dailyLimit          ?? 250000   // max transaction amount per day
    this.monthlyLimit        = monthlyLimit        ?? 1000000  // max transaction amount per month
    this.dailySpending       = dailySpending       ?? 0    // total spent today
    this.monthlySpending     = monthlySpending     ?? 0    // total spent this month
    // Business accounts only: { name, pib, registrationNumber, address, activityCode }
    this.company             = company             ?? null
  }

  get ownerFullName() {
    return `${this.ownerFirstName} ${this.ownerLastName}`
  }

  get isActive() {
    return this.status === 'active'
  }

  // 'current' for RSD accounts, 'foreign' for everything else
  get currencyType() {
    return this.currency === 'RSD' ? 'current' : 'foreign'
  }
}

// Formats a raw accountType string for display (e.g. "foreign_currency" → "Foreign Currency")
export function formatAccountType(type) {
  if (!type) return '—'
  return type.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ─── Subtype labels ───────────────────────────────────────────────────────────

export const PERSONAL_SUBTYPES = [
  { value: 'standard',   label: 'Standard' },
  { value: 'savings',    label: 'Savings' },
  { value: 'pensioner',  label: 'Pensioner' },
  { value: 'youth',      label: 'Youth' },
  { value: 'student',    label: 'Student' },
  { value: 'unemployed', label: 'Unemployed' },
]

export const BUSINESS_SUBTYPES = [
  { value: 'doo',        label: 'DOO (LLC)' },
  { value: 'ad',         label: 'AD (Joint Stock)' },
  { value: 'foundation', label: 'Foundation' },
]

// Maps a backend account response to a BankAccount instance.
// Used by both accountService (create response) and clientAccountService (list/detail).
export function bankAccountFromApi(data) {
  return new BankAccount({
    id:               data.id ?? data.accountId,
    accountNumber:    data.accountNumber,
    accountName:      data.accountName    ?? null,
    ownerId:          data.ownerId        ?? null,
    ownerFirstName:   data.ownerFirstName ?? (data.owner ? data.owner.split(' ')[0] : null),
    ownerLastName:    data.ownerLastName  ?? (data.owner ? data.owner.split(' ').slice(1).join(' ') : null),
    createdByEmployeeId: data.employeeId  ?? null,
    currency:         data.currency ?? data.currencyCode ?? 'RSD',
    type:             data.accountType?.toUpperCase() === 'BUSINESS' ? 'business' : 'personal',
    subtype:          data.accountSubtype ?? (data.accountType ? data.accountType.toLowerCase() : null),
    status:           data.status ? data.status.toLowerCase() : 'active',
    balance:          data.balance        ?? 0,
    availableBalance: data.availableBalance ?? 0,
    dailyLimit:       data.dailyLimit     ?? 250000,
    monthlyLimit:     data.monthlyLimit   ?? 1000000,
    dailySpending:    data.dailySpent     ?? 0,
    monthlySpending:  data.monthlySpent   ?? 0,
    company:          data.company        ?? null,
  })
}
