import { useState, useEffect, ReactNode } from "react";
import { apiFetch } from "../api/client";
import { queryClient } from "../api/queryClient";
import { tenantKeys } from "../api/queries";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantPlan, setTenantPlan] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  function fetchTenant() {
    return apiFetch<{ name: string; slug: string; plan: string; emailVerified: boolean }>(
      "/api/tenants/me"
    )
      .then((data) => {
        setIsLoggedIn(true);
        setTenantName(data.name ?? null);
        setTenantSlug(data.slug ?? null);
        setTenantPlan(data.plan ?? null);
        setEmailVerified(data.emailVerified ?? null);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setEmailVerified(null);
      });
  }

  useEffect(() => {
    fetchTenant();
  }, []);

  function markLoggedIn() {
    void queryClient.invalidateQueries({ queryKey: tenantKeys.me });
    return fetchTenant();
  }

  function logout() {
    setIsLoggedIn(false);
    setTenantName(null);
    setTenantSlug(null);
    setTenantPlan(null);
    setEmailVerified(null);
    void queryClient.invalidateQueries({ queryKey: tenantKeys.me });
    apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }

  async function resendVerificationEmail() {
    await apiFetch("/api/auth/resend-verification", { method: "POST" });
  }

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        tenantName,
        tenantSlug,
        tenantPlan,
        emailVerified,
        markLoggedIn,
        logout,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
