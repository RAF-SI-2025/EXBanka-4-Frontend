import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { EmployeesProvider } from './context/EmployeesContext'
import { ClientsProvider } from './context/ClientsContext'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import AdminEmployeesPage from './pages/AdminEmployeesPage'
import EmployeeDetailPage from './pages/EmployeeDetailPage'
import NewEmployeePage from './pages/NewEmployeePage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import SetPasswordPage from './pages/SetPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <EmployeesProvider>
      <ClientsProvider>
        <Routes>
          {/* Public pages with Navbar + Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            {/* Protected pages (still use Navbar + Footer layout) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin/employees" element={<AdminEmployeesPage />} />
              <Route path="/admin/employees/new" element={<NewEmployeePage />} />
              <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/admin/clients" element={<ClientsPage />} />
              <Route path="/admin/clients/:id" element={<ClientDetailPage />} />
            </Route>
          </Route>

          {/* Auth pages — full-screen, no layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ClientsProvider>
      </EmployeesProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
