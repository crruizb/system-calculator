import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetchAuth } from "../api/client";

export function CalculatorForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [currency, setCurrency] = useState("€");
  const [locale, setLocale] = useState("es-ES");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    apiFetchAuth<{
      name: string;
      slug: string;
      sheetUrl: string;
      settings: { currency: string; locale: string };
    }>(`/api/calculators/${id}`).then((c) => {
      setName(c.name);
      setSlug(c.slug);
      setSheetUrl(c.sheetUrl);
      setCurrency(c.settings.currency ?? "€");
      setLocale(c.settings.locale ?? "es-ES");
    });
  }, [id, isEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const body = { name, slug, sheetUrl, settings: { currency, locale } };
    try {
      if (isEdit) {
        await apiFetchAuth(`/api/calculators/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetchAuth("/api/calculators", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message.replace(/^\d+\s/, "")
          : "Save failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div
        className="w-full rounded-2xl p-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border-line)' }}
      >
        <h1 className="font-display text-3xl mb-8">
          {isEdit ? "Edit Calculator" : "New Calculator"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1">
              Name
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          {!isEdit && (
            <div>
              <label htmlFor="slug" className="block text-sm mb-1">
                Slug
              </label>
              <input
                id="slug"
                required
                pattern="^[a-z0-9-]{2,63}$"
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  )
                }
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          )}
          <div>
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
            <input
              id="sheetUrl"
              type="url"
              required
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="currency" className="block text-sm mb-1">
                Currency symbol
              </label>
              <input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="locale" className="block text-sm mb-1">
                Locale (e.g. es-ES)
              </label>
              <input
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-gold)]/30 focus:outline-none focus:border-[var(--color-gold)]"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-gold)] text-white font-semibold hover:bg-[var(--color-gold-muted)] transition-colors disabled:opacity-50"
          >
            {loading ? "Saving…" : isEdit ? "Save Changes" : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
}
