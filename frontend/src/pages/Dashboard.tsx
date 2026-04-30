import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetchAuth } from "../api/client";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "../components/ConfirmDialog";

function planLimit(plan: string | null): number {
  if (plan === "pro") return 10;
  if (plan === "basic") return 3;
  return 1;
}

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { tenantPlan } = useAuth();
  const max = planLimit(tenantPlan);
  const atLimit = calculators.length >= max;

  useEffect(() => {
    apiFetchAuth<Calculator[]>("/api/calculators")
      .then(setCalculators)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    await apiFetchAuth(`/api/calculators/${id}`, { method: "DELETE" });
    setCalculators((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleToggle(calc: Calculator) {
    const updated = await apiFetchAuth<Calculator>(
      `/api/calculators/${calc.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ isActive: !calc.isActive }),
      },
    );
    setCalculators((prev) => prev.map((c) => (c.id === calc.id ? updated : c)));
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <span style={{ color: "var(--color-text-muted)" }}>
          {t("dashboard.loading")}
        </span>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
        <h1
          className="font-display text-3xl"
          style={{ color: "var(--color-text-primary)" }}
        >
          {t("dashboard.title")}
        </h1>
        <div className="flex items-center gap-3">
          <span
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("dashboard.usage", { count: calculators.length, max })}
          </span>
          {atLimit ? (
            <span className="flex items-center gap-2 text-sm">
              <span style={{ color: "var(--color-text-muted)" }}>
                {t("dashboard.limitReached")}
              </span>
              <Link
                to="/dashboard/billing"
                className="font-semibold transition-colors"
                style={{ color: "var(--color-main)" }}
              >
                {t("dashboard.upgrade")}
              </Link>
            </span>
          ) : (
            <Link
              to="/dashboard/new"
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: "var(--color-main)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--color-main-muted)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--color-main)")
              }
            >
              {t("dashboard.newCalc")}
            </Link>
          )}
        </div>
      </div>

      {calculators.length === 0 && (
        <div className="text-center py-20">
          <p className="mb-2" style={{ color: "var(--color-text-muted)" }}>
            {t("dashboard.empty")}
          </p>
          <Link
            to="/guide"
            className="text-sm transition-colors"
            style={{ color: "var(--color-main)" }}
          >
            {t("dashboard.emptyGuide")}
          </Link>
        </div>
      )}

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {calculators.map((c) => (
          <li
            key={c.id}
            className="rounded-xl p-5 flex flex-col gap-4 transition-opacity"
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border-line)",
              opacity: c.isActive ? 1 : 0.6,
            }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {c.name}
                </p>
                {!c.isActive && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{
                      background: "var(--color-border-line)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Inactivo
                  </span>
                )}
              </div>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                /c/{c.tenantSlug}/{c.slug}
              </p>
            </div>
            <div
              className="flex items-center gap-4 text-sm border-t pt-3 flex-wrap"
              style={{ borderColor: "var(--color-border-line)" }}
            >
              <a
                href={`/c/${c.tenantSlug}/${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-muted)")
                }
              >
                {t("dashboard.view")}
              </a>
              <Link
                to={`/dashboard/${c.id}`}
                className="transition-colors"
                style={{ color: "var(--color-main)" }}
              >
                {t("dashboard.edit")}
              </Link>
              <button
                onClick={() => handleToggle(c)}
                className="transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--color-text-muted)")
                }
              >
                {c.isActive
                  ? t("dashboard.deactivate")
                  : t("dashboard.activate")}
              </button>
              <button
                onClick={() => setConfirmDeleteId(c.id)}
                className="ml-auto transition-colors"
                style={{ color: "var(--color-error)" }}
              >
                {t("dashboard.delete")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title={t("confirmDialog.deleteCalculatorTitle")}
        message={t("confirmDialog.deleteCalculatorMessage")}
        confirmLabel={t("confirmDialog.confirm")}
        cancelLabel={t("confirmDialog.cancel")}
        onConfirm={async () => {
          if (confirmDeleteId) await handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
