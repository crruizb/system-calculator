import { useEffect, useState } from 'react'
import { apiFetchAuth } from '../api/client'
import { useAuth } from '../context/AuthContext'

interface TenantInfo { id: string; slug: string; name: string; plan: string }

export function BillingPage() {
  const { token } = useAuth()
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    apiFetchAuth<TenantInfo>('/api/tenants/me', token).then(setTenant)
  }, [token])

  async function upgrade(plan: 'basic' | 'pro') {
    if (!token) return
    setLoading(true)
    const { url } = await apiFetchAuth<{ url: string }>(`/api/billing/checkout?plan=${plan}`, token)
    window.location.href = url
  }

  async function openPortal() {
    if (!token) return
    setLoading(true)
    const { url } = await apiFetchAuth<{ url: string }>('/api/billing/portal', token)
    window.location.href = url
  }

  const planLabel = { free: 'Free', basic: 'Basic', pro: 'Pro' }[tenant?.plan ?? 'free'] ?? 'Free'

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl mb-8">Billing</h1>

      <div className="p-6 bg-[var(--color-surface)] rounded-2xl mb-6">
        <p className="text-sm text-[var(--color-text-primary)]/50 mb-1">Current plan</p>
        <p className="text-2xl font-semibold">{planLabel}</p>
      </div>

      {tenant?.plan !== 'pro' && (
        <div className="grid grid-cols-2 gap-4">
          {tenant?.plan === 'free' && (
            <button onClick={() => upgrade('basic')} disabled={loading}
              className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-gold)]/30 hover:border-[var(--color-gold)] transition-colors text-left">
              <p className="font-semibold mb-1">Basic</p>
              <p className="text-2xl font-display mb-2">~€15<span className="text-sm font-sans">/mo</span></p>
              <p className="text-sm text-[var(--color-text-primary)]/50">3 calculators · No watermark</p>
            </button>
          )}
          <button onClick={() => upgrade('pro')} disabled={loading}
            className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-gold)]/30 hover:border-[var(--color-gold)] transition-colors text-left">
            <p className="font-semibold mb-1">Pro</p>
            <p className="text-2xl font-display mb-2">~€49<span className="text-sm font-sans">/mo</span></p>
            <p className="text-sm text-[var(--color-text-primary)]/50">Unlimited · Custom branding</p>
          </button>
        </div>
      )}

      {tenant?.plan !== 'free' && (
        <button onClick={openPortal} disabled={loading}
          className="mt-6 text-sm text-[var(--color-gold)] hover:underline">
          Manage subscription →
        </button>
      )}
    </div>
  )
}
