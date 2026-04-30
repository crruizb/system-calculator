import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { calcT } from "../utils/calcT";
import { useTheme } from "../context/ThemeContext";
import { useTenantCalculator } from "../hooks/useTenantCalculator";
import { useSheetData } from "../hooks/useSheetData";
import PriceCalculator from "../components/PriceCalculator";
import PriceSummary from "../components/PriceSummary";
import LoadingSpinner from "../components/LoadingSpinner";
import { Watermark } from "../components/Watermark";
import { getFilterFields, matchPrice } from "../utils/filters";
import { useSeo } from "../hooks/useSeo";

type Filters = Record<string, string | undefined>;

interface CalculatorInstance {
  id: string;
  filters: Filters;
}

export function PublicCalculator() {
  const { tenantSlug = "", calcSlug = "" } = useParams<{
    tenantSlug: string;
    calcSlug: string;
  }>();
  const { theme, toggleTheme } = useTheme();
  const {
    config,
    loading: configLoading,
    error,
  } = useTenantCalculator(tenantSlug, calcSlug);
  const { data, loading: dataLoading } = useSheetData(config?.sheetUrl ?? null);
  const [instances, setInstances] = useState<CalculatorInstance[]>([
    { id: crypto.randomUUID(), filters: {} },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(() => instances[0].id);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const BASE_URL = import.meta.env.VITE_API_URL ?? "";
  const t = calcT((config?.settings?.locale as string | undefined) ?? "es-ES");

  const filterFields = useMemo(() => getFilterFields(data), [data]);

  const prices = useMemo(
    () => instances.map((inst) => matchPrice(data, inst.filters, filterFields)),
    [instances, data, filterFields],
  );

  const hasPrices = prices.some((p) => p !== null);

  async function handleDownloadPdf() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/pdf/${tenantSlug}/${calcSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: instances.map((inst, i) => ({
            filters: inst.filters,
            price: prices[i],
          })),
          currency,
          locale,
        }),
      });
      if (res.status === 403) {
        setPdfError(t("public.pdfProRequired"));
        return;
      }
      if (!res.ok) {
        setPdfError(t("public.pdfError"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "presupuesto.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setPdfError(t("public.pdfError"));
    } finally {
      setPdfLoading(false);
    }
  }

  const seoCompany = (config?.branding?.companyName as string | undefined) ?? "";
  const seoTitle = seoCompany
    ? `${seoCompany} — Calculadora de precios | Prexario`
    : "Calculadora de precios | Prexario";
  const seoDescription = seoCompany
    ? `Calcula el precio de ${seoCompany} fácilmente. Selecciona tus opciones y obtén tu presupuesto al instante.`
    : "Calcula tu precio al instante. Selecciona tus opciones y obtén un presupuesto en segundos.";
  useSeo({
    title: seoTitle,
    description: seoDescription,
    noindex: !seoCompany,
  });

  if (configLoading)
    return (
      <div
        data-theme={theme}
        style={{
          minHeight: "100dvh",
          background: "var(--color-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  if (error)
    return (
      <p className="text-center text-red-400 mt-20">Calculator not found.</p>
    );
  if (!config) return null;

  const { settings, branding } = config;
  const currency = (settings.currency as string) ?? "€";
  const locale = (settings.locale as string) ?? "es-ES";
  const showWatermark = !branding.companyName;

  const primaryColor =
    theme === "dark"
      ? ((branding.primaryColorDark as string | undefined) ??
        (branding.primaryColor as string | undefined))
      : ((branding.primaryColorLight as string | undefined) ??
        (branding.primaryColor as string | undefined));

  const cssVars: React.CSSProperties = primaryColor
    ? ({ "--color-main": primaryColor } as React.CSSProperties)
    : {};

  return (
    <div
      data-theme={theme}
      style={{
        ...cssVars,
        minHeight: "100dvh",
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
      }}
    >
      <header className="relative text-center px-6 pt-10 pb-6 md:pt-14 md:pb-8">
        {branding.logo ? (
          <img
            src={branding.logo}
            alt={branding.companyName}
            className="h-12 mx-auto"
          />
        ) : (
          <svg
            width="48"
            height="48"
            viewBox="0 0 64 64"
            className="mx-auto"
            aria-label="Prexario"
          >
            <rect
              width="64"
              height="64"
              rx="14"
              fill="var(--color-surface)"
              stroke="var(--color-border-line)"
              strokeWidth="1"
            />
            <text
              x="32"
              y="47"
              fontFamily="Georgia, serif"
              fontSize="44"
              fontWeight="700"
              fill="var(--color-main)"
              textAnchor="middle"
            >
              P
            </text>
          </svg>
        )}
        <h1 className="mt-2 font-display text-2xl">
          {branding.companyName ?? "Prexario"}
        </h1>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          {theme === "dark" ? (
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
          ) : (
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
          )}
        </button>
      </header>

      {dataLoading && <LoadingSpinner />}

      <div className="w-full max-w-3xl mx-auto px-4 md:px-8 pb-16">
        <div className="flex items-center gap-1 mb-0">
          {instances.map((inst, i) => (
            <button
              key={inst.id}
              onClick={() => setActiveTabId(inst.id)}
              className={`px-3 py-1 text-sm rounded-t-lg transition-colors ${
                inst.id === activeTabId
                  ? "bg-[var(--color-surface)] text-[var(--color-main)] font-semibold"
                  : "text-[var(--color-text-primary)]/40 hover:text-[var(--color-text-primary)]/70"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => {
              const newId = crypto.randomUUID();
              setInstances((prev) => [...prev, { id: newId, filters: {} }]);
              setActiveTabId(newId);
            }}
            className="px-3 py-1 text-sm text-[var(--color-text-primary)]/40 hover:text-[var(--color-text-primary)]/70 transition-colors"
          >
            +
          </button>
        </div>

        {instances.map(
          (inst) =>
            inst.id === activeTabId && (
              <PriceCalculator
                key={inst.id}
                instanceId={inst.id}
                data={data}
                filterFields={filterFields}
                filters={inst.filters}
                onFiltersChange={(id, f) =>
                  setInstances((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, filters: f } : p)),
                  )
                }
                showRemove={instances.length > 1}
                onRemove={(id) => {
                  const remaining = instances.filter((p) => p.id !== id);
                  setInstances(remaining);
                  if (activeTabId === id)
                    setActiveTabId(remaining[remaining.length - 1].id);
                }}
                currency={currency}
                locale={locale}
              />
            ),
        )}

        {instances.length >= 2 && (
          <PriceSummary
            instances={instances.map((inst, i) => ({
              filters: inst.filters,
              price: prices[i],
            }))}
            filterFields={filterFields}
            currency={currency}
            locale={locale}
          />
        )}

        {hasPrices && Object.keys(branding).length > 0 && (
          <div className="flex flex-col items-center gap-2 mt-8">
            <button
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              style={{ background: "var(--color-main)", color: "#fff" }}
            >
              {pdfLoading ? t("public.pdfLoading") : t("public.downloadPdf")}
            </button>
            {pdfError && (
              <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                {pdfError}
              </p>
            )}
          </div>
        )}

        {showWatermark && <Watermark />}
      </div>
    </div>
  );
}
