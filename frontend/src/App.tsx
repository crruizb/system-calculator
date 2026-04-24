import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { CalculatorForm } from './pages/CalculatorForm'
import { BillingPage } from './pages/BillingPage'
import { PublicCalculator } from './pages/PublicCalculator'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/new" element={<CalculatorForm />} />
            <Route path="/dashboard/:id" element={<CalculatorForm />} />
            <Route path="/dashboard/billing" element={<BillingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
