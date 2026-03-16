# EXBanka-4-Frontend

## Project overview
Client-facing and employee banking portal built with React + Vite + Tailwind CSS. Two separate portals share the same codebase:
- **Employee portal** — `/` and `/admin/*` routes, protected by JWT auth
- **Client portal** — `/client/*` routes, protected by client auth context

## Stack
- React 18, React Router v6
- Tailwind CSS v3 with custom utility classes (`input-field`, `btn-primary`, `input-error`) defined in `src/index.css`
- Axios for API calls (via `src/services/apiClient.js`)
- Vite dev server

## Commands
```bash
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build
```

## Project structure
```
src/
├── pages/
│   ├── client/       # client portal pages (/client/*)
│   ├── employee/     # employee portal pages (/, /admin/*, /login, etc.)
│   └── NotFoundPage.jsx
├── layouts/
│   ├── ClientPortalLayout.jsx   # sidebar + navbar for logged-in client pages
│   └── MainLayout.jsx           # navbar + footer for employee pages
├── context/          # React context providers (Auth, ClientAuth, ClientAccounts, ClientPayments, Recipients, Theme, Employees, Clients, Accounts)
├── components/       # shared components (Navbar, ProtectedRoute, PermissionGate, etc.)
├── models/           # plain JS classes (BankAccount, Client, Employee, Payment, Recipient)
├── mocks/            # in-memory mock data (bankAccounts, clientAccounts, clients, employees, payments, recipients)
├── services/         # API service functions (apiClient, authService, clientAuthService, clientAccountService, paymentService, recipientService, transferService, etc.)
├── hooks/            # custom hooks (useWindowTitle, usePermission)
└── utils/            # utilities (permissions, formatting)
```

## Architecture notes

### Auth
- **Employee auth**: JWT stored via `tokenService`, managed in `AuthContext`. `ProtectedRoute` guards `/admin/*`.
- **Client auth**: `ClientAuthContext` wraps client portal. `clientAuthService` handles login/logout with mock backing until backend is ready.

### Mock data / API swap pattern
All pages that hit APIs use mock data while the backend is not ready. The pattern is:
1. Mock data lives in `src/mocks/` as instances of the model classes from `src/models/`
2. Services in `src/services/` export async functions — swap the body for real API calls without touching call sites
3. Context providers (`ClientAccountsContext`, `ClientPaymentsContext`, etc.) consume services and expose data via hooks
4. Model files export a `*FromApi()` mapper function to convert backend responses

Key split: `src/mocks/bankAccounts.js` is the employee-portal view of all bank accounts; `src/mocks/clientAccounts.js` is the client-portal view of the logged-in client's own accounts.

When wiring transfers or other mutations: update the relevant service's in-memory store (e.g. `clientAccountService.applyTransfer`), then call `reload()` from the context after the operation so all pages reflect the new state.

### Client portal layout
All logged-in client pages (except `ClientHomePage` which doubles as a landing page) use `<ClientPortalLayout>` which provides the sidebar and navbar. `NAV_ITEMS` is exported from `ClientPortalLayout.jsx` and shared with `ClientHomePage`.

### Shared utilities
- `src/utils/formatting.js` — `fmt(n, currency?)` for Serbian-locale number formatting

### Styling conventions
- Use existing Tailwind classes — avoid inline styles except for dynamic values (e.g. `gridTemplateAreas`)
- `input-field` — standard text/select/date input
- `input-error` — red border variant applied alongside `input-field`
- `btn-primary` — violet filled button

## Current status (Sprint 2)
Backend not yet integrated — all data is mocked. Pages are structured so API wiring only requires updating service functions and removing mock imports.

### Implemented client portal pages
| Route | Page | Notes |
|---|---|---|
| `/client` | ClientHomePage (landing + dashboard) | #36, #46 |
| `/client/login` | ClientLoginPage | #36 |
| `/client/accounts` | ClientAccountsOverviewPage | #19 |
| `/client/accounts/:id` | ClientAccountDetailPage | #20 |
| `/client/payments` | ClientPaymentsPage | #22 |
| `/client/payments/new` | ClientNewPaymentPage | #24 |
| `/client/payments/verify` | ClientPaymentVerifyPage | #25 |
| `/client/payments/:id` | ClientPaymentDetailPage | #33 |
| `/client/transfers` | ClientTransfersPage | #26 |
| `/client/recipients` | ClientRecipientsPage | #27, #28, #29, #30 |
| `/client/exchange` | ClientExchangePage | stub |
| `/client/cards` | ClientCardsPage | stub |
| `/client/loans` | ClientLoansPage | stub |

### Implemented employee portal pages
Employee list, detail, create — client list, detail, create — account list, detail, create. Auth pages (login, forgot password, set/reset password).
