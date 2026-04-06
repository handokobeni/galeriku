import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

import { MediaViewer } from "../media-viewer";

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

describe("MediaViewer", () => {
  it("renders close button", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });
  it("renders filename", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
  });
  it("renders uploader name", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByText(/Beni/)).toBeInTheDocument();
  });
  it("renders download button", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByLabelText("Download")).toBeInTheDocument();
  });
  it("renders img for photos", () => {
    render(<MediaViewer media={mockMedia} viewUrl="https://example.com/photo.jpg" />);
    expect(screen.getByAltText("sunset.jpg")).toBeInTheDocument();
  });
  it("renders video for video type", () => {
    const videoMedia = { ...mockMedia, type: "video" as const, duration: 45 };
    const { container } = render(<MediaViewer media={videoMedia} viewUrl="https://example.com/video.mp4" />);
    expect(container.querySelector("video")).toBeInTheDocument();
  });
});
