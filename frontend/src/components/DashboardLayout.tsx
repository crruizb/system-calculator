import { useTheme } from '../hooks/useTheme'
import { TopNavbar } from './TopNavbar'
import { EmailVerificationBanner } from './EmailVerificationBanner'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()

  return (
    <div
      data-theme={theme}
      style={{
        minHeight: '100dvh',
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-family-body)',
      }}
    >
      <TopNavbar />
      <EmailVerificationBanner />
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
