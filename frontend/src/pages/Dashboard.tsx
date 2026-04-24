import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetchAuth } from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Calculator {
  id: string
  name: string
  slug: string
  tenantSlug: string
  sheetUrl: string
  settings: Record<string, unknown>
  branding: Record<string, unknown>
  isActive: boolean
}

export function Dashboard() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [calculators, setCalculators] = useState<Calculator[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    apiFetchAuth<Calculator[]>('/api/calculators', token)
      .then(setCalculators)
      .finally(() => setLoading(false))
  }, [token])

  async function handleDelete(id: string) {
    if (!token) return
    await apiFetchAuth(`/api/calculators/${id}`, token, { method: 'DELETE' })
    setCalculators((prev) => prev.filter((c) => c.id !== id))
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span>Loading…</span></div>

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">My Calculators</h1>
        <div className="flex gap-3">
          <Link to="/dashboard/billing" className="text-sm text-[var(--color-gold)] hover:underline">Billing</Link>
          <button onClick={() => { logout(); navigate('/login') }} className="text-sm text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)]">Sign out</button>
        </div>
      </div>

      <Link
        to="/dashboard/new"
        className="inline-block mb-6 px-5 py-2.5 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors"
      >
        + New Calculator
      </Link>

      {calculators.length === 0 && (
        <p className="text-[var(--color-text-primary)]/50 text-center mt-12">No calculators yet. Create one to get started.</p>
      )}

      <ul className="space-y-3">
        {calculators.map((c) => (
          <li key={c.id} className="p-4 bg-[var(--color-surface)] rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-[var(--color-text-primary)]/50">/c/{c.tenantSlug}/{c.slug}</p>
            </div>
            <div className="flex gap-3">
              <a
                href={`/c/${c.tenantSlug}/${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)]"
              >
                View
              </a>
              <Link to={`/dashboard/${c.id}`} className="text-sm text-[var(--color-gold)] hover:underline">Edit</Link>
              <button
                onClick={() => handleDelete(c.id)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
