import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetchAuth } from "../api/client";

interface Calculator {
  id: string;
  name: string;
  slug: string;
  tenantSlug: string;
  sheetUrl: string;
  settings: Record<string, unknown>;
  branding: Record<string, unknown>;
  isActive: boolean;
}

export function Dashboard() {
  const [calculators, setCalculators] = useState<Calculator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchAuth<Calculator[]>("/api/calculators")
      .then(setCalculators)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await apiFetchAuth(`/api/calculators/${id}`, { method: "DELETE" });
    setCalculators((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <span style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl" style={{ color: 'var(--color-text-primary)' }}>
          My Calculators
        </h1>
        <div className="flex items-center gap-3">
          <Link
            to="/guide"
            className="text-sm transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Guide
          </Link>
        <Link
          to="/dashboard/new"
          className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--color-gold)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-gold-muted)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-gold)')}
        >
          + New Calculator
        </Link>
        </div>
      </div>

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

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((c) => (
          <li
            key={c.id}
            className="rounded-xl p-5 flex flex-col gap-4"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-line)',
            }}
          >
            <div className="flex-1">
              <p className="font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {c.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                /c/{c.tenantSlug}/{c.slug}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm border-t pt-3" style={{ borderColor: 'var(--color-border-line)' }}>
              <a
                href={`/c/${c.tenantSlug}/${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-muted)')}
              >
                View ↗
              </a>
              <Link
                to={`/dashboard/${c.id}`}
                className="transition-colors"
                style={{ color: 'var(--color-gold)' }}
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(c.id)}
                className="ml-auto text-red-400 hover:text-red-300 transition-colors"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
