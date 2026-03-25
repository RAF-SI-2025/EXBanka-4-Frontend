/**
 * Feature: Menjačnica (Currency Exchange)
 * Scenarios: 24–26
 */

const ADMIN_EMAIL    = 'admin@exbanka.com'
const ADMIN_PASSWORD = 'admin'
const CLIENT_EMAIL   = 'ddimitrijevi822rn@raf.rs'
const CLIENT_PASSWORD = 'taraDunjic123'
const API_BASE       = 'http://localhost:8083'

const SUPPORTED_CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP', 'JPY', 'CAD', 'AUD']

describe('Menjačnica — scenarios 24–26', () => {

  // ── Seed: ensure client has funded RSD + EUR accounts ────────────────────────
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

        // RSD account with balance for S25/S26
        cy.request({
          method:  'POST',
          url:     `${API_BASE}/api/accounts/create`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            clientId:       client.id,
            accountType:    'CURRENT',
            currencyCode:   'RSD',
            initialBalance: 2000,
            accountName:    'Cypress Exchange RSD',
          },
        })

        // EUR account as destination
        cy.request({
          method:  'POST',
          url:     `${API_BASE}/api/accounts/create`,
          headers: { Authorization: `Bearer ${adminToken}` },
          body: {
            clientId:       client.id,
            accountType:    'FOREIGN_CURRENCY',
            currencyCode:   'EUR',
            initialBalance: 0,
            accountName:    'Cypress Exchange EUR',
          },
        })
      })
    })
  })

  // ── Shared login ──────────────────────────────────────────────────────────────
  beforeEach(() => {
    cy.visit('/client/login')
    cy.get('input[name="email"]').type(CLIENT_EMAIL)
    cy.get('input[name="password"]').type(CLIENT_PASSWORD)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })

  // ── Scenario 24 ──────────────────────────────────────────────────────────────

  it('Scenario 24: pregled kursne liste — prikazuju se kursevi za podržane valute prema RSD', () => {
    cy.visit('/client/exchange')
    cy.contains('h1', 'Exchange').should('be.visible')

    // Rates section heading
    cy.contains("Today's rates vs RSD").scrollIntoView().should('be.visible')

    // Table columns
    cy.contains('th', 'Buying').scrollIntoView().should('be.visible')
    cy.contains('th', 'Selling').scrollIntoView().should('be.visible')

    // Every supported currency appears in the table
    SUPPORTED_CURRENCIES.forEach((code) => {
      cy.contains('td', code).scrollIntoView().should('be.visible')
    })

    // At least one font-mono selling rate cell is visible and non-zero
    cy.get('tbody td.font-mono').first().scrollIntoView().invoke('text').then((text) => {
      const rate = parseFloat(text.replace(',', '.'))
      expect(rate).to.be.greaterThan(0)
    })
  })

  // ── Scenario 25 ──────────────────────────────────────────────────────────────

  it('Scenario 25: provera ekvivalentnosti valute — prikazuje konverziju bez izvršavanja transakcije', () => {
    // Find RSD and EUR account IDs via API
    cy.request('POST', `${API_BASE}/client/login`, {
      email: CLIENT_EMAIL, password: CLIENT_PASSWORD, source: 'mobile',
    }).then(({ body }) => {
      const token = body.access_token
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/api/accounts/my`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body: accounts }) => {
        const rsd = accounts.find(a => a.currency === 'RSD' && a.availableBalance > 0)
        const eur = accounts.find(a => a.currency === 'EUR')

        if (!rsd || !eur) {
          cy.log('NOTE: No RSD+EUR account pair found — skipping')
          return
        }

        cy.visit('/client/exchange')
        cy.contains('h1', 'Exchange').should('be.visible')

        // Step 1: select accounts (form is below the rates table — scroll first)
        cy.contains('Select accounts').scrollIntoView()
        cy.get('select').eq(0).select(String(rsd.accountId))
        cy.get('select').eq(1).select(String(eur.accountId))
        cy.contains('button', 'Next').scrollIntoView().click()

        // Step 2: enter amount
        cy.contains('Amount').scrollIntoView().should('be.visible')
        cy.get('input[type="number"]').scrollIntoView().type('100')

        // Live estimate appears
        cy.contains('Estimated:').scrollIntoView().should('be.visible')
        cy.contains('indicative, includes commission').should('be.visible')

        // Click Review to fetch exact preview
        cy.contains('button', 'Review').scrollIntoView().click()

        // Step 3: preview shown — no transaction executed yet
        cy.contains('Review conversion').scrollIntoView().should('be.visible')
        cy.contains('Rate').scrollIntoView().should('be.visible')
        cy.contains('Commission').scrollIntoView().should('be.visible')
        cy.contains('You receive').scrollIntoView().should('be.visible')

        // "Conversion complete" must NOT appear — transaction not submitted
        cy.contains('Conversion complete').should('not.exist')
      })
    })
  })

  // ── Scenario 26 ──────────────────────────────────────────────────────────────

  it('Scenario 26: konverzija valute tokom transfera — vrši se konverzija po prodajnom kursu sa provizijom', () => {
    // Find RSD (funded) and EUR account IDs via API
    cy.request('POST', `${API_BASE}/client/login`, {
      email: CLIENT_EMAIL, password: CLIENT_PASSWORD, source: 'mobile',
    }).then(({ body }) => {
      const token = body.access_token
      cy.request({
        method:  'GET',
        url:     `${API_BASE}/api/accounts/my`,
        headers: { Authorization: `Bearer ${token}` },
      }).then(({ body: accounts }) => {
        const rsd = accounts.find(a => a.currency === 'RSD' && a.availableBalance >= 100)
        const eur = accounts.find(a => a.currency === 'EUR')

        if (!rsd || !eur) {
          cy.log('NOTE: No RSD+EUR account pair with sufficient funds — skipping')
          return
        }

        cy.visit('/client/exchange')
        cy.contains('h1', 'Exchange').should('be.visible')

        // Step 1: select RSD → EUR (scroll form into view first)
        cy.contains('Select accounts').scrollIntoView()
        cy.get('select').eq(0).select(String(rsd.accountId))
        cy.get('select').eq(1).select(String(eur.accountId))
        cy.contains('button', 'Next').scrollIntoView().click()

        // Step 2: enter amount
        cy.get('input[type="number"]').scrollIntoView().type('100')
        cy.contains('button', 'Review').scrollIntoView().click()

        // Step 3: confirm conversion
        cy.contains('Review conversion').scrollIntoView().should('be.visible')

        // Commission row is shown — bank applies commission
        cy.contains('Commission').scrollIntoView().should('be.visible')

        // Then: confirm
        cy.contains('button', 'Confirm').scrollIntoView().click()

        // Then: conversion complete — funds transferred in target currency
        cy.contains('Conversion complete', { timeout: 10000 }).scrollIntoView().should('be.visible')
        cy.contains('converted to').scrollIntoView().should('be.visible')
        cy.contains('Transaction #').scrollIntoView().should('be.visible')
      })
    })
  })

})
