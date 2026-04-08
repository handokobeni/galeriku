import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
const mockFetch = vi.fn().mockResolvedValue({ ok: true });

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
}));

global.fetch = mockFetch;

import { SetupForm } from "../setup-form";
import { signUp } from "@/features/auth/lib/auth-client";

describe("SetupForm", () => {
  const mockSignUpEmail = signUp.email as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUpEmail.mockResolvedValue({ error: null });
    mockFetch.mockResolvedValue({ ok: true });
  });

  it("renders setup form", () => {
    render(<SetupForm />);
    expect(screen.getByRole("heading", { name: /set up your studio/i })).toBeInTheDocument();
  });

  it("renders all input fields", () => {
    render(<SetupForm />);
    expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<SetupForm />);
    expect(
      screen.getByRole("button", { name: "Create Owner Account" })
    ).toBeInTheDocument();
  });

  it("calls signUp.email and setup-owner API on successful setup, then redirects", async () => {
    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Owner User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "owneruser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: "Owner User",
        username: "owneruser",
        email: "owner@test.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/auth/setup-owner", {
        method: "POST",
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/albums");
    });
  });

  it("shows error message when signUp fails", async () => {
    mockSignUpEmail.mockResolvedValueOnce({
      error: { message: "Email already in use" },
    });

    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Owner User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "owneruser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to create account. Email may already be in use."
        )
      ).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error message when setup-owner API returns not ok", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Owner User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "owneruser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Account created but failed to set owner role.")
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error message when setup-owner API throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Owner User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "owneruser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Account created but failed to set owner role.")
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows field error when name is too short", async () => {
    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "owneruser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Name must be at least 2 characters")
      ).toBeInTheDocument();
    });

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("shows field error when username is too short", async () => {
    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Owner User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "ab" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 3 characters")
      ).toBeInTheDocument();
    });

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("shows field error when username has invalid characters", async () => {
    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Owner User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "invalid-user!" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Username can only contain letters, numbers, and underscores"
        )
      ).toBeInTheDocument();
    });

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("shows field error when password is too short", async () => {
    render(<SetupForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Owner User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "owneruser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Create Owner Account" })
    );

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters")
      ).toBeInTheDocument();
    });

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });
});
