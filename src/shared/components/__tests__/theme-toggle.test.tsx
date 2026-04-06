import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockTheme = "light";
const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme,
    setTheme: mockSetTheme,
  }),
}));

import { ThemeToggle } from "../theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it("renders toggle button", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /toggle theme/i })).toBeInTheDocument();
  });

  it("toggles from light to dark", () => {
    mockTheme = "light";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("toggles from dark to light", () => {
    mockTheme = "dark";
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});
