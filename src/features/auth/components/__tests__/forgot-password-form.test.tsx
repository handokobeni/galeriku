import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/auth/actions/forgot-password", () => ({
  checkEmailAndRequestReset: vi.fn(),
}));

import { checkEmailAndRequestReset } from "@/features/auth/actions/forgot-password";
import { ForgotPasswordForm } from "../forgot-password-form";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email input and submit button", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("renders link back to login", () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it("calls checkEmailAndRequestReset on submit", async () => {
    vi.mocked(checkEmailAndRequestReset).mockResolvedValue({ success: true });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(checkEmailAndRequestReset).toHaveBeenCalledWith("test@test.com");
    });
  });

  it("shows success state after successful submit", async () => {
    vi.mocked(checkEmailAndRequestReset).mockResolvedValue({ success: true });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    });
  });

  it("shows error when email not found", async () => {
    vi.mocked(checkEmailAndRequestReset).mockResolvedValue({ error: "Email not found" });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "missing@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  it("does not show success state when there's an error", async () => {
    vi.mocked(checkEmailAndRequestReset).mockResolvedValue({ error: "Email not found" });
    render(<ForgotPasswordForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "missing@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send reset link/i }));
    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument();
  });
});
