import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { GalleryGrid } from "./gallery-grid";

beforeEach(() => { global.fetch = vi.fn(); });

const photos = [
  { id: "m1", thumbUrl: "https://x/t1.jpg", previewUrl: "https://x/p1.jpg", width: 400, height: 400 },
  { id: "m2", thumbUrl: "https://x/t2.jpg", previewUrl: "https://x/p2.jpg", width: 400, height: 400 },
];

describe("GalleryGrid", () => {
  it("renders photos", () => {
    const { container } = render(<GalleryGrid slug="abc12-x" photos={photos} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("renders empty state when no photos", () => {
    render(<GalleryGrid slug="abc12-x" photos={[]} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    expect(screen.getByText(/belum upload/i)).toBeInTheDocument();
  });

  it("img has width/height attrs to prevent layout shift", () => {
    const { container } = render(<GalleryGrid slug="abc12-x" photos={photos} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    const imgs = container.querySelectorAll("img");
    expect(imgs[0]).toHaveAttribute("width", "400");
    expect(imgs[0]).toHaveAttribute("height", "400");
    expect(imgs[0]).toHaveAttribute("loading", "lazy");
  });
});
