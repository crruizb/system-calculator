import { useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { DuplicateDialog } from "../components/DuplicateDialog";
import { EmbedDialog } from "../components/EmbedDialog";
import { useCalculators } from "../api/queries";
import {
  useDeleteCalculator,
  useToggleCalculator,
  useDuplicateCalculator,
} from "../api/mutations";

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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { tenantPlan } = useAuth();
  const { theme } = useTheme();
  const max = planLimit(tenantPlan);
  const navigate = useNavigate();
  const [duplicateCalc, setDuplicateCalc] = useState<Calculator | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [embedCalc, setEmbedCalc] = useState<Calculator | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });

  const { data: calculators = [], isLoading: loading } = useCalculators();
  const deleteMutation = useDeleteCalculator();
  const toggleMutation = useToggleCalculator();
  const duplicateMutation = useDuplicateCalculator();

  const atLimit = calculators.length >= max;

  async function handleDelete(id: string) {
    await deleteMutation.mutateAsync(id);
    setConfirmDeleteId(null);
  }

  function handleToggle(calc: Calculator) {
    toggleMutation.mutate(calc);
  }

  function openDuplicateDialog(calc: Calculator) {
    setDuplicateError(null);
    const slugs = new Set(calculators.map((c) => c.slug));
    const names = new Set(calculators.map((c) => c.name));
    let slug = `${calc.slug}-copy`;
    let i = 2;
    while (slugs.has(slug)) {
      slug = `${calc.slug}-copy-${i}`;
      i++;
    }
    let name = `${calc.name} (copy)`;
    let j = 2;
    while (names.has(name)) {
      name = `${calc.name} (copy ${j})`;
      j++;
    }
    setDuplicateCalc({ ...calc, slug, name });
  }

  async function handleDuplicate(name: string, slug: string) {
    if (!duplicateCalc) return;
    setDuplicateError(null);
    const isPro = tenantPlan === "pro";
    const body = {
      name,
      slug,
      sheetUrl: duplicateCalc.sheetUrl,
      settings: duplicateCalc.settings,
      ...(isPro && { branding: duplicateCalc.branding }),
    };
    try {
      const created = await duplicateMutation.mutateAsync(body);
      setDuplicateCalc(null);
      navigate(`/dashboard/${created.id}`);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message.replace(/^\d+\s/, "")
          : t("dashboard.duplicateError");
      setDuplicateError(msg);
    }
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
                    {t("dashboard.inactive")}
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
            <div className="flex items-center gap-4 text-sm border-t border-border-line pt-3">
              <a
                href={`/c/${c.tenantSlug}/${c.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                {t("dashboard.view")}
              </a>
              <Link
                to={`/dashboard/${c.id}`}
                className="text-main transition-colors"
              >
                {t("dashboard.edit")}
              </Link>
              <button
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                  setOpenMenuId(openMenuId === c.id ? null : c.id);
                }}
                className="ml-auto px-1 text-lg leading-none text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                aria-label={t("dashboard.moreActions")}
              >
                ···
              </button>
            </div>
          </li>
        ))}
      </ul>

      {(() => {
        const menuCalc = calculators.find((c) => c.id === openMenuId);
        if (!menuCalc) return null;
        return createPortal(
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
            <div
              className="fixed z-50 min-w-40 rounded-lg border border-border-line bg-surface p-1 shadow-lg"
              data-theme={theme}
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button
                onClick={() => { handleToggle(menuCalc); setOpenMenuId(null); }}
                className="w-full text-left px-3 py-1.5 rounded text-sm text-text-primary hover:bg-border-line transition-colors cursor-pointer"
              >
                {menuCalc.isActive ? t("dashboard.deactivate") : t("dashboard.activate")}
              </button>
              {!atLimit && (
                <button
                  onClick={() => { openDuplicateDialog(menuCalc); setOpenMenuId(null); }}
                  className="w-full text-left px-3 py-1.5 rounded text-sm text-text-primary hover:bg-border-line transition-colors cursor-pointer"
                >
                  {t("dashboard.duplicate")}
                </button>
              )}
              <button
                onClick={() => { setEmbedCalc(menuCalc); setOpenMenuId(null); }}
                className="w-full text-left px-3 py-1.5 rounded text-sm text-text-primary hover:bg-border-line transition-colors cursor-pointer"
              >
                {t("dashboard.embed")}
              </button>
              <div className="h-px bg-border-line my-1" />
              <button
                onClick={() => { setConfirmDeleteId(menuCalc.id); setOpenMenuId(null); }}
                className="w-full text-left px-3 py-1.5 rounded text-sm text-error hover:bg-border-line transition-colors cursor-pointer"
              >
                {t("dashboard.delete")}
              </button>
            </div>
          </>,
          document.body
        );
      })()}

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
      <DuplicateDialog
        open={duplicateCalc !== null}
        initialName={duplicateCalc?.name ?? ""}
        initialSlug={duplicateCalc?.slug ?? ""}
        onConfirm={handleDuplicate}
        onCancel={() => setDuplicateCalc(null)}
        error={duplicateError}
      />
      <EmbedDialog
        open={embedCalc !== null}
        tenantSlug={embedCalc?.tenantSlug ?? ""}
        calcSlug={embedCalc?.slug ?? ""}
        onClose={() => setEmbedCalc(null)}
      />
    </div>
  );
}
