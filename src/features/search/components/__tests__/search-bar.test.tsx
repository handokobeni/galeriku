import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(""),
}));

import { SearchBar } from "../search-bar";

describe("SearchBar", () => {
  beforeEach(() => mockPush.mockClear());

  it("renders search input", () => {
    render(<SearchBar />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it("navigates to search results on form submit", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "sunset" } });
    fireEvent.submit(input.closest("form")!);
    expect(mockPush).toHaveBeenCalledWith("/search?q=sunset");
  });

  it("encodes special characters in query", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "hello world" } });
    fireEvent.submit(input.closest("form")!);
    expect(mockPush).toHaveBeenCalledWith("/search?q=hello%20world");
  });

  it("does not navigate when query is empty", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.submit(input.closest("form")!);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("trims whitespace from query before navigating", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.change(input, { target: { value: "  beach  " } });
    fireEvent.submit(input.closest("form")!);
    expect(mockPush).toHaveBeenCalledWith("/search?q=beach");
  });
});
