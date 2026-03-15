import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ClientAuthProvider } from './context/ClientAuthContext'
import { EmployeesProvider } from './context/EmployeesContext'
import { ClientsProvider } from './context/ClientsContext'
import { AccountsProvider } from './context/AccountsContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import EmployeeHomePage from './pages/EmployeeHomePage'
import EmployeeLoginPage from './pages/EmployeeLoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AdminEmployeesPage from './pages/AdminEmployeesPage'
import EmployeeDetailPage from './pages/EmployeeDetailPage'
import NewEmployeePage from './pages/NewEmployeePage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import NewClientPage from './pages/NewClientPage'
import ClientAccountsPage from './pages/ClientAccountsPage'
import AccountDetailPage from './pages/AccountDetailPage'
import NewAccountPage from './pages/NewAccountPage'
import ClientLoginPage from './pages/ClientLoginPage'
import ClientHomePage from './pages/ClientHomePage'
import ClientAccountsOverviewPage from './pages/ClientAccountsOverviewPage'
import ClientAccountDetailPage from './pages/ClientAccountDetailPage'
import ClientPaymentsPage from './pages/ClientPaymentsPage'
import ClientPaymentDetailPage from './pages/ClientPaymentDetailPage'
import SetPasswordPage from './pages/SetPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <ClientAuthProvider>
      <EmployeesProvider>
      <ClientsProvider>
      <AccountsProvider>
        <Routes>
          {/* Public pages with Navbar + Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<EmployeeHomePage />} />
            {/* Protected pages (still use Navbar + Footer layout) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin/employees" element={<AdminEmployeesPage />} />
              <Route path="/admin/employees/new" element={<NewEmployeePage />} />
              <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/admin/clients" element={<ClientsPage />} />
              <Route path="/admin/clients/new" element={<NewClientPage />} />
              <Route path="/admin/clients/:id" element={<ClientDetailPage />} />
              <Route path="/admin/accounts" element={<ClientAccountsPage />} />
              <Route path="/admin/accounts/new" element={<NewAccountPage />} />
              <Route path="/admin/accounts/:id" element={<AccountDetailPage />} />
            </Route>
          </Route>

          {/* Auth pages — full-screen, no layout */}
          <Route path="/login" element={<EmployeeLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Client portal — full-screen, no layout */}
          <Route path="/client/login" element={<ClientLoginPage />} />
          <Route path="/client" element={<ClientHomePage />} />
          <Route path="/client/accounts" element={<ClientAccountsOverviewPage />} />
          <Route path="/client/accounts/:id" element={<ClientAccountDetailPage />} />
          <Route path="/client/payments" element={<ClientPaymentsPage />} />
          <Route path="/client/payments/:id" element={<ClientPaymentDetailPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AccountsProvider>
      </ClientsProvider>
      </EmployeesProvider>
      </ClientAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
