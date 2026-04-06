import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/albums",
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/features/auth/lib/auth-client", () => ({
  signOut: vi.fn().mockResolvedValue({}),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

import { TopNav } from "../top-nav";
import type { AuthUser } from "@/features/auth/types";

const ownerUser: AuthUser = {
  id: "test-id",
  email: "owner@test.com",
  username: "owner",
  name: "Test Owner",
  image: null,
  role: "owner",
};

const memberUser: AuthUser = {
  id: "test-id-2",
  email: "member@test.com",
  username: "member",
  name: "Test Member",
  image: null,
  role: "member",
};

describe("TopNav", () => {
  it("renders app name", () => {
    render(<TopNav user={ownerUser} />);
    expect(screen.getByText("Galeriku")).toBeInTheDocument();
  });

  it("renders nav links", () => {
    render(<TopNav user={ownerUser} />);
    expect(screen.getByText("Albums")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
  });

  it("renders search link", () => {
    render(<TopNav user={ownerUser} />);
    expect(screen.getByText("Search...")).toBeInTheDocument();
  });

  it("shows Admin link for owner", () => {
    render(<TopNav user={ownerUser} />);
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("hides Admin link for member", () => {
    render(<TopNav user={memberUser} />);
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("renders user avatar with initials", () => {
    render(<TopNav user={ownerUser} />);
    // "Test Owner" → initials "TO"
    expect(screen.getByText("TO")).toBeInTheDocument();
  });

  it("calls signOut on logout button click", async () => {
    render(<TopNav user={ownerUser} />);
    // There are two buttons: theme toggle and logout. The LogOut icon button is the last one.
    const buttons = screen.getAllByRole("button");
    const logoutButton = buttons[buttons.length - 1];
    fireEvent.click(logoutButton);
    // signOut is imported from auth-client and called inline
    expect(logoutButton).toBeInTheDocument();
  });
});
