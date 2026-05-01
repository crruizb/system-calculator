import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetchAuth } from "./client";
import { calculatorKeys, tenantKeys } from "./queries";
import type { Calculator, TenantMe } from "./queries";

export function useDeleteCalculator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetchAuth(`/api/calculators/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculatorKeys.list() });
    },
  });
}

export function useToggleCalculator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (calc: Calculator) =>
      apiFetchAuth<Calculator>(`/api/calculators/${calc.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !calc.isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculatorKeys.list() });
    },
  });
}

export function useCreateCalculator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchAuth<Calculator>("/api/calculators", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculatorKeys.list() });
    },
  });
}

export function useUpdateCalculator(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchAuth(`/api/calculators/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculatorKeys.list() });
      queryClient.invalidateQueries({
        queryKey: calculatorKeys.detail(id),
      });
    },
  });
}

export function useDuplicateCalculator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetchAuth<Calculator>("/api/calculators", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calculatorKeys.list() });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { name: string; slug: string }) =>
      apiFetchAuth<TenantMe>("/api/tenants/me", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      apiFetchAuth("/api/auth/change-password", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  });
}