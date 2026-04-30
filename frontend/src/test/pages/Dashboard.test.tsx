import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { Dashboard } from "../../pages/Dashboard";
import * as client from "../../api/client";
import { createTestQueryClient, TestProviders } from "../test-utils";

function renderDashboard() {
  const queryClient = createTestQueryClient();
  return render(
    <TestProviders queryClient={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard"]}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/new" element={<div>New Calculator</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </TestProviders>,
  );
}

function makeCalc(overrides = {}) {
  return {
    id: "1",
    name: "Diamond Ring",
    slug: "diamond-ring",
    tenantSlug: "my-tenant",
    sheetUrl: "https://example.com",
    settings: {},
    branding: {},
    isActive: true,
    ...overrides,
  };
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows list of calculators", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([
      {
        id: "1",
        name: "Diamond Ring",
        slug: "diamond-ring",
        tenantSlug: "my-tenant",
        sheetUrl: "https://example.com",
        settings: {},
        branding: {},
        isActive: true,
      },
    ]);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Diamond Ring")).toBeInTheDocument(),
    );
  });

  it("shows view link pointing to public calculator url", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([
      {
        id: "1",
        name: "Diamond Ring",
        slug: "diamond-ring",
        tenantSlug: "my-tenant",
        sheetUrl: "https://example.com",
        settings: {},
        branding: {},
        isActive: true,
      },
    ]);
    renderDashboard();
    const viewLink = await screen.findByRole("link", { name: /view/i });
    expect(viewLink).toHaveAttribute("href", "/c/my-tenant/diamond-ring");
  });

  it("shows empty state when no calculators", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([]);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText(/no calculators/i)).toBeInTheDocument(),
    );
  });

  it("navigates to create page on link click", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([]);
    renderDashboard();
    await userEvent.click(
      await screen.findByRole("link", { name: /new calculator/i }),
    );
    expect(screen.getByText("New Calculator")).toBeInTheDocument();
  });

  it("shows confirmation dialog when delete button clicked", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([
      {
        id: "1",
        name: "Diamond Ring",
        slug: "diamond-ring",
        tenantSlug: "my-tenant",
        sheetUrl: "https://example.com",
        settings: {},
        branding: {},
        isActive: true,
      },
    ]);
    renderDashboard();
    await userEvent.click(await screen.findByRole("button", { name: /delete/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
  });

  it("does NOT call delete API when cancel clicked in confirmation", async () => {
    const apiFetchAuthMock = vi.spyOn(client, "apiFetchAuth").mockResolvedValue([
      {
        id: "1",
        name: "Diamond Ring",
        slug: "diamond-ring",
        tenantSlug: "my-tenant",
        sheetUrl: "https://example.com",
        settings: {},
        branding: {},
        isActive: true,
      },
    ]);
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    renderDashboard();
    await userEvent.click(await screen.findByRole("button", { name: /delete/i }));
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // apiFetchAuth called once (initial load), never with DELETE
    expect(apiFetchAuthMock).not.toHaveBeenCalledWith(
      expect.stringContaining("/api/calculators/"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("calls delete API and removes item when confirm clicked", async () => {
    const apiFetchAuthMock = vi.spyOn(client, "apiFetchAuth")
      .mockResolvedValueOnce([
        {
          id: "1",
          name: "Diamond Ring",
          slug: "diamond-ring",
          tenantSlug: "my-tenant",
          sheetUrl: "https://example.com",
          settings: {},
          branding: {},
          isActive: true,
        },
      ])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([]);
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    renderDashboard();
    await userEvent.click(await screen.findByRole("button", { name: /delete/i }));
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /^delete$/i }));
    expect(apiFetchAuthMock).toHaveBeenCalledWith(
      "/api/calculators/1",
      expect.objectContaining({ method: "DELETE" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("Diamond Ring")).not.toBeInTheDocument(),
    );
  });

  it("shows duplicate button when not at limit", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "basic",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([makeCalc()]);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /duplicate/i })).toBeInTheDocument(),
    );
  });

  it("does NOT show duplicate button when at limit", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([
      makeCalc({ id: "1" }),
    ]);
    renderDashboard();
    await waitFor(() =>
      expect(screen.getByText("Diamond Ring")).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("button", { name: /duplicate/i }),
    ).not.toBeInTheDocument();
  });

  it("opens duplicate dialog with pre-filled values", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "basic",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue([makeCalc()]);
    renderDashboard();
    await userEvent.click(
      await screen.findByRole("button", { name: /duplicate/i }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Diamond Ring (copy)"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("diamond-ring-copy"),
    ).toBeInTheDocument();
  });

  it("calls POST with user-edited name and slug when duplicating", async () => {
    const apiFetchAuthMock = vi
      .spyOn(client, "apiFetchAuth")
      .mockResolvedValueOnce([makeCalc()])
      .mockResolvedValueOnce({ id: "2", ...makeCalc({ id: "2" }) });
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "basic",
    });
    renderDashboard();
    await userEvent.click(
      await screen.findByRole("button", { name: /duplicate/i }),
    );

    const nameInput = screen.getByDisplayValue("Diamond Ring (copy)");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Gold Ring");

    const slugInput = screen.getByDisplayValue("diamond-ring-copy");
    await userEvent.clear(slugInput);
    await userEvent.type(slugInput, "gold-ring");

    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /^duplicate$/i }));

    await waitFor(() =>
      expect(apiFetchAuthMock).toHaveBeenCalledWith(
        "/api/calculators",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            name: "Gold Ring",
            slug: "gold-ring",
            sheetUrl: "https://example.com",
            settings: {},
          }),
        }),
      ),
    );
  });

  it("sends branding in duplicate when user is Pro", async () => {
    const apiFetchAuthMock = vi
      .spyOn(client, "apiFetchAuth")
      .mockResolvedValueOnce([
        makeCalc({ branding: { companyName: "Acme" } }),
      ])
      .mockResolvedValueOnce({ id: "2", ...makeCalc({ id: "2" }) });
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "pro",
    });
    renderDashboard();
    await userEvent.click(
      await screen.findByRole("button", { name: /duplicate/i }),
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /^duplicate$/i }));

    await waitFor(() =>
      expect(apiFetchAuthMock).toHaveBeenCalledWith(
        "/api/calculators",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"branding"'),
        }),
      ),
    );
  });

  it("does NOT send branding in duplicate when user is not Pro", async () => {
    const apiFetchAuthMock = vi
      .spyOn(client, "apiFetchAuth")
      .mockResolvedValueOnce([
        makeCalc({ branding: { companyName: "Acme" } }),
      ])
      .mockResolvedValueOnce({ id: "2", ...makeCalc({ id: "2" }) });
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "basic",
    });
    renderDashboard();
    await userEvent.click(
      await screen.findByRole("button", { name: /duplicate/i }),
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /^duplicate$/i }));

    await waitFor(() =>
      expect(apiFetchAuthMock).toHaveBeenCalledWith(
        "/api/calculators",
        expect.objectContaining({
          method: "POST",
          body: expect.not.stringContaining('"branding"'),
        }),
      ),
    );
  });

  it("shows error in dialog when duplicate API fails", async () => {
    vi.spyOn(client, "apiFetchAuth")
      .mockResolvedValueOnce([makeCalc()])
      .mockRejectedValueOnce(new Error("409 Slug already taken"));
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "basic",
    });
    renderDashboard();
    await userEvent.click(
      await screen.findByRole("button", { name: /duplicate/i }),
    );
    const dialog = screen.getByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: /^duplicate$/i }));

    await waitFor(() =>
      expect(screen.getByText("Slug already taken")).toBeInTheDocument(),
    );
  });
});