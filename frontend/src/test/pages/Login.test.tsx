import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { Login } from '../../pages/Login'
import * as client from '../../api/client'

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('Login', () => {
  beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('renders email and password fields', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('redirects to /dashboard on successful login', async () => {
    vi.spyOn(client, 'apiFetch').mockResolvedValue({ token: 'jwt-token' })
    renderLogin()

    await userEvent.type(screen.getByLabelText(/email/i), 'test@test.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'pass1234')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
  })

  it('shows error message on failed login', async () => {
    vi.spyOn(client, 'apiFetch').mockRejectedValue(new Error('401 Invalid credentials'))
    renderLogin()

    await userEvent.type(screen.getByLabelText(/email/i), 'bad@test.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument())
  })
})
