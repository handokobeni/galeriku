import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
}));

import { RegisterForm } from "../register-form";

describe("RegisterForm", () => {
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
});
