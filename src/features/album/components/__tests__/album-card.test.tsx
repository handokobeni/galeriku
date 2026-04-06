import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { AlbumCard } from "../album-card";

const mockAlbum = {
  id: "album-1",
  name: "Liburan Bali",
  description: "Summer trip",
  coverMediaId: null,
  createdBy: "user-1",
  createdAt: new Date(),
  updatedAt: new Date(),
  memberCount: 3,
  mediaCount: 124,
};

describe("AlbumCard", () => {
  it("renders album name", () => {
    render(<AlbumCard album={mockAlbum} />);
    expect(screen.getByText("Liburan Bali")).toBeInTheDocument();
  });
  it("renders media count", () => {
    render(<AlbumCard album={mockAlbum} />);
    expect(screen.getByText(/124/)).toBeInTheDocument();
  });
  it("renders member count", () => {
    render(<AlbumCard album={mockAlbum} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });
  it("links to album detail page", () => {
    render(<AlbumCard album={mockAlbum} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/albums/album-1");
  });
});
