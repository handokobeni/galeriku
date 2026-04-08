import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/albums",
}));

import { BottomNav } from "../bottom-nav";

describe("BottomNav", () => {
  it("renders core navigation links", () => {
    render(<BottomNav />);
    expect(screen.getByText("Albums")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("shows admin link for owner", () => {
    render(<BottomNav isOwner={true} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides admin link for non-owner", () => {
    render(<BottomNav isOwner={false} />);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("highlights active route with primary color", () => {
    render(<BottomNav />);
    const albumsLink = screen.getByText("Albums").closest("a");
    expect(albumsLink).toHaveClass("text-primary");
  });
});
