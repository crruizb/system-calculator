import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiFetch } from "../api/client";
import { queryClient } from "../api/queryClient";
import { tenantKeys } from "../api/queries";

interface AuthContextValue {
  isLoggedIn: boolean | null;
  tenantName: string | null;
  tenantPlan: string | null;
  markLoggedIn: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [tenantPlan, setTenantPlan] = useState<string | null>(null);

  function fetchTenant() {
    return apiFetch<{ name: string; plan: string }>("/api/tenants/me")
      .then((data) => {
        setIsLoggedIn(true);
        setTenantName(data.name ?? null);
        setTenantPlan(data.plan ?? null);
      })
      .catch(() => setIsLoggedIn(false));
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
    setTenantPlan(null);
    void queryClient.invalidateQueries({ queryKey: tenantKeys.me });
    apiFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, tenantName, tenantPlan, markLoggedIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}