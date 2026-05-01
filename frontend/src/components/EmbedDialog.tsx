import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";

interface EmbedDialogProps {
  open: boolean;
  tenantSlug: string;
  calcSlug: string;
  onClose: () => void;
}

export function EmbedDialog({
  open,
  tenantSlug,
  calcSlug,
  onClose,
}: EmbedDialogProps) {
  const { t } = useTranslation();
  const id = useId();
  const titleId = `${id}-title`;
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("600");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const snippet = `<iframe src="${window.location.origin}/c/${tenantSlug}/${calcSlug}" width="${width}" height="${height}" style="border:none;" loading="lazy" title="Calculator"></iframe>`;

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-surface border border-border-line rounded-xl p-6 w-full max-w-lg mx-4 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-text-primary">
          {t("dashboard.embedTitle")}
        </h2>

        <p className="text-sm text-text-muted">
          {t("dashboard.embedSnippetLabel")}
        </p>

        <textarea
          readOnly
          value={snippet}
          rows={3}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
          className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-bg border border-border-line resize-none focus:outline-none text-text-primary"
        />

        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs mb-1 text-text-muted">
              {t("dashboard.embedWidth")}
            </label>
            <input
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className="w-24 px-2 py-1 rounded-lg text-sm bg-bg border border-main/30 focus:outline-none focus:border-main transition-colors text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-text-muted">
              {t("dashboard.embedHeight")}
            </label>
            <input
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-24 px-2 py-1 rounded-lg text-sm bg-bg border border-main/30 focus:outline-none focus:border-main transition-colors text-text-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-text-muted border border-border-line bg-transparent cursor-pointer"
          >
            {t("confirmDialog.cancel")}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-colors bg-main hover:bg-main-muted"
          >
            {copied ? t("dashboard.embedCopied") : t("dashboard.embedCopy")}
          </button>
        </div>
      </div>
    </div>
  );
}
