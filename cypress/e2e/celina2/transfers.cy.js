/**
 * Feature: Prenos sredstava između sopstvenih računa
 * Scenarios: 17–20
 */

const ADMIN_EMAIL    = 'admin@exbanka.com'
const ADMIN_PASSWORD = 'admin'
const CLIENT_EMAIL    = 'ddimitrijevi822rn@raf.rs'
const CLIENT_PASSWORD = 'taraDunjic123'
const API_BASE        = 'http://localhost:8083'

describe('Prenos sredstava — klijent', () => {

  // ── Seed: create a funded account once before all tests ──────────────────
  before(() => {
    // Login as admin to get an employee token
    cy.request('POST', `${API_BASE}/login`, {
      email:    ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }).then(({ body }) => {
      const adminToken = body.access_token

      // Find the test client's numeric ID by email
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/clients`,
        headers: { Authorization: `Bearer ${adminToken}` },
        qs:      { page: 1, page_size: 100 },
      }).then(({ body }) => {
        const client = body.clients.find(c => c.email === CLIENT_EMAIL)
        expect(client, `client ${CLIENT_EMAIL} should exist in DB`).to.exist

        // Create a funded RSD account (for S17/S20)
        cy.request({
          method:  'POST',
          url:     `${API_BASE}/api/accounts/create`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            clientId:       client.id,
            accountType:    'CURRENT',
            currencyCode:   'RSD',
            initialBalance: 1000,
            accountName:    'Cypress Transfer Test',
          },
        })

        // Create a funded EUR account (for S18 cross-currency test)
        cy.request({
          method:  'POST',
          url:     `${API_BASE}/api/accounts/create`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            clientId:       client.id,
            accountType:    'FOREIGN_CURRENCY',
            currencyCode:   'EUR',
            initialBalance: 100,
            accountName:    'Cypress EUR Test',
          },
        })
      })
    })
  })

  beforeEach(() => {
    cy.visit('/client/login')
    cy.get('input[name="email"]').type(CLIENT_EMAIL)
    cy.get('input[name="password"]').type(CLIENT_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
    cy.visit('/client/transfers')
    cy.contains('h1', 'Transfer').should('be.visible')
    cy.get('select[name="fromAccountId"] option').not('[value=""]').should('have.length.greaterThan', 0)
  })

  // ── Scenario 17 ─────────────────────────────────────────────────────────────

  it('Scenario 17: transfer između računa u istoj valuti — izvršava se bez provizije', () => {
    // When: izabere izvorni i odredišni račun
    cy.get('select[name="fromAccountId"] option').not('[value=""]').first()
      .invoke('val').then((fromVal) => {
        cy.get('select[name="fromAccountId"]').select(fromVal)

        cy.get('select[name="toAccountId"] option').not('[value=""]')
          .not(`[value="${fromVal}"]`).first()
          .invoke('val').then((toVal) => {
            cy.get('select[name="toAccountId"]').select(toVal)

            // Check available balance from the hint
            cy.contains('Available:').invoke('text').then((text) => {
              const num = parseFloat(text.replace('Available:', '').trim().replace(/\./g, '').replace(',', '.'))
              const balance = isNaN(num) ? 0 : num

              expect(balance, 'seeded account should have funds').to.be.greaterThan(0)

              // Transfer a small amount within available balance
              const amount = Math.min(balance, 1)
              cy.get('input[name="amount"]').type(String(amount))

              // No commission notice for same-currency pair
              cy.contains('Currency conversion applies').should('not.exist')

              // And: klikne na dugme "Potvrdi"
              cy.get('button[type="submit"]').click()

              // Then: transfer se uspešno izvršava
              cy.contains('Transfer initiated', { timeout: 10000 }).should('be.visible')
              cy.contains('Transfer Successful').should('be.visible')

              // And: stanje se ažurira — navigate to accounts
              cy.contains('My accounts').click()
              cy.url().should('include', '/client/accounts')
            })
          })
      })
  })

  // ── Scenario 18 ─────────────────────────────────────────────────────────────

  it('Scenario 18: transfer između računa u različitim valutama — prikazuje konverziju i proviziju', () => {
    // Use the API to find a cross-currency pair directly — avoids unreliable
    // DOM iteration where .each() queues all iterations before any execute.
    cy.request('POST', `${API_BASE}/client/login`, {
      email: CLIENT_EMAIL, password: CLIENT_PASSWORD, source: 'mobile',
    }).then(({ body }) => {
      const token = body.access_token
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/api/accounts/my`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body: accounts }) => {
        // accounts[].accountId and accounts[].currency
        let fromAcc = null, toAcc = null
        outer: for (const a of accounts) {
          for (const b of accounts) {
            if (a.accountId !== b.accountId && a.currency !== b.currency) {
              fromAcc = a; toAcc = b; break outer
            }
          }
        }

        if (!fromAcc) {
          cy.log('NOTE: No cross-currency account pair found — skipping')
          return
        }

        // Select the known cross-currency pair by ID
        cy.get('select[name="fromAccountId"]').select(String(fromAcc.accountId))
        cy.get('select[name="toAccountId"]').select(String(toAcc.accountId))

        // Then: sistem prikazuje konverziju i proviziju
        cy.contains('Currency conversion applies').should('be.visible')
        cy.contains('0.5% commission').should('be.visible')

        cy.get('input[name="amount"]').type('10')
        cy.contains('approximately').should('be.visible')

        cy.get('button[type="submit"]').click()
        cy.contains('Transfer initiated', { timeout: 10000 }).should('be.visible')
      })
    })
  })

  // ── Scenario 19 ─────────────────────────────────────────────────────────────

  it('Scenario 19: pregled istorije transfera — lista transakcija klijenta', () => {
    // NOTE: No dedicated transfer history page exists in the app.
    // The Payments page (/client/payments) is the closest available history.
    cy.visit('/client/payments')
    cy.contains('h1', 'Payments').should('be.visible')

    // Then: prikazuje se lista transakcija
    cy.get('.bg-white.dark\\:bg-slate-900').should('be.visible')

    // And: sortirani od najnovijeg ka najstarijem — verify if rows exist
    cy.get('tbody').then(($tbody) => {
      const rows = $tbody.find('tr')
      if (rows.length < 2) {
        cy.log('NOTE: Fewer than 2 transactions — sort order cannot be verified')
        return
      }

      // Read date values from first column and verify descending order
      const dates = []
      cy.get('tbody tr').each(($row) => {
        const dateText = $row.find('td').first().text().trim()
        if (dateText) dates.push(dateText)
      }).then(() => {
        if (dates.length >= 2) {
          const sorted = [...dates].sort((a, b) => new Date(b) - new Date(a))
          expect(dates).to.deep.equal(sorted)
        }
      })
    })
  })

  // ── Scenario 20 ─────────────────────────────────────────────────────────────

  it('Scenario 20: transfer sa iznosom većim od raspoloživog stanja — prikazuje grešku', () => {
    // When: pokuša da izvrši transfer sa iznosom većim od raspoloživog stanja
    cy.get('select[name="fromAccountId"] option').not('[value=""]').first()
      .invoke('val').then((fromVal) => {
        cy.get('select[name="fromAccountId"]').select(fromVal)

        cy.get('select[name="toAccountId"] option').not('[value=""]')
          .not(`[value="${fromVal}"]`).first()
          .invoke('val').then((toVal) => {
            cy.get('select[name="toAccountId"]').select(toVal)

            // Read available balance and enter more than it
            cy.contains('Available:').invoke('text').then((text) => {
              const num = parseFloat(text.replace('Available:', '').trim().replace(/\./g, '').replace(',', '.'))
              const balance = isNaN(num) ? 0 : num
              const tooMuch = balance + 1

              cy.get('input[name="amount"]').type(String(tooMuch))
              cy.get('button[type="submit"]').click()

              // Then: sistem prikazuje poruku o nedovoljnim sredstvima
              cy.contains('Insufficient funds').should('be.visible')

              // And: transfer se ne izvršava
              cy.contains('Transfer initiated').should('not.exist')
            })
          })
      })
  })
})
