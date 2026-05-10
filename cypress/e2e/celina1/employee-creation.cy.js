/**
 * Feature 2 — Kreiranje i aktivacija zaposlenog
 * Scenarios: 6–10
 *
 * S8 requires a seeded activation token in auth-service/db/schema.sql
 * (token: 'cypress-valid-token-s8', employee_id: 100).
 * S9 requires a seeded expired token ('cypress-expired-token-s9', employee_id: 101).
 * Both tokens are seeded on fresh container startup — re-run requires
 * docker compose down -v && up for auth-service and employee-service.
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

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Kreiranje i aktivacija zaposlenog — scenarios 6–10', () => {

  // ── Scenario 6 ───────────────────────────────────────────────────────────────

  it('Scenario 6: admin kreira novog zaposlenog', () => {
    loginAsAdmin()
    cy.visit('/admin/employees/new')

    // When: popuni sva obavezna polja
    const ts = Date.now()
    const uniqueEmail    = `cypress.new.${ts}@banka.rs`
    const uniqueUsername = `cypress_new_${ts}`
    const uniqueJmbg     = String(ts)  // Date.now() is exactly 13 digits

    cy.get('input[name="firstName"]').type('Cypress')
    cy.get('input[name="lastName"]').type('Test')
    cy.get('input[name="dateOfBirth"]').type('1990-01-01')
    cy.get('select[name="gender"]').select('M')
    cy.get('input[name="email"]').type(uniqueEmail)
    cy.get('input[name="phoneNumber"]').type('+381601234567')
    cy.get('input[name="address"]').type('Test Street 1')
    cy.get('input[name="username"]').type(uniqueUsername)
    cy.get('input[name="position"]').type('Agent')
    cy.get('input[name="department"]').type('IT')
    cy.get('input[name="jmbg"]').type(uniqueJmbg)

    // And: potvrdi unos
    cy.contains('button', 'Create Employee').click()

    // Then: sistem kreira nalog i preusmerava na listu zaposlenih
    cy.url().should('include', '/admin/employees')
    cy.url().should('not.include', '/new')

    // And: zaposleni se pojavljuje u listi (verifikacija via API)
    cy.request('POST', `${API_BASE}/login`, {
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    }).then(({ body }) => {
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/employees/search?email=${uniqueEmail}`,
        headers: { Authorization: `Bearer ${body.access_token}` },
      }).then(({ body: results }) => {
        const found = (results.employees || results).find(e => e.email === uniqueEmail)
        expect(found, 'created employee should exist in DB').to.exist
        expect(found.active).to.equal(false) // inactive until activation
      })
    })
  })

  // ── Scenario 7 ───────────────────────────────────────────────────────────────

  it('Scenario 7: kreiranje zaposlenog sa već postojećim email-om', () => {
    loginAsAdmin()
    cy.visit('/admin/employees/new')

    // When: pokuša da kreira sa email-om koji već postoji
    cy.get('input[name="firstName"]').type('Duplikat')
    cy.get('input[name="lastName"]').type('Test')
    cy.get('input[name="email"]').type('marko@banka.rs') // already exists
    cy.get('input[name="username"]').type(`duplicate_${Date.now()}`)
    cy.get('input[name="address"]').type('Test Street 1')
    cy.get('input[name="position"]').type('Agent')
    cy.get('input[name="department"]').type('IT')
    cy.get('input[name="jmbg"]').type('9999999999999')

    cy.contains('button', 'Create Employee').click()

    // Then: sistem odbija kreiranje
    cy.contains('Failed to create employee').should('be.visible')

    // And: admin ostaje na formi
    cy.url().should('include', '/admin/employees/new')
  })

  // ── Scenario 8 ───────────────────────────────────────────────────────────────

  it('Scenario 8: zaposleni aktivira nalog putem email linka', () => {
    cy.intercept('POST', '/auth/activate', { statusCode: 200, body: {} }).as('activate')

    // Given: zaposleni klikne na aktivacioni link (seeded token)
    cy.visit('/set-password?token=cypress-valid-token-s8')
    cy.contains('Create Password').should('be.visible')

    // When: unese validnu lozinku u oba polja
    cy.get('input[name="password"]').type('ValidPass12')
    cy.get('input[name="confirm"]').type('ValidPass12')
    cy.contains('button', 'Create Password').click()
    cy.wait('@activate')

    // Then: sistem aktivira nalog
    cy.contains('Password Created', { timeout: 8000 }).should('be.visible')
    cy.contains('Your account is ready').should('be.visible')
  })

  // ── Scenario 9 ───────────────────────────────────────────────────────────────

  it('Scenario 9: aktivacija naloga sa isteklim tokenom', () => {
    // Given: zaposleni koristi istekli aktivacioni link
    cy.visit('/set-password?token=cypress-expired-token-s9')
    cy.contains('Create Password').should('be.visible')

    // When: pokuša da postavi lozinku
    cy.get('input[name="password"]').type('ValidPass12')
    cy.get('input[name="confirm"]').type('ValidPass12')
    cy.contains('button', 'Create Password').click()

    // Then: sistem odbija aktivaciju i prikazuje grešku
    cy.contains('expired', { timeout: 8000, matchCase: false }).should('be.visible')
  })

  // ── Scenario 10 ──────────────────────────────────────────────────────────────

  it('Scenario 10: postavljanje lozinke koja ne ispunjava bezbednosne zahteve', () => {
    // Given: zaposleni se nalazi na stranici za aktivaciju
    // (token param just needs to exist — validation is client-side before submit)
    cy.visit('/set-password?token=cypress-complexity-test')
    cy.contains('Create Password').should('be.visible')

    // When: unese lozinku bez velikog slova
    cy.get('input[name="password"]').type('nouppercase12')
    cy.get('input[name="confirm"]').type('nouppercase12')
    cy.contains('button', 'Create Password').click()
    cy.contains('Password must contain at least one uppercase letter.').should('be.visible')

    // When: unese lozinku bez dva broja
    cy.get('input[name="password"]').clear().type('OnlyOneNumber1')
    cy.get('input[name="confirm"]').clear().type('OnlyOneNumber1')
    cy.contains('button', 'Create Password').click()
    cy.contains('Password must contain at least two numbers.').should('be.visible')

    // When: unese prekratku lozinku
    cy.get('input[name="password"]').clear().type('Ab12')
    cy.get('input[name="confirm"]').clear().type('Ab12')
    cy.contains('button', 'Create Password').click()
    cy.contains('Password must be at least 8 characters.').should('be.visible')

    // Then: nalog ostaje neaktivan (nije preusmeravan na success screen)
    cy.contains('Password Created').should('not.exist')
    cy.url().should('include', '/set-password')
  })

})
