import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PublicCalculator } from '../../pages/PublicCalculator'
import * as hook from '../../hooks/useTenantCalculator'

describe('PublicCalculator', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('shows loading state initially', () => {
    vi.spyOn(hook, 'useTenantCalculator').mockReturnValue({
      config: null, loading: true, error: null,
    })

    render(
      <MemoryRouter initialEntries={['/c/acme/diamond-ring']}>
        <Routes>
          <Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error message when config fetch fails', () => {
    vi.spyOn(hook, 'useTenantCalculator').mockReturnValue({
      config: null, loading: false, error: '404 Not Found',
    })

    render(
      <MemoryRouter initialEntries={['/c/acme/diamond-ring']}>
        <Routes>
          <Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })

  it('applies primaryColor as CSS variable when branding has color', () => {
    vi.spyOn(hook, 'useTenantCalculator').mockReturnValue({
      config: {
        sheetUrl: 'https://example.com',
        settings: { currency: '€', locale: 'es-ES' },
        branding: { companyName: 'Acme Jewels', primaryColor: '#ff0000', logo: null },
      },
      loading: false,
      error: null,
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/c/acme/diamond-ring']}>
        <Routes>
          <Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />
        </Routes>
      </MemoryRouter>
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.getPropertyValue('--color-gold')).toBe('#ff0000')
  })

  it('shows watermark when branding has no companyName', () => {
    vi.spyOn(hook, 'useTenantCalculator').mockReturnValue({
      config: {
        sheetUrl: 'https://example.com',
        settings: { currency: '€', locale: 'es-ES' },
        branding: {},
      },
      loading: false,
      error: null,
    })

    render(
      <MemoryRouter initialEntries={['/c/acme/diamond-ring']}>
        <Routes>
          <Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText(/powered by/i)).toBeInTheDocument()
  })
})
