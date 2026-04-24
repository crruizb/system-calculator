import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token } = await apiFetch<{ token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      login(token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg.replace(/^\d+\s/, ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-md p-8 bg-[var(--color-surface)] rounded-2xl shadow-xl">
        <h1 className="font-display text-3xl text-center mb-8">Sign In</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">Email</label>
            <input
              id="email" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1">Password</label>
            <input
              id="password" type="password" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[var(--color-text-primary)]/60">
          No account? <Link to="/register" className="text-[var(--color-gold)] hover:underline">Register</Link>
        </div>

        <div className="mt-6">
          <GoogleSignInButton onToken={(token) => { login(token); navigate('/dashboard') }} />
        </div>
      </div>
    </div>
  )
}

function GoogleSignInButton({ onToken }: { onToken: (token: string) => void }) {
  async function handleGoogleResponse(response: { credential: string }) {
    try {
      const { token } = await apiFetch<{ token: string }>('/api/auth/google', {
        method: 'POST',
        body: JSON.stringify({ idToken: response.credential }),
      })
      onToken(token)
    } catch {
      window.location.href = `/register?googleToken=${response.credential}`
    }
  }

  function initGoogle(el: HTMLDivElement | null) {
    if (!el) return
    const w = window as unknown as { google?: { accounts: { id: { initialize: (c: object) => void; renderButton: (el: HTMLElement, opts: object) => void } } } }
    w.google?.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    })
    w.google?.accounts.id.renderButton(el, { theme: 'filled_black', size: 'large', width: '100%' })
  }

  return <div ref={initGoogle} />
}
