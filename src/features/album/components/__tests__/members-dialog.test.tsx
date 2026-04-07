import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/album/actions/manage-members", () => ({
  inviteMemberAction: vi.fn().mockResolvedValue({ success: true }),
  removeMemberAction: vi.fn().mockResolvedValue({ success: true }),
  updateMemberRoleAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { inviteMemberAction, removeMemberAction } from "@/features/album/actions/manage-members";
import { MembersDialog } from "../members-dialog";

const mockMembers = [
  { userId: "u1", userName: "Beni", userEmail: "beni@test.com", role: "editor" as const, invitedAt: new Date() },
  { userId: "u2", userName: "Mama", userEmail: "mama@test.com", role: "viewer" as const, invitedAt: new Date() },
];

describe("MembersDialog", () => {
  beforeEach(() => vi.clearAllMocks());

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

  it("calls inviteMemberAction on invite button click", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/email/i);
    fireEvent.change(input, { target: { value: "new@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /invite/i }));
    await waitFor(() => {
      expect(inviteMemberAction).toHaveBeenCalledWith("a1", "new@test.com");
    });
  });

  it("calls inviteMemberAction on Enter key in email input", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/email/i);
    fireEvent.change(input, { target: { value: "enter@test.com" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(inviteMemberAction).toHaveBeenCalledWith("a1", "enter@test.com");
    });
  });

  it("calls removeMemberAction when remove button is clicked", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />);
    // Remove buttons are rendered for each member (UserMinus icon buttons)
    // They appear after the Invite button, so filter by SVG presence
    const allButtons = screen.getAllByRole("button");
    // The invite button has text "Invite"; remove buttons have only SVG icons
    const removeButtons = allButtons.filter(b => !b.textContent?.includes("Invite"));
    fireEvent.click(removeButtons[0]);
    await waitFor(() => {
      expect(removeMemberAction).toHaveBeenCalledWith("a1", "u1");
    });
  });

  it("shows error when inviteMemberAction returns error", async () => {
    vi.mocked(inviteMemberAction).mockResolvedValueOnce({ error: "User not found" });
    render(<MembersDialog albumId="a1" members={mockMembers} canEdit={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/email/i);
    fireEvent.change(input, { target: { value: "bad@test.com" } });
    fireEvent.click(screen.getByRole("button", { name: /invite/i }));
    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument();
    });
  });
});
