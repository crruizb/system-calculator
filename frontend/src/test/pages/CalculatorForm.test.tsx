import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { CalculatorForm } from '../../pages/CalculatorForm'
import * as client from '../../api/client'

function renderCreate() {
  localStorage.setItem('token', 'test-token')
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard/new']}>
        <Routes>
          <Route path="/dashboard/new" element={<CalculatorForm />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('CalculatorForm', () => {
  beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('submits create form and redirects to dashboard', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue({
      id: '1', name: 'Test', slug: 'test', sheetUrl: 'https://example.com', settings: {}, branding: {}, isActive: true,
    })
    renderCreate()

    await userEvent.type(screen.getByLabelText(/name/i), 'My Calc')
    await userEvent.type(screen.getByLabelText(/slug/i), 'my-calc')
    await userEvent.type(screen.getByLabelText(/sheet url/i), 'https://docs.google.com/test')
    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
  })
})
