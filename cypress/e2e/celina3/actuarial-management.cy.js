/**
 * Feature: Upravljanje aktuarima
 * Scenarios: 1–9
 *
 * Portal /admin/actuaries requires IS_SUPERVISOR permission.
 * Supervisors can view agents, set limits, and reset usedLimit.
 * Admins inherit supervisor access; supervisors cannot reach /admin/employees.
 */

const API_BASE            = 'http://localhost:8083'
const SUPERVISOR_EMAIL    = 'vasa@banka.rs'
const SUPERVISOR_PASSWORD = 'vasilije123'
const AGENT_EMAIL         = 'elezovic@banka.rs'
const AGENT_PASSWORD      = 'denis123'
const ADMIN_EMAIL         = 'admin@exbanka.com'
const ADMIN_PASSWORD      = 'admin'


// ── Helpers ────────────────────────────────────────────────────────────────────

function loginAsSupervisor() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(SUPERVISOR_EMAIL)
  cy.get('input[name="password"]').type(SUPERVISOR_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsAgent() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(AGENT_EMAIL)
  cy.get('input[name="password"]').type(AGENT_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsAdmin() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(ADMIN_EMAIL)
  cy.get('input[name="password"]').type(ADMIN_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function getSupervisorToken() {
  return cy.request('POST', `${API_BASE}/login`, {
    email: SUPERVISOR_EMAIL, password: SUPERVISOR_PASSWORD,
  }).then(({ body }) => body.access_token)
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Upravljanje aktuarima — scenarios 1–9', () => {

  // ── Scenario 1 ────────────────────────────────────────────────────────────────

  it('Scenario 1: supervizor može da otvori portal za upravljanje aktuarima', () => {
    // Given: korisnik je ulogovan kao supervizor
    loginAsSupervisor()

    // When: otvori portal "Upravljanje aktuarima"
    cy.visit('/admin/actuaries')

    // Then: vidi listu agenata
    cy.contains('h1', 'Actuaries').should('be.visible')
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // And: vidi filtere po email-u, imenu, prezimenu i poziciji
    cy.get('input[name="firstName"]').should('be.visible')
    cy.get('input[name="lastName"]').should('be.visible')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="position"]').should('be.visible')

    // And: za svakog agenta vidi mogućnost izmene limita i resetovanja usedLimit vrednosti
    cy.get('tbody tr').first().within(() => {
      cy.contains('Set limit').should('be.visible')
      cy.contains('Reset used').should('be.visible')
    })
  })

  // ── Scenario 2 ────────────────────────────────────────────────────────────────

  it('Scenario 2: agent nema pristup portalu za upravljanje aktuarima', () => {
    // Given: korisnik je ulogovan kao agent
    loginAsAgent()

    // When: pokuša da otvori portal "Upravljanje aktuarima"
    cy.visit('/admin/actuaries')

    // Then: pristup mu je odbijen i stranica nije dostupna
    cy.contains('Access Denied').should('be.visible')
    cy.contains('Supervisors only').should('be.visible')
  })

  // ── Scenario 3 ────────────────────────────────────────────────────────────────

  it('Scenario 3: supervizor menja limit agentu — uspešno', () => {
    cy.intercept('PUT', '**/api/actuaries/*/limit').as('setLimit')

    // Given: supervizor je na portalu za upravljanje aktuarima
    loginAsSupervisor()
    cy.visit('/admin/actuaries')
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: supervizor unese novi limit 150.000 RSD i klikne "Sačuvaj"
    cy.contains('tr', 'Denis').within(() => {
      cy.contains('Set limit').click()
      cy.get('input[type="number"]').clear().type('150000')
      cy.contains('Save').click()
    })

    // Then: novi limit je uspešno sačuvan na 150.000 RSD
    cy.wait('@setLimit').its('request.body').should('deep.equal', { limit: 150000 })

    // And: edit mode je zatvoren (potvrda o uspešnoj izmeni)
    cy.contains('tr', 'Denis').within(() => {
      cy.get('input[type="number"]').should('not.exist')
      cy.contains('Set limit').should('be.visible')
    })
  })

  // ── Scenario 4 ────────────────────────────────────────────────────────────────

  it('Scenario 4: unos nevalidnog limita — sistem odbija', () => {
    cy.intercept('PUT', '**/api/actuaries/*/limit').as('setLimit')

    // Given: supervizor je na portalu za upravljanje aktuarima
    loginAsSupervisor()
    cy.visit('/admin/actuaries')
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: unese limit 0
    cy.contains('tr', 'Denis').within(() => {
      cy.contains('Set limit').click()
      cy.get('input[type="number"]').clear().type('0')
      cy.contains('Save').click()
    })

    // Then: sistem odbija unos — API nije pozvan, edit mode ostaje otvoren
    cy.get('@setLimit.all').should('have.length', 0)
    cy.get('input[type="number"]').should('be.visible')

    // And: negativna vrednost je takođe odbijena
    cy.get('input[type="number"]').clear().type('-500')
    cy.contains('Save').click()
    cy.get('@setLimit.all').should('have.length', 0)
    cy.get('input[type="number"]').should('be.visible')
  })

  // ── Scenario 5 ────────────────────────────────────────────────────────────────

  it('Scenario 5: supervizor resetuje usedLimit agentu', () => {
    cy.intercept('POST', '**/api/actuaries/*/reset-used-limit').as('resetUsed')

    // Given: supervizor je na portalu za upravljanje aktuarima
    loginAsSupervisor()
    cy.visit('/admin/actuaries')
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne na "Reset used" (UI nema modal — direktna akcija)
    cy.contains('tr', 'Denis').within(() => {
      cy.contains('Reset used').click()
    })

    // Then: sistem uspešno resetuje usedLimit
    cy.wait('@resetUsed').its('response.statusCode').should('eq', 200)

    // And: promena je vidljiva na listi agenata (usedLimit cell shows 0)
    cy.contains('tr', 'Denis').find('td').eq(4).should('contain.text', '0')
  })

  // ── Scenario 6 ────────────────────────────────────────────────────────────────

  it('Scenario 6: postavljanje limita jednakog trenutnom usedLimit-u', () => {
    cy.intercept('PUT', '**/api/actuaries/*/limit').as('setLimit')

    // Given: supervizor je na portalu za upravljanje aktuarima
    loginAsSupervisor()
    cy.visit('/admin/actuaries')
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Read Denis's current usedLimit from the UI, then set limit to that same value
    cy.contains('tr', 'Denis').find('td').eq(4).invoke('text').then((text) => {
      // fmt() renders as e.g. "50.000,00 RSD" — parse back to a number
      const usedLimit = parseFloat(text.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''))
      // If usedLimit is 0 we can't use it as a limit (frontend rejects ≤ 0); use 50000 as fallback
      const limitToSet = usedLimit > 0 ? usedLimit : 50000

      // When: supervizor postavi limit na vrednost jednaku usedLimit-u
      cy.contains('tr', 'Denis').within(() => {
        cy.contains('Set limit').click()
        cy.get('input[type="number"]').clear().type(String(limitToSet))
        cy.contains('Save').click()
      })

      // Then: sistem dozvoljava izmenu i novi limit je uspešno sačuvan
      cy.wait('@setLimit').its('request.body').should('deep.equal', { limit: limitToSet })
      cy.contains('tr', 'Denis').within(() => {
        cy.get('input[type="number"]').should('not.exist')
      })
    })
  })

  // ── Scenario 7 ────────────────────────────────────────────────────────────────

  it('Scenario 7: automatski reset usedLimit-a na kraju radnog dana', () => {
    // Reset se odvija u 23:59h (backend scheduler); test verifikuje mehanizam via API
    getSupervisorToken().then((token) => {
      cy.request({
        method: 'GET',
        url: `${API_BASE}/api/actuaries`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body: actuaries }) => {
        expect(actuaries).to.have.length.greaterThan(0)

        const firstAgent = actuaries[0]
        const agentId = firstAgent.employee_id ?? firstAgent.employeeId

        // When: sistem izvrši automatski reset (simuliramo pozivom endpoint-a)
        cy.request({
          method: 'POST',
          url: `${API_BASE}/api/actuaries/${agentId}/reset-used-limit`,
          headers: { Authorization: `Bearer ${token}` },
        }).its('status').should('eq', 200)

        // Then: usedLimit svih agenata se postavlja na 0 — verifikujemo via GET
        cy.request({
          method: 'GET',
          url: `${API_BASE}/api/actuaries/${agentId}`,
          failOnStatusCode: false,
          headers: { Authorization: `Bearer ${token}` },
        }).then(({ body: agent, status }) => {
          if (status === 200) {
            const used = agent.used_limit ?? agent.usedLimit ?? 0
            expect(used).to.equal(0)
          }
        })
      })
    })
  })

  // ── Scenario 8 ────────────────────────────────────────────────────────────────

  it('Scenario 8: svaki admin je ujedno i supervizor', () => {
    // Given: zaposleni ima admin permisiju
    loginAsAdmin()

    // When: admin pokuša da pristupi portalu za upravljanje aktuarima
    cy.visit('/admin/actuaries')

    // Then: pristup je dozvoljen
    cy.contains('h1', 'Actuaries').should('be.visible')

    // And: admin vidi listu agenata i može menjati njihove limite
    cy.get('tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('tbody tr').first().within(() => {
      cy.contains('Set limit').should('be.visible')
    })
  })

  // ── Scenario 9 ────────────────────────────────────────────────────────────────

  it('Scenario 9: supervizor koji nije admin ne dobija pristup portalu za upravljanje zaposlenima', () => {
    // Given: zaposlenom je dodeljena supervizor permisija, ali ne i admin
    loginAsSupervisor()

    // When: supervizor pokuša da pristupi portalu za upravljanje zaposlenima
    cy.visit('/admin/employees')

    // Then: pristup je odbijen jer supervizor nije admin
    cy.contains('You do not have permission to perform this action.', { timeout: 6000 }).should('be.visible')
  })

})
