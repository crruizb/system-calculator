import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTenantCalculator } from "../../hooks/useTenantCalculator";
import * as client from "../../api/client";

describe("useTenantCalculator", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns config when API call succeeds", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      sheetUrl: "https://docs.google.com/test",
      settings: { currency: "€", locale: "es-ES" },
      branding: { companyName: "Acme", primaryColor: "#ff0000", logo: null },
    });

    const { result } = renderHook(() =>
      useTenantCalculator("acme", "diamond-ring"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config?.sheetUrl).toBe(
      "https://docs.google.com/test",
    );
    expect(result.current.config?.settings.currency).toBe("€");
    expect(result.current.config?.branding.companyName).toBe("Acme");
    expect(result.current.error).toBeNull();
  });

  it("returns error when API call fails", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(new Error("404 Not Found"));

    const { result } = renderHook(() =>
      useTenantCalculator("no-tenant", "no-calc"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.config).toBeNull();
    expect(result.current.error).toBe("404 Not Found");
  });
});
