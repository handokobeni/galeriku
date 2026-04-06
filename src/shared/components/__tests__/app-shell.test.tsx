import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/albums",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  signOut: vi.fn().mockResolvedValue({}),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

import { AppShell } from "../app-shell";
import type { AuthUser } from "@/features/auth/types";

const testUser: AuthUser = {
  id: "test-id",
  email: "test@test.com",
  username: "testuser",
  name: "Test User",
  image: null,
  role: "owner",
};

describe("AppShell", () => {
  it("renders children", () => {
    render(
      <AppShell user={testUser}>
        <div data-testid="child">Content</div>
      </AppShell>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders TopNav with app name", () => {
    render(
      <AppShell user={testUser}>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByText("Galeriku")).toBeInTheDocument();
  });

  it("renders BottomNav with Upload button", () => {
    render(
      <AppShell user={testUser}>
        <div>Content</div>
      </AppShell>
    );
    expect(screen.getByLabelText("Upload")).toBeInTheDocument();
  });
});
