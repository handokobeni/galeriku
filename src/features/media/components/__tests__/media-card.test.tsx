import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { MediaCard } from "../media-card";

const mockMedia = {
  id: "media-1",
  albumId: "album-1",
  uploadedBy: "user-1",
  type: "photo" as const,
  filename: "sunset.jpg",
  r2Key: "originals/album-1/media-1.jpg",
  thumbnailR2Key: "thumbnails/media-1.webp",
  mimeType: "image/jpeg",
  sizeBytes: 4200000,
  width: 4032,
  height: 3024,
  duration: null,
  createdAt: new Date(),
  uploaderName: "Beni",
};

describe("MediaCard", () => {
  it("renders thumbnail image", () => {
    render(<MediaCard media={mockMedia} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/api/thumbnail/media-1");
  });
  it("links to media detail page", () => {
    render(<MediaCard media={mockMedia} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/media/media-1");
  });
  it("shows video duration for videos", () => {
    const videoMedia = { ...mockMedia, type: "video" as const, duration: 45 };
    render(<MediaCard media={videoMedia} />);
    expect(screen.getByText("0:45")).toBeInTheDocument();
  });
  it("does not show duration for photos", () => {
    render(<MediaCard media={mockMedia} />);
    expect(screen.queryByText(/:/)).not.toBeInTheDocument();
  });
});
