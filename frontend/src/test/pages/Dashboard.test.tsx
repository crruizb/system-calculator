import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import { Dashboard } from '../../pages/Dashboard'
import * as client from '../../api/client'

function renderDashboard(token = 'test-token') {
  localStorage.setItem('token', token)
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/new" element={<div>New Calculator</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('Dashboard', () => {
  beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('shows list of calculators', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([
      { id: '1', name: 'Diamond Ring', slug: 'diamond-ring', tenantSlug: 'my-tenant', sheetUrl: 'https://example.com', settings: {}, branding: {}, isActive: true },
    ])
    renderDashboard()
    await waitFor(() => expect(screen.getByText('Diamond Ring')).toBeInTheDocument())
  })

  it('shows view link pointing to public calculator url', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([
      { id: '1', name: 'Diamond Ring', slug: 'diamond-ring', tenantSlug: 'my-tenant', sheetUrl: 'https://example.com', settings: {}, branding: {}, isActive: true },
    ])
    renderDashboard()
    const viewLink = await screen.findByRole('link', { name: /view/i })
    expect(viewLink).toHaveAttribute('href', '/c/my-tenant/diamond-ring')
  })

  it('shows empty state when no calculators', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([])
    renderDashboard()
    await waitFor(() => expect(screen.getByText(/no calculators/i)).toBeInTheDocument())
  })

  it('navigates to create page on link click', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([])
    renderDashboard()
    await userEvent.click(await screen.findByRole('link', { name: /new calculator/i }))
    expect(screen.getByText('New Calculator')).toBeInTheDocument()
  })
})
