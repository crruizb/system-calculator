import { useState } from "react";
import { apiFetchAuth } from "../api/client";
import { useTenantMe } from "../api/queries";
import { useTranslation } from "react-i18next";

interface TenantInfo {
  id: string;
  slug: string;
  name: string;
  plan: string;
}

export function BillingPage() {
  const { data: tenant } = useTenantMe() as { data: TenantInfo | undefined };
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function upgrade(plan: "basic" | "pro") {
    setLoading(true);
    const { url } = await apiFetchAuth<{ url: string }>(
      `/api/billing/checkout?plan=${plan}`,
    );
    window.location.href = url;
  }

  async function openPortal() {
    setLoading(true);
    const { url } = await apiFetchAuth<{ url: string }>("/api/billing/portal");
    window.location.href = url;
  }

  const planKey = tenant?.plan ?? "free";
  const planLabel = t(
    `billing.plan${planKey.charAt(0).toUpperCase() + planKey.slice(1)}`,
  );

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl mb-8">{t("billing.title")}</h1>

      <div className="p-6 bg-[var(--color-surface)] rounded-2xl mb-6">
        <p className="text-sm text-[var(--color-text-primary)]/50 mb-1">
          {t("billing.currentPlan")}
        </p>
        <p className="text-2xl font-semibold">{planLabel}</p>
      </div>

      {tenant?.plan !== "pro" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tenant?.plan === "free" && (
            <button
              onClick={() => upgrade("basic")}
              disabled={loading}
              className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-main)]/30 hover:border-[var(--color-main)] transition-colors text-left"
            >
              <p className="font-semibold mb-1">{t("billing.planBasic")}</p>
              <p className="text-2xl font-display mb-2">
                {t("billing.basicPrice")}
              </p>
              <p className="text-sm text-[var(--color-text-primary)]/50">
                {t("billing.basicFeatures")}
              </p>
            </button>
          )}
          <button
            onClick={() => upgrade("pro")}
            disabled={loading}
            className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-main)]/30 hover:border-[var(--color-main)] transition-colors text-left"
          >
            <p className="font-semibold mb-1">{t("billing.planPro")}</p>
            <p className="text-2xl font-display mb-2">
              {t("billing.proPrice")}
            </p>
            <p className="text-sm text-[var(--color-text-primary)]/50">
              {t("billing.proFeatures")}
            </p>
          </button>
        </div>
      )}

      {tenant?.plan !== "free" && (
        <button
          onClick={openPortal}
          disabled={loading}
          className="mt-6 text-sm text-[var(--color-main)] hover:underline"
        >
          {t("billing.manage")}
        </button>
      )}
    </div>
  );
}