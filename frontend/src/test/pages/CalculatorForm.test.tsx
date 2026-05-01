import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/AuthProvider";
import { CalculatorForm } from "../../pages/CalculatorForm";
import * as client from "../../api/client";
import { TestProviders } from "../test-utils";
import { createTestQueryClient } from "../test-helpers";

function renderCreate() {
  const queryClient = createTestQueryClient();
  return render(
    <TestProviders queryClient={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/dashboard/new"]}>
          <Routes>
            <Route path="/dashboard/new" element={<CalculatorForm />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </TestProviders>,
  );
}

describe("CalculatorForm", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("submits create form and redirects to dashboard", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue({
      id: "1",
      name: "Test",
      slug: "test",
      tenantSlug: "my-tenant",
      sheetUrl: "https://example.com",
      settings: {},
      branding: {},
      isActive: true,
    });
    renderCreate();

    await userEvent.type(screen.getByLabelText(/^name$/i), "My Calc");
    await userEvent.type(screen.getByLabelText(/slug/i), "my-calc");
    await userEvent.type(
      screen.getByLabelText(/sheet url/i),
      "https://docs.google.com/test",
    );
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() =>
      expect(screen.getByText("Dashboard")).toBeInTheDocument(),
    );
  });

  it("shows email not verified error when backend returns 403 EMAIL_NOT_VERIFIED", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth")
      .mockRejectedValue(new Error("403 EMAIL_NOT_VERIFIED"));
    renderCreate();

    await userEvent.type(screen.getByLabelText(/^name$/i), "My Calc");
    await userEvent.type(screen.getByLabelText(/slug/i), "my-calc");
    await userEvent.type(
      screen.getByLabelText(/sheet url/i),
      "https://docs.google.com/test",
    );
    await userEvent.click(screen.getByRole("button", { name: /create/i }));

    await waitFor(() =>
      expect(
        screen.getByText(/verify your email before creating/i),
      ).toBeInTheDocument(),
    );
  });
});