import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/actions/user-admin-actions", () => ({
  deleteUserAction: vi.fn(),
}));

import { UserList } from "../user-list";

const mockUsers = [
  { id: "u1", name: "Owner", email: "owner@test.com", role: "owner", createdAt: new Date(), albumCount: 5, uploadCount: 100 },
  { id: "u2", name: "Member", email: "member@test.com", role: "member", createdAt: new Date(), albumCount: 2, uploadCount: 30 },
];

describe("UserList", () => {
  it("renders all users", () => {
    render(<UserList users={mockUsers} currentUserId="u1" />);
    expect(screen.getAllByText("Owner").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Member").length).toBeGreaterThan(0);
  });
  it("shows role labels", () => {
    render(<UserList users={mockUsers} currentUserId="u1" />);
    expect(screen.getAllByText("owner").length).toBeGreaterThan(0);
    expect(screen.getAllByText("member").length).toBeGreaterThan(0);
  });
  it("does not show delete button for owner role users", () => {
    render(<UserList users={mockUsers} currentUserId="u1" />);
    const deleteButtons = screen.queryAllByLabelText("Delete user");
    // u1 is owner role + current user → no delete; u2 is member → has delete (mobile + desktop = 2)
    expect(deleteButtons).toHaveLength(2);
  });
});
