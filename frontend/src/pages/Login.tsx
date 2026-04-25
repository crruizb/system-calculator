import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export function Login() {
  const { markLoggedIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasOAuthError = searchParams.has("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      markLoggedIn();
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg.replace(/^\d+\s/, ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      data-theme={theme}
      className="min-h-screen flex items-center justify-center relative"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
    >
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {theme === 'dark' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-line)' }}>
        <h1 className="font-display text-3xl text-center mb-8">Sign In</h1>

        {hasOAuthError && (
          <p className="mb-4 text-red-400 text-sm text-center">
            Sign in with Google failed, please try again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-white font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="mt-6">
          <a
            href="/oauth2/authorization/google"
            className="flex items-center justify-center w-full py-3 rounded-lg border border-[var(--color-gold)]/30 text-sm hover:bg-[var(--color-gold)]/10 transition-colors"
          >
            Sign in with Google
          </a>
        </div>

        <div className="mt-4 text-center text-sm text-[var(--color-text-primary)]/60">
          No account?{" "}
          <Link
            to="/register"
            className="text-[var(--color-gold)] hover:underline"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
