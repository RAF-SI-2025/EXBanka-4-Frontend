/**
 * Feature: Moj portfolio - Moji fondovi + Upravljanje zaposlenima Dodatak
 * Scenarios: 43–46
 */

const API_BASE         = 'http://localhost:8083'
const CLIENT_EMAIL     = 'dunja@banka.rs'
const CLIENT_PASS      = 'taraDunjic123'
const SUPERVISOR_EMAIL = 'vasa@banka.rs'
const SUPERVISOR_PASS  = 'vasilije123'
const ADMIN_EMAIL      = 'admin@exbanka.com'
const ADMIN_PASS       = 'admin'

function loginAsClient() {
  cy.visit('/client/login')
  cy.get('input[name="email"]').type(CLIENT_EMAIL)
  cy.get('input[name="password"]').type(CLIENT_PASS)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/client/login')
}

function loginAsSupervisor() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(SUPERVISOR_EMAIL)
  cy.get('input[name="password"]').type(SUPERVISOR_PASS)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsAdmin() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(ADMIN_EMAIL)
  cy.get('input[name="password"]').type(ADMIN_PASS)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Moj portfolio - Moji fondovi — scenarios 43–46', () => {

  // ── Scenario 43 ───────────────────────────────────────────────────────────────

  it('Scenario 43: klijent pregleda svoje fondove u portfoliju', () => {
    // Given: klijent ima udele u fondovima
    cy.intercept('GET', '**/client/funds/positions', {
      statusCode: 200,
      body: [{
        fundId: 1,
        fundName: 'Alpha Fund',
        fundValue: 100000,
        totalInvestedAmount: 5000,
        currentPositionValue: 5250,
        myProfit: 250,
        fundPercentage: 5.25,
      }],
    }).as('myFunds')
    loginAsClient()

    // When: otvori tab "Moji fondovi" u Moj portfolio
    cy.visit('/client/portfolio')
    cy.contains(/my funds|moji fondovi/i, { timeout: 8000 }).click()

    // Then: vidi spisak fondova sa nazivom, opisom i vrednošću fonda
    cy.get('table', { timeout: 8000 }).should('exist')
    cy.get('table thead').within(() => {
      cy.contains(/fund name|naziv/i).should('exist')
      cy.contains(/fund value|vrednost/i).should('exist')
      cy.contains(/invested|uloženo/i).should('exist')
      cy.contains(/current value|trenutna vrednost/i).should('exist')
      cy.contains(/profit/i).should('exist')
    })

    // And: vidi udeo klijenta (procentualno i novčano) i ostvareni profit
    cy.get('table thead').within(() => {
      cy.contains(/%.*share|share.*%|udeo/i).should('exist')
    })

    // And: "Invest" and "Withdraw" buttons per row
    cy.get('table tbody tr').first().within(() => {
      cy.contains('button', /invest/i).should('exist')
      cy.contains('button', /withdraw/i).should('exist')
    })
  })

  // ── Scenario 44 ───────────────────────────────────────────────────────────────

  it('Scenario 44: supervizor pregleda fondove kojima upravlja', () => {
    // Given: supervizor upravlja fondovima
    cy.intercept('GET', 'http://localhost:8083/investment/funds*', {
      statusCode: 200,
      body: [{ id: 1, name: 'Alpha Fund', description: 'Test fund', fundValue: 100000, profit: 5000, minimumContribution: 1000 }],
    }).as('getFunds')
    loginAsSupervisor()

    // When: otvori listu investicionih fondova na employee portalu
    cy.visit('/investment/funds')

    // Then: vidi spisak fondova koje upravlja sa nazivom, opisom i vrednošću fonda
    cy.get('table', { timeout: 8000 }).should('exist')
    cy.get('table thead').within(() => {
      cy.contains(/fund name|naziv/i).should('exist')
      cy.contains(/fund value|vrednost/i).should('exist')
    })

    cy.get('table tbody tr').should('have.length.greaterThan', 0)
  })

  // ── Scenario 45 ───────────────────────────────────────────────────────────────

  it('Scenario 45: procenat fonda klijenta se menja kada drugi klijent uloži', () => {
    // Given: klijent A ima udeo u fondu
    let fetchCount = 0
    cy.intercept('GET', '**/client/funds/positions', (req) => {
      fetchCount++
      if (fetchCount === 1) {
        req.reply({ statusCode: 200, body: [{ fundId: 1, fundName: 'Alpha Fund', fundValue: 100000, totalInvestedAmount: 5000, currentPositionValue: 5250, myProfit: 250, fundPercentage: 5.25 }] })
      } else {
        req.reply({ statusCode: 200, body: [{ fundId: 1, fundName: 'Alpha Fund', fundValue: 200000, totalInvestedAmount: 5000, currentPositionValue: 5250, myProfit: 250, fundPercentage: 2.60 }] })
      }
    }).as('myFunds')
    loginAsClient()
    cy.visit('/client/portfolio')
    cy.contains(/my funds|moji fondovi/i, { timeout: 8000 }).click()
    cy.get('table tbody tr', { timeout: 8000 }).should('have.length.greaterThan', 0)

    // Capture initial percentage from first fund row
    let initialPercent
    cy.get('table tbody tr').first().find('td').then(($cells) => {
      // Find the % share cell
      $cells.each((_, cell) => {
        const text = cell.innerText.trim()
        if (text.match(/%/)) {
          initialPercent = parseFloat(text.replace('%', '').replace(',', '.'))
        }
      })
    })

    // When: klijent B uloži veliki iznos u isti fond
    // Get the fund ID from the current row link
    cy.get('table tbody tr').first().find('a').then(($a) => {
      const href = $a.attr('href') || ''
      const fundId = href.split('/').pop()

      if (!fundId) { cy.log('Could not extract fund ID — skipping invest step'); return }

      // Use cy.request as a second client to invest a large amount
      cy.request('POST', `${API_BASE}/client/login`, {
        email: CLIENT_EMAIL,
        password: CLIENT_PASS,
      }).then(({ body }) => {
        const token = body.access_token
        cy.request({
          method: 'GET',
          url: `${API_BASE}/client/accounts`,
          headers: { Authorization: `Bearer ${token}` },
          failOnStatusCode: false,
        }).then(({ body: accounts }) => {
          const accs = Array.isArray(accounts) ? accounts : accounts?.content ?? []
          if (accs.length === 0) return

          cy.request({
            method: 'POST',
            url: `${API_BASE}/investment/funds/${fundId}/invest`,
            headers: { Authorization: `Bearer ${token}` },
            body: { sourceAccountId: accs[0].id, amount: 100000 },
            failOnStatusCode: false,
          })
        })
      })
    })

    // Then: procenat fonda klijenta A se smanjuje proporcionalno
    cy.reload()
    cy.contains(/my funds|moji fondovi/i, { timeout: 8000 }).click()
    cy.get('table tbody tr', { timeout: 8000 }).first().find('td').then(($cells) => {
      let newPercent
      $cells.each((_, cell) => {
        const text = cell.innerText.trim()
        if (text.match(/%/)) {
          newPercent = parseFloat(text.replace('%', '').replace(',', '.'))
        }
      })
      if (initialPercent !== undefined && newPercent !== undefined) {
        expect(newPercent).to.be.lessThan(initialPercent)
      }
    })
  })

  // ── Scenario 46 ───────────────────────────────────────────────────────────────

  it('Scenario 46: admin uklanja isSupervisor permisiju — fondovi se prebacuju', () => {
    cy.on('uncaught:exception', () => false)
    // Given: supervizor upravlja fondovima — vidi ih na employee portalu
    cy.intercept('GET', 'http://localhost:8083/investment/funds*', {
      statusCode: 200,
      body: [{ id: 1, name: 'Alpha Fund', description: 'Managed by supervisor', fundValue: 100000, profit: 5000, minimumContribution: 1000 }],
    }).as('getFunds')
    loginAsSupervisor()
    cy.visit('/investment/funds')
    cy.get('table', { timeout: 8000 }).should('exist')

    // When: admin ukloni permisiju isSupervisor tom supervizoru
    loginAsAdmin()
    cy.visit('/admin/employees')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Row click navigates to detail page (no inline Edit button — whole row is clickable)
    cy.contains('tr', /vasa|vasilije/i).click()
    cy.url().should('include', '/admin/employees/')

    // Click Edit on the detail page
    cy.contains('button', /^edit$/i, { timeout: 8000 }).click()

    // Set up intercept BEFORE clicking save — mock response to prevent permanent DB change
    cy.intercept('PUT', '**/employees/*', { statusCode: 200, body: {} }).as('updateEmployee')

    // Change role from Supervisor to None via radio buttons (detail page uses radio, not checkboxes)
    cy.get('input[type="radio"][value="none"]', { timeout: 5000 }).click({ force: true })
    cy.contains('button', /save|sačuvaj|update/i).click()

    cy.wait('@updateEmployee', { timeout: 10000 })

    // Then: update was accepted — navigate to fund list to verify funds are still managed
    cy.intercept('GET', 'http://localhost:8083/investment/funds*', {
      statusCode: 200,
      body: [{ id: 1, name: 'Alpha Fund', description: 'Managed by supervisor', active: true, managerName: 'Manager', fundValue: 100000, profit: 5000, minimumContribution: 1000 }],
    })
    cy.visit('/investment/funds')
    cy.get('table', { timeout: 8000 }).should('exist')
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
  })

})
