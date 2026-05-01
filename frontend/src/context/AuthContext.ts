import { createContext } from "react";

interface AuthContextValue {
  isLoggedIn: boolean | null;
  tenantName: string | null;
  tenantSlug: string | null;
  tenantPlan: string | null;
  emailVerified: boolean | null;
  markLoggedIn: () => Promise<void>;
  logout: () => void;
  resendVerificationEmail: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
