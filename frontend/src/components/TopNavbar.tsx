import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

function SunIcon() {
  return (
    <svg
      width="18"
      height="18"
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
      width="18"
      height="18"
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

export function TopNavbar() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  function toggleLang() {
    i18n.changeLanguage(i18n.language === "en" ? "es" : "en");
  }

  return (
    <nav
      className="h-14 flex items-center px-4 sm:px-8 border-b gap-6"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border-line)",
        color: "var(--color-text-primary)",
      }}
    >
      <Link
        to="/dashboard"
        className="flex items-center gap-2 font-semibold text-sm tracking-wide shrink-0"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span
          className="w-6 h-6 rounded flex items-center justify-center text-black text-xs font-bold"
          style={{ background: "var(--color-main)" }}
        >
          P
        </span>
        <span className="hidden sm:inline">Prexario</span>
      </Link>

      <div className="flex items-center gap-1 flex-1">
        <Link
          to="/dashboard"
          className="px-3 py-1.5 rounded text-sm transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-muted)")
          }
        >
          {t("nav.calculators")}
        </Link>
        <Link
          to="/dashboard/billing"
          className="px-3 py-1.5 rounded text-sm transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-muted)")
          }
        >
          {t("nav.billing")}
        </Link>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleLang}
          className="px-2 py-1 text-xs rounded border transition-colors"
          style={{
            color: "var(--color-text-muted)",
            borderColor: "var(--color-border-line)",
          }}
        >
          {t("lang")}
        </button>
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Toggle theme"
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-muted)")
          }
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="px-3 py-1.5 rounded text-sm transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--color-text-primary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--color-text-muted)")
          }
        >
          {t("nav.signOut")}
        </button>
      </div>
    </nav>
  );
}
