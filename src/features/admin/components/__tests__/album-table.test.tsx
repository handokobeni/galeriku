import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/features/album/actions/delete-album", () => ({
  deleteAlbumAction: vi.fn(),
}));

import { AlbumTable } from "../album-table";

const mockAlbums = [
  {
    id: "a1",
    name: "Liburan Bali",
    createdBy: "u1",
    creatorName: "Beni",
    createdAt: new Date(),
    mediaCount: 100,
    memberCount: 3,
    storageBytes: 1024 * 1024 * 50,
  },
];

describe("AlbumTable", () => {
  it("renders album rows", () => {
    render(<AlbumTable albums={mockAlbums} />);
    expect(screen.getAllByText("Liburan Bali").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Beni").length).toBeGreaterThan(0);
  });
  it("renders media count", () => {
    render(<AlbumTable albums={mockAlbums} />);
    expect(screen.getAllByText("100").length).toBeGreaterThan(0);
  });
  it("renders delete button", () => {
    render(<AlbumTable albums={mockAlbums} />);
    // mobile + desktop both render → 2 delete buttons
    expect(screen.getAllByLabelText("Delete album").length).toBeGreaterThan(0);
  });
});
