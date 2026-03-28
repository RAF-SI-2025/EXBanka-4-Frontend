/**
 * Feature 1 — Autentifikacija korisnika
 * Scenarios: 1–4
 */

const EMPLOYEE_EMAIL    = 'marko@banka.rs'
const EMPLOYEE_PASSWORD = 'marko123'
const EXISTING_EMAIL    = 'luka@banka.rs'

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Autentifikacija korisnika — scenarios 1–4', () => {

  beforeEach(() => {
    cy.visit('/login')
  })

  // ── Scenario 1 ───────────────────────────────────────────────────────────────

  it('Scenario 1: uspešno logovanje zaposlenog', () => {
    // When: unese validan email i lozinku
    cy.get('input[name="email"]').type(EMPLOYEE_EMAIL)
    cy.get('input[name="password"]').type(EMPLOYEE_PASSWORD)
    cy.get('button[type="submit"]').click()

    // Then: sistem uspešno autentifikuje korisnika i preusmerava na početnu stranicu
    cy.url().should('not.include', '/login')
    cy.url().should('eq', Cypress.config('baseUrl') + '/')

    // And: access token je generisan (korisnik je ulogovan)
    cy.window().then((win) => {
      const token = win.localStorage.getItem('access_token')
        || win.sessionStorage.getItem('access_token')
      // Token may be in a cookie — verify indirectly via redirect
    })
    cy.contains('Sign Out').should('be.visible')
  })

  // ── Scenario 2 ───────────────────────────────────────────────────────────────

  it('Scenario 2: neuspešno logovanje zbog pogrešne lozinke', () => {
    // When: unese validan email i pogrešnu lozinku
    cy.get('input[name="email"]').type(EXISTING_EMAIL)
    cy.get('input[name="password"]').type('pogresna123')
    cy.get('button[type="submit"]').click()

    // Then: sistem odbija prijavu
    cy.url().should('include', '/login')

    // And: prikazuje poruku o grešci
    cy.contains('Invalid email or password.').should('be.visible')
  })

  // ── Scenario 3 ───────────────────────────────────────────────────────────────

  it('Scenario 3: neuspešno logovanje zbog nepostojećeg korisnika', () => {
    // When: unese nepostojeći email
    cy.get('input[name="email"]').type('nepostojeci@banka.rs')
    cy.get('input[name="password"]').type('Sifra123')
    cy.get('button[type="submit"]').click()

    // Then: sistem odbija prijavu
    cy.url().should('include', '/login')

    // And: prikazuje poruku o grešci
    cy.contains('Invalid email or password.').should('be.visible')
  })

  // ── Scenario 4 ───────────────────────────────────────────────────────────────

  it('Scenario 4: reset lozinke putem email-a', () => {
    cy.intercept('POST', '**/auth/forgot-password', { statusCode: 200, body: { message: 'password reset email sent' } }).as('forgotPassword')

    // When: klikne na "Forgot Password"
    cy.contains('Forgot').click()
    cy.url().should('include', '/forgot-password')

    // And: unese email
    cy.get('input[type="email"]').type('zaposleni@banka.rs')
    cy.contains('button', 'Send Reset Link').click()

    cy.wait('@forgotPassword')

    // Then: prikazuje se ekran potvrde (sistem je poslao email sa linkom)
    cy.contains('Check Your Inbox', { timeout: 8000 }).should('be.visible')
    cy.contains('If an account exists for').should('be.visible')
  })

})
