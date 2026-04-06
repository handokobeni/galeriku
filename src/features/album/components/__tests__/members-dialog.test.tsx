import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/album/actions/manage-members", () => ({
  inviteMemberAction: vi.fn(),
  removeMemberAction: vi.fn(),
  updateMemberRoleAction: vi.fn(),
}));

import { MembersDialog } from "../members-dialog";

const mockMembers = [
  { userId: "u1", userName: "Beni", userEmail: "beni@test.com", role: "editor" as const, invitedAt: new Date() },
  { userId: "u2", userName: "Mama", userEmail: "mama@test.com", role: "viewer" as const, invitedAt: new Date() },
];

describe("MembersDialog", () => {
  it("renders member list when open", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("Beni")).toBeInTheDocument();
    expect(screen.getByText("Mama")).toBeInTheDocument();
  });
  it("shows invite form for editors", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />);
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
  });
  it("hides invite form for viewers", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canEdit={false} open={true} onOpenChange={() => {}} />);
    expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
  });
});
