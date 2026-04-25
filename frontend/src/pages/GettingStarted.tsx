import { useSearchParams, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { SheetMockup } from '../components/SheetMockup'
import { CalculatorMockup } from '../components/CalculatorMockup'
import { PublishDialogMockup } from '../components/PublishDialogMockup'

type Locale = 'en' | 'es'

const content = {
  en: {
    signIn: 'Sign in',
    getStarted: 'Get started free',
    register: 'Register',
    eyebrow: 'Getting Started',
    heroTitle: 'Set up your first calculator',
    heroSubtitle: 'Three steps — no code required.',
    step1N: '01',
    step1Heading: 'Create your Google Sheet',
    step1Body: 'Your sheet is the source of truth. Each row defines one price combination. Every column except',
    step1BodyCode: 'price',
    step1BodyEnd: 'becomes a filter dropdown — in column order. That last column is the calculated result.',
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
    step1BodyEnd: 'se convierte en un filtro desplegable — en el orden en que aparecen. Esa última columna es el resultado.',
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
  const { isLoggedIn, tenantName } = useAuth()
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
            {isLoggedIn === false && (
              <Link to="/login" className="px-3 py-1.5 text-sm rounded transition-colors" style={{ color: 'var(--color-text-muted)' }}>
                {c.signIn}
              </Link>
            )}
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
            {isLoggedIn === true ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border-line)' }}
              >
                {tenantName ?? 'Dashboard'} →
              </Link>
            ) : isLoggedIn === false ? (
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: 'var(--color-gold)' }}
              >
                {c.getStarted}
              </Link>
            ) : null}
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
            <SheetMockup locale={locale} />
          </div>
        </div>
      </section>

      {/* Step 2 — visual left, text right */}
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
            <CalculatorMockup locale={locale} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: '1px solid var(--color-border-line)' }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-20 text-center">
          <h2 className="font-display text-4xl mb-8" style={{ color: 'var(--color-text-primary)' }}>
            {c.ctaHeading}
          </h2>
          {isLoggedIn === true ? (
            <Link
              to="/dashboard"
              className="inline-block px-8 py-4 rounded-xl text-base font-semibold transition-colors"
              style={{ color: 'var(--color-text-primary)', border: '1px solid var(--color-border-line)' }}
            >
              {c.step3Cta}
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-block px-8 py-4 rounded-xl text-base font-semibold text-white transition-colors"
              style={{ background: 'var(--color-gold)' }}
            >
              {c.ctaButton}
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--color-border-line)' }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between text-xs" style={{ color: 'var(--color-text-dim)' }}>
          <span>{c.copyright}</span>
          <div className="flex gap-4">
            {isLoggedIn === true ? (
              <Link to="/dashboard" style={{ color: 'var(--color-text-dim)' }}>Dashboard</Link>
            ) : (
              <>
                <Link to="/login" style={{ color: 'var(--color-text-dim)' }}>{c.signIn}</Link>
                <Link to="/register" style={{ color: 'var(--color-text-dim)' }}>{c.register}</Link>
              </>
            )}
          </div>
        </div>
      </footer>

    </div>
  )
}
