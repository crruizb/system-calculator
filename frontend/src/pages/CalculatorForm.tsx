import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetchAuth } from "../api/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

export function CalculatorForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { t } = useTranslation();
  const { tenantPlan } = useAuth();
  const isPro = tenantPlan === "pro";

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [currency, setCurrency] = useState("€");
  const [locale, setLocale] = useState("es-ES");
  const [brandingCompanyName, setBrandingCompanyName] = useState("");
  const [brandingLogo, setBrandingLogo] = useState("");
  const [brandingColorLight, setBrandingColorLight] = useState("#818cf8");
  const [brandingColorDark, setBrandingColorDark] = useState("#c5def2");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    apiFetchAuth<{
      name: string;
      slug: string;
      sheetUrl: string;
      settings: { currency: string; locale: string };
      branding: {
        companyName?: string;
        logo?: string;
        primaryColorLight?: string;
        primaryColorDark?: string;
      };
    }>(`/api/calculators/${id}`).then((c) => {
      setName(c.name);
      setSlug(c.slug);
      setSheetUrl(c.sheetUrl);
      setCurrency(c.settings.currency ?? "€");
      setLocale(c.settings.locale ?? "es-ES");
      setBrandingCompanyName(c.branding.companyName ?? "");
      setBrandingLogo(c.branding.logo ?? "");
      setBrandingColorLight(c.branding.primaryColorLight ?? "#818cf8");
      setBrandingColorDark(c.branding.primaryColorDark ?? "#c5def2");
    });
  }, [id, isEdit]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const body = {
      name,
      slug,
      sheetUrl,
      settings: { currency, locale },
      ...(isPro && {
        branding: {
          companyName: brandingCompanyName,
          logo: brandingLogo,
          primaryColorLight: brandingColorLight,
          primaryColorDark: brandingColorDark,
        },
      }),
    };
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
          : t("calcForm.save"),
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (disabled?: boolean) =>
    `w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-main)]/30 focus:outline-none focus:border-[var(--color-main)] transition-colors${disabled ? " opacity-40 cursor-not-allowed" : ""}`;

  return (
    <div className="max-w-lg">
      <div
        className="w-full rounded-2xl p-5 sm:p-8"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-line)",
        }}
      >
        <h1 className="font-display text-3xl mb-8">
          {isEdit ? t("calcForm.titleEdit") : t("calcForm.titleNew")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm mb-1">
              {t("calcForm.name")}
            </label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass()}
            />
          </div>
          {!isEdit && (
            <div>
              <label htmlFor="slug" className="block text-sm mb-1">
                {t("calcForm.slug")}
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
                className={inputClass()}
              />
            </div>
          )}
          <div>
            <label
              htmlFor="sheetUrl"
              className="flex items-center justify-between text-sm mb-1"
            >
              <span>{t("calcForm.sheetUrl")}</span>
              <a
                href="/guide"
                target="_blank"
                rel="noreferrer"
                className="text-xs transition-colors"
                style={{ color: "var(--color-main)" }}
              >
                {t("calcForm.sheetUrlHelp")}
              </a>
            </label>
            <input
              id="sheetUrl"
              type="url"
              required
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className={inputClass()}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="currency" className="block text-sm mb-1">
                {t("calcForm.currency")}
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={inputClass()}
              >
                <option value="€">€ — Euro</option>
                <option value="$">$ — Dollar</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="locale" className="block text-sm mb-1">
                {t("calcForm.locale")}
              </label>
              <select
                id="locale"
                value={locale}
                onChange={(e) => setLocale(e.target.value)}
                className={inputClass()}
              >
                <option value="es-ES">Español</option>
                <option value="en-US">English</option>
              </select>
            </div>
          </div>

          {/* Branding section */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{
              border: "1px solid var(--color-border-line)",
              background: "var(--color-bg)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                {t("calcForm.brandingHeading")}
              </span>
              {!isPro && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: "var(--color-main)", color: "#000" }}
                >
                  PRO
                </span>
              )}
            </div>

            {!isPro && (
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                <Link
                  to="/dashboard/billing"
                  className="underline"
                  style={{ color: "var(--color-main)" }}
                >
                  {t("calcForm.brandingProLock")}
                </Link>
              </p>
            )}

            <div>
              <label
                htmlFor="brandingCompanyName"
                className="block text-sm mb-1"
              >
                {t("calcForm.brandingCompanyName")}
              </label>
              <input
                id="brandingCompanyName"
                disabled={!isPro}
                value={brandingCompanyName}
                onChange={(e) => setBrandingCompanyName(e.target.value)}
                className={inputClass(!isPro)}
              />
            </div>

            <div>
              <label
                htmlFor="brandingLogo"
                className="flex items-center justify-between text-sm mb-1"
              >
                <span>{t("calcForm.brandingLogo")}</span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {t("calcForm.brandingLogoHint")}
                </span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="brandingLogo"
                  type="url"
                  disabled={!isPro}
                  value={brandingLogo}
                  onChange={(e) => setBrandingLogo(e.target.value)}
                  className={inputClass(!isPro)}
                />
                {brandingLogo && (
                  <img
                    src={brandingLogo}
                    alt="logo preview"
                    className="h-10 w-10 object-contain rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="brandingColorLight"
                  className="block text-sm mb-1"
                >
                  {t("calcForm.brandingColorLight")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="brandingColorLight"
                    type="color"
                    disabled={!isPro}
                    value={brandingColorLight}
                    onChange={(e) => setBrandingColorLight(e.target.value)}
                    className={`h-10 w-16 rounded cursor-pointer border border-[var(--color-main)]/30${!isPro ? " opacity-40 cursor-not-allowed" : ""}`}
                  />
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {brandingColorLight}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <label
                  htmlFor="brandingColorDark"
                  className="block text-sm mb-1"
                >
                  {t("calcForm.brandingColorDark")}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="brandingColorDark"
                    type="color"
                    disabled={!isPro}
                    value={brandingColorDark}
                    onChange={(e) => setBrandingColorDark(e.target.value)}
                    className={`h-10 w-16 rounded cursor-pointer border border-[var(--color-main)]/30${!isPro ? " opacity-40 cursor-not-allowed" : ""}`}
                  />
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {brandingColorDark}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[var(--color-main)] text-white font-semibold hover:bg-[var(--color-main-muted)] transition-colors disabled:opacity-50"
          >
            {loading
              ? t("calcForm.saving")
              : isEdit
                ? t("calcForm.save")
                : t("calcForm.create")}
          </button>
        </form>
      </div>
    </div>
  );
}
