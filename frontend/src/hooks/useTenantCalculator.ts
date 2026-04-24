import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

export interface TenantCalculatorConfig {
  sheetUrl: string;
  settings: { currency: string; locale: string; [key: string]: unknown };
  branding: {
    companyName?: string;
    primaryColor?: string;
    logo?: string | null;
  };
}

interface State {
  config: TenantCalculatorConfig | null;
  loading: boolean;
  error: string | null;
}

export function useTenantCalculator(
  tenantSlug: string,
  calcSlug: string,
): State {
  const [state, setState] = useState<State>({
    config: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setState({ config: null, loading: true, error: null });
    apiFetch<TenantCalculatorConfig>(`/api/public/${tenantSlug}/${calcSlug}`)
      .then((config) => setState({ config, loading: false, error: null }))
      .catch((err: Error) =>
        setState({ config: null, loading: false, error: err.message }),
      );
  }, [tenantSlug, calcSlug]);

  return state;
}
