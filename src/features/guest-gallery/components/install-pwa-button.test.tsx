import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { InstallPwaButton } from "./install-pwa-button";

describe("InstallPwaButton", () => {
  it("renders nothing initially (no beforeinstallprompt event)", () => {
    const { container } = render(<InstallPwaButton />);
    expect(container.firstChild).toBeNull();
  });
});
