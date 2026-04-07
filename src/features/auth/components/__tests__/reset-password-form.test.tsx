import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: {
    resetPassword: vi.fn(),
  },
}));

import { authClient } from "@/features/auth/lib/auth-client";
import { ResetPasswordForm } from "../reset-password-form";

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders password and confirm fields when token provided", () => {
    render(<ResetPasswordForm token="valid-token" />);
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows invalid link state when no token and no error", () => {
    render(<ResetPasswordForm />);
    expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
  });

  it("shows error when initialError is INVALID_TOKEN", () => {
    render(<ResetPasswordForm token="bad" initialError="INVALID_TOKEN" />);
    expect(screen.getByText(/reset link is invalid or expired/i)).toBeInTheDocument();
  });

  it("validates password length", async () => {
    const { container } = render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "short" },
    });
    // Use fireEvent.submit on the form to bypass HTML minLength constraint validation in jsdom
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("validates password match", async () => {
    const { container } = render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "different123" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });
  });

  it("calls authClient.resetPassword on valid submit", async () => {
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      data: null,
      error: null,
    } as never);
    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await waitFor(() => {
      expect(authClient.resetPassword).toHaveBeenCalledWith({
        newPassword: "password123",
        token: "valid-token",
      });
    });
  });

  it("redirects to login on success", async () => {
    vi.mocked(authClient.resetPassword).mockResolvedValue({
      data: null,
      error: null,
    } as never);
    render(<ResetPasswordForm token="valid-token" />);
    fireEvent.change(screen.getByLabelText(/^new password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?reset=success");
    });
  });
});
