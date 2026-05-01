import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../../context/AuthProvider";
import { EmailVerificationBanner } from "../../components/EmailVerificationBanner";
import * as client from "../../api/client";
import { TestProviders } from "../test-utils";
import { createTestQueryClient } from "../test-helpers";

function renderBanner(apiFetchImpl: () => Promise<unknown>) {
  const queryClient = createTestQueryClient();
  vi.spyOn(client, "apiFetch").mockImplementation(apiFetchImpl);
  return render(
    <TestProviders queryClient={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <EmailVerificationBanner />
        </MemoryRouter>
      </AuthProvider>
    </TestProviders>,
  );
}

describe("EmailVerificationBanner", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when user is not logged in", async () => {
    renderBanner(() => Promise.reject(new Error("401")));
    // wait for auth check to settle
    await waitFor(() => {});
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders nothing when emailVerified is true", async () => {
    renderBanner(() =>
      Promise.resolve({ slug: "t", plan: "free", emailVerified: true }),
    );
    await waitFor(() => {});
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows banner when emailVerified is false", async () => {
    renderBanner(() =>
      Promise.resolve({ slug: "t", plan: "free", emailVerified: false }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/check your inbox/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /resend email/i }),
    ).toBeInTheDocument();
  });

  it("resend button calls POST /api/auth/resend-verification", async () => {
    renderBanner(() =>
      Promise.resolve({ slug: "t", plan: "free", emailVerified: false }),
    );
    const apiFetchAuthSpy = vi
      .spyOn(client, "apiFetchAuth")
      .mockResolvedValue(undefined);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /resend email/i })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /resend email/i }));

    await waitFor(() =>
      expect(apiFetchAuthSpy).toHaveBeenCalledWith(
        "/api/auth/resend-verification",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("shows 'Email sent!' after successful resend", async () => {
    renderBanner(() =>
      Promise.resolve({ slug: "t", plan: "free", emailVerified: false }),
    );
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue(undefined);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /resend email/i })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /resend email/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /email sent/i })).toBeInTheDocument(),
    );
  });

  it("disables resend button after click", async () => {
    renderBanner(() =>
      Promise.resolve({ slug: "t", plan: "free", emailVerified: false }),
    );
    vi.spyOn(client, "apiFetchAuth").mockResolvedValue(undefined);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /resend email/i })).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: /resend email/i }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /email sent/i }),
      ).toBeDisabled(),
    );
  });
});
