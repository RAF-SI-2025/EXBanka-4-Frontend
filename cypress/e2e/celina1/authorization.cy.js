/**
 * Feature 4 — Autorizacija i permisije
 * Scenarios: 16–18
 *
 * S16 logs in as Marko (READ/WRITE, no ADMIN) and verifies the 403 toast
 * appears when navigating to /admin/employees.
 *
 * S17 uses seeded employee Petar Petrovic (petar.petrovic@banka.rs, id=102)
 * with no permissions. The test grants him "View Clients" (READ).
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

describe('Autorizacija i permisije — scenarios 16–18', () => {

  // ── Scenario 16 ──────────────────────────────────────────────────────────────

  it('Scenario 16: korisnik bez admin permisija pokušava pristup admin portalu', () => {
    // Log in as non-admin employee (Marko has READ/WRITE, no ADMIN)
    cy.visit('/login')
    cy.get('input[name="email"]').type('marko@banka.rs')
    cy.get('input[name="password"]').type('marko123')
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')

    // When: pokušava pristup admin portalu
    cy.visit('/admin/employees')

    // Then: sistem odbija pristup i prikazuje poruku o grešci (403 toast)
    cy.contains('You do not have permission to perform this action.', { timeout: 6000 }).should('be.visible')
  })

  // ── Scenario 17 ──────────────────────────────────────────────────────────────

  it('Scenario 17: admin dodeljuje permisije zaposlenom', () => {
    // Reset Petar's permissions to empty via API before the test
    getAdminToken().then((token) => {
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/employees/search?email=petar.petrovic@banka.rs`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body }) => {
        const petar = (body.employees || body)[0]
        expect(petar, 'Petar must exist').to.exist

        // Ensure Petar starts with no permissions
        cy.request({
          method:  'PUT',
          url:     `${API_BASE}/employees/${petar.id}`,
          headers: { Authorization: `Bearer ${token}` },
          body:    { ...petar, permissions: [] },
        })

        loginAsAdmin()
        cy.visit('/admin/employees')
        cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
        cy.get('tbody tr').contains('td', 'petar.petrovic@banka.rs').click()

        // Given: admin je na stranici za upravljanje permisijama zaposlenog
        cy.contains('Petar').scrollIntoView().should('be.visible')
        cy.contains('button', 'Edit').scrollIntoView().click()

        // When: dodeli rolu "Clerk" (koja daje View Clients / READ permisiju)
        cy.contains('label', 'Clerk')
          .find('input[type="radio"]')
          .check({ force: true })

        cy.contains('button', 'Save').click()

        // Then: sistem ažurira listu permisija
        cy.contains('button', 'Save').should('not.exist')
        cy.contains('Clerk').scrollIntoView().should('be.visible')

        // And: permisija je sačuvana u bazi (verifikacija via API)
        cy.request({
          method:  'GET',
          url:     `${API_BASE}/employees/${petar.id}`,
          headers: { Authorization: `Bearer ${token}` },
        }).then(({ body: updated }) => {
          const perms = updated.permissions || []
          expect(perms.map(p => p.toUpperCase())).to.include('READ')
        })
      })
    })
  })

  // ── Scenario 18 ──────────────────────────────────────────────────────────────

  it('Scenario 18: novi korisnik nema podrazumevane permisije', () => {
    getAdminToken().then((token) => {
      const ts = Date.now()

      // Given: admin kreira novog zaposlenog
      cy.request({
        method:  'POST',
        url:     `${API_BASE}/employees`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          first_name:    'NoPerms',
          last_name:     'Test',
          date_of_birth: '1995-01-01',
          gender:        'M',
          email:         `noperms.${ts}@banka.rs`,
          phone_number:  '+381601111111',
          address:       'Test Street 1',
          username:      `noperms_${ts}`,
          position:      'Agent',
          department:    'IT',
          jmbg:          String(ts),
        },
      }).then(({ body: emp }) => {
        // Then: lista permisija tog zaposlenog je prazna
        expect(emp.permissions, 'new employee should have no permissions').to.be.empty

        // And: verifikacija via GET — permisije su prazne i u bazi
        cy.request({
          method:  'GET',
          url:     `${API_BASE}/employees/${emp.id}`,
          headers: { Authorization: `Bearer ${token}` },
        }).then(({ body: fetched }) => {
          expect(fetched.permissions || [], 'permissions should be empty in DB').to.be.empty
        })
      })
    })
  })

})
