import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Lightbox } from "./lightbox";

beforeEach(() => { global.fetch = vi.fn(); });

const photos = [
  { id: "m1", thumbUrl: "t1", previewUrl: "p1", width: 100, height: 100 },
  { id: "m2", thumbUrl: "t2", previewUrl: "p2", width: 100, height: 100 },
];

describe("Lightbox", () => {
  it("renders preview image of starting index", () => {
    const { container } = render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={() => {}} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "p1");
  });

  it("closes on ESC", () => {
    const onClose = vi.fn();
    render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={onClose} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("hides download button when policy=none", () => {
    render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={() => {}} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    expect(screen.queryByRole("button", { name: /download/i })).toBeNull();
  });

  it("shows download button when policy=watermarked", () => {
    render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={() => {}} hasGuest={false} downloadPolicy="watermarked" favorites={new Set()} />);
    expect(screen.getByRole("button", { name: /download/i })).toBeInTheDocument();
  });

  it("ArrowRight advances index", () => {
    const { container } = render(<Lightbox slug="x" photos={photos} startIndex={0} onClose={() => {}} hasGuest={false} downloadPolicy="none" favorites={new Set()} />);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    const img = container.querySelector("img")!;
    expect(img).toHaveAttribute("src", "p2");
  });
});
