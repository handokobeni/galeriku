import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/albums",
}));

import { BottomNav } from "../bottom-nav";

describe("BottomNav", () => {
  it("renders navigation links", () => {
    render(<BottomNav />);
    expect(screen.getByText("Albums")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(screen.getByText("Search")).toBeInTheDocument();
  });

  it("renders upload FAB button", () => {
    render(<BottomNav />);
    expect(screen.getByLabelText("Upload")).toBeInTheDocument();
  });

  it("shows admin link for owner", () => {
    render(<BottomNav isOwner={true} />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("hides admin link for non-owner", () => {
    render(<BottomNav isOwner={false} />);
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
  });

  it("highlights active route", () => {
    render(<BottomNav />);
    const albumsLink = screen.getByText("Albums").closest("a");
    expect(albumsLink).toHaveClass("text-indigo-500");
  });
});
