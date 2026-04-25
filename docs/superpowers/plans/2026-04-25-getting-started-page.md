# Getting Started Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/guide` page that walks users through creating a Google Sheet, publishing it as CSV, and creating their first calculator — with EN/ES content and links from Landing, Dashboard, and CalculatorForm.

**Architecture:** Single React page at `/guide` with a `content` object keyed by locale (`en`|`es`) driven by `?lang=` query param. Reuses `SheetMockup` and `CalculatorMockup` (extracted from `Landing.tsx`) plus a new `PublishDialogMockup`. Three step sections with alternating text/visual layout. No new dependencies.

**Tech Stack:** React, React Router v6 (`useSearchParams`), Tailwind CSS, existing CSS custom properties (`--color-*`).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `frontend/src/components/SheetMockup.tsx` | Shared Google Sheet table mockup |
| Create | `frontend/src/components/CalculatorMockup.tsx` | Shared calculator UI mockup |
| Create | `frontend/src/components/PublishDialogMockup.tsx` | Static "Publish to web" dialog mockup |
| Create | `frontend/src/pages/GettingStarted.tsx` | Getting Started page with EN/ES content |
| Modify | `frontend/src/pages/Landing.tsx` | Remove inline mockups, import shared ones; add Guide nav link |
| Modify | `frontend/src/App.tsx` | Add `/guide` public route |
| Modify | `frontend/src/pages/Dashboard.tsx` | Add guide link to empty state |
| Modify | `frontend/src/pages/CalculatorForm.tsx` | Add "How do I get this URL?" link |

---

## Task 1: Extract SheetMockup Component

**Files:**
- Create: `frontend/src/components/SheetMockup.tsx`
- Modify: `frontend/src/pages/Landing.tsx`

- [ ] **Step 1: Create `frontend/src/components/SheetMockup.tsx`**

```tsx
export function SheetMockup() {
  const cols = ['talla', 'material', 'color', 'grosor', 'forma', 'precio']
  const rows = [
    ['6', 'Plata', 'Blanco', '2mm', 'Redonda', '20'],
    ['6', 'Plata', 'Blanco', '2mm', 'Cuadrada', '21'],
    ['6', 'Plata', 'Blanco', '3mm', 'Redonda', '32'],
    ['6', 'Plata', 'Blanco', '4mm', 'Rectangular', '44'],
    ['7', 'Plata', 'Blanco', '2mm', 'Redonda', '22'],
    ['7', 'Oro', 'Amarillo', '3mm', 'Cuadrada', '86'],
    ['7', 'Oro', 'Amarillo', '4mm', 'Redonda', '112'],
    ['8', 'Oro', 'Rosado', '3mm', 'Rectangular', '98'],
  ]

  return (
    <div style={{
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid #dadce0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      background: '#fff',
    }}>
      <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#ea4335', '#fbbc04', '#34a853'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ color: '#5f6368', fontSize: 11, marginLeft: 4 }}>precio-anillos.xlsx — Google Sheets</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(6, 1fr)', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ padding: '4px 8px', color: '#999', borderRight: '1px solid #e0e0e0', textAlign: 'center' }} />
        {cols.map((c, i) => (
          <div
            key={c}
            style={{
              padding: '4px 8px',
              color: c === 'precio' ? '#1a73e8' : '#3c4043',
              fontWeight: 600,
              borderRight: i < cols.length - 1 ? '1px solid #e0e0e0' : 'none',
              textAlign: c === 'precio' ? 'right' : 'left',
            }}
          >
            {c}
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div
          key={ri}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px repeat(6, 1fr)',
            borderBottom: '1px solid #f0f0f0',
            background: ri % 2 === 0 ? '#fff' : '#fafafa',
          }}
        >
          <div style={{ padding: '3px 8px', color: '#999', borderRight: '1px solid #e0e0e0', textAlign: 'center' }}>{ri + 1}</div>
          {row.map((cell, ci) => (
            <div
              key={ci}
              style={{
                padding: '3px 8px',
                color: ci === 5 ? '#1a73e8' : ci === 0 ? '#5f6368' : '#3c4043',
                fontWeight: ci === 5 ? 600 : 400,
                borderRight: ci < row.length - 1 ? '1px solid #e0e0e0' : 'none',
                textAlign: ci === 0 || ci === 5 ? 'right' : 'left',
              }}
            >
              {ci === 5 ? `€${cell}` : cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Remove inline `SheetMockup` from Landing and import shared component**

In `frontend/src/pages/Landing.tsx`:
1. Delete the `function SheetMockup() { ... }` block (lines 23–83).
2. Add this import after the existing imports:

```tsx
import { SheetMockup } from '../components/SheetMockup'
```

- [ ] **Step 3: Start dev server and verify Landing still works**

Run: `pnpm run dev` (from repo root)
Navigate to: `http://localhost:5173`
Expected: Landing page renders with the sheet table visible in "How it works" section. No console errors.

---

## Task 2: Extract CalculatorMockup Component

**Files:**
- Create: `frontend/src/components/CalculatorMockup.tsx`
- Modify: `frontend/src/pages/Landing.tsx`

- [ ] **Step 1: Create `frontend/src/components/CalculatorMockup.tsx`**

```tsx
export function CalculatorMockup() {
  const fields = [
    { label: 'Talla', value: '7' },
    { label: 'Material', value: 'Oro' },
    { label: 'Color', value: 'Amarillo' },
    { label: 'Grosor', value: '4mm' },
    { label: 'Forma', value: 'Redonda' },
  ]

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--color-border-line)',
      background: 'var(--color-surface)',
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 2px 16px rgba(99,102,241,0.08)',
    }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-line)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 4 }}>Price Calculator</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>Anillos Personalizados</div>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', width: 56, flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
            <div style={{
              flex: 1,
              padding: '5px 10px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border-line)',
              borderRadius: 5,
              fontSize: 12,
              color: 'var(--color-text-primary)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span>{value}</span>
              <span style={{ color: 'var(--color-gold)', fontSize: 10 }}>▾</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{
        margin: '0 20px 20px',
        padding: '14px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-gold)',
        borderRadius: 8,
        textAlign: 'center',
        boxShadow: '0 0 20px rgba(99,102,241,0.10)',
      }}>
        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Precio calculado</div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: 20, color: 'var(--color-gold)', fontWeight: 300 }}>€</span>
          <span style={{ fontSize: 36, color: 'var(--color-gold)', fontWeight: 700, letterSpacing: '-0.02em' }}>112</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Remove inline `CalculatorMockup` from Landing and import shared component**

In `frontend/src/pages/Landing.tsx`:
1. Delete the `function CalculatorMockup() { ... }` block (lines 85–149 in the original file; adjust for any line shift from Task 1).
2. Add this import:

```tsx
import { CalculatorMockup } from '../components/CalculatorMockup'
```

- [ ] **Step 3: Verify Landing still works**

Navigate to: `http://localhost:5173` (dev server already running)
Expected: Landing page renders with both sheet mockup and calculator mockup visible. No console errors.

---

## Task 3: Create PublishDialogMockup Component

**Files:**
- Create: `frontend/src/components/PublishDialogMockup.tsx`

- [ ] **Step 1: Create `frontend/src/components/PublishDialogMockup.tsx`**

```tsx
export function PublishDialogMockup() {
  return (
    <div style={{
      borderRadius: 8,
      overflow: 'hidden',
      border: '1px solid #dadce0',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 13,
      boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
      background: '#fff',
    }}>
      <div style={{ background: '#f8f9fa', borderBottom: '1px solid #e0e0e0', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['#ea4335', '#fbbc04', '#34a853'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ color: '#3c4043', fontSize: 12, fontWeight: 600, marginLeft: 4 }}>Publish to the web</span>
      </div>
      <div style={{ padding: '16px' }}>
        <p style={{ color: '#5f6368', fontSize: 12, marginBottom: 12 }}>
          Make your content visible to anyone by publishing it to the web.
        </p>
        <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0', marginBottom: 12 }}>
          <div style={{ padding: '6px 16px', borderBottom: '2px solid #1a73e8', color: '#1a73e8', fontSize: 12, fontWeight: 600 }}>Link</div>
          <div style={{ padding: '6px 16px', color: '#5f6368', fontSize: 12 }}>Embed</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #dadce0',
            borderRadius: 4,
            fontSize: 12,
            color: '#3c4043',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Sheet1</span>
            <span style={{ color: '#5f6368' }}>▾</span>
          </div>
          <div style={{
            flex: 1,
            padding: '6px 10px',
            border: '1px solid #1a73e8',
            borderRadius: 4,
            fontSize: 12,
            color: '#1a73e8',
            background: '#e8f0fe',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>Comma-separated values (.csv)</span>
            <span>▾</span>
          </div>
        </div>
        <div style={{
          padding: '6px 10px',
          border: '1px solid #dadce0',
          borderRadius: 4,
          fontSize: 11,
          color: '#1a73e8',
          background: '#f8f9fa',
          marginBottom: 12,
          wordBreak: 'break-all',
        }}>
          https://docs.google.com/spreadsheets/d/e/…/pub?output=csv
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{
            padding: '8px 20px',
            background: '#1a73e8',
            color: '#fff',
            borderRadius: 4,
            fontSize: 13,
            fontWeight: 600,
          }}>
            Publish
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 4: Create GettingStarted Page

**Files:**
- Create: `frontend/src/pages/GettingStarted.tsx`

- [ ] **Step 1: Create `frontend/src/pages/GettingStarted.tsx`**

```tsx
import { useSearchParams, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { SheetMockup } from '../components/SheetMockup'
import { CalculatorMockup } from '../components/CalculatorMockup'
import { PublishDialogMockup } from '../components/PublishDialogMockup'

type Locale = 'en' | 'es'

const content = {
  en: {
    guide: 'Guide',
    signIn: 'Sign in',
    getStarted: 'Get started free',
    register: 'Register',
    eyebrow: 'Getting Started',
    heroTitle: 'Set up your first calculator',
    heroSubtitle: 'Three steps — no code required.',
    step1N: '01',
    step1Heading: 'Create your Google Sheet',
    step1Body: 'Your sheet is the source of truth. Each row defines one price combination. Every column except',
    step1BodyCode: 'precio',
    step1BodyMid: 'becomes a filter dropdown — in the order they appear. The',
    step1BodyCode2: 'precio',
    step1BodyEnd: 'column is the calculated result.',
    step1Rules: [
      'Column headers become dropdown labels.',
      'Each unique row maps to one price.',
      'Add a row to add a new option — no code changes needed.',
    ],
    step2N: '02',
    step2Heading: 'Publish it as CSV',
    step2Body: 'Google Sheets can serve your data as a live CSV URL — this is what PriceCalc reads.',
    step2Steps: [
      'Open your sheet → File → Share → Publish to web',
      'Select the sheet tab from the first dropdown',
      'Choose "Comma-separated values (.csv)" from the second dropdown',
      'Click Publish → copy the URL',
    ],
    step3N: '03',
    step3Heading: 'Create your calculator',
    step3Body: 'In your dashboard, click "+ New Calculator", paste the CSV URL, give it a name, and click Create. Your calculator is live immediately at its own shareable URL.',
    step3Cta: 'Go to dashboard →',
    ctaHeading: 'Ready to try it?',
    ctaButton: 'Create your first calculator',
    copyright: '© 2025 PriceCalc',
  },
  es: {
    guide: 'Guía',
    signIn: 'Iniciar sesión',
    getStarted: 'Empezar gratis',
    register: 'Registrarse',
    eyebrow: 'Primeros pasos',
    heroTitle: 'Configura tu primera calculadora',
    heroSubtitle: 'Tres pasos — sin código.',
    step1N: '01',
    step1Heading: 'Crea tu hoja de Google',
    step1Body: 'Tu hoja es la fuente de datos. Cada fila define una combinación de precio. Cada columna excepto',
    step1BodyCode: 'precio',
    step1BodyMid: 'se convierte en un filtro desplegable — en el orden en que aparecen. La columna',
    step1BodyCode2: 'precio',
    step1BodyEnd: 'es el resultado calculado.',
    step1Rules: [
      'Los encabezados de columna se convierten en etiquetas de filtro.',
      'Cada fila única corresponde a un precio.',
      'Añade una fila para añadir una opción nueva — sin cambios de código.',
    ],
    step2N: '02',
    step2Heading: 'Publícala como CSV',
    step2Body: 'Google Sheets puede servir tus datos como URL CSV en vivo — esto es lo que lee PriceCalc.',
    step2Steps: [
      'Abre tu hoja → Archivo → Compartir → Publicar en la web',
      'Selecciona la pestaña de la hoja en el primer desplegable',
      'Elige "Valores separados por comas (.csv)" en el segundo desplegable',
      'Haz clic en Publicar → copia la URL',
    ],
    step3N: '03',
    step3Heading: 'Crea tu calculadora',
    step3Body: 'En tu panel, haz clic en "+ Nueva calculadora", pega la URL CSV, elige un nombre y haz clic en Crear. Tu calculadora estará disponible de inmediato en su propia URL.',
    step3Cta: 'Ir al panel →',
    ctaHeading: '¿Listo para probarlo?',
    ctaButton: 'Crea tu primera calculadora',
    copyright: '© 2025 PriceCalc',
  },
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

export function GettingStarted() {
  const { theme, toggleTheme } = useTheme()
  const [params, setParams] = useSearchParams()
  const locale: Locale = params.get('lang') === 'es' ? 'es' : 'en'
  const c = content[locale]

  function toggleLang() {
    setParams({ lang: locale === 'en' ? 'es' : 'en' })
  }

  return (
    <div data-theme={theme} style={{ minHeight: '100dvh', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}>

      {/* Nav */}
      <header style={{ borderBottom: '1px solid var(--color-border-line)' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-4 flex items-center gap-6">
          <div className="flex items-center gap-2 flex-1">
            <Link to="/" className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'var(--color-gold)' }}
              >P</span>
              <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>PriceCalc</span>
            </Link>
          </div>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="px-3 py-1.5 text-sm rounded transition-colors" style={{ color: 'var(--color-text-muted)' }}>
              {c.signIn}
            </Link>
            <button
              onClick={toggleLang}
              className="px-2 py-1 text-xs rounded border transition-colors"
              style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border-line)' }}
            >
              {locale === 'en' ? 'ES' : 'EN'}
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 flex items-center justify-center rounded transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Link
              to="/register"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: 'var(--color-gold)' }}
            >
              {c.getStarted}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 sm:px-8 pt-16 pb-12 text-center">
        <div
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase"
          style={{ background: 'var(--color-gold-dim)', color: 'var(--color-gold)', border: '1px solid var(--color-gold-muted)' }}
        >
          {c.eyebrow}
        </div>
        <h1 className="font-display text-4xl sm:text-5xl mb-4 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {c.heroTitle}
        </h1>
        <p className="text-lg" style={{ color: 'var(--color-text-muted)' }}>
          {c.heroSubtitle}
        </p>
      </section>

      {/* Step 1 — text left, visual right */}
      <section style={{ borderTop: '1px solid var(--color-border-line)' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1">
            <div className="text-5xl font-bold mb-3" style={{ color: 'var(--color-text-dim)', lineHeight: 1 }}>{c.step1N}</div>
            <h2 className="font-display text-3xl mb-4" style={{ color: 'var(--color-text-primary)' }}>{c.step1Heading}</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              {c.step1Body}{' '}
              <code style={{ color: 'var(--color-gold)', background: 'var(--color-gold-dim)', padding: '1px 5px', borderRadius: 3 }}>{c.step1BodyCode}</code>
              {' '}{c.step1BodyMid}{' '}
              <code style={{ color: 'var(--color-gold)', background: 'var(--color-gold-dim)', padding: '1px 5px', borderRadius: 3 }}>{c.step1BodyCode2}</code>
              {' '}{c.step1BodyEnd}
            </p>
            <ul className="space-y-2">
              {c.step1Rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span style={{ color: 'var(--color-gold)', flexShrink: 0, marginTop: 2 }}>✓</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full md:w-1/2 shrink-0">
            <SheetMockup />
          </div>
        </div>
      </section>

      {/* Step 2 — visual left, text right (flex-row-reverse) */}
      <section style={{ borderTop: '1px solid var(--color-border-line)' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-16 flex flex-col md:flex-row-reverse items-center gap-8 md:gap-12">
          <div className="flex-1">
            <div className="text-5xl font-bold mb-3" style={{ color: 'var(--color-text-dim)', lineHeight: 1 }}>{c.step2N}</div>
            <h2 className="font-display text-3xl mb-4" style={{ color: 'var(--color-text-primary)' }}>{c.step2Heading}</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>{c.step2Body}</p>
            <ol className="space-y-2">
              {c.step2Steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'var(--color-gold)', marginTop: 1 }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="w-full md:w-1/2 shrink-0">
            <PublishDialogMockup />
          </div>
        </div>
      </section>

      {/* Step 3 — text left, visual right */}
      <section style={{ borderTop: '1px solid var(--color-border-line)' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1">
            <div className="text-5xl font-bold mb-3" style={{ color: 'var(--color-text-dim)', lineHeight: 1 }}>{c.step3N}</div>
            <h2 className="font-display text-3xl mb-4" style={{ color: 'var(--color-text-primary)' }}>{c.step3Heading}</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{c.step3Body}</p>
            <Link
              to="/dashboard"
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--color-gold)' }}
            >
              {c.step3Cta}
            </Link>
          </div>
          <div className="w-full md:w-72 shrink-0">
            <CalculatorMockup />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid var(--color-border-line)' }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-20 text-center">
          <h2 className="font-display text-4xl mb-8" style={{ color: 'var(--color-text-primary)' }}>
            {c.ctaHeading}
          </h2>
          <Link
            to="/register"
            className="inline-block px-8 py-4 rounded-xl text-base font-semibold text-white transition-colors"
            style={{ background: 'var(--color-gold)' }}
          >
            {c.ctaButton}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border-line)' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <span>{c.copyright}</span>
          <div className="flex gap-4">
            <Link to="/login" style={{ color: 'var(--color-text-dim)' }}>{c.signIn}</Link>
            <Link to="/register" style={{ color: 'var(--color-text-dim)' }}>{c.register}</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
```

---

## Task 5: Wire Up Route and Links

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/Landing.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/pages/CalculatorForm.tsx`

- [ ] **Step 1: Add `/guide` route in `App.tsx`**

Add the import at the top of `frontend/src/App.tsx`:

```tsx
import { GettingStarted } from './pages/GettingStarted'
```

Add the route in the Public section, after the `/register` route:

```tsx
<Route path="/guide" element={<GettingStarted />} />
```

The Public routes block should now read:

```tsx
{/* Public */}
<Route path="/" element={<Landing />} />
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
<Route path="/guide" element={<GettingStarted />} />
<Route path="/c/:tenantSlug/:calcSlug" element={<PublicCalculator />} />
```

- [ ] **Step 2: Add "Guide" link to Landing nav**

In `frontend/src/pages/Landing.tsx`, in the `<nav>` block, add a Guide link before the existing Sign in link:

```tsx
<Link
  to="/guide"
  className="px-3 py-1.5 text-sm rounded transition-colors"
  style={{ color: 'var(--color-text-muted)' }}
>
  Guide
</Link>
```

The nav block after the change:

```tsx
<nav className="flex items-center gap-2">
  <Link
    to="/guide"
    className="px-3 py-1.5 text-sm rounded transition-colors"
    style={{ color: 'var(--color-text-muted)' }}
  >
    Guide
  </Link>
  <Link
    to="/login"
    className="px-3 py-1.5 text-sm rounded transition-colors"
    style={{ color: 'var(--color-text-muted)' }}
  >
    Sign in
  </Link>
  <button
    onClick={toggleTheme}
    aria-label="Toggle theme"
    className="w-8 h-8 flex items-center justify-center rounded transition-colors"
    style={{ color: 'var(--color-text-muted)' }}
  >
    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
  </button>
  <Link
    to="/register"
    className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
    style={{ background: 'var(--color-gold)' }}
  >
    Get started free
  </Link>
</nav>
```

- [ ] **Step 3: Update Dashboard empty state**

In `frontend/src/pages/Dashboard.tsx`, replace:

```tsx
{calculators.length === 0 && (
  <p className="text-center py-20" style={{ color: 'var(--color-text-muted)' }}>
    No calculators yet. Create one to get started.
  </p>
)}
```

With:

```tsx
{calculators.length === 0 && (
  <div className="text-center py-20">
    <p className="mb-2" style={{ color: 'var(--color-text-muted)' }}>No calculators yet.</p>
    <Link
      to="/guide"
      className="text-sm transition-colors"
      style={{ color: 'var(--color-gold)' }}
    >
      See how to set up your Google Sheet →
    </Link>
  </div>
)}
```

Note: `Link` is already imported from `react-router-dom` in `Dashboard.tsx`.

- [ ] **Step 4: Add help link to CalculatorForm Sheet URL field**

In `frontend/src/pages/CalculatorForm.tsx`, replace the Sheet URL label:

```tsx
<label htmlFor="sheetUrl" className="block text-sm mb-1">
  Google Sheet URL
</label>
```

With:

```tsx
<label htmlFor="sheetUrl" className="flex items-center justify-between text-sm mb-1">
  <span>Google Sheet URL</span>
  <a
    href="/guide"
    target="_blank"
    rel="noreferrer"
    className="text-xs transition-colors"
    style={{ color: 'var(--color-gold)' }}
  >
    How do I get this URL?
  </a>
</label>
```

- [ ] **Step 5: Verify all touchpoints in the browser**

With dev server running at `http://localhost:5173`, verify:

1. **Landing nav** → "Guide" link appears between logo area and "Sign in"; clicking navigates to `/guide`.
2. **`/guide` EN** → All 3 steps render with correct mockups; step numbers `01`/`02`/`03` visible; CTA button present.
3. **`/guide?lang=es`** → All text switches to Spanish; mockups unchanged.
4. **Lang toggle** → Clicking `ES` / `EN` pill in nav switches content.
5. **Theme toggle** → Dark/light theme applies correctly across the page.
6. **Mobile layout** (resize browser to < 768px) → Steps stack vertically, text above visual in each step.
7. **Dashboard empty state** → Log in with a fresh account (or delete existing calculators); guide link appears.
8. **CalculatorForm** → Navigate to `/dashboard/new`; "How do I get this URL?" appears next to Sheet URL label; clicking opens `/guide` in new tab.
