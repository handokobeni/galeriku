import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { OfflineIndicator } from "../offline-indicator";

describe("OfflineIndicator", () => {
  beforeEach(() => {
    Object.defineProperty(window.navigator, "onLine", {
      writable: true,
      configurable: true,
      value: true,
    });
  });

  it("does not render when online", () => {
    render(<OfflineIndicator />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });

  it("renders when offline", () => {
    Object.defineProperty(window.navigator, "onLine", {
      writable: true,
      configurable: true,
      value: false,
    });
    render(<OfflineIndicator />);
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
