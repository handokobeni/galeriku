import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  signIn: { email: vi.fn().mockResolvedValue({ error: null }) },
}));

import { LoginForm } from "../login-form";

describe("LoginForm", () => {
  it("renders login form", () => {
    render(<LoginForm />);
    expect(screen.getByText("Galeriku")).toBeInTheDocument();
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<LoginForm />);
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("renders register link", () => {
    render(<LoginForm />);
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("renders with optional callbackUrl prop", () => {
    render(<LoginForm callbackUrl="/albums/123" />);
    // callbackUrl is used in JS logic only, but the form still renders
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });
});
