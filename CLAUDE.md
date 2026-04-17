# EXBanka-4-Frontend

## Project overview
Client-facing and employee banking portal built with React + Vite + Tailwind CSS. Two separate portals share the same codebase:
- **Employee portal** — `/` and `/admin/*` routes, protected by JWT auth
- **Client portal** — `/client/*` routes, protected by client auth context

## Stack
- React 18, React Router v6
- Tailwind CSS v3 with custom utility classes (`input-field`, `btn-primary`, `input-error`) defined in `src/index.css`
- Axios for API calls — two instances: `src/services/apiClient.js` (employee) and `src/services/clientApiClient.js` (client)
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
│   ├── securities/   # securities/listings pages (/securities/*, employee only)
│   └── NotFoundPage.jsx
├── layouts/
│   ├── ClientPortalLayout.jsx   # sidebar + navbar for logged-in client pages
│   └── MainLayout.jsx           # navbar + footer for employee pages
├── context/          # React context providers (Auth, ClientAuth, ClientAccounts, ClientPayments, Recipients, Theme, ApiError, Employees, Clients, Accounts)
├── components/       # shared components (Navbar, Footer, ProtectedRoute, PermissionGate, CardBrand, CardDetailModal, Spinner)
├── models/           # plain JS classes with *FromApi() mappers (BankAccount, Card, Client, Employee, Payment, Recipient)
├── mocks/            # legacy in-memory mock data — not imported anywhere, safe to delete
├── services/         # API service functions (apiClient, clientApiClient, authService, clientAuthService, clientAccountService, paymentService, recipientService, transferService, cardService, exchangeService, loanService, securitiesService, clientSecuritiesService, orderService, etc.)
├── hooks/            # custom hooks (useWindowTitle, usePermission)
└── utils/            # utilities (permissions, formatting)
```

## Architecture notes

### Auth
- **Employee auth**: `POST /login` → `{ access_token, refresh_token }` stored in **sessionStorage**. JWT decoded client-side (no signature verification) for claims: `user_id`, `first_name`, `last_name`, `email`, `dozvole` (permissions). Session restored on app mount via `authService.restoreSession()`. Also implements activate (`POST /auth/activate`), forgot-password, and reset-password flows.
- **Client auth**: `POST /client/login` → tokens stored in sessionStorage under `client_access_token` / `client_refresh_token`. Managed by `clientAuthService` + `clientTokenService`. Claims: `user_id`, `first_name`, `last_name`, `email`.
- Both `AuthContext` and `ClientAuthContext` listen for session-expired custom events to trigger forced logout.

### API clients
Both Axios instances (`apiClient.js` and `clientApiClient.js`) share the same pattern:
- Base URL from `VITE_API_URL` env var, defaults to `http://localhost:8083`
- **Request interceptor**: attaches `Authorization: Bearer <token>` from sessionStorage
- **Response interceptor**:
  - On 401: silently refreshes token (`POST /refresh` or `POST /client/refresh`), queues concurrent requests during refresh, retries after success
  - On final 401 failure: dispatches `auth:session-expired` / `client-auth:session-expired` custom event → forced logout
  - On 4xx/5xx: dispatches `api:error` custom event with user-friendly message → picked up by `ApiErrorContext` → toast

### Error handling
- `ApiErrorContext` / `ApiErrorProvider` — global toast notification system
- Listens for `api:error` events dispatched by the Axios interceptors
- Toasts auto-dismiss after 5 s, rendered bottom-right
- Use `addToast(message)` / `addSuccess(message)` from `useApiError()` hook for manual toasts

### State management
React Context only — no Redux, Zustand, or TanStack Query. Ten context providers:
1. `AuthContext` — employee session
2. `ClientAuthContext` — client session
3. `ClientAccountsContext` — client's bank accounts, exposes `reload()` and `renameAccount()`
4. `ClientPaymentsContext` — client's payments, exposes `reload()`
5. `RecipientsContext` — full CRUD + reorder for payment recipients
6. `AccountsContext` — employee view of all bank accounts
7. `EmployeesContext` — employee management
8. `ClientsContext` — client management
9. `ThemeContext` — dark mode toggle, persisted in localStorage, syncs with OS preference on first load
10. `ApiErrorContext` — global toast system (see above)

### Data fetching
Services are thin Axios wrappers that return model instances via `*FromApi()` mappers. Context providers call service functions on auth state changes and store results in state. Use the context's `reload()` after any mutation to keep all pages in sync.

### Client portal layout
All logged-in client pages (except `ClientHomePage` which doubles as a landing page) use `<ClientPortalLayout>` which provides the sidebar and navbar. `NAV_ITEMS` is exported from `ClientPortalLayout.jsx` and shared with `ClientHomePage`.

### Shared utilities
- `src/utils/formatting.js` — `fmt(n, currency?)` for Serbian-locale number formatting
- `src/utils/permissions.js` — permission definitions; `permissionsFromDozvole()` in Employee model maps backend `dozvole` list to permissions object

### Styling conventions
- Use existing Tailwind classes — avoid inline styles except for dynamic values (e.g. `gridTemplateAreas`)
- `input-field` — standard text/select/date input
- `input-error` — red border variant applied alongside `input-field`
- `btn-primary` — violet filled button

## Current status
Backend fully integrated — all data is fetched from the live Go backend. Mock files in `src/mocks/` are legacy artifacts not imported anywhere and can be deleted.

### Client portal pages
| Route | Page | Notes |
|---|---|---|
| `/client` | ClientHomePage (landing + dashboard) | |
| `/client/login` | ClientLoginPage | |
| `/client/activate` | ClientActivatePage | account activation flow |
| `/client/accounts` | ClientAccountsOverviewPage | |
| `/client/accounts/:id` | ClientAccountDetailPage | |
| `/client/payments` | ClientPaymentsPage | |
| `/client/payments/new` | ClientNewPaymentPage | |
| `/client/payments/verify` | ClientPaymentVerifyPage | |
| `/client/payments/:id` | ClientPaymentDetailPage | |
| `/client/transfers` | ClientTransfersPage | |
| `/client/recipients` | ClientRecipientsPage | CRUD + reorder |
| `/client/exchange` | ClientExchangePage | rates, preview, convert, history |
| `/client/cards` | ClientCardsPage | |
| `/client/cards/request` | ClientCardRequestPage | |
| `/client/cards/confirm` | ClientCardConfirmPage | 2FA confirmation |
| `/client/loans` | ClientLoansPage | |
| `/client/loans/apply` | ClientLoanApplyPage | |
| `/client/loans/:id` | ClientLoanDetailPage | |
| `/client/securities` | ClientSecuritiesPage | listings overview |
| `/client/securities/:id` | ClientListingDetailPage | listing detail + order placement |

### Employee portal pages
Employee list, detail, create — client list, detail, create — account list, detail, create — bank accounts view — loan applications (approve/reject) — loans overview — securities/listings list (`/securities`) — listing detail (`/securities/:id`) — auth pages (login, forgot password, set/reset password) — dashboard — about.
