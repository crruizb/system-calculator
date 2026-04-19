# Frontend: Dashboard, Auth & Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. No commits

**Goal:** Implement auth pages (login + register with Google OAuth), a dashboard for managing calculators (list, create, edit, delete), a billing page that links to Stripe, and a marketing landing page.

**Architecture:** JWT stored in `localStorage`. An `AuthContext` provides the current user + token to all pages. `ProtectedRoute` redirects unauthenticated users to `/login`. React Router v6 handles all routes. Google Sign-In uses the Google Identity Services (GIS) JS library loaded via a script tag. All API calls go through `apiFetchAuth` from Plan 3's `client.ts`.

**Tech Stack:** React 19, TypeScript, React Router v6, Vitest, React Testing Library (from Plan 3), Google Identity Services JS SDK

**Prerequisite:** Plans 1–3 complete. `frontend/src/api/client.ts` and React Router already wired up.

---

## File Map

```
frontend/src/
├── context/
│   └── AuthContext.tsx                     (new — JWT + user state)
├── components/
│   └── ProtectedRoute.tsx                  (new — redirect if not authenticated)
├── pages/
│   ├── Landing.tsx                         (new — marketing page)
│   ├── Login.tsx                           (new — email/password + Google OAuth)
│   ├── Register.tsx                        (new — same as Login with extra fields)
│   ├── Dashboard.tsx                       (new — list + manage calculators)
│   ├── CalculatorForm.tsx                  (new — create / edit a calculator)
│   └── BillingPage.tsx                     (new — plan info + upgrade link)
└── App.tsx                                 (modify — add all new routes)

frontend/src/test/
├── context/
│   └── AuthContext.test.tsx
├── pages/
│   ├── Login.test.tsx
│   ├── Dashboard.test.tsx
│   └── CalculatorForm.test.tsx
```

---

## Task 1: `AuthContext`

**Files:**

- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/test/context/AuthContext.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/test/context/AuthContext.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../context/AuthContext'

function TestConsumer() {
  const { token, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="token">{token ?? 'none'}</span>
      <button onClick={() => login('test-token')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear())

  it('starts with no token', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('token').textContent).toBe('none')
  })

  it('login stores token in localStorage and state', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    expect(screen.getByTestId('token').textContent).toBe('test-token')
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  it('logout clears token from localStorage and state', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await userEvent.click(screen.getByText('Login'))
    await userEvent.click(screen.getByText('Logout'))
    expect(screen.getByTestId('token').textContent).toBe('none')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('restores token from localStorage on mount', () => {
    localStorage.setItem('token', 'existing-token')
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('token').textContent).toBe('existing-token')
  })
})
```

- [ ] **Step 2: Run tests — verify failure**

```bash
cd frontend && pnpm test
```

Expected: FAIL — `AuthContext` module not found.

- [ ] **Step 3: Create `frontend/src/context/AuthContext.tsx`**

```typescript
import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextValue {
  token: string | null
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))

  function login(t: string) {
    localStorage.setItem('token', t)
    setToken(t)
  }

  function logout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd frontend && pnpm test
```

Expected: All PASS.

---

## Task 2: `ProtectedRoute`

**Files:**

- Create: `frontend/src/components/ProtectedRoute.tsx`

- [ ] **Step 1: Create `ProtectedRoute.tsx`**

```typescript
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
```

---

## Task 3: Login Page

**Files:**

- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/test/pages/Login.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/test/pages/Login.test.tsx
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
```

- [ ] **Step 2: Run tests — verify failure**

```bash
cd frontend && pnpm test
```

Expected: FAIL — `Login` module not found.

- [ ] **Step 3: Create `frontend/src/pages/Login.tsx`**

```typescript
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
      // User is new — redirect to register with the Google token pre-filled
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
```

- [ ] **Step 4: Add Google GIS script to `frontend/index.html`**

Open `frontend/index.html` and add before `</body>`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

- [ ] **Step 5: Add `VITE_GOOGLE_CLIENT_ID` to `frontend/.env`**

```
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
cd frontend && pnpm test
```

Expected: All PASS.

---

## Task 4: Register Page

**Files:**

- Create: `frontend/src/pages/Register.tsx`

The Register page is the same as Login with two extra fields (`tenantName`, `tenantSlug`) and calls `POST /api/auth/register`. No separate test — the pattern is identical to Login and already covered.

- [ ] **Step 1: Create `frontend/src/pages/Register.tsx`**

```typescript
import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const googleToken = searchParams.get('googleToken')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      let token: string
      if (googleToken) {
        const res = await apiFetch<{ token: string }>('/api/auth/google', {
          method: 'POST',
          body: JSON.stringify({ idToken: googleToken, tenantName, tenantSlug }),
        })
        token = res.token
      } else {
        const res = await apiFetch<{ token: string }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, tenantName, tenantSlug }),
        })
        token = res.token
      }
      login(token)
      navigate('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg.replace(/^\d+\s/, ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-md p-8 bg-[var(--color-surface)] rounded-2xl shadow-xl">
        <h1 className="font-display text-3xl text-center mb-8">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!googleToken && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm mb-1">Email</label>
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm mb-1">Password</label>
                <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
              </div>
            </>
          )}
          <div>
            <label htmlFor="tenantName" className="block text-sm mb-1">Company Name</label>
            <input id="tenantName" type="text" required value={tenantName} onChange={(e) => setTenantName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
          </div>
          <div>
            <label htmlFor="tenantSlug" className="block text-sm mb-1">URL Slug <span className="text-[var(--color-text-primary)]/40 text-xs">(e.g. acme-jewels)</span></label>
            <input id="tenantSlug" type="text" required pattern="^[a-z0-9-]{2,63}$"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
            {tenantSlug && <p className="text-xs mt-1 text-[var(--color-text-primary)]/40">Your calculator URL: /c/{tenantSlug}/...</p>}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-[var(--color-text-primary)]/60">
          Already have an account? <Link to="/login" className="text-[var(--color-gold)] hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 5: Dashboard Page

**Files:**

- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/test/pages/Dashboard.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/test/pages/Dashboard.test.tsx
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
      { id: '1', name: 'Diamond Ring', slug: 'diamond-ring', sheetUrl: 'https://example.com', settings: {}, branding: {}, isActive: true },
    ])
    renderDashboard()
    await waitFor(() => expect(screen.getByText('Diamond Ring')).toBeInTheDocument())
  })

  it('shows empty state when no calculators', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([])
    renderDashboard()
    await waitFor(() => expect(screen.getByText(/no calculators/i)).toBeInTheDocument())
  })

  it('navigates to create page on button click', async () => {
    vi.spyOn(client, 'apiFetchAuth').mockResolvedValue([])
    renderDashboard()
    await userEvent.click(await screen.findByRole('button', { name: /new calculator/i }))
    expect(screen.getByText('New Calculator')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — verify failure**

```bash
cd frontend && pnpm test
```

Expected: FAIL — `Dashboard` module not found.

- [ ] **Step 3: Create `frontend/src/pages/Dashboard.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetchAuth } from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Calculator {
  id: string
  name: string
  slug: string
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

      <button
        onClick={() => navigate('/dashboard/new')}
        className="mb-6 px-5 py-2.5 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors"
      >
        + New Calculator
      </button>

      {calculators.length === 0 && (
        <p className="text-[var(--color-text-primary)]/50 text-center mt-12">No calculators yet. Create one to get started.</p>
      )}

      <ul className="space-y-3">
        {calculators.map((c) => (
          <li key={c.id} className="p-4 bg-[var(--color-surface)] rounded-xl flex items-center justify-between">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-[var(--color-text-primary)]/50">/c/…/{c.slug}</p>
            </div>
            <div className="flex gap-3">
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
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd frontend && pnpm test
```

Expected: All PASS.

---

## Task 6: Calculator Form Page (Create + Edit)

**Files:**

- Create: `frontend/src/pages/CalculatorForm.tsx`
- Create: `frontend/src/test/pages/CalculatorForm.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
// frontend/src/test/pages/CalculatorForm.test.tsx
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
```

- [ ] **Step 2: Run tests — verify failure**

```bash
cd frontend && pnpm test
```

Expected: FAIL — `CalculatorForm` module not found.

- [ ] **Step 3: Create `frontend/src/pages/CalculatorForm.tsx`**

```typescript
import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiFetchAuth } from '../api/client'
import { useAuth } from '../context/AuthContext'

export function CalculatorForm() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const isEdit = Boolean(id)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [sheetUrl, setSheetUrl] = useState('')
  const [currency, setCurrency] = useState('€')
  const [locale, setLocale] = useState('es-ES')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isEdit || !token || !id) return
    apiFetchAuth<{ name: string; slug: string; sheetUrl: string; settings: { currency: string; locale: string } }>(
      `/api/calculators/${id}`, token
    ).then((c) => {
      setName(c.name); setSlug(c.slug); setSheetUrl(c.sheetUrl)
      setCurrency(c.settings.currency ?? '€'); setLocale(c.settings.locale ?? 'es-ES')
    })
  }, [id, isEdit, token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!token) return
    setError(null); setLoading(true)
    const body = { name, slug, sheetUrl, settings: { currency, locale } }
    try {
      if (isEdit) {
        await apiFetchAuth(`/api/calculators/${id}`, token, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetchAuth('/api/calculators', token, { method: 'POST', body: JSON.stringify(body) })
      }
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message.replace(/^\d+\s/, '') : 'Save failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-8">
      <div className="w-full max-w-lg bg-[var(--color-surface)] rounded-2xl p-8 shadow-xl">
        <h1 className="font-display text-3xl mb-8">{isEdit ? 'Edit Calculator' : 'New Calculator'}</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1">Name</label>
            <input id="name" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
          </div>
          {!isEdit && (
            <div>
              <label htmlFor="slug" className="block text-sm mb-1">Slug</label>
              <input id="slug" required pattern="^[a-z0-9-]{2,63}$"
                value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>
          )}
          <div>
            <label htmlFor="sheetUrl" className="block text-sm mb-1">Google Sheet URL</label>
            <input id="sheetUrl" type="url" required value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="currency" className="block text-sm mb-1">Currency symbol</label>
              <input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>
            <div className="flex-1">
              <label htmlFor="locale" className="block text-sm mb-1">Locale (e.g. es-ES)</label>
              <input id="locale" value={locale} onChange={(e) => setLocale(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]" />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50">
            {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd frontend && pnpm test
```

Expected: All PASS.

---

## Task 7: Billing Page

**Files:**

- Create: `frontend/src/pages/BillingPage.tsx`

No separate test — billing page is a thin wrapper that calls one endpoint and redirects to Stripe.

- [ ] **Step 1: Create `frontend/src/pages/BillingPage.tsx`**

```typescript
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
    <div className="min-h-screen bg-[var(--color-bg)] p-8 max-w-2xl mx-auto">
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
```

---

## Task 8: Landing Page

**Files:**

- Create: `frontend/src/pages/Landing.tsx`

- [ ] **Step 1: Create `frontend/src/pages/Landing.tsx`**

```typescript
import { Link } from 'react-router-dom'

export function Landing() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      <header className="max-w-4xl mx-auto px-8 py-12 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/diamond.png" alt="logo" className="h-8" />
          <span className="font-display text-xl">PriceCalc</span>
        </div>
        <nav className="flex gap-6 text-sm">
          <Link to="/login" className="hover:text-[var(--color-gold)] transition-colors">Sign in</Link>
          <Link to="/register" className="px-4 py-2 rounded-lg bg-[var(--color-gold)] text-black font-semibold hover:bg-[var(--color-gold-muted)] transition-colors">
            Get started free
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-24 text-center">
        <h1 className="font-display text-6xl mb-6 leading-tight">
          Price calculators<br />for any product
        </h1>
        <p className="text-lg text-[var(--color-text-primary)]/60 mb-12 max-w-xl mx-auto">
          Connect a Google Sheet, get a shareable calculator URL. No code required.
        </p>
        <Link to="/register"
          className="inline-block px-8 py-4 rounded-xl bg-[var(--color-gold)] text-black text-lg font-semibold hover:bg-[var(--color-gold-muted)] transition-colors">
          Start for free
        </Link>
      </main>

      <section className="max-w-4xl mx-auto px-8 py-16 grid grid-cols-3 gap-8 text-center">
        {[
          { title: 'Connect your sheet', body: 'Paste a Google Sheets export URL. Columns become filter dropdowns automatically.' },
          { title: 'Share the link', body: 'Each calculator gets a URL you can embed or share directly with customers.' },
          { title: 'Upgrade for branding', body: 'Remove the watermark and apply your own colors and logo on the Pro plan.' },
        ].map(({ title, body }) => (
          <div key={title} className="p-6 bg-[var(--color-surface)] rounded-2xl text-left">
            <h3 className="font-semibold mb-2">{title}</h3>
            <p className="text-sm text-[var(--color-text-primary)]/50">{body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
```

---

## Task 9: Wire Up All Routes in `App.tsx`

**Files:**

- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Update routes**

Replace the contents of the `<Routes>` block in `frontend/src/App.tsx` with:

```typescript
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

// Replace the existing App return with:
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
```

- [ ] **Step 2: Remove the old standalone `useSheetData` call from `App.tsx`**

The top-level `useSheetData(SHEET_URL)` call and related state that was used by the original multi-calculator UI is no longer needed — the `PublicCalculator` page handles that. Remove it.

- [ ] **Step 3: Run all tests**

```bash
cd frontend && pnpm test
```

Expected: All PASS.

- [ ] **Step 4: Manually test the full flow**

```bash
cd frontend && pnpm run dev
```

- `http://localhost:5173` → Landing page
- `http://localhost:5173/register` → Register form, create an account
- `http://localhost:5173/dashboard` → Redirects to `/login` if not authenticated
- After login → Dashboard, create a calculator
- `http://localhost:5173/c/{slug}/{calcSlug}` → Public calculator loads

---

## Verification

1. Full auth flow:
   - Register with email/password → redirected to `/dashboard`
   - Log out → redirected to `/login`
   - Log in again → dashboard with existing calculators

2. Calculator lifecycle:
   - Create a calculator → appears in dashboard list
   - Edit it (change name/sheet URL) → changes reflected
   - Delete it → removed from list

3. Public calculator:
   - Visit `/c/{tenantSlug}/{calcSlug}` → calculator loads with correct sheet data
   - Free plan → "Powered by PriceCalc" watermark visible
   - (If Pro) → company name shown, watermark absent

4. Billing:
   - Visit `/dashboard/billing` → current plan shown
   - Click upgrade → redirected to Stripe checkout (requires real Stripe test key)

5. All tests pass:
   ```bash
   cd frontend && pnpm test
   ```
   Expected: All PASS.
