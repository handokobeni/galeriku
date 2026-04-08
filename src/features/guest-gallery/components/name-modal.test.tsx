import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NameModal } from "./name-modal";

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("NameModal", () => {
  it("does not render when closed", () => {
    render(<NameModal slug="abc12-x" open={false} onClose={() => {}} onSuccess={() => {}} />);
    expect(screen.queryByPlaceholderText(/nama/i)).toBeNull();
  });

  it("calls onSuccess after registering", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true, json: async () => ({ guestId: "g1" }) });
    const onSuccess = vi.fn();
    render(<NameModal slug="abc12-x" open onClose={() => {}} onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText(/nama/i), { target: { value: "Sinta" } });
    fireEvent.click(screen.getByRole("button", { name: /simpan/i }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("g1"));
  });

  it("disables Simpan when name is blank", () => {
    render(<NameModal slug="abc12-x" open onClose={() => {}} onSuccess={() => {}} />);
    const btn = screen.getByRole("button", { name: /simpan/i });
    expect(btn).toBeDisabled();
  });

  it("calls onClose when Batal clicked", () => {
    const onClose = vi.fn();
    render(<NameModal slug="abc12-x" open onClose={onClose} onSuccess={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /batal/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
