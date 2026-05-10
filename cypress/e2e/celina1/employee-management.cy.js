/**
 * Feature 3 — Upravljanje zaposlenima
 * Scenarios: 11–15
 *
 * S14 uses 'luka@banka.rs' for deactivation (not Marko, who is used in S1 auth tests).
 * S15 is skipped — no restriction on editing admin employees exists in the current UI or backend.
 */

const ADMIN_EMAIL    = 'admin@exbanka.com'
const ADMIN_PASSWORD = 'admin'
const API_BASE       = 'http://localhost:8083'

function loginAsAdmin() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(ADMIN_EMAIL)
  cy.get('input[name="password"]').type(ADMIN_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function getAdminToken() {
  return cy.request('POST', `${API_BASE}/login`, {
    email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
  }).then(({ body }) => body.access_token)
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Upravljanje zaposlenima — scenarios 11–15', () => {

  beforeEach(() => {
    loginAsAdmin()
  })

  // ── Scenario 11 ──────────────────────────────────────────────────────────────

  it('Scenario 11: admin vidi listu svih zaposlenih', () => {
    cy.visit('/admin/employees')
    cy.contains('h1', 'Employees').should('be.visible')

    // Then: lista zaposlenih je prikazana
    cy.get('table').should('be.visible')
    cy.get('tbody tr').should('have.length.greaterThan', 0)

    // And: za svakog zaposlenog prikazuju se podaci (ime, email, pozicija, status)
    cy.get('tbody tr').first().within(() => {
      cy.get('td').should('have.length.greaterThan', 2)
    })
  })

  // ── Scenario 12 ──────────────────────────────────────────────────────────────

  it('Scenario 12: admin pretražuje zaposlene', () => {
    cy.visit('/admin/employees')
    cy.contains('h1', 'Employees').should('be.visible')

    // When: unese ime u polje za pretragu
    cy.get('input[name="firstName"]').type('Marko')

    // Then: lista se filtrira
    cy.get('tbody tr', { timeout: 5000 }).should('have.length.greaterThan', 0)
    cy.get('tbody').should('contain.text', 'Marko')

    // And: zaposleni koji ne odgovaraju kriterijumu nisu prikazani
    cy.get('tbody').should('not.contain.text', 'Admin')

    // Search by email
    cy.get('input[name="firstName"]').clear()
    cy.get('input[name="email"]').type('marko@banka.rs')
    cy.get('tbody', { timeout: 5000 }).should('contain.text', 'marko@banka.rs')

    // Clear filters
    cy.contains('Clear filters').click()
    cy.get('tbody tr').should('have.length.greaterThan', 1)
  })

  // ── Scenario 13 ──────────────────────────────────────────────────────────────

  it('Scenario 13: admin menja podatke zaposlenog', () => {
    // Find Marko via API to get his ID
    getAdminToken().then((token) => {
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/employees/search?email=marko@banka.rs`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body }) => {
        const marko = (body.employees || body)[0]
        expect(marko, 'Marko must exist').to.exist

        // Navigate via row click (client-side) so EmployeesContext stays populated
        cy.visit('/admin/employees')
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
        cy.get('tbody tr').contains('td', marko.email).click()
        cy.contains('button', 'Edit').click()

        // When: promeni broj telefona i departman
        const newPhone = '+381611234567'
        const newDept  = 'Operations'

        cy.get('input[name="phoneNumber"]').clear().type(newPhone)
        cy.get('input[name="department"]').clear().type(newDept)

        cy.contains('button', 'Save').click()

        // Then: podaci su ažurirani (edit mode closed, new values displayed)
        cy.contains('button', 'Save').should('not.exist')
        cy.contains(newPhone).scrollIntoView().should('be.visible')
        cy.contains(newDept).scrollIntoView().should('be.visible')
      })
    })
  })

  // ── Scenario 14 ──────────────────────────────────────────────────────────────

  it('Scenario 14: admin deaktivira zaposlenog', () => {
    // Using Luka (luka@banka.rs) to avoid breaking Marko's auth test (S1)
    getAdminToken().then((token) => {
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/employees/search?email=luka@banka.rs`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body }) => {
        const luka = (body.employees || body)[0]
        expect(luka, 'Luka must exist').to.exist

        // First ensure Luka is active
        cy.request({
          method:  'PUT',
          url:     `${API_BASE}/employees/${luka.id}`,
          headers: { Authorization: `Bearer ${token}` },
          body:    { ...luka, active: true },
        })

        cy.visit('/admin/employees')
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
        cy.get('tbody tr').contains('td', luka.email).click()
        cy.contains('button', 'Edit').click()

        // When: ukloni oznaku "Active"
        cy.get('input[type="checkbox"][name="active"]').should('be.checked').uncheck()
        cy.contains('button', 'Save').click()

        // Then: status je postavljen na neaktivan
        cy.contains('button', 'Save').should('not.exist')
        cy.contains('Inactive').scrollIntoView().should('be.visible')

        // And: zaposleni više ne može da se prijavi
        cy.visit('/login')
        cy.get('input[name="email"]').type('luka@banka.rs')
        cy.get('input[name="password"]').type('luka123')
        cy.get('button[type="submit"]').click()
        cy.contains('Invalid email or password.').should('be.visible')
      })
    })
  })

  // ── Scenario 15 (pending — restriction not implemented) ───────────────────────

  it.skip('Scenario 15: admin pokušava da izmeni drugog admina', () => {
    /**
     * The current UI and backend have no restriction on editing admin employees.
     * When checking the Admin permission checkbox there is a confirmation modal,
     * but admins can be freely edited otherwise.
     *
     * To implement: add a backend check that returns 403 when a non-super-admin
     * tries to edit an employee with the ADMIN permission, and show a message
     * in the UI.
     */
  })

})
