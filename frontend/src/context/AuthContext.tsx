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
  markLoggedIn: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch("/api/tenants/me")
      .then(() => setIsLoggedIn(true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  function markLoggedIn() {
    setIsLoggedIn(true);
  }

  async function logout() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      setIsLoggedIn(false);
    }
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, markLoggedIn, logout }}>
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
