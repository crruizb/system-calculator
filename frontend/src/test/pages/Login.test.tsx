import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { Login } from "../../pages/Login";
import * as client from "../../api/client";

function renderLogin(search = "/login") {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[search]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders email and password fields", () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("renders Google sign-in as a link to /oauth2/authorization/google", () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    renderLogin();
    const link = screen.getByRole("link", { name: /sign in with google/i });
    expect(link).toHaveAttribute("href", "/oauth2/authorization/google");
  });

  it("redirects to /dashboard on successful login", async () => {
    vi.spyOn(client, "apiFetch")
      .mockResolvedValueOnce(new Error("401")) // session restore → not logged in
      .mockResolvedValueOnce(undefined); // POST /api/auth/login
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "test@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pass1234");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText("Dashboard")).toBeInTheDocument(),
    );
  });

  it("shows error message on failed login", async () => {
    vi.spyOn(client, "apiFetch")
      .mockRejectedValueOnce(new Error("401")) // session restore
      .mockRejectedValueOnce(new Error("401 Invalid credentials")); // login attempt
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), "bad@test.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() =>
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument(),
    );
  });

  it("shows OAuth error message when ?error is in URL", () => {
    vi.spyOn(client, "apiFetch").mockReturnValue(new Promise(() => {}));
    renderLogin("/login?error");
    expect(screen.getByText(/sign in with google failed/i)).toBeInTheDocument();
  });
});
