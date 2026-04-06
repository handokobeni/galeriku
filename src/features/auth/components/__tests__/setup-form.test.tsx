import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
}));

// Mock fetch for setup-owner API call
global.fetch = vi.fn().mockResolvedValue({ ok: true });

import { SetupForm } from "../setup-form";

describe("SetupForm", () => {
  it("renders setup form", () => {
    render(<SetupForm />);
    expect(screen.getByText("Welcome to Galeriku")).toBeInTheDocument();
    expect(screen.getByText("Create your owner account to get started")).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Create Owner Account" })).toBeInTheDocument();
  });
});
