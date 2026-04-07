import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { SearchResults } from "../search-results";
import type { SearchResult } from "../../types";

describe("SearchResults", () => {
  it("renders empty state when no results", () => {
    render(<SearchResults results={[]} query="test" />);
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("includes the query in the empty state message", () => {
    render(<SearchResults results={[]} query="unicorn" />);
    expect(screen.getByText(/unicorn/)).toBeInTheDocument();
  });

  it("renders album results", () => {
    const results: SearchResult[] = [
      { type: "album", id: "a1", title: "Liburan Bali" },
    ];
    render(<SearchResults results={results} query="bali" />);
    expect(screen.getByText("Liburan Bali")).toBeInTheDocument();
  });

  it("renders media results", () => {
    const results: SearchResult[] = [
      { type: "media", id: "m1", title: "sunset.jpg", albumId: "a1", albumName: "Bali", mediaType: "photo", thumbnailMediaId: "m1" },
    ];
    render(<SearchResults results={results} query="sunset" />);
    expect(screen.getByText("sunset.jpg")).toBeInTheDocument();
  });

  it("groups albums and media with counts", () => {
    const results: SearchResult[] = [
      { type: "album", id: "a1", title: "Bali" },
      { type: "media", id: "m1", title: "sunset.jpg", albumId: "a1", albumName: "Bali", mediaType: "photo", thumbnailMediaId: "m1" },
    ];
    render(<SearchResults results={results} query="bali" />);
    expect(screen.getByText(/Albums \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Media \(1\)/)).toBeInTheDocument();
  });

  it("links album results to album page", () => {
    const results: SearchResult[] = [
      { type: "album", id: "a1", title: "Bali" },
    ];
    render(<SearchResults results={results} query="bali" />);
    const link = screen.getByRole("link", { name: /Bali/i });
    expect(link).toHaveAttribute("href", "/albums/a1");
  });

  it("links media results to media page", () => {
    const results: SearchResult[] = [
      { type: "media", id: "m1", title: "sunset.jpg", albumId: "a1", albumName: "Bali", mediaType: "photo", thumbnailMediaId: "m1" },
    ];
    render(<SearchResults results={results} query="sunset" />);
    const link = screen.getByRole("link", { name: /sunset\.jpg/i });
    expect(link).toHaveAttribute("href", "/media/m1");
  });

  it("renders multiple albums", () => {
    const results: SearchResult[] = [
      { type: "album", id: "a1", title: "Album One" },
      { type: "album", id: "a2", title: "Album Two" },
    ];
    render(<SearchResults results={results} query="album" />);
    expect(screen.getByText("Album One")).toBeInTheDocument();
    expect(screen.getByText("Album Two")).toBeInTheDocument();
    expect(screen.getByText(/Albums \(2\)/)).toBeInTheDocument();
  });

  it("does not render Albums section when no albums", () => {
    const results: SearchResult[] = [
      { type: "media", id: "m1", title: "photo.jpg", albumId: "a1", albumName: "Bali", mediaType: "photo", thumbnailMediaId: "m1" },
    ];
    render(<SearchResults results={results} query="photo" />);
    expect(screen.queryByText(/Albums/)).not.toBeInTheDocument();
  });

  it("does not render Media section when no media", () => {
    const results: SearchResult[] = [
      { type: "album", id: "a1", title: "Bali" },
    ];
    render(<SearchResults results={results} query="bali" />);
    expect(screen.queryByText(/Media/)).not.toBeInTheDocument();
  });
});
