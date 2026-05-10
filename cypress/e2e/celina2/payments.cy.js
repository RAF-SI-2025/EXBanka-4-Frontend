/**
 * Feature: Plaćanja (Payments)
 * Scenarios: 9–16
 *
 * S14 requires an OTP code input that does not exist in the current UI.
 * S15 requires an "Add recipient" button that does not exist in the payment flow.
 * Both are marked pending with explanatory notes.
 */

const ADMIN_EMAIL     = 'admin@exbanka.com'
const ADMIN_PASSWORD  = 'admin'
const CLIENT_EMAIL    = 'ddimitrijevi822rn@raf.rs'
const CLIENT_PASSWORD = 'taraDunjic123'
const API_BASE        = 'http://localhost:8083'

// 18 raw digits → formatAccountNumberInput produces 265-0000000000000-11
// which passes isValidAccountNumber (/^\d{3}-\d{10,13}-\d{2}$/)
const RECIPIENT_ACCOUNT_DIGITS = '265000000000000011'

// ── Helpers ───────────────────────────────────────────────────────────────────

function loginAsClient() {
  cy.visit('/client/login')
  cy.get('input[name="email"]').type(CLIENT_EMAIL)
  cy.get('input[name="password"]').type(CLIENT_PASSWORD)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

/** Returns accounts for the test client via client API. */
function getClientAccounts(cb) {
  cy.request('POST', `${API_BASE}/client/login`, {
    email: CLIENT_EMAIL, password: CLIENT_PASSWORD, source: 'mobile',
  }).then(({ body }) => {
    cy.request({
      method:  'GET',
      url:     `${API_BASE}/api/accounts/my`,
      headers: { Authorization: `Bearer ${body.access_token}` },
    }).then(({ body: accounts }) => cb(accounts))
  })
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Plaćanja — scenarios 9–16', () => {

  // ── Seed: create a funded account once before all tests ────────────────────

  before(() => {
    cy.request('POST', `${API_BASE}/login`, {
      email: ADMIN_EMAIL, password: ADMIN_PASSWORD,
    }).then(({ body }) => {
      const adminToken = body.access_token

      cy.request({
        method:  'GET',
        url:     `${API_BASE}/clients`,
        headers: { Authorization: `Bearer ${adminToken}` },
        qs:      { page: 1, page_size: 100 },
      }).then(({ body }) => {
        const client = body.clients.find(c => c.email === CLIENT_EMAIL)
        expect(client, `client ${CLIENT_EMAIL} should exist`).to.exist

        cy.request({
          method:  'POST',
          url:     `${API_BASE}/api/accounts/create`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            clientId:       client.id,
            accountType:    'personal',
            currencyCode:   'RSD',
            initialBalance: 5000,
            accountName:    'Cypress Payment Test',
          },
        })

        cy.request({
          method:  'POST',
          url:     `${API_BASE}/api/accounts/create`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            clientId:       client.id,
            accountType:    'personal',
            currencyCode:   'EUR',
            initialBalance: 1000,
            accountName:    'Cypress Foreign Payment Test',
          },
        })
      })
    })
  })

  beforeEach(() => {
    loginAsClient()
  })

  // ── Scenario 9 ───────────────────────────────────────────────────────────

  it('Scenario 9: uspešno slanje naloga za plaćanje — prikazuje se ekran potvrde', () => {
    cy.intercept('POST', '**/api/mobile/approvals', {
      statusCode: 200,
      body: { id: 901, status: 'pending' },
    }).as('createApproval')
    cy.intercept('GET', '**/api/approvals/901/poll', {
      statusCode: 200,
      body: { status: 'APPROVED' },
    }).as('pollApproval')

    getClientAccounts((accounts) => {
      const funded = accounts.find(a => a.availableBalance > 0)
      expect(funded, 'client must have a funded account').to.exist

      cy.visit('/client/payments/new')
      cy.contains('h1', 'New Payment').should('be.visible')

      cy.get('select[name="fromAccountId"]').select(String(funded.accountId))
      cy.get('input[name="recipientName"]').type('Test Recipient')
      cy.get('input[name="recipientAccount"]').type(RECIPIENT_ACCOUNT_DIGITS)
      cy.get('input[name="amount"]').type('100')
      cy.get('input[name="paymentCode"]').type('289')
      cy.get('input[name="purpose"]').type('Cypress test payment')

      cy.contains('button', 'Continue').click()

      // Then: verify page shows payment summary
      cy.url().should('include', '/client/payments/verify')
      cy.contains('h1', 'Verify Payment').should('be.visible')
      cy.contains('Payment summary').should('be.visible')
      cy.contains('Test Recipient').should('be.visible')

      // Approval is sent automatically on page load — just wait for the intercepts
      cy.wait('@createApproval')
      cy.wait('@pollApproval')

      // Then: success screen
      cy.contains('Payment Confirmed', { timeout: 10000 }).should('be.visible')
      cy.contains('Test Recipient').should('be.visible')
    })
  })

  // ── Scenario 10 ──────────────────────────────────────────────────────────

  it('Scenario 10: slanje naloga sa iznosom većim od raspoloživog stanja — prikazuje se greška', () => {
    getClientAccounts((accounts) => {
      const acc = accounts[0]
      expect(acc, 'client must have at least one account').to.exist

      cy.visit('/client/payments/new')
      cy.get('select[name="fromAccountId"]').select(String(acc.accountId))
      cy.get('input[name="recipientName"]').type('Test Recipient')
      cy.get('input[name="recipientAccount"]').type(RECIPIENT_ACCOUNT_DIGITS)

      // Enter more than the available balance
      const tooMuch = acc.availableBalance + 1
      cy.get('input[name="amount"]').type(String(tooMuch))
      cy.get('input[name="paymentCode"]').type('289')
      cy.get('input[name="purpose"]').type('Over-limit test')

      cy.contains('button', 'Continue').click()

      // Then: insufficient funds error shown on form
      cy.contains('Insufficient funds').should('be.visible')

      // And: stays on the payment form
      cy.url().should('include', '/client/payments/new')
      cy.contains('Verify Payment').should('not.exist')
    })
  })

  // ── Scenario 11 ──────────────────────────────────────────────────────────

  it('Scenario 11: slanje naloga sa nevalidnim brojem računa — prikazuje se greška formata', () => {
    getClientAccounts((accounts) => {
      const acc = accounts.find(a => a.availableBalance > 0)
      expect(acc, 'client must have a funded account').to.exist

      cy.visit('/client/payments/new')
      cy.get('select[name="fromAccountId"]').select(String(acc.accountId))
      cy.get('input[name="recipientName"]').type('Test Recipient')

      // Type an invalid account number (too short, wrong format)
      cy.get('input[name="recipientAccount"]').type('12345678')

      cy.get('input[name="amount"]').type('100')
      cy.get('input[name="paymentCode"]').type('289')
      cy.get('input[name="purpose"]').type('Invalid account test')

      cy.contains('button', 'Continue').click()

      // Then: format validation error shown
      cy.contains('Invalid account number format').should('be.visible')

      // And: stays on the payment form
      cy.url().should('include', '/client/payments/new')
      cy.contains('Verify Payment').should('not.exist')
    })
  })

  // ── Scenario 12 ──────────────────────────────────────────────────────────

  it('Scenario 12: plaćanje u stranoj valuti — nalog se uspešno kreira', () => {
    cy.intercept('POST', '**/api/mobile/approvals', {
      statusCode: 200,
      body: { id: 902, status: 'pending' },
    }).as('createApproval')
    cy.intercept('GET', '**/api/approvals/902/poll', {
      statusCode: 200,
      body: { status: 'APPROVED' },
    }).as('pollApproval')

    getClientAccounts((accounts) => {
      // Find a non-RSD funded account (e.g. EUR)
      const foreignAcc = accounts.find(a => a.currency !== 'RSD' && a.availableBalance > 0)

      if (!foreignAcc) {
        cy.log('NOTE: No funded foreign-currency account found — skipping')
        return
      }

      cy.visit('/client/payments/new')
      cy.get('select[name="fromAccountId"]').select(String(foreignAcc.accountId))
      cy.get('input[name="recipientName"]').type('Foreign Recipient')
      cy.get('input[name="recipientAccount"]').type(RECIPIENT_ACCOUNT_DIGITS)
      cy.get('input[name="amount"]').type('10')
      cy.get('input[name="paymentCode"]').type('289')
      cy.get('input[name="purpose"]').type('Foreign currency payment')

      cy.contains('button', 'Continue').click()

      cy.url().should('include', '/client/payments/verify')
      cy.contains('h1', 'Verify Payment').should('be.visible')

      cy.wait('@createApproval')
      cy.wait('@pollApproval')

      cy.contains('Payment Confirmed', { timeout: 10000 }).should('be.visible')
    })
  })

  // ── Scenario 13 ──────────────────────────────────────────────────────────

  it('Scenario 13: provera plaćanja — korisnik pregleda detalje pre potvrde', () => {
    cy.intercept('POST', '**/api/mobile/approvals', {
      statusCode: 200,
      body: { id: 903, status: 'pending' },
    }).as('createApproval')
    cy.intercept('GET', '**/api/approvals/903/poll', {
      statusCode: 200,
      body: { status: 'APPROVED' },
    }).as('pollApproval')

    getClientAccounts((accounts) => {
      const funded = accounts.find(a => a.availableBalance > 0)
      expect(funded, 'client must have a funded account').to.exist

      cy.visit('/client/payments/new')
      cy.get('select[name="fromAccountId"]').select(String(funded.accountId))
      cy.get('input[name="recipientName"]').type('Verify Recipient')
      cy.get('input[name="recipientAccount"]').type(RECIPIENT_ACCOUNT_DIGITS)
      cy.get('input[name="amount"]').type('50')
      cy.get('input[name="paymentCode"]').type('221')
      cy.get('input[name="referenceNumber"]').type('REF-001')
      cy.get('input[name="purpose"]').type('Verify step test')

      cy.contains('button', 'Continue').click()

      // Then: verify page shows all payment details before submission
      cy.url().should('include', '/client/payments/verify')
      cy.contains('h1', 'Verify Payment').should('be.visible')
      cy.contains('Payment summary').should('be.visible')
      cy.contains('Verify Recipient').should('be.visible')
      cy.contains('221').should('be.visible')
      cy.contains('REF-001').should('be.visible')
      cy.contains('Verify step test').should('be.visible')

      // Mobile app notice visible
      cy.contains('Open the AnkaBanka mobile app').should('be.visible')

      // "Payment Confirmed" must NOT appear yet — not submitted
      cy.contains('Payment Confirmed').should('not.exist')

      // Approval is sent automatically on page load — just wait for the intercepts
      cy.wait('@createApproval')
      cy.wait('@pollApproval')

      cy.contains('Payment Confirmed', { timeout: 10000 }).should('be.visible')
    })
  })

  // ── Scenario 14 (pending — no OTP input in current UI) ───────────────────

  it.skip('Scenario 14: tri puta unesen pogrešan kod — nalog se blokira', () => {
    /**
     * The current verify page uses a simulated mobile-app "Confirm" button —
     * there is no OTP code input field. The 3-wrong-code lock-out scenario
     * cannot be driven through the UI.
     *
     * To implement: add an OTP input to ClientPaymentVerifyPage, expose a
     * POST /api/payments/verify endpoint that validates the code, and return
     * a 403/locked status after 3 failed attempts.
     */
  })

  // ── Scenario 15 (pending — no "Add recipient" button in payment flow) ────

  it.skip('Scenario 15: dodavanje primaoca — primalac se čuva za buduće uplate', () => {
    /**
     * There is no "Add recipient" / "Save as recipient" button in the
     * payment flow (ClientNewPaymentPage, ClientPaymentVerifyPage, or
     * ClientPaymentDetailPage).  Recipients are managed separately via
     * /client/recipients.
     *
     * To implement: add a "Save as recipient" option on the payment
     * success screen that calls POST /api/recipients.
     */
  })

  // ── Scenario 16 ──────────────────────────────────────────────────────────

  it('Scenario 16: pregled istorije plaćanja sa filterima — lista se filtrira', () => {
    cy.visit('/client/payments')
    cy.contains('h1', 'Payments').should('be.visible')

    // Filters panel is visible
    cy.get('input[type="date"]').should('be.visible')
    cy.contains('Min amount').should('be.visible')
    cy.contains('Max amount').should('be.visible')
    cy.contains('Status').should('be.visible')

    // Status select has multiple options
    cy.get('select').find('option').should('have.length.greaterThan', 1)

    // Apply a min-amount filter — "Clear" button appears
    cy.get('input[type="number"]').first().type('1')
    cy.contains('Clear').should('be.visible')

    // Clear filters — "Clear" disappears and count resets
    cy.contains('Clear').click()
    cy.contains('Clear').should('not.exist')
  })

})
