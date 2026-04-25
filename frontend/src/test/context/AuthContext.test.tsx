import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../../context/AuthContext";
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
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("status").textContent).toBe("loading");
  });

  it("sets isLoggedIn=true when GET /api/tenants/me returns 200", async () => {
    vi.spyOn(client, "apiFetch").mockResolvedValue({
      slug: "my-tenant",
      plan: "free",
    });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("in"),
    );
  });

  it("sets isLoggedIn=false when GET /api/tenants/me returns 401", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(
      new Error("401 Unauthorized"),
    );
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
  });

  it("markLoggedIn sets isLoggedIn=true synchronously", async () => {
    vi.spyOn(client, "apiFetch").mockRejectedValue(new Error("401"));
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("out"),
    );
    await userEvent.click(screen.getByText("Mark Logged In"));
    expect(screen.getByTestId("status").textContent).toBe("in");
  });

  it("logout calls POST /api/auth/logout and sets isLoggedIn=false", async () => {
    const fetchSpy = vi
      .spyOn(client, "apiFetch")
      .mockResolvedValueOnce({ slug: "my-tenant", plan: "free" }) // session restore
      .mockResolvedValueOnce(undefined); // logout
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
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
