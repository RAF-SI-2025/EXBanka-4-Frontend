import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ApiErrorProvider } from './context/ApiErrorContext'
import { ClientAuthProvider } from './context/ClientAuthContext'
import { EmployeesProvider } from './context/EmployeesContext'
import { ClientsProvider } from './context/ClientsContext'
import { AccountsProvider } from './context/AccountsContext'
import { ClientAccountsProvider } from './context/ClientAccountsContext'
import { ClientPaymentsProvider } from './context/ClientPaymentsContext'
import { RecipientsProvider } from './context/RecipientsContext'
import EmployeePortalLayout from './layouts/EmployeePortalLayout'
import ProtectedRoute from './components/ProtectedRoute'
import EmployeeHomePage from './pages/employee/EmployeeHomePage'
import EmployeeLoginPage from './pages/employee/EmployeeLoginPage'
import ForgotPasswordPage from './pages/employee/ForgotPasswordPage'
import AdminEmployeesPage from './pages/employee/AdminEmployeesPage'
import EmployeeDetailPage from './pages/employee/EmployeeDetailPage'
import NewEmployeePage from './pages/employee/NewEmployeePage'
import ClientsPage from './pages/employee/ClientsPage'
import ClientDetailPage from './pages/employee/ClientDetailPage'
import NewClientPage from './pages/employee/NewClientPage'
import ClientAccountsPage from './pages/employee/ClientAccountsPage'
import BankAccountsPage from './pages/employee/BankAccountsPage'
import AccountDetailPage from './pages/employee/AccountDetailPage'
import NewAccountPage from './pages/employee/NewAccountPage'
import ClientLoginPage from './pages/client/ClientLoginPage'
import ClientActivatePage from './pages/client/ClientActivatePage'
import ClientHomePage from './pages/client/ClientHomePage'
import ClientAccountsOverviewPage from './pages/client/ClientAccountsOverviewPage'
import ClientAccountDetailPage from './pages/client/ClientAccountDetailPage'
import ClientPaymentsPage from './pages/client/ClientPaymentsPage'
import ClientPaymentDetailPage from './pages/client/ClientPaymentDetailPage'
import ClientNewPaymentPage from './pages/client/ClientNewPaymentPage'
import ClientPaymentVerifyPage from './pages/client/ClientPaymentVerifyPage'
import ClientTransfersPage from './pages/client/ClientTransfersPage'
import ClientExchangePage from './pages/client/ClientExchangePage'
import ClientCardsPage from './pages/client/ClientCardsPage'
import ClientCardRequestPage from './pages/client/ClientCardRequestPage'
import ClientCardConfirmPage from './pages/client/ClientCardConfirmPage'
import ClientLoansPage from './pages/client/ClientLoansPage'
import ClientLoanDetailPage from './pages/client/ClientLoanDetailPage'
import ClientLoanApplyPage from './pages/client/ClientLoanApplyPage'
import ClientRecipientsPage from './pages/client/ClientRecipientsPage'
import SetPasswordPage from './pages/employee/SetPasswordPage'
import ResetPasswordPage from './pages/employee/ResetPasswordPage'
import EmployeeLoanApplicationsPage from './pages/employee/EmployeeLoanApplicationsPage'
import EmployeeLoansPage from './pages/employee/EmployeeLoansPage'
import ActuaryManagementPage from './pages/employee/ActuaryManagementPage'
import StockExchangesPage from './pages/employee/StockExchangesPage'
import CreateOrderPage from './pages/orders/CreateOrderPage'
import OrderReviewPage from './pages/orders/OrderReviewPage'
import PortfolioPage from './pages/orders/PortfolioPage'
import SecuritiesPage from './pages/securities/SecuritiesPage'
import ListingDetailPage from './pages/securities/ListingDetailPage'
import StockOptionsPage from './pages/securities/StockOptionsPage'
import ClientSecuritiesPage from './pages/client/ClientSecuritiesPage'
import ClientListingDetailPage from './pages/client/ClientListingDetailPage'
import ClientPortfolioPage from './pages/client/ClientPortfolioPage'
import ClientCreateOrderPage from './pages/client/ClientCreateOrderPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <ApiErrorProvider>
      <AuthProvider>
      <ClientAuthProvider>
      <ClientAccountsProvider>
      <ClientPaymentsProvider>
      <RecipientsProvider>
      <EmployeesProvider>
      <ClientsProvider>
      <AccountsProvider>
        <Routes>
          {/* Home — handles both logged-in (sidebar) and logged-out (landing) */}
          <Route path="/" element={<EmployeeHomePage />} />

          {/* Protected pages — full-screen sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<EmployeePortalLayout />}>
              <Route path="/admin/employees" element={<AdminEmployeesPage />} />
              <Route path="/admin/employees/new" element={<NewEmployeePage />} />
              <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/admin/clients" element={<ClientsPage />} />
              <Route path="/admin/clients/new" element={<NewClientPage />} />
              <Route path="/admin/clients/:id" element={<ClientDetailPage />} />
              <Route path="/admin/accounts" element={<ClientAccountsPage />} />
              <Route path="/admin/accounts/new" element={<NewAccountPage />} />
              <Route path="/admin/accounts/:id" element={<AccountDetailPage />} />
              <Route path="/admin/bank-accounts" element={<BankAccountsPage />} />
              <Route path="/admin/loans/applications" element={<EmployeeLoanApplicationsPage />} />
              <Route path="/admin/loans" element={<EmployeeLoansPage />} />
              <Route path="/admin/actuaries" element={<ActuaryManagementPage />} />
              <Route path="/admin/stock-exchanges" element={<StockExchangesPage />} />
              <Route path="/admin/orders" element={<OrderReviewPage />} />
              <Route path="/orders/new" element={<CreateOrderPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/securities" element={<SecuritiesPage />} />
              <Route path="/securities/:id" element={<ListingDetailPage />} />
              <Route path="/securities/:id/options" element={<StockOptionsPage />} />
            </Route>
          </Route>

          {/* Auth pages — full-screen, no layout */}
          <Route path="/login" element={<EmployeeLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Client portal — full-screen, no layout */}
          <Route path="/client/login" element={<ClientLoginPage />} />
          <Route path="/client/activate" element={<ClientActivatePage />} />
          <Route path="/client" element={<ClientHomePage />} />
          <Route path="/client/accounts" element={<ClientAccountsOverviewPage />} />
          <Route path="/client/accounts/:id" element={<ClientAccountDetailPage />} />
          <Route path="/client/payments" element={<ClientPaymentsPage />} />
          <Route path="/client/payments/new" element={<ClientNewPaymentPage />} />
          <Route path="/client/payments/verify" element={<ClientPaymentVerifyPage />} />
          <Route path="/client/payments/:id" element={<ClientPaymentDetailPage />} />
          <Route path="/client/transfers" element={<ClientTransfersPage />} />
          <Route path="/client/exchange" element={<ClientExchangePage />} />
          <Route path="/client/cards" element={<ClientCardsPage />} />
          <Route path="/client/cards/request" element={<ClientCardRequestPage />} />
          <Route path="/client/cards/confirm" element={<ClientCardConfirmPage />} />
          <Route path="/client/loans" element={<ClientLoansPage />} />
          <Route path="/client/loans/apply" element={<ClientLoanApplyPage />} />
          <Route path="/client/loans/:id" element={<ClientLoanDetailPage />} />
          <Route path="/client/recipients" element={<ClientRecipientsPage />} />
          <Route path="/client/securities" element={<ClientSecuritiesPage />} />
          <Route path="/client/securities/:id" element={<ClientListingDetailPage />} />
          <Route path="/client/orders/new" element={<ClientCreateOrderPage />} />
          <Route path="/client/portfolio" element={<ClientPortfolioPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AccountsProvider>
      </ClientsProvider>
      </EmployeesProvider>
      </RecipientsProvider>
      </ClientPaymentsProvider>
      </ClientAccountsProvider>
      </ClientAuthProvider>
      </AuthProvider>
      </ApiErrorProvider>
    </ThemeProvider>
  )
}

export default App
