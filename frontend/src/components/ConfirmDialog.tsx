import { useEffect, useId } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const id = useId();
  const titleId = `${id}-title`;
  const descId = `${id}-desc`;

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
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
      >
        <h2
          id={titleId}
          style={{
            color: "var(--color-text-primary)",
            fontSize: "1.125rem",
            fontWeight: 600,
          }}
        >
          {title}
        </h2>
        <p
          id={descId}
          style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
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
            {cancelLabel}
          </button>
          <button
            autoFocus
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#fff",
              background: "var(--color-error)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
