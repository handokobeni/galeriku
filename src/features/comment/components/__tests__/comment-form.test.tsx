import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/features/comment/actions/comment-actions", () => ({
  addCommentAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { addCommentAction } from "@/features/comment/actions/comment-actions";
import { CommentForm } from "../comment-form";

describe("CommentForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders input and send button", () => {
    render(<CommentForm mediaId="m1" />);
    expect(screen.getByPlaceholderText(/comment/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("disables button when input empty", () => {
    render(<CommentForm mediaId="m1" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("enables button when input has content", () => {
    render(<CommentForm mediaId="m1" />);
    const input = screen.getByPlaceholderText(/comment/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("calls addCommentAction on submit", async () => {
    render(<CommentForm mediaId="m1" />);
    const input = screen.getByPlaceholderText(/comment/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(addCommentAction).toHaveBeenCalledWith("m1", "Hello");
    });
  });

  it("clears input after successful submit", async () => {
    render(<CommentForm mediaId="m1" />);
    const input = screen.getByPlaceholderText(/comment/i);
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect((input as HTMLInputElement).value).toBe("");
    });
  });

  it("trims whitespace before submitting", async () => {
    render(<CommentForm mediaId="m1" />);
    const input = screen.getByPlaceholderText(/comment/i);
    fireEvent.change(input, { target: { value: "  spaces  " } });
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(addCommentAction).toHaveBeenCalledWith("m1", "spaces");
    });
  });
});
