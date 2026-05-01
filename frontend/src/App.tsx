import { BrowserRouter, Outlet, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './api/queryClient'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { DashboardLayout } from './components/DashboardLayout'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { CalculatorForm } from './pages/CalculatorForm'
import { BillingPage } from './pages/BillingPage'
import { SettingsPage } from './pages/SettingsPage'
import { PublicCalculator } from './pages/PublicCalculator'
import { GettingStarted } from './pages/GettingStarted'

function DashboardShell() {
  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/guide" element={<GettingStarted />} />
          <Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardShell />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/new" element={<CalculatorForm />} />
              <Route path="/dashboard/:id" element={<CalculatorForm />} />
              <Route path="/dashboard/billing" element={<BillingPage />} />
              <Route path="/dashboard/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  )
}
