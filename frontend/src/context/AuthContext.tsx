import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiFetch } from "../api/client";

interface AuthContextValue {
  isLoggedIn: boolean | null;
  tenantName: string | null;
  tenantPlan: string | null;
  markLoggedIn: () => void;
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
    fetchTenant();
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsLoggedIn(false);
      setTenantName(null);
      setTenantPlan(null);
    }
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
