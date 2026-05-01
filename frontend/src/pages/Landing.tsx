import { Link } from "react-router-dom";
import { useTheme } from "../hooks/useTheme";
import { useAuth } from "../hooks/useAuth";
import { useTranslation, Trans } from "react-i18next";
import { SheetMockup } from "../components/SheetMockup";
import { CalculatorMockup } from "../components/CalculatorMockup";
import { useSeo } from "../hooks/useSeo";

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, tenantName } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "es" ? "es" : "en";

  function toggleLang() {
    i18n.changeLanguage(locale === "en" ? "es" : "en");
  }

  useSeo({
    title: "Prexario — Calculadora de precios desde Google Sheets",
    description:
      "Convierte tu hoja de cálculo de Google en una calculadora de precios compartible al instante. Sin código. Ideal para autónomos y empresas en España.",
    canonical: "https://prexario.app/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "Prexario",
      url: "https://prexario.app",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web Browser",
      inLanguage: "es",
      description:
        "Crea calculadoras de precios personalizadas desde hojas de cálculo de Google. Sin código.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Plan gratuito disponible",
      },
      publisher: {
        "@type": "Organization",
        name: "Prexario",
        url: "https://prexario.app",
      },
    },
  });

  return (
    <div
      data-theme={theme}
      style={{
        minHeight: "100dvh",
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
      }}
    >
      {/* Nav */}
      <header style={{ borderBottom: "1px solid var(--color-border-line)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--color-main)" }}
            >
              P
            </span>
            <span
              className="font-semibold text-sm hidden sm:inline"
              style={{ color: "var(--color-text-primary)" }}
            >
              Prexario
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {!isLoggedIn && (
              <Link
                to="/guide"
                className="hidden sm:block px-3 py-1.5 text-sm rounded transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("nav.guide")}
              </Link>
            )}
            {isLoggedIn === false && (
              <Link
                to="/login"
                className="hidden sm:block px-3 py-1.5 text-sm rounded transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                {t("nav.signIn")}
              </Link>
            )}
            <button
              onClick={toggleLang}
              className="px-2 py-1 text-xs rounded border transition-colors cursor-pointer"
              style={{
                color: "var(--color-text-muted)",
                borderColor: "var(--color-border-line)",
              }}
            >
              {t("lang")}
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 flex items-center justify-center rounded transition-colors cursor-pointer"
              style={{ color: "var(--color-text-muted)" }}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            {isLoggedIn === true ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  color: "var(--color-text-primary)",
                  border: "1px solid var(--color-border-line)",
                }}
              >
                {tenantName
                  ? t("nav.dashboardLink", { name: tenantName })
                  : t("nav.dashboard")}
              </Link>
            ) : isLoggedIn === false ? (
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
                style={{ background: "var(--color-main)" }}
              >
                {t("nav.getStarted")}
              </Link>
            ) : null}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 sm:px-8 pt-20 pb-16 text-center">
        <div
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-6 tracking-wide uppercase"
          style={{
            background: "var(--color-main-dim)",
            color: "var(--color-main)",
            border: "1px solid var(--color-main-muted)",
          }}
        >
          {t("landing.eyebrow")}
        </div>
        <h1
          className="font-display text-5xl sm:text-6xl mb-6 leading-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t("landing.heroTitle")}
        </h1>
        <p
          className="text-lg mb-10 max-w-xl mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("landing.heroSubtitle")}
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {isLoggedIn === true ? (
            <Link
              to="/dashboard"
              className="px-7 py-3.5 rounded-xl text-base font-semibold transition-colors"
              style={{
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border-line)",
              }}
            >
              {t("landing.goToDashboard")}
            </Link>
          ) : isLoggedIn === false ? (
            <>
              <Link
                to="/register"
                className="px-7 py-3.5 rounded-xl text-base font-semibold text-white transition-colors"
                style={{ background: "var(--color-main)" }}
              >
                {t("landing.startFree")}
              </Link>
              <a
                href={`${import.meta.env.VITE_API_URL ?? ""}/oauth2/authorization/google`}
                className="px-7 py-3.5 rounded-xl text-base font-semibold transition-colors"
                style={{
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border-line)",
                }}
              >
                {t("landing.googleCta")}
              </a>
            </>
          ) : null}
        </div>
      </section>

      {/* Demo: Sheet → Calculator */}
      <section className="max-w-5xl mx-auto px-6 sm:px-8 pb-24">
        <p
          className="text-center text-sm uppercase tracking-widest mb-10"
          style={{ color: "var(--color-text-muted)" }}
        >
          {t("landing.howItWorks")}
        </p>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="flex-1 w-full">
            <p
              className="text-xs uppercase tracking-widest mb-3 font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t("landing.yourSheet")}
            </p>
            <SheetMockup locale={locale} />
          </div>

          <div className="flex flex-col items-center gap-2 shrink-0 md:mt-12">
            <div className="hidden md:flex flex-col items-center gap-1">
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: "var(--color-main)",
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "5px solid transparent",
                  borderBottom: "5px solid transparent",
                  borderLeft: "8px solid var(--color-main)",
                }}
              />
            </div>
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-main)" }}
            >
              →
            </span>
            <span
              className="text-xs hidden md:block"
              style={{ color: "var(--color-text-dim)" }}
            >
              {t("landing.autoGenerated")}
            </span>
          </div>

          <div className="w-full md:w-72 shrink-0">
            <p
              className="text-xs uppercase tracking-widest mb-3 font-semibold"
              style={{ color: "var(--color-text-muted)" }}
            >
              {t("landing.yourCalc")}
            </p>
            <CalculatorMockup locale={locale} />
          </div>
        </div>

        <div
          className="mt-8 p-4 rounded-xl text-sm text-center"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border-line)",
            color: "var(--color-text-muted)",
          }}
        >
          <Trans
            i18nKey="landing.callout"
            components={{
              strong: <strong style={{ color: "var(--color-text-primary)" }} />,
            }}
          />{" "}
          <Link to="/guide" style={{ color: "var(--color-main)" }}>
            {t("landing.stepByStep")}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ borderTop: "1px solid var(--color-border-line)" }}>
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-20">
          <p
            className="text-center text-sm uppercase tracking-widest mb-12"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("landing.everythingYouNeed")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(["1", "2", "3"] as const).map((n) => (
              <div
                key={n}
                className="p-6 rounded-2xl"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border-line)",
                }}
              >
                <div className="text-2xl mb-3">
                  {n === "1" ? "⚡" : n === "2" ? "🔗" : "🎨"}
                </div>
                <h3
                  className="font-semibold mb-2 text-sm"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {t(`landing.feature${n}Title`)}
                </h3>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t(`landing.feature${n}Body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ borderTop: "1px solid var(--color-border-line)" }}>
        <div className="max-w-3xl mx-auto px-6 sm:px-8 py-20 text-center">
          <h2
            className="font-display text-4xl mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            {t("landing.ctaHeading")}
          </h2>
          <p className="mb-8" style={{ color: "var(--color-text-muted)" }}>
            {t("landing.ctaSubtitle")}
          </p>
          {isLoggedIn === true ? (
            <Link
              to="/dashboard"
              className="inline-block px-8 py-4 rounded-xl text-base font-semibold transition-colors"
              style={{
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border-line)",
              }}
            >
              {t("landing.goToDashboard")}
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-4 rounded-xl text-base font-semibold text-white transition-colors"
                style={{ background: "var(--color-main)" }}
              >
                {t("landing.ctaButton")}
              </Link>
              <a
                href={`${import.meta.env.VITE_API_URL ?? ""}/oauth2/authorization/google`}
                className="px-8 py-4 rounded-xl text-base font-semibold transition-colors"
                style={{
                  color: "var(--color-text-muted)",
                  border: "1px solid var(--color-border-line)",
                }}
              >
                {t("landing.googleCta")}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border-line)" }}>
        <div
          className="max-w-5xl mx-auto px-6 sm:px-8 py-6 flex items-center justify-between text-xs"
          style={{ color: "var(--color-text-dim)" }}
        >
          <span>{t("landing.copyright")}</span>
          <div className="flex gap-4">
            {isLoggedIn === true ? (
              <Link to="/dashboard" style={{ color: "var(--color-text-dim)" }}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" style={{ color: "var(--color-text-dim)" }}>
                  {t("nav.signIn")}
                </Link>
                <Link to="/register" style={{ color: "var(--color-text-dim)" }}>
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
