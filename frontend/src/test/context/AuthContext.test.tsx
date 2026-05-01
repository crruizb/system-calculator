import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "../../context/AuthProvider";
import { useAuth } from "../../hooks/useAuth";
import { TestProviders } from "../test-utils";
import { createTestQueryClient } from "../test-helpers";
import * as client from "../../api/client";

function TestConsumer() {
  const { isLoggedIn, markLoggedIn, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">
        {isLoggedIn === null ? "loading" : isLoggedIn ? "in" : "out"}
      </span>
      <button onClick={markLoggedIn}>Mark Logged In</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state on mount before auth check completes", async () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    const queryClient = createTestQueryClient();
    render(
      <TestProviders queryClient={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </TestProviders>,
    );
    expect(screen.getByTestId("status").textContent).toBe("loading");
  });

  it("sets isLoggedIn=true when GET /api/tenants/me returns 200", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    const queryClient = createTestQueryClient();
    render(
      <TestProviders queryClient={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </TestProviders>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("in"),
    );
  });

  it("sets isLoggedIn=false when GET /api/tenants/me returns 401", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new Error("401 Unauthorized"),
    );
    const queryClient = createTestQueryClient();
    render(
      <TestProviders queryClient={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </TestProviders>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
  });

  it("markLoggedIn sets isLoggedIn=true after re-fetching tenant", async () => {
    vi.spyOn(client, "apiFetch")
      .mockRejectedValueOnce(new Error("401"))
      .mockResolvedValueOnce({ slug: "my-tenant", plan: "free" });
    const queryClient = createTestQueryClient();
    render(
      <TestProviders queryClient={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </TestProviders>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
    await userEvent.click(screen.getByText("Mark Logged In"));
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("in"),
    );
  });

  it("logout calls POST /api/auth/logout and sets isLoggedIn=false", async () => {
    const fetchSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValueOnce({ slug: "my-tenant", plan: "free" })
      .mockResolvedValueOnce(undefined);
    const queryClient = createTestQueryClient();
    render(
      <TestProviders queryClient={queryClient}>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </TestProviders>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("in"),
    );
    await userEvent.click(screen.getByText("Logout"));
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/logout",
      expect.objectContaining({ method: "POST" }),
    );
  });
});