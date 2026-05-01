import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { calcT } from "../utils/calcT";
import { useTheme } from "../context/ThemeContext";
import { useTenantCalculator, useSheetData } from "../api/queries";
import PriceCalculator from "../components/PriceCalculator";
import PriceSummary from "../components/PriceSummary";
import LoadingSpinner from "../components/LoadingSpinner";
import { Watermark } from "../components/Watermark";
import { getFilterFields, matchPrice } from "../utils/filters";
import { useSeo } from "../hooks/useSeo";

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
  const [searchParams] = useSearchParams();
  const { theme, toggleTheme } = useTheme();
  const {
    data: config,
    isLoading: configLoading,
    error,
  } = useTenantCalculator(tenantSlug, calcSlug);
  const { data, isLoading: dataLoading } = useSheetData(config?.sheetUrl ?? null);
  const [instances, setInstances] = useState<CalculatorInstance[]>([
    { id: crypto.randomUUID(), filters: {} },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>(() => instances[0].id);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const BASE_URL = import.meta.env.VITE_API_URL ?? "";
  const t = calcT((config?.settings?.locale as string | undefined) ?? "es-ES");

  const filterFields = useMemo(() => getFilterFields(data), [data]);

  useEffect(() => {
    if (filterFields.length === 0) return;
    const indexedEntries = [...searchParams.entries()].filter(([k]) => /^\d+_/.test(k));
    if (indexedEntries.length > 0) {
      const tabsMap = new Map<number, Filters>();
      indexedEntries.forEach(([key, value]) => {
        const sep = key.indexOf("_");
        const idx = parseInt(key.slice(0, sep), 10);
        const field = key.slice(sep + 1);
        if (!tabsMap.has(idx)) tabsMap.set(idx, {});
        tabsMap.get(idx)![field] = value;
      });
      const newInstances = [...tabsMap.keys()]
        .sort((a, b) => a - b)
        .map((idx) => ({ id: crypto.randomUUID(), filters: tabsMap.get(idx)! }));
      setInstances(newInstances);
      setActiveTabId(newInstances[0].id);
    } else {
      const params: Filters = {};
      filterFields.forEach((field) => {
        const val = searchParams.get(field);
        if (val) params[field] = val;
      });
      if (Object.keys(params).length > 0) {
        setInstances((prev) => [{ ...prev[0], filters: params }, ...prev.slice(1)]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterFields]);

  const prices = useMemo(
    () => instances.map((inst) => matchPrice(data, inst.filters, filterFields)),
    [instances, data, filterFields],
  );

  const hasPrices = prices.some((p) => p !== null);

  const resolvedInstances = instances
    .map((inst, i) => ({ inst, price: prices[i] }))
    .filter(({ price }) => price !== null);

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

  function handleShareWhatsApp() {
    const name = config?.branding?.companyName ?? "Calculator";
    const shareLocale = (config?.settings?.locale as string) ?? "es-ES";
    const isEn = shareLocale.startsWith("en");
    const count = resolvedInstances.length;
    const intro = isEn
      ? count > 1
        ? `Hey! I just compared *${count}* prices with *${name}* on Prexario.`
        : `Hey! I just got a quote from *${name}* on Prexario.`
      : count > 1
        ? `Hola! Acabo de comparar *${count}* precios con *${name}* en Prexario.`
        : `Hola! Acabo de obtener un presupuesto de *${name}* en Prexario.`;
    const checkItOut = isEn ? "Check it out:" : "Míralo aquí:";
    const lines: string[] = [intro, "", checkItOut];

    const params = new URLSearchParams();
    resolvedInstances.forEach(({ inst }, idx) => {
      filterFields.forEach((f) => {
        if (inst.filters[f]) params.set(`${idx}_${f}`, inst.filters[f]!);
      });
    });
    const shareUrl = `${window.location.origin}/c/${tenantSlug}/${calcSlug}?${params}`;
    lines.push(shareUrl);

    const encoded = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/?text=${encoded}`, "_blank", "noopener");
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
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded transition-colors cursor-pointer"
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
              className={`px-3 py-1 text-sm rounded-t-lg transition-colors cursor-pointer ${
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
            className="px-3 py-1 text-sm text-[var(--color-text-primary)]/40 hover:text-[var(--color-text-primary)]/70 transition-colors cursor-pointer"
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

        {hasPrices && (
          <div className="flex flex-col items-center gap-3 mt-8">
            {Object.keys(branding).length > 0 && (
              <>
                <button
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="px-6 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  style={{ background: "var(--color-main)", color: "#fff" }}
                >
                  {pdfLoading ? t("public.pdfLoading") : t("public.downloadPdf")}
                </button>
                {pdfError && (
                  <p className="text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
                    {pdfError}
                  </p>
                )}
              </>
            )}
            <button
              onClick={handleShareWhatsApp}
              className="md:hidden flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold text-white transition-colors cursor-pointer"
              style={{ background: "#25D366" }}
            >
              <WhatsAppIcon />
              {t("public.shareWhatsApp")}
            </button>
          </div>
        )}

        {showWatermark && <Watermark />}
      </div>
    </div>
  );
}
