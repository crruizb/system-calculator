import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTenantMe, TenantMe } from "../api/queries";
import { useUpdateTenant, useChangePassword } from "../api/mutations";
import { useAuth } from "../hooks/useAuth";

function SettingsForm({ tenant }: { tenant: TenantMe }) {
  const { t } = useTranslation();
  const { markLoggedIn } = useAuth();

  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [companySaved, setCompanySaved] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateTenant = useUpdateTenant();
  const changePassword = useChangePassword();

  const inputClass =
    "w-full px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-main)]/30 focus:outline-none focus:border-[var(--color-main)] transition-colors";

  async function handleCompanySubmit(e: FormEvent) {
    e.preventDefault();
    setCompanyError(null);
    setCompanySaved(false);
    try {
      await updateTenant.mutateAsync({ name, slug });
      await markLoggedIn();
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.replace(/^\d+\s/, "") : t("settings.saveError");
      setCompanyError(msg === "Slug already taken" ? t("settings.errorConflict") : msg);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"));
      return;
    }
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message.replace(/^\d+\s/, "") : t("settings.saveError");
      setPasswordError(msg === "Current password incorrect" ? t("settings.passwordWrong") : msg);
    }
  }

  return (
    <>
      {/* Company section */}
      <div
        className="rounded-2xl p-5 sm:p-8"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-line)",
        }}
      >
        <h2 className="font-semibold text-lg mb-6">{t("settings.companySection")}</h2>
        <form onSubmit={handleCompanySubmit} className="space-y-4">
          <div>
            <label htmlFor="settings-name" className="block text-sm mb-1">
              {t("settings.companyName")}
            </label>
            <input
              id="settings-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="settings-slug" className="block text-sm mb-1">
              {t("settings.slug")}
            </label>
            <input
              id="settings-slug"
              required
              pattern="^[a-z0-9-]{2,63}$"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              className={inputClass}
            />
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              {t("settings.slugHint")}
            </p>
            <p className="mt-1 text-xs text-amber-500">
              {t("settings.slugWarning")}
            </p>
          </div>
          {companyError && <p className="text-red-400 text-sm">{companyError}</p>}
          <button
            type="submit"
            disabled={updateTenant.isPending}
            className="w-full py-3 rounded-lg bg-[var(--color-main)] text-white font-semibold hover:bg-[var(--color-main-muted)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {updateTenant.isPending
              ? t("settings.saving")
              : companySaved
                ? t("settings.saved")
                : t("settings.saveChanges")}
          </button>
        </form>
      </div>

      {/* Password section */}
      <div
        className="rounded-2xl p-5 sm:p-8"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border-line)",
        }}
      >
        <h2 className="font-semibold text-lg mb-6">{t("settings.passwordSection")}</h2>
        {!tenant.hasPassword ? (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {t("settings.passwordNoAuth")}
          </p>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="settings-current-pw" className="block text-sm mb-1">
                {t("settings.currentPassword")}
              </label>
              <input
                id="settings-current-pw"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="settings-new-pw" className="block text-sm mb-1">
                {t("settings.newPassword")}
              </label>
              <input
                id="settings-new-pw"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="settings-confirm-pw" className="block text-sm mb-1">
                {t("settings.confirmPassword")}
              </label>
              <input
                id="settings-confirm-pw"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            {passwordError && <p className="text-red-400 text-sm">{passwordError}</p>}
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="w-full py-3 rounded-lg bg-[var(--color-main)] text-white font-semibold hover:bg-[var(--color-main-muted)] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {changePassword.isPending
                ? t("settings.saving")
                : passwordSaved
                  ? t("settings.saved")
                  : t("settings.saveChanges")}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const { data: tenant } = useTenantMe();

  if (!tenant) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-3xl">{t("settings.title")}</h1>
        <p className="mt-4 text-[var(--color-text-muted)]">{t("settings.loading")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="font-display text-3xl">{t("settings.title")}</h1>
      <SettingsForm key={tenant.id} tenant={tenant} />
    </div>
  );
}
