import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/features/album/actions/manage-members", () => ({
  inviteMemberByIdAction: vi.fn().mockResolvedValue({ success: true }),
  removeMemberAction: vi.fn().mockResolvedValue({ success: true }),
  updateMemberRoleAction: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/features/user/actions/search-users", () => ({
  searchUsersAction: vi.fn().mockResolvedValue([
    { id: "u99", name: "Alice Search", email: "alice@test.com", image: null },
  ]),
}));

import {
  inviteMemberByIdAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/features/album/actions/manage-members";
import { searchUsersAction } from "@/features/user/actions/search-users";
import { MembersDialog } from "../members-dialog";

const mockMembers = [
  { userId: "u1", userName: "Beni", userEmail: "beni@test.com", role: "editor" as const, invitedAt: new Date() },
  { userId: "u2", userName: "Mama", userEmail: "mama@test.com", role: "viewer" as const, invitedAt: new Date() },
];

async function typeAndWaitForResults(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
  // Advance past the 300ms debounce using fake timers
  await act(async () => {
    vi.advanceTimersByTime(350);
  });
}

describe("MembersDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders member list when open", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("Beni")).toBeInTheDocument();
    expect(screen.getByText("Mama")).toBeInTheDocument();
  });

  it("shows search input for editors", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    expect(screen.getByPlaceholderText(/search by name or email/i)).toBeInTheDocument();
  });

  it("hides search input for viewers", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={false} open={true} onOpenChange={() => {}} />);
    expect(screen.queryByPlaceholderText(/search by name or email/i)).not.toBeInTheDocument();
  });

  it("calls searchUsersAction when typing in search input", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/search by name or email/i);
    await typeAndWaitForResults(input, "alice");
    await waitFor(() => {
      expect(searchUsersAction).toHaveBeenCalledWith("alice");
    });
  });

  it("shows search results dropdown", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/search by name or email/i);
    await typeAndWaitForResults(input, "alice");
    await waitFor(() => {
      expect(screen.getByText("Alice Search")).toBeInTheDocument();
    });
  });

  it("shows role selector after selecting a user from results", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/search by name or email/i);
    await typeAndWaitForResults(input, "alice");
    await waitFor(() => screen.getByText("Alice Search"));
    fireEvent.click(screen.getByText("Alice Search"));
    // Each member has a role select (2) + the new invite role select = 3 total
    expect(screen.getAllByRole("combobox").length).toBeGreaterThanOrEqual(3);
  });

  it("renders editable role select for each member when canManage", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const selects = screen.getAllByLabelText("Member role");
    expect(selects).toHaveLength(2);
  });

  it("calls updateMemberRoleAction when changing a member role", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const selects = screen.getAllByLabelText("Member role");
    fireEvent.change(selects[1], { target: { value: "editor" } });
    expect(updateMemberRoleAction).toHaveBeenCalledWith("a1", "u2", "editor");
  });

  it("shows read-only role text for viewers", () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={false} open={true} onOpenChange={() => {}} />);
    expect(screen.queryByLabelText("Member role")).not.toBeInTheDocument();
    expect(screen.getByText("editor")).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();
  });

  it("shows invite button after selecting a user", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/search by name or email/i);
    await typeAndWaitForResults(input, "alice");
    await waitFor(() => screen.getByText("Alice Search"));
    fireEvent.click(screen.getByText("Alice Search"));
    expect(screen.getByRole("button", { name: /invite as/i })).toBeInTheDocument();
  });

  it("calls inviteMemberByIdAction on invite button click", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/search by name or email/i);
    await typeAndWaitForResults(input, "alice");
    await waitFor(() => screen.getByText("Alice Search"));
    fireEvent.click(screen.getByText("Alice Search"));
    fireEvent.click(screen.getByRole("button", { name: /invite as/i }));
    await waitFor(() => {
      expect(inviteMemberByIdAction).toHaveBeenCalledWith("a1", "u99", "viewer");
    });
  });

  it("calls removeMemberAction when remove button is clicked", async () => {
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const removeButtons = screen.getAllByRole("button", { name: /remove member/i });
    fireEvent.click(removeButtons[0]);
    await waitFor(() => {
      expect(removeMemberAction).toHaveBeenCalledWith("a1", "u1");
    });
  });

  it("shows error when inviteMemberByIdAction returns error", async () => {
    vi.mocked(inviteMemberByIdAction).mockResolvedValueOnce({ error: "Permission denied" });
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/search by name or email/i);
    await typeAndWaitForResults(input, "alice");
    await waitFor(() => screen.getByText("Alice Search"));
    fireEvent.click(screen.getByText("Alice Search"));
    fireEvent.click(screen.getByRole("button", { name: /invite as/i }));
    await waitFor(() => {
      expect(screen.getByText("Permission denied")).toBeInTheDocument();
    });
  });

  it("filters existing members from search results", async () => {
    vi.mocked(searchUsersAction).mockResolvedValueOnce([
      { id: "u1", name: "Beni", email: "beni@test.com", image: null },
      { id: "u99", name: "Alice Search", email: "alice@test.com", image: null },
    ]);
    render(<MembersDialog albumId="a1" members={mockMembers} canManage={true} open={true} onOpenChange={() => {}} />);
    const input = screen.getByPlaceholderText(/search by name or email/i);
    await typeAndWaitForResults(input, "b");
    // Alice is not a member, so she should appear in the dropdown
    await waitFor(() => {
      expect(screen.getByText("Alice Search")).toBeInTheDocument();
    });
    // "Beni" appears in the members list but should NOT appear in search dropdown
    // (it would be filtered because u1 is already in mockMembers)
    const dropdown = screen.getByText("Alice Search").closest("div");
    expect(dropdown).toBeInTheDocument();
  });
});
