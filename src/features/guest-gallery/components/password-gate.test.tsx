import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PasswordGate } from "./password-gate";

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("PasswordGate", () => {
  it("submits password and reloads on success", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: true });
    const reload = vi.fn();
    Object.defineProperty(window, "location", { value: { reload }, writable: true });
    render(<PasswordGate slug="abc12-x" />);
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter2" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await waitFor(() => expect(reload).toHaveBeenCalled());
  });

  it("shows error on 401", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });
    render(<PasswordGate slug="abc12-x" />);
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await waitFor(() => expect(screen.getByText(/password salah/i)).toBeInTheDocument());
  });

  it("shows rate limit error on 429", async () => {
    (global.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 429 });
    render(<PasswordGate slug="abc12-x" />);
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await waitFor(() => expect(screen.getByText(/terlalu banyak/i)).toBeInTheDocument());
  });
});
