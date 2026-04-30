import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTenantCalculator } from "../../api/queries";
import * as client from "../../api/client";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useTenantCalculator", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns config when API call succeeds", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      sheetUrl: "https://docs.google.com/test",
      settings: { currency: "€", locale: "es-ES" },
      branding: { companyName: "Acme", primaryColor: "#ff0000", logo: null },
    });

    const { result } = renderHook(
      () => useTenantCalculator("acme", "diamond-ring"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.sheetUrl).toBe(
      "https://docs.google.com/test",
    );
    expect(result.current.data?.settings.currency).toBe("€");
    expect(result.current.data?.branding.companyName).toBe("Acme");
  });

  it("returns error when API call fails", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(new Error("404 Not Found"));

    const { result } = renderHook(
      () => useTenantCalculator("no-tenant", "no-calc"),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe("404 Not Found");
  });
});