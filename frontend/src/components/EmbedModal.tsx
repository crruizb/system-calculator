import { useState } from "react";

interface Calculator {
  tenantSlug: string;
  slug: string;
}

interface EmbedModalProps {
  calc: Calculator;
  onClose: () => void;
}

export function EmbedModal({ calc, onClose }: EmbedModalProps) {
  const [copied, setCopied] = useState(false);
  const origin = window.location.origin;
  const snippet = `<iframe src="${origin}/c/${calc.tenantSlug}/${calc.slug}" width="100%" height="650" frameborder="0"></iframe>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-line)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Código de inserción</h2>
          <button
            onClick={onClose}
            className="text-sm transition-colors"
            style={{ color: "var(--color-text-muted)" }}
          >
            ✕
          </button>
        </div>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Copia este código y pégalo en tu web para insertar la calculadora.
        </p>
        <pre
          className="text-xs p-3 rounded-lg overflow-x-auto"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border-line)",
            color: "var(--color-text-primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {snippet}
        </pre>
        <button
          onClick={handleCopy}
          className="w-full py-2 rounded-lg font-semibold text-sm transition-colors"
          style={{
            background: copied ? "var(--color-main-muted)" : "var(--color-main)",
            color: "#fff",
          }}
        >
          {copied ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
