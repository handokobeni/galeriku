import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

import { ThemeProvider } from "../theme-provider";

describe("ThemeProvider", () => {
  it("renders children", () => {
    render(
      <ThemeProvider>
        <div data-testid="child">Content</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("wraps children in theme provider", () => {
    render(
      <ThemeProvider>
        <div>Content</div>
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
  });
});
