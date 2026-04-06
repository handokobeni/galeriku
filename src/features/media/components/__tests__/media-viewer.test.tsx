import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/features/favorite/components/favorite-button", () => ({
  FavoriteButton: ({ mediaId, initialFavorited }: { mediaId: string; initialFavorited: boolean }) => (
    <button aria-label="Favorite" data-media-id={mediaId} data-favorited={initialFavorited}>♥</button>
  ),
}));

vi.mock("@/features/comment/components/comment-list", () => ({
  CommentList: ({ mediaId, comments }: { mediaId: string; comments: unknown[] }) => (
    <div data-testid="comment-list" data-media-id={mediaId} data-count={comments.length} />
  ),
}));

vi.mock("@/features/tag/components/tag-input", () => ({
  TagInput: ({ mediaId, tags, canEdit }: { mediaId: string; tags: unknown[]; canEdit: boolean }) => (
    <div data-testid="tag-input" data-media-id={mediaId} data-tag-count={tags.length} data-can-edit={canEdit} />
  ),
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

const defaultProps = {
  media: mockMedia,
  viewUrl: "https://example.com/photo.jpg",
  isFavorited: false,
  comments: [],
  tags: [],
  canEdit: false,
};

describe("MediaViewer", () => {
  it("renders close button", () => {
    render(<MediaViewer {...defaultProps} />);
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
  });
  it("renders filename", () => {
    render(<MediaViewer {...defaultProps} />);
    expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
  });
  it("renders uploader name", () => {
    render(<MediaViewer {...defaultProps} />);
    expect(screen.getByText(/Beni/)).toBeInTheDocument();
  });
  it("renders download button", () => {
    render(<MediaViewer {...defaultProps} />);
    expect(screen.getByLabelText("Download")).toBeInTheDocument();
  });
  it("renders img for photos", () => {
    render(<MediaViewer {...defaultProps} />);
    expect(screen.getByAltText("sunset.jpg")).toBeInTheDocument();
  });
  it("renders video for video type", () => {
    const videoMedia = { ...mockMedia, type: "video" as const, duration: 45 };
    const { container } = render(<MediaViewer {...defaultProps} media={videoMedia} viewUrl="https://example.com/video.mp4" />);
    expect(container.querySelector("video")).toBeInTheDocument();
  });
  it("renders favorite button", () => {
    render(<MediaViewer {...defaultProps} isFavorited={true} />);
    expect(screen.getByLabelText("Favorite")).toBeInTheDocument();
  });
  it("renders comment list", () => {
    const comments = [
      { id: "c1", mediaId: "media-1", userId: "u1", userName: "Alice", userImage: null, content: "Nice!", createdAt: new Date() },
    ];
    render(<MediaViewer {...defaultProps} comments={comments} />);
    expect(screen.getByTestId("comment-list")).toBeInTheDocument();
  });
  it("renders tag input", () => {
    const tags = [{ id: 1, name: "nature" }];
    render(<MediaViewer {...defaultProps} tags={tags} canEdit={true} />);
    expect(screen.getByTestId("tag-input")).toBeInTheDocument();
  });
});
