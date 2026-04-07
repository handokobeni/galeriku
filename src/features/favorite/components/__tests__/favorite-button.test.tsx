import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/favorite/actions/favorite-actions", () => ({
  toggleFavoriteAction: vi.fn().mockResolvedValue({ success: true, isFavorited: true }),
}));

import { toggleFavoriteAction } from "@/features/favorite/actions/favorite-actions";
import { FavoriteButton } from "../favorite-button";

describe("FavoriteButton", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders heart button", () => {
    render(<FavoriteButton mediaId="m1" initialFavorited={false} />);
    expect(screen.getByRole("button", { name: /favorite/i })).toBeInTheDocument();
  });
  it("shows filled state when favorited", () => {
    const { container } = render(<FavoriteButton mediaId="m1" initialFavorited={true} />);
    expect(container.querySelector("[data-favorited='true']")).toBeInTheDocument();
  });
  it("shows unfilled state when not favorited", () => {
    const { container } = render(<FavoriteButton mediaId="m1" initialFavorited={false} />);
    expect(container.querySelector("[data-favorited='false']")).toBeInTheDocument();
  });

  it("calls toggleFavoriteAction on click", async () => {
    render(<FavoriteButton mediaId="m1" initialFavorited={false} />);
    fireEvent.click(screen.getByRole("button", { name: /favorite/i }));
    await waitFor(() => {
      expect(toggleFavoriteAction).toHaveBeenCalledWith("m1");
    });
  });

  it("toggles state optimistically", async () => {
    const { container } = render(<FavoriteButton mediaId="m1" initialFavorited={false} />);
    expect(container.querySelector("[data-favorited='false']")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /favorite/i }));
    // Should immediately flip to true (optimistic)
    await waitFor(() => {
      expect(container.querySelector("[data-favorited='true']")).toBeInTheDocument();
    });
  });
});
