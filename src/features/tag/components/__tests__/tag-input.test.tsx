import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/tag/actions/tag-actions", () => ({
  addTagAction: vi.fn().mockResolvedValue({ success: true }),
  removeTagAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { addTagAction, removeTagAction } from "@/features/tag/actions/tag-actions";
import { TagInput } from "../tag-input";

const mockTags = [{ id: 1, name: "sunset" }, { id: 2, name: "beach" }];

describe("TagInput", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders existing tags", () => {
    render(<TagInput mediaId="m1" tags={mockTags} canEdit={true} />);
    expect(screen.getByText("#sunset")).toBeInTheDocument();
    expect(screen.getByText("#beach")).toBeInTheDocument();
  });

  it("shows input when canEdit is true", () => {
    render(<TagInput mediaId="m1" tags={mockTags} canEdit={true} />);
    expect(screen.getByPlaceholderText(/add tag/i)).toBeInTheDocument();
  });

  it("hides input when canEdit is false", () => {
    render(<TagInput mediaId="m1" tags={mockTags} canEdit={false} />);
    expect(screen.queryByPlaceholderText(/add tag/i)).not.toBeInTheDocument();
  });

  it("calls addTagAction when adding via Enter key", async () => {
    render(<TagInput mediaId="m1" tags={mockTags} canEdit={true} />);
    const input = screen.getByPlaceholderText(/add tag/i);
    fireEvent.change(input, { target: { value: "newtag" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(addTagAction).toHaveBeenCalledWith("m1", "newtag");
    });
  });

  it("calls addTagAction when clicking the add button", async () => {
    render(<TagInput mediaId="m1" tags={mockTags} canEdit={true} />);
    const input = screen.getByPlaceholderText(/add tag/i);
    fireEvent.change(input, { target: { value: "mountain" } });
    // The add button is the last button in the form area
    const addButton = input.closest("div")!.querySelector("button")!;
    fireEvent.click(addButton);
    await waitFor(() => {
      expect(addTagAction).toHaveBeenCalledWith("m1", "mountain");
    });
  });

  it("calls removeTagAction when removing a tag", async () => {
    render(<TagInput mediaId="m1" tags={mockTags} canEdit={true} />);
    // TagBadge renders an × button for removing
    const removeButtons = screen.getAllByRole("button");
    // First remove button corresponds to first tag
    fireEvent.click(removeButtons[0]);
    await waitFor(() => {
      expect(removeTagAction).toHaveBeenCalledWith("m1", 1);
    });
  });

  it("renders no tags when tags array is empty", () => {
    render(<TagInput mediaId="m1" tags={[]} canEdit={false} />);
    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
  });
});
