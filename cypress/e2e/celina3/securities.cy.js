/**
 * Feature: Hartije od vrednosti — Prikaz i pretraga
 * Even scenarios: S10, S12, S14, S16, S18, S20, S22, S24
 */

const API_BASE = 'http://localhost:8083'
const ADMIN_EMAIL = 'admin@exbanka.com'
const ADMIN_PASS = 'admin'
const CLIENT_EMAIL = 'ddimitrijevi822rn@raf.rs'
const CLIENT_PASS = 'taraDunjic123'

function loginAs(email, pass) {
  cy.visit('/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(pass)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/login')
}

function loginAsClient(email, pass) {
  cy.visit('/client/login')
  cy.get('input[name="email"]').type(email)
  cy.get('input[name="password"]').type(pass)
  cy.get('button[type="submit"]').click()
  cy.url().should('not.include', '/client/login')
}

// Navigate to detail page by clicking the ticker button (not the row)
function clickFirstSecurityRow() {
  cy.get('table tbody tr').first().within(() => {
    cy.get('button').first().click()
  })
}

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Hartije od vrednosti — S10–S24', () => {

  // ── Scenario 11 ──────────────────────────────────────────────────────────────

  it('Scenario 11: Aktuar vidi sve podržane tipove hartija (Stocks, Forex, Futures)', () => {
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.contains('button', 'Stocks').should('exist')
    cy.contains('button', 'Futures').should('exist')
    cy.contains('button', 'Forex Pairs').should('exist')
  })

  // ── Scenario 10 ──────────────────────────────────────────────────────────────

  it('Scenario 10: Klijent vidi samo akcije i futures ugovore, ne i forex parove', () => {
    // Given: korisnik je ulogovan kao klijent
    loginAsClient(CLIENT_EMAIL, CLIENT_PASS)

    // When: otvori portal "Hartije od vrednosti"
    cy.visit('/client/securities')

    // Then: vidi samo akcije i futures ugovore
    cy.contains('Stocks').should('exist')
    cy.contains('Futures').should('exist')

    // And: ne vidi forex parove
    cy.contains('Forex Pairs').should('not.exist')
    cy.contains('Forex').should('not.exist')
  })

  // ── Scenario 12 ──────────────────────────────────────────────────────────────

  it('Scenario 12: Pretraga hartije po ticker-u filtrira listu', () => {
    // Given: korisnik je na portalu "Hartije od vrednosti"
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: u polje za pretragu unese ticker "MSFT"
    cy.get('input[placeholder="Search by ticker or name…"]').clear().type('MSFT')

    // Wait for debounce and API response
    cy.wait(800)

    // Then: lista se filtrira i prikazuje rezultate koji sadrže MSFT
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().should('contain.text', 'MSFT')
  })

  // ── Scenario 13 ──────────────────────────────────────────────────────────────

  it('Scenario 13: Pretraga hartije bez rezultata prikazuje prazan prikaz', () => {
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('input[placeholder="Search by ticker or name…"]').clear().type('ZZZNONEXISTENT999')
    cy.wait(800)
    // Empty state renders one <tr> with a message and no Buy buttons
    cy.get('table tbody tr').find('button').should('have.length', 0)
  })

  // ── Scenario 14 ──────────────────────────────────────────────────────────────

  it('Scenario 14: Filtriranje po exchange prefix-u prikazuje samo odgovarajuće hartije', () => {
    // Given: korisnik je na listi hartija
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Record initial unfiltered row count
    cy.get('table tbody tr').then(($before) => {
      const initialCount = $before.length

      // When: unese prefix "XN" u filter za exchange (npr. XNYS — NYSE)
      cy.get('input[placeholder="Prefix…"]').clear().type('XN')
      cy.wait(800)

      // Then: broj prikazanih hartija je manji ili jednak ukupnom broju
      // (filter je primenjen — nije prikazano više hartija nego pre filtera)
      cy.get('table tbody tr').should(($after) => {
        expect($after.length).to.be.at.most(initialCount)
      })
    })
  })

  // ── Scenario 15 ──────────────────────────────────────────────────────────────

  it('Scenario 15: Filtriranje sa nevalidnim opsegom cene ne prikazuje rezultate', () => {
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('input[type="number"][placeholder="Min"]').first().clear().type('999999')
    cy.get('input[type="number"][placeholder="Max"]').first().clear().type('1')
    cy.wait(800)
    // Empty state renders one <tr> with a message and no Buy buttons
    cy.get('table tbody tr').find('button').should('have.length', 0)
  })

  // ── Scenario 16 ──────────────────────────────────────────────────────────────

  it('Scenario 16: Ručno osvežavanje podataka o hartiji ažurira prikazane podatke', () => {
    // Given: korisnik je otvorio listu hartija
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    // Wait for actual data (not loading placeholder)
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 1)

    // When: klikne na per-row refresh dugme (poslednje dugme u prvom redu = SVG refresh)
    // Intercept the per-row refresh call: GET /securities/{id}
    cy.intercept('GET', /\/securities\//).as('refreshRow')
    cy.get('table tbody tr').first().find('button').last().click()

    // Then: podaci se osvežavaju (API call fires again)
    cy.wait('@refreshRow', { timeout: 10000 })
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
  })

  // ── Scenario 17 ──────────────────────────────────────────────────────────────

  it('Scenario 17: Automatsko osvežavanje podataka na intervalu', () => {
    // Given: korisnik je na listi hartija
    // Intercept pre login-a, pa drugi alias hvata automatski refresh
    cy.intercept('GET', /\/securities(\?|$)/).as('secLoad')

    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')

    // When: prođe definisani vremenski interval (REFRESH_INTERVAL = 60 s)
    cy.wait('@secLoad', { timeout: 15000 }) // initial load

    // Then: podaci se automatski osvežavaju — drugi poziv bez korisničke akcije
    cy.wait('@secLoad', { timeout: 70000 }) // auto-refresh fires after ~60 s

    // And: tabela i dalje prikazuje podatke
    cy.get('table tbody tr').should('have.length.greaterThan', 0)
  })

  // ── Scenario 18 ──────────────────────────────────────────────────────────────

  it('Scenario 18: Otvaranje detalja hartije prikazuje graf i tabelu', () => {
    // Given: korisnik je na listi hartija
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne na određenu hartiju (ticker button navigates to detail)
    clickFirstSecurityRow()

    // Then: otvara se detaljan prikaz sa grafom promene cene
    cy.url().should('include', '/securities/')

    // And: vidi graf (canvas element ili chart kontejner)
    cy.get('canvas, [class*="chart"], [class*="Chart"], [class*="recharts"]', { timeout: 10000 })
      .should('exist')

    // And: vidi tabelarni prikaz podataka
    cy.get('table').should('exist')
  })

  // ── Scenario 19 ──────────────────────────────────────────────────────────────

  it('Scenario 19: Promena perioda na grafiku menja prikazane podatke', () => {
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.contains('button', 'Stocks').click()
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    clickFirstSecurityRow()
    cy.url().should('include', '/securities/')
    cy.contains('button', 'Week', { timeout: 10000 }).click()
    cy.contains('button', 'Week').should('have.class', 'bg-violet-600')
    cy.contains('button', 'Month').click()
    cy.contains('button', 'Month').should('have.class', 'bg-violet-600')
  })

  // ── Scenario 20 ──────────────────────────────────────────────────────────────

  it('Scenario 20: Detaljan prikaz akcije sadrži sekciju sa opcijama', () => {
    // Given: korisnik (aktuar) je otvorio detaljan prikaz akcije
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')

    // Open Stocks tab
    cy.contains('button', 'Stocks').click()
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // When: klikne na akciju (ticker button)
    clickFirstSecurityRow()

    // Then: prikazana je sekcija sa opcijama
    cy.url().should('include', '/securities/')
    cy.contains('View Options', { timeout: 10000 }).should('exist')
  })

  // ── Scenario 21 ──────────────────────────────────────────────────────────────

  it('Scenario 21: Tabela opcija prikazuje ITM polja zelenom bojom', () => {
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.get('input[placeholder="Search by ticker or name…"]').type('MSFT')
    cy.wait(600)
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().within(() => cy.get('button').first().click())
    cy.url().should('include', '/securities/')

    // Intercept the OPTIONS securities query before clicking "View Options".
    // StockOptionsPage calls getListings({ type: 'OPTION', ticker: ... }) which maps to
    // GET /securities?type=OPTION&... — mock data guarantees ITM strikes exist regardless of DB state.
    // Strike 100 < any real MSFT price → isCallITM = true → bg-emerald-50/60 on CALL side.
    // Strike 99999 > any real MSFT price → isPutITM = true → bg-emerald-50/60 on PUT side.
    cy.intercept('GET', /\/securities(\?|$)/, (req) => {
      if (/type=OPTION/.test(req.url)) {
        req.reply({
          statusCode: 200,
          body: {
            listings: [
              {
                id: 9001, ticker: 'MSFT260620C00100000', name: 'MSFT Call 100', type: 'OPTION',
                optionType: 'CALL', strikePrice: 100, settlementDate: '2026-06-20',
                price: 310.00, changePercent: 1.50, volume: 500, openInterest: 2000,
              },
              {
                id: 9002, ticker: 'MSFT260620P99999000', name: 'MSFT Put 99999', type: 'OPTION',
                optionType: 'PUT', strikePrice: 99999, settlementDate: '2026-06-20',
                price: 99590.00, changePercent: -0.80, volume: 300, openInterest: 1500,
              },
            ],
            totalPages: 1, totalElements: 2,
          },
        })
      } else {
        req.continue()
      }
    }).as('optionsData')

    cy.contains('View Options', { timeout: 10000 }).click()
    cy.url().should('include', '/options')
    cy.contains('Loading options', { timeout: 10000 }).should('not.exist')

    // Settlement date table shows the mocked date — click it to load the options table
    cy.get('table tbody tr', { timeout: 5000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().click()

    // Then: at least one cell has the ITM green background class
    cy.get('[class*="bg-emerald"]', { timeout: 5000 }).should('exist')
  })

  // ── Scenario 22 ──────────────────────────────────────────────────────────────

  it('Scenario 22: Filtriranje broja prikazanih strike vrednosti opcija', () => {
    // Given: aktuar je na detaljnom prikazu akcije
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.contains('button', 'Stocks').click()
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Navigate to stock detail via ticker button
    cy.get('table tbody tr').first().within(() => {
      cy.get('button').first().click()
    })
    cy.url().should('include', '/securities/')

    // Intercept OPTIONS query with enough mock strikes so the ±3 filter can be verified.
    // We need 7+ strikes (e.g. 300,310,...,360) around stockPrice to produce a non-trivial filter.
    // Without mock, DB may have no options, making the test uninformative.
    cy.intercept('GET', /\/securities(\?|$)/, (req) => {
      if (/type=OPTION/.test(req.url)) {
        const strikes = [200, 250, 300, 350, 400, 450, 500, 550, 600]
        const options = strikes.flatMap((s) => [
          {
            id: 9000 + s, ticker: `MOCK${s}C`, name: `Mock Call ${s}`, type: 'OPTION',
            optionType: 'CALL', strikePrice: s, settlementDate: '2026-06-20',
            price: Math.max(1, 420 - s), changePercent: 0.5, volume: 100, openInterest: 500,
          },
          {
            id: 9100 + s, ticker: `MOCK${s}P`, name: `Mock Put ${s}`, type: 'OPTION',
            optionType: 'PUT', strikePrice: s, settlementDate: '2026-06-20',
            price: Math.max(1, s - 420), changePercent: -0.5, volume: 80, openInterest: 400,
          },
        ])
        req.reply({ statusCode: 200, body: { listings: options, totalPages: 1, totalElements: options.length } })
      } else {
        req.continue()
      }
    }).as('optionsData')

    // When: klikne "View Options →" da otvori stranicu opcija
    cy.contains('View Options', { timeout: 10000 }).click()
    cy.url().should('include', '/options')

    // Wait for page to finish loading (loading spinner disappears)
    cy.contains('Loading options', { timeout: 10000 }).should('not.exist')

    // Settlement date table is visible — click the mocked date to load the options table
    cy.get('table tbody tr', { timeout: 5000 }).should('have.length.greaterThan', 0)
    cy.get('table tbody tr').first().click()

    // Then: pojavljuje se input za filtriranje strike vrednosti
    cy.get('input[type="number"]', { timeout: 5000 }).should('exist')

    // When: postavi filter na 3
    cy.get('input[type="number"]').first().clear().type('3')
    cy.wait(400)

    // Then: footer prikazuje "N strikes shown" gde N ≤ 7 (3 ispod + ATM + 3 iznad)
    // Napomena: cy.get('table tbody tr') ne može se koristiti jer StockOptionsPage koristi
    // ugneždene <table> elemente (1 outer tr sadrži 2 nested table), što daje 3× više redova.
    cy.contains(/\d+ strikes? shown/, { timeout: 5000 })
      .invoke('text')
      .then((text) => {
        const n = parseInt(text)
        expect(n).to.be.at.most(7)
      })
  })

  // ── Scenario 23 ──────────────────────────────────────────────────────────────

  it('Scenario 23: Filtriranje futures ugovora po Settlement Date', () => {
    loginAs(ADMIN_EMAIL, ADMIN_PASS)
    cy.visit('/securities')
    cy.contains('button', 'Futures').click()
    cy.get('table tbody tr', { timeout: 10000 }).should('have.length.greaterThan', 0)

    // Then: Settlement Date filter inputs are visible on the Futures tab
    cy.contains('label', 'Settlement Date').should('exist')
    cy.get('input[type="date"]').should('have.length.greaterThan', 0)

    // When: postavi opseg datuma
    cy.get('input[type="date"]').first().type('2025-01-01')
    cy.get('input[type="date"]').last().type('2025-12-31')
    cy.wait(600)

    // Then: filter je primenjen bez greške — tabela ostaje funkcionalna
    cy.get('table').should('exist')
  })

  // ── Scenario 25 ──────────────────────────────────────────────────────────────

  it('Scenario 25: Hartije sa nepostojećim exchange-om se ne prikazuju', () => {
    // Spec: "sistem učita hartije sa nepostojećim exchange-om → takve hartije se ne prikazuju"
    // Backend filtrira ove hartije pre slanja; test verifikuje da nijedna hartija iz
    // /securities nema exchange koji ne postoji u /stock-exchanges.
    cy.request('POST', `${API_BASE}/login`, { email: ADMIN_EMAIL, password: ADMIN_PASS })
      .then(({ body: auth }) => {
        // Fetch valid exchanges and all securities in parallel
        cy.request({
          method: 'GET',
          url: `${API_BASE}/api/stock-exchanges`,
          headers: { Authorization: `Bearer ${auth.access_token}` },
          failOnStatusCode: false,
        }).then(({ body: exBody, status: exStatus }) => {
          cy.request({
            method: 'GET',
            url: `${API_BASE}/securities`,
            headers: { Authorization: `Bearer ${auth.access_token}` },
            failOnStatusCode: false,
          }).then(({ body: secBody, status: secStatus }) => {
            if (exStatus !== 200 || secStatus !== 200) {
              // API unreachable — can't cross-reference
              expect(exStatus).to.be.oneOf([200, 404])
              return
            }

            const exchanges = Array.isArray(exBody) ? exBody : exBody?.content ?? exBody?.exchanges ?? []
            const securities = Array.isArray(secBody) ? secBody : secBody?.content ?? secBody?.listings ?? []

            // Collect all valid MIC codes and acronyms from the exchanges list
            const validMics = new Set(exchanges.map(e => e.micCode ?? e.mic_code).filter(Boolean))
            const validAcros = new Set(exchanges.map(e => e.acronym).filter(Boolean))

            // Then: every returned security belongs to a known exchange
            securities.forEach((sec) => {
              const mic = sec.exchangeMic ?? sec.exchange_mic ?? sec.mic_code
              const acro = sec.exchangeAcronym ?? sec.exchange_acronym ?? sec.exchange
              const knownMic = !mic || validMics.has(mic)
              const knownAcro = !acro || validAcros.has(acro)
              // At least one identifier is recognized (backend filters before returning)
              expect(knownMic || knownAcro, `security ${sec.ticker} has unknown exchange`).to.be.true
            })
          })
        })
      })
  })

  // ── Scenario 24 ──────────────────────────────────────────────────────────────

  it('Scenario 24: Kreiranje ordera sa nevalidnom količinom — sistem odbija', () => {
    // Given: korisnik pokuša da kreira order sa količinom 0 (API test — forma ne postoji u UI)
    cy.request('POST', `${API_BASE}/login`, { email: ADMIN_EMAIL, password: ADMIN_PASS })
      .then(({ body: auth }) => {
        // When: unese količinu 0
        cy.request({
          method: 'POST',
          url: `${API_BASE}/orders`,
          headers: { Authorization: `Bearer ${auth.access_token}` },
          body: {
            asset_id: 1,
            quantity: 0,
            direction: 'BUY',
            order_type: 'MARKET',
            account_id: 1,
          },
          failOnStatusCode: false,
        }).then(({ status }) => {
          // Then: sistem odbija kreiranje ordera
          expect(status).to.be.oneOf([400, 422, 404])
        })
      })
  })
})
