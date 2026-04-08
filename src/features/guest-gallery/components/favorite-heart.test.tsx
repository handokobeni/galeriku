import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FavoriteHeart } from "./favorite-heart";

beforeEach(() => {
  global.fetch = vi.fn();
});

describe("FavoriteHeart", () => {
  it("opens NameModal on first tap when no guest", () => {
    render(<FavoriteHeart slug="abc12-x" mediaId="m1" hasGuest={false} />);
    fireEvent.click(screen.getByRole("button", { name: /favorite/i }));
    expect(screen.getByPlaceholderText(/nama/i)).toBeInTheDocument();
  });

  it("toggles favorite directly when hasGuest=true", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: true });
    render(<FavoriteHeart slug="abc12-x" mediaId="m1" hasGuest />);
    fireEvent.click(screen.getByRole("button", { name: /favorite/i }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "/g/abc12-x/api/favorite",
        expect.objectContaining({ method: "POST" }),
      ),
    );
  });

  it("rolls back optimistic update on error", async () => {
    (global.fetch as any).mockResolvedValueOnce({ ok: false });
    render(<FavoriteHeart slug="abc12-x" mediaId="m1" hasGuest initialFavorited={false} />);
    const btn = screen.getByRole("button", { name: /favorite/i });
    fireEvent.click(btn);
    await waitFor(() => expect(btn.textContent).toContain("\u2661"));
  });
});
