import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPage } from "../../pages/SettingsPage";
import { AuthProvider } from "../../context/AuthProvider";
import { TestProviders } from "../test-utils";
import { createTestQueryClient } from "../test-helpers";
import * as client from "../../api/client";

function renderSettingsPage() {
  const queryClient = createTestQueryClient();
  return render(
    <TestProviders queryClient={queryClient}>
      <AuthProvider>
        <SettingsPage />
      </AuthProvider>
    </TestProviders>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows translated error message when slug is already taken", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      name: "Acme",
      slug: "acme",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth")
      .mockResolvedValueOnce({
        id: "1",
        name: "Acme",
        slug: "acme",
        plan: "free",
        hasPassword: true,
      })
      .mockRejectedValueOnce(new Error("409 Slug already taken"));

    renderSettingsPage();

    await waitFor(() =>
      expect(screen.getByLabelText(/company name/i)).toHaveValue("Acme"),
    );

    const slugInput = screen.getByLabelText(/url slug/i);
    await userEvent.clear(slugInput);
    await userEvent.type(slugInput, "taken-slug");

    await userEvent.click(screen.getAllByRole("button", { name: /^save$/i })[0]);

    await waitFor(() =>
      expect(screen.getByText(/slug already taken/i)).toBeInTheDocument(),
    );
  });

  it("shows success state after updating company settings", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      name: "Acme Inc",
      slug: "acme-inc",
      plan: "free",
    });
    vi.spyOn(client, "apiFetchAuth")
      .mockResolvedValueOnce({
        id: "1",
        name: "Acme",
        slug: "acme",
        plan: "free",
        hasPassword: true,
      })
      .mockResolvedValueOnce({
        id: "1",
        name: "Acme Inc",
        slug: "acme-inc",
        plan: "free",
        hasPassword: true,
      });

    renderSettingsPage();

    await waitFor(() =>
      expect(screen.getByLabelText(/company name/i)).toHaveValue("Acme"),
    );

    const nameInput = screen.getByLabelText(/company name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Acme Inc");

    await userEvent.click(screen.getAllByRole("button", { name: /^save$/i })[0]);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /saved!/i })).toBeInTheDocument(),
    );
  });
});
