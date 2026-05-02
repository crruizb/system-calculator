import { useTheme } from "../hooks/useTheme";
import { TopNavbar } from "./TopNavbar";
import { EmailVerificationBanner } from "./EmailVerificationBanner";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <div
      data-theme={theme}
      className="min-h-dvh flex flex-col"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-family-body)",
      }}
    >
      <TopNavbar />
      <EmailVerificationBanner />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex-1">
        {children}
      </main>
      <footer className="border-t border-[var(--color-border-line)] text-[var(--color-text-dim)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between text-xs">
          <span>© 2026 Prexario</span>
          <a
            href="mailto:support@prexario.dpdns.org"
            className="text-[var(--color-text-dim)]"
          >
            support@prexario.dpdns.org
          </a>
        </div>
      </footer>
    </div>
  );
}
