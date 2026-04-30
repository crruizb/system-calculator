import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

interface DuplicateDialogProps {
  open: boolean;
  initialName: string;
  initialSlug: string;
  onConfirm: (name: string, slug: string) => Promise<void>;
  onCancel: () => void;
  error: string | null;
}

export function DuplicateDialog({
  open,
  initialName,
  initialSlug,
  onConfirm,
  onCancel,
  error,
}: DuplicateDialogProps) {
  const { t } = useTranslation();
  const id = useId();
  const titleId = `${id}-title`;
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setSlug(initialSlug);
      setLoading(false);
    }
  }, [open, initialName, initialSlug]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(name, slug);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.6)",
      }}
      onClick={onCancel}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-line)",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          maxWidth: "24rem",
          width: "100%",
          margin: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2
          id={titleId}
          style={{
            color: "var(--color-text-primary)",
            fontSize: "1.125rem",
            fontWeight: 600,
          }}
        >
          {t("dashboard.duplicateTitle")}
        </h2>

        <div>
          <label
            htmlFor="dup-name"
            className="block text-sm mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("calcForm.name")}
          </label>
          <input
            id="dup-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-main)]/30 focus:outline-none focus:border-[var(--color-main)] transition-colors text-sm"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>

        <div>
          <label
            htmlFor="dup-slug"
            className="block text-sm mb-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            {t("calcForm.slug")}
          </label>
          <input
            id="dup-slug"
            required
            pattern="^[a-z0-9-]{2,63}$"
            value={slug}
            onChange={(e) =>
              setSlug(
                e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              )
            }
            className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-main)]/30 focus:outline-none focus:border-[var(--color-main)] transition-colors text-sm"
            style={{ color: "var(--color-text-primary)" }}
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
            marginTop: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border-line)",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {t("confirmDialog.cancel")}
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fff",
              background: "var(--color-main)",
              border: "none",
              cursor: "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? t("calcForm.saving") : t("dashboard.duplicate")}
          </button>
        </div>
      </form>
    </div>
  );
}
