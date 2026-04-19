# Frontend: Public Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. No commits

**Goal:** Adapt the existing React SPA to load calculator config dynamically from the backend API instead of a hardcoded env var, support per-tenant branding (colors, logo, company name) and a watermark for free plans, and make currency/locale configurable per calculator.

**Architecture:** New `useTenantCalculator` hook fetches config from `GET /api/public/{tenantSlug}/{calcSlug}`, then passes `sheetUrl` into the existing `useSheetData` hook (unchanged). `PriceDisplay` receives currency and locale as props. Branding is applied via a CSS custom property override on the calculator page. React Router v6 is added for routing; the existing multi-calculator UI is wrapped in a `PublicCalculator` page component.

**Tech Stack:** React 19, TypeScript, React Router v6, Vite, Vitest, React Testing Library, existing PapaParse + Tailwind CSS

**Prerequisite:** Plan 1 monorepo restructure complete (source files in `frontend/`). Plan 2 backend running locally.

---

## File Map

```
frontend/
├── package.json                            (add react-router-dom, axios, vitest, RTL)
├── vite.config.ts                          (add test config)
├── src/
│   ├── api/
│   │   └── client.ts                       (new — fetch wrapper with base URL)
│   ├── hooks/
│   │   ├── useSheetData.ts                 (modify — accept URL param instead of env var)
│   │   └── useTenantCalculator.ts          (new — fetches calculator config from API)
│   ├── components/
│   │   ├── PriceDisplay.tsx                (modify — currency + locale as props)
│   │   └── Watermark.tsx                   (new — "Powered by" footer)
│   ├── pages/
│   │   └── PublicCalculator.tsx            (new — wraps existing App calculator UI)
│   └── App.tsx                             (modify — add Router + /c/:tenant/:calc route)
└── src/test/
    ├── hooks/
    │   └── useTenantCalculator.test.ts     (new)
    └── pages/
        └── PublicCalculator.test.tsx       (new)
```

---

## Task 1: Add Dependencies + Test Config

**Files:**

- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: Install new packages**

```bash
cd frontend
pnpm add react-router-dom axios
pnpm add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Add test config to `vite.config.ts`**

Open `frontend/vite.config.ts` and merge the `test` block:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

- [ ] **Step 3: Create `frontend/src/test/setup.ts`**

```typescript
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Add test script to `package.json`**

In `frontend/package.json`, add to the `scripts` section:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verify test runner works**

```bash
cd frontend && pnpm test
```

Expected: `No test files found` — test suite configured correctly.

---

## Task 2: API Client

**Files:**

- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Add `VITE_API_URL` to `frontend/.env`**

Append to `frontend/.env`:

```
VITE_API_URL=http://localhost:8080
```

- [ ] **Step 2: Create `frontend/src/api/client.ts`**

```typescript
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export function apiFetchAuth<T>(
  path: string,
  token: string,
  options?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
}
```

---

## Task 3: `useTenantCalculator` Hook

**Files:**

- Create: `frontend/src/hooks/useTenantCalculator.ts`
- Create: `frontend/src/test/hooks/useTenantCalculator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/src/test/hooks/useTenantCalculator.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTenantCalculator } from "../../hooks/useTenantCalculator";
import * as client from "../../api/client";

describe("useTenantCalculator", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns config when API call succeeds", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      sheetUrl: "https://docs.google.com/test",
      settings: { currency: "€", locale: "es-ES" },
      branding: { companyName: "Acme", primaryColor: "#ff0000", logo: null },
    });

    const { result } = renderHook(() =>
      useTenantCalculator("acme", "diamond-ring"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config?.sheetUrl).toBe(
      "https://docs.google.com/test",
    );
    expect(result.current.config?.settings.currency).toBe("€");
    expect(result.current.config?.branding.companyName).toBe("Acme");
    expect(result.current.error).toBeNull();
  });

  it("returns error when API call fails", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(new Error("404 Not Found"));

    const { result } = renderHook(() =>
      useTenantCalculator("no-tenant", "no-calc"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBe("404 Not Found");
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd frontend && pnpm test
```

Expected: FAIL — `useTenantCalculator` module not found.

- [ ] **Step 3: Create `frontend/src/hooks/useTenantCalculator.ts`**

```typescript
import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export interface TenantCalculatorConfig {
  sheetUrl: string;
  settings: { currency: string; locale: string; [key: string]: unknown };
  branding: {
    companyName?: string;
    primaryColor?: string;
    logo?: string | null;
  };
}

interface State {
  config: TenantCalculatorConfig | null;
  loading: boolean;
  error: string | null;
}

export function useTenantCalculator(
  tenantSlug: string,
  calcSlug: string,
): State {
  const [state, setState] = useState<State>({
    config: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState({ config: null, loading: true, error: null });
    apiFetch<TenantCalculatorConfig>(`/api/public/${tenantSlug}/${calcSlug}`)
      .then((config) => setState({ config, loading: false, error: null }))
      .catch((err: Error) =>
        setState({ config: null, loading: false, error: err.message }),
      );
  }, [tenantSlug, calcSlug]);

  return state;
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
cd frontend && pnpm test
```

Expected: PASS

---

## Task 4: Modify `useSheetData` to Accept Dynamic URL

**Files:**

- Modify: `frontend/src/hooks/useSheetData.ts`

The hook currently reads `VITE_SHEET_URL` from the environment inside the hook. It needs to accept the URL as a parameter instead.

- [ ] **Step 1: Read current `useSheetData.ts`**

Open `frontend/src/hooks/useSheetData.ts` and note the current signature and where `VITE_SHEET_URL` is used.

- [ ] **Step 2: Change the hook to accept a URL parameter**

Replace the hook's export signature so it accepts `sheetUrl: string | null` as its first parameter instead of reading from `import.meta.env`:

```typescript
// Before (remove this line from inside the hook):
// const SHEET_URL = import.meta.env.VITE_SHEET_URL as string

// Change the function signature from:
export function useSheetData() {

// To:
export function useSheetData(sheetUrl: string | null) {
```

Inside the hook, wherever `SHEET_URL` (or `import.meta.env.VITE_SHEET_URL`) was used, replace it with `sheetUrl`. Add an early return guard so the hook does nothing when `sheetUrl` is null:

```typescript
useEffect(() => {
  if (!sheetUrl) return; // add this guard at the top of the effect
  // ... rest of the existing fetch logic unchanged
}, [sheetUrl]); // add sheetUrl to the dependency array
```

- [ ] **Step 3: Update `App.tsx` to pass the sheet URL explicitly**

In `frontend/src/App.tsx`, `useSheetData` is called at the top level. After this change, it needs a URL:

```typescript
// Change:
const { data, loading, error, refresh } = useSheetData();
// To:
const SHEET_URL = import.meta.env.VITE_SHEET_URL as string;
const { data, loading, error, refresh } = useSheetData(SHEET_URL);
```

This keeps the existing standalone app working via `.env` while the new `PublicCalculator` page passes the URL from the API.

- [ ] **Step 4: Verify existing app still builds**

```bash
cd frontend && pnpm run build
```

Expected: BUILD SUCCESSFUL with no TypeScript errors.

---

## Task 5: Update `PriceDisplay` to Accept Currency + Locale Props

**Files:**

- Modify: `frontend/src/components/PriceDisplay.tsx`

- [ ] **Step 1: Find the hardcoded `€` and `es-ES` in `PriceDisplay.tsx`**

Open `frontend/src/components/PriceDisplay.tsx`. Find:

- The `"€"` currency symbol (used in the display string)
- The `"es-ES"` locale string (used in `toLocaleString`)

- [ ] **Step 2: Add `currency` and `locale` props**

Add the props to the component's props interface and replace hardcoded values:

```typescript
// Add to the props interface (or create one if it's inline):
interface PriceDisplayProps {
  price: number | null;
  allSelected: boolean;
  currency?: string; // default "€"
  locale?: string; // default "es-ES"
}

// Inside the component, replace:
// "€"     → props.currency ?? "€"
// "es-ES" → props.locale ?? "es-ES"
```

- [ ] **Step 3: Update every call site of `PriceDisplay`**

Search for `<PriceDisplay` in the codebase:

```bash
grep -r "PriceDisplay" frontend/src --include="*.tsx" -l
```

For each file found, the existing usage without `currency`/`locale` props remains valid (they default). No call-site changes needed — props are optional with defaults.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && pnpm run build
```

Expected: BUILD SUCCESSFUL

---

## Task 6: Watermark Component

**Files:**

- Create: `frontend/src/components/Watermark.tsx`

- [ ] **Step 1: Create `Watermark.tsx`**

```typescript
export function Watermark() {
  return (
    <div className="mt-6 text-center text-xs text-[var(--color-text-secondary,#666)] opacity-60">
      Powered by{' '}
      <a
        href="/"
        className="underline hover:opacity-100 transition-opacity"
        target="_blank"
        rel="noopener noreferrer"
      >
        PriceCalc
      </a>
    </div>
  )
}
```

---

## Task 7: `PublicCalculator` Page

**Files:**

- Create: `frontend/src/pages/PublicCalculator.tsx`
- Create: `frontend/src/test/pages/PublicCalculator.test.tsx`

- [ ] **Step 1: Write the failing test**

```typescript
// frontend/src/test/pages/PublicCalculator.test.tsx
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
```

- [ ] **Step 2: Run test — verify failures**

```bash
cd frontend && pnpm test
```

Expected: FAIL — `PublicCalculator` module not found.

- [ ] **Step 3: Create `frontend/src/pages/PublicCalculator.tsx`**

```typescript
import { useParams } from 'react-router-dom'
import { useTenantCalculator } from '../hooks/useTenantCalculator'
import { useSheetData } from '../hooks/useSheetData'
import { PriceCalculator } from '../components/PriceCalculator'
import { PriceSummary } from '../components/PriceSummary'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Watermark } from '../components/Watermark'
import { useState } from 'react'

type Filters = Record<string, string>

export function PublicCalculator() {
  const { tenantSlug = '', calcSlug = '' } = useParams<{ tenantSlug: string; calcSlug: string }>()
  const { config, loading: configLoading, error } = useTenantCalculator(tenantSlug, calcSlug)
  const { data, loading: dataLoading } = useSheetData(config?.sheetUrl ?? null)
  const [instances, setInstances] = useState([{ id: crypto.randomUUID(), filters: {} as Filters }])

  if (configLoading) return <div role="status"><LoadingSpinner /></div>
  if (error) return <p className="text-center text-red-400 mt-20">Calculator not found.</p>
  if (!config) return null

  const { settings, branding } = config
  const currency = (settings.currency as string) ?? '€'
  const locale = (settings.locale as string) ?? 'es-ES'
  const showWatermark = !branding.companyName

  const cssVars: React.CSSProperties = branding.primaryColor
    ? ({ '--color-gold': branding.primaryColor } as React.CSSProperties)
    : {}

  return (
    <div style={cssVars}>
      <header className="text-center py-8">
        {branding.logo
          ? <img src={branding.logo} alt={branding.companyName} className="h-12 mx-auto" />
          : <img src="/diamond.png" alt="logo" className="h-12 mx-auto" />}
        <h1 className="mt-2 font-display text-2xl">
          {branding.companyName ?? 'Price Calculator'}
        </h1>
      </header>

      {dataLoading && <LoadingSpinner />}

      {instances.map((inst, i) => (
        <PriceCalculator
          key={inst.id}
          instanceId={inst.id}
          data={data}
          filters={inst.filters}
          onFiltersChange={(id, f) =>
            setInstances((prev) => prev.map((p) => p.id === id ? { ...p, filters: f } : p))
          }
          showRemove={instances.length > 1}
          onRemove={(id) => setInstances((prev) => prev.filter((p) => p.id !== id))}
          currency={currency}
          locale={locale}
        />
      ))}

      <div className="text-center mt-4">
        <button onClick={() => setInstances((prev) => [...prev, { id: crypto.randomUUID(), filters: {} }])}>
          + Add Calculator
        </button>
      </div>

      {instances.length >= 2 && <PriceSummary instances={instances} data={data} currency={currency} locale={locale} />}

      {showWatermark && <Watermark />}
    </div>
  )
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
cd frontend && pnpm test
```

Expected: All tests PASS.

---

## Task 8: Wire Up React Router in `App.tsx`

**Files:**

- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add `BrowserRouter` and the `/c/:tenant/:calc` route**

In `frontend/src/App.tsx`, wrap the app in `BrowserRouter` and add a route for the public calculator. The existing multi-calculator UI becomes the default (index) route, and `PublicCalculator` handles `/c/:tenantSlug/:calcSlug`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PublicCalculator } from './pages/PublicCalculator'

// Wrap the existing JSX return in:
return (
  <BrowserRouter>
    <Routes>
      <Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />
      <Route path="*" element={<ExistingAppContent />} />
    </Routes>
  </BrowserRouter>
)
```

Extract the existing JSX from `App.tsx` into a local `ExistingAppContent` component (or keep it inline under the `path="*"` route).

- [ ] **Step 2: Verify the app builds and both routes work**

```bash
cd frontend && pnpm run dev
```

- Open `http://localhost:5173` → existing multi-calculator UI loads
- Open `http://localhost:5173/c/testco/diamond-ring` → public calculator loads (or shows error if backend not running)

---

## Verification

1. Start the backend (from Plan 1/2):

   ```bash
   cd backend && ./gradlew bootRun
   ```

2. Start the frontend:

   ```bash
   cd frontend && pnpm run dev
   ```

3. Register a tenant and create a calculator:

   ```bash
   TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"pass1234","tenantName":"Test","tenantSlug":"testco"}' \
     | jq -r '.token')

   curl -X POST http://localhost:8080/api/calculators \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"Diamond Ring","slug":"diamond-ring","sheetUrl":"https://docs.google.com/spreadsheets/d/e/..."}'
   ```

4. Open `http://localhost:5173/c/testco/diamond-ring` — calculator loads with data from the sheet URL.

5. Run all frontend tests:
   ```bash
   cd frontend && pnpm test
   ```
   Expected: All PASS.
