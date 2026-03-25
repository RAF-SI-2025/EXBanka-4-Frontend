/**
 * Feature: Kartice (Cards)
 * Scenarios: 27–32
 */

const ADMIN_EMAIL    = 'admin@exbanka.com'
const ADMIN_PASSWORD = 'admin'
const CLIENT_EMAIL   = 'ddimitrijevi822rn@raf.rs'
const CLIENT_PASSWORD = 'taraDunjic123'
const API_BASE       = 'http://localhost:8083'

// Shared across tests — populated in before()
let clientId          = null
let seedAccountId     = null
let seedAccountNumber = null
let seedCardId        = null

// ── Helpers ───────────────────────────────────────────────────────────────────

function loginAsClient() {
  cy.visit('/client/login')
  cy.get('input[name="email"]').type(CLIENT_EMAIL)
  cy.get('input[name="password"]').type(CLIENT_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsEmployee() {
  cy.visit('/login')
  cy.get('input[name="email"]').type(ADMIN_EMAIL)
  cy.get('input[name="password"]').type(ADMIN_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

/** Runs a cy.request as admin and passes the token to cb(token). */
function withAdminToken(cb) {
  cy.request('POST', `${API_BASE}/login`, {
    email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
  }).then(({ body }) => cb(body.access_token))
}

// ── Seed: one account + card shared by S29–S32 ───────────────────────────────

describe('Kartice — scenarios 27–32', () => {

  before(() => {
    cy.request('POST', `${API_BASE}/login`, {
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    }).then(({ body }) => {
      const adminToken = body.access_token

      // Find test client
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/clients`,
        headers: { Authorization: `Bearer ${adminToken}` },
        qs:      { page: 1, page_size: 100 },
      }).then(({ body }) => {
        const client = body.clients.find(c => c.email === CLIENT_EMAIL)
        expect(client, `client ${CLIENT_EMAIL} should exist in DB`).to.exist
        clientId = client.id

        // Create a seeded account with an auto-generated card
        cy.request({
          method:  'POST',
          url:     `${API_BASE}/api/accounts/create`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            clientId:       client.id,
            accountType:    'CURRENT',
            currencyCode:   'RSD',
            initialBalance: 500,
            accountName:    'Cypress Card Seed',
            createCard:     true,
          },
        }).then(({ body: account }) => {
          seedAccountId     = account.id
          seedAccountNumber = account.accountNumber

          // Fetch the auto-created card
          cy.request({
            method:  'GET',
            url:     `${API_BASE}/api/cards/by-account/${seedAccountNumber}`,
            headers: { Authorization: `Bearer ${adminToken}` },
          }).then(({ body: cards }) => {
            expect(cards, 'seeded account should have a card').to.have.length.greaterThan(0)
            seedCardId = cards[0].id
          })
        })
      })
    })
  })

  // ── Scenario 27 ──────────────────────────────────────────────────────────────

  it('Scenario 27: zaposleni kreira nalog sa karticom — kartica se automatski generiše', () => {
    loginAsEmployee()
    cy.visit('/admin/accounts/new')

    // Select the test client by ID (option value is the numeric client ID)
    cy.get('select[name="ownerId"]').select(String(clientId))

    // Select a standard personal subtype — auto-fills name + limits
    cy.get('select[name="subtype"]').select('standard')
    cy.get('input[name="accountName"]').should('not.have.value', '')

    // Check "Create a card for this account"
    cy.contains('label', 'Create a card for this account').click()
    cy.contains('Card Limit').should('be.visible')

    // Submit
    cy.get('button[type="submit"]').click()

    // Then: success page shows "Account Created"
    cy.contains('Account Created', { timeout: 10000 }).should('be.visible')

    // Capture the new account number and verify card was created via API
    cy.get('h2.font-mono').invoke('text').then((accountNumber) => {
      accountNumber = accountNumber.trim()

      withAdminToken((token) => {
        cy.request({
          method:  'GET',
          url:     `${API_BASE}/api/cards/by-account/${accountNumber}`,
          headers: { Authorization: `Bearer ${token}` },
        }).then(({ body: cards }) => {
          expect(cards, 'card should be auto-created for new account').to.have.length.greaterThan(0)
        })
      })
    })
  })

  // ── Scenario 28 ──────────────────────────────────────────────────────────────

  it('Scenario 28: klijent zahteva karticu — kreiranje kartice se potvrđuje kodom', () => {
    // Intercept both endpoints so we don't need a real email OTP
    cy.intercept('POST', '**/api/cards/request', {
      statusCode: 200,
      body: { requestToken: 'cypress-token-s28' },
    }).as('requestCard')

    cy.intercept('POST', '**/api/cards/request/confirm', {
      statusCode: 200,
      body: {},
    }).as('confirmCard')

    loginAsClient()
    cy.visit('/client/cards/request')
    cy.contains('Request a Card').should('be.visible')

    // Select card brand (first select) and account (second select)
    cy.get('select').eq(0).select('VISA')
    cy.get('select').eq(1).select(seedAccountNumber)

    // Submit card request
    cy.get('button[type="submit"]').click()
    cy.wait('@requestCard')

    // Then: navigated to confirm page
    cy.url().should('include', '/client/cards/confirm')
    cy.contains('Enter Code').should('be.visible')

    // Enter any code (intercepted, so accepted regardless)
    cy.get('input[type="text"]').type('123456')
    cy.get('button[type="submit"]').click()
    cy.wait('@confirmCard')

    // Then: success toast confirms card creation
    cy.contains('Your card has been created successfully.').should('be.visible')
  })

  // ── Scenario 29 ──────────────────────────────────────────────────────────────

  it('Scenario 29: klijent pregleda listu kartica — prikazuju se maskirani brojevi', () => {
    // Ensure seed card is ACTIVE before viewing
    withAdminToken((token) => {
      cy.request({
        method:  'PUT',
        url:     `${API_BASE}/api/cards/${seedCardId}/unblock`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false, // OK if already active
      })
    })

    loginAsClient()
    cy.visit('/client/cards')
    cy.contains('h1', 'Cards').should('be.visible')

    // At least one card row with a font-mono number
    cy.get('p.font-mono').should('have.length.greaterThan', 0)

    // Card numbers should be masked (contain * or • characters)
    cy.get('p.font-mono').first().invoke('text').then((cardNum) => {
      expect(cardNum).to.match(/[*•]/)
    })
  })

  // ── Scenario 30 ──────────────────────────────────────────────────────────────

  it('Scenario 30: klijent blokira karticu — prikazuje se poruka o blokiranju', () => {
    // Ensure seed card is ACTIVE before blocking
    withAdminToken((token) => {
      cy.request({
        method:  'PUT',
        url:     `${API_BASE}/api/cards/${seedCardId}/unblock`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    })

    loginAsClient()
    cy.visit('/client/cards')
    cy.contains('h1', 'Cards').should('be.visible')

    // Click the seed card row (identified by its account number)
    cy.contains(seedAccountNumber).closest('button').click()

    // Modal opens — "Block Card" action is visible (card is ACTIVE)
    cy.contains('Card Details').should('be.visible')
    cy.contains('Block Card').should('be.visible').click()

    // Confirm dialog appears
    cy.contains('Block this card?').should('be.visible')
    cy.contains('Confirm').click()

    // Then: card is blocked — status badge updates to "Blocked"
    cy.contains('Blocked', { timeout: 8000 }).should('be.visible')
  })

  // ── Scenario 31 ──────────────────────────────────────────────────────────────

  it('Scenario 31: zaposleni deblokira karticu — kartica postaje aktivna', () => {
    // Ensure seed card is BLOCKED before the employee unblocks it
    withAdminToken((token) => {
      cy.request({
        method:  'PUT',
        url:     `${API_BASE}/api/cards/${seedCardId}/block`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    })

    loginAsEmployee()
    cy.visit(`/admin/accounts/${seedAccountId}`)

    // Cards section shows the blocked card
    cy.contains('Cards').should('be.visible')
    cy.contains('Blocked').should('be.visible')

    // Click Unblock
    cy.contains('Unblock').click()

    // Then: success toast contains "unblocked"
    cy.contains('unblocked', { timeout: 8000 }).should('be.visible')

    // And: status badge changes to Active
    cy.contains('Active').should('be.visible')
  })

  // ── Scenario 32 ──────────────────────────────────────────────────────────────

  it('Scenario 32: deaktivirana kartica prikazuje status "Deactivated" bez opcije blokiranja', () => {
    // Deactivate seed card via API (employee action)
    withAdminToken((token) => {
      cy.request({
        method:  'PUT',
        url:     `${API_BASE}/api/cards/${seedCardId}/deactivate`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
    })

    loginAsClient()
    cy.visit('/client/cards')
    cy.contains('h1', 'Cards').should('be.visible')

    // The deactivated card row shows "Deactivated" status badge
    cy.contains('Deactivated').should('be.visible')

    // Click the deactivated card row
    cy.contains(seedAccountNumber).closest('button').click()
    cy.contains('Card Details').should('be.visible')

    // Then: "Block Card" action is NOT shown (isActive is false)
    cy.contains('Block Card').should('not.exist')

    // Close modal
    cy.get('button').contains('×').click()
  })

})
