import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/favorite/actions/favorite-actions", () => ({
  toggleFavoriteAction: vi.fn().mockResolvedValue({ success: true, isFavorited: true }),
}));

import { FavoriteButton } from "../favorite-button";

describe("FavoriteButton", () => {
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
});
