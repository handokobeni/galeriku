import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
}));

import { RegisterForm } from "../register-form";
import { signUp } from "@/features/auth/lib/auth-client";

describe("RegisterForm", () => {
  const mockSignUpEmail = signUp.email as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUpEmail.mockResolvedValue({ error: null });
  });

  it("renders registration form heading", () => {
    render(<RegisterForm />);
    // CardTitle "Create Account" and CardDescription
    expect(screen.getAllByText("Create Account").length).toBeGreaterThan(0);
    expect(screen.getByText("Join Galeriku to share memories")).toBeInTheDocument();
  });

  it("renders all input fields", () => {
    render(<RegisterForm />);
    expect(screen.getByLabelText("Display Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<RegisterForm />);
    expect(screen.getByRole("button", { name: "Create Account" })).toBeInTheDocument();
  });

  it("renders login link", () => {
    render(<RegisterForm />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("calls signUp.email with form values on successful registration", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: "Test User",
        username: "testuser",
        email: "test@test.com",
        password: "password123",
      });
    });
  });

  it("redirects to /albums on successful registration", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/albums");
    });
  });

  it("shows error message on failed registration", async () => {
    mockSignUpEmail.mockResolvedValueOnce({
      error: { message: "Email already in use" },
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to create account. Email or username may already be in use."
        )
      ).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows field error when name is too short", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "A" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(
        screen.getByText("Name must be at least 2 characters")
      ).toBeInTheDocument();
    });

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("shows field error when username is too short", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "ab" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(
        screen.getByText("Username must be at least 3 characters")
      ).toBeInTheDocument();
    });

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });

  it("shows field error when username has invalid characters", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "invalid-user!" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

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
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText("Display Name"), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText("Username"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters")
      ).toBeInTheDocument();
    });

    expect(mockSignUpEmail).not.toHaveBeenCalled();
  });
});
