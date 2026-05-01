import { useQuery } from "@tanstack/react-query";
import { apiFetch, apiFetchAuth } from "./client";
import Papa from "papaparse";
import type { SheetRow } from "../utils/filters";
import type { TenantCalculatorConfig } from "../hooks/useTenantCalculator";

// ── Query Key Factories ──────────────────────────────────────────

export const calculatorKeys = {
  all: ["calculators"] as const,
  list: () => [...calculatorKeys.all, "list"] as const,
  detail: (id: string) => [...calculatorKeys.all, "detail", id] as const,
};

export const tenantKeys = {
  me: ["tenant", "me"] as const,
};

export const publicKeys = {
  calculator: (tenantSlug: string, calcSlug: string) =>
    ["public", tenantSlug, calcSlug] as const,
  sheetData: (url: string) => ["sheetData", url] as const,
};

// ── Types ─────────────────────────────────────────────────────────

export interface Calculator {
  id: string;
  name: string;
  slug: string;
  tenantSlug: string;
  sheetUrl: string;
  settings: Record<string, unknown>;
  branding: Record<string, unknown>;
  isActive: boolean;
}

export interface TenantMe {
  id: string;
  slug: string;
  name: string;
  plan: string;
  hasPassword: boolean;
}

// ── Query Hooks ───────────────────────────────────────────────────

export function useCalculators() {
  return useQuery({
    queryKey: calculatorKeys.list(),
    queryFn: () => apiFetchAuth<Calculator[]>("/api/calculators"),
  });
}

export function useCalculator(id: string | undefined) {
  return useQuery({
    queryKey: calculatorKeys.detail(id!),
    queryFn: () => apiFetchAuth<Calculator>(`/api/calculators/${id!}`),
    enabled: !!id,
  });
}

export function useTenantMe() {
  return useQuery({
    queryKey: tenantKeys.me,
    queryFn: () => apiFetchAuth<TenantMe>("/api/tenants/me"),
  });
}

export function useTenantCalculator(tenantSlug: string, calcSlug: string) {
  return useQuery({
    queryKey: publicKeys.calculator(tenantSlug, calcSlug),
    queryFn: () =>
      apiFetch<TenantCalculatorConfig>(`/api/public/${tenantSlug}/${calcSlug}`),
    enabled: !!tenantSlug && !!calcSlug,
  });
}

export function useSheetData(sheetUrl: string | null) {
  return useQuery({
    queryKey: publicKeys.sheetData(sheetUrl!),
    queryFn: () =>
      new Promise<SheetRow[]>((resolve, reject) => {
        Papa.parse<SheetRow>(sheetUrl!, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const cleaned = results.data.filter((row) =>
              Object.values(row).some((v) => v && v.trim() !== ""),
            );
            resolve(cleaned);
          },
          error: (err) => reject(new Error(err.message)),
        });
      }),
    enabled: !!sheetUrl,
    staleTime: 10_000,
  });
}
