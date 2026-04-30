import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PublicCalculator } from "../../pages/PublicCalculator";
import * as queries from "../../api/queries";

describe("PublicCalculator", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows loading state initially", () => {
    vi.spyOn(queries, "useTenantCalculator").mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as ReturnType<typeof queries.useTenantCalculator>);
    vi.spyOn(queries, "useSheetData").mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof queries.useSheetData>);

    render(
      <MemoryRouter initialEntries={["/c/acme/diamond-ring"]}>
        <Routes>
          <Route
            path="/c/:tenantSlug/:calcSlug"
            element={<PublicCalculator />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it("shows error message when config fetch fails", () => {
    vi.spyOn(queries, "useTenantCalculator").mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("404 Not Found"),
    } as ReturnType<typeof queries.useTenantCalculator>);
    vi.spyOn(queries, "useSheetData").mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof queries.useSheetData>);

    render(
      <MemoryRouter initialEntries={["/c/acme/diamond-ring"]}>
        <Routes>
          <Route
            path="/c/:tenantSlug/:calcSlug"
            element={<PublicCalculator />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it("applies primaryColor as CSS variable when branding has color", () => {
    vi.spyOn(queries, "useTenantCalculator").mockReturnValue({
      data: {
        sheetUrl: "https://example.com",
        settings: { currency: "€", locale: "es-ES" },
        branding: {
          companyName: "Acme Jewels",
          primaryColor: "#ff0000",
          logo: null,
        },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof queries.useTenantCalculator>);
    vi.spyOn(queries, "useSheetData").mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof queries.useSheetData>);

    const { container } = render(
      <MemoryRouter initialEntries={["/c/acme/diamond-ring"]}>
        <Routes>
          <Route
            path="/c/:tenantSlug/:calcSlug"
            element={<PublicCalculator />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue("--color-main")).toBe("#ff0000");
  });

  it("shows watermark when branding has no companyName", () => {
    vi.spyOn(queries, "useTenantCalculator").mockReturnValue({
      data: {
        sheetUrl: "https://example.com",
        settings: { currency: "€", locale: "es-ES" },
        branding: {},
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof queries.useTenantCalculator>);
    vi.spyOn(queries, "useSheetData").mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof queries.useSheetData>);

    render(
      <MemoryRouter initialEntries={["/c/acme/diamond-ring"]}>
        <Routes>
          <Route
            path="/c/:tenantSlug/:calcSlug"
            element={<PublicCalculator />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/powered by/i)).toBeInTheDocument();
  });
});