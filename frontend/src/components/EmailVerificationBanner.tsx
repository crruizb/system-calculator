import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useResendVerification } from "../api/mutations";

export function EmailVerificationBanner() {
  const { isLoggedIn, emailVerified } = useAuth();
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const resend = useResendVerification();

  if (!isLoggedIn || emailVerified !== false) return null;

  async function handleResend() {
    try {
      await resend.mutateAsync(undefined);
      setSent(true);
    } catch {
      // error state shown via resend.isError
    }
  }

  return (
    <div
      role="alert"
      style={{
        background: "#fef3c7",
        borderBottom: "1px solid #f59e0b",
        color: "#92400e",
      }}
      className="px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3"
    >
      <span>{t("emailBanner.message")}</span>
      <button
        onClick={handleResend}
        disabled={resend.isPending || sent}
        className="font-semibold underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sent
          ? t("emailBanner.sent")
          : resend.isPending
            ? t("emailBanner.sending")
            : t("emailBanner.resend")}
      </button>
    </div>
  );
}
