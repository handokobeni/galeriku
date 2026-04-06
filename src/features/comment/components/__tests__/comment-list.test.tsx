import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/comment/actions/comment-actions", () => ({
  addCommentAction: vi.fn(),
  deleteCommentAction: vi.fn(),
}));

import { CommentList } from "../comment-list";

const mockComments = [
  { id: "c1", mediaId: "m1", userId: "u1", userName: "Beni", userImage: null, content: "Nice photo!", createdAt: new Date() },
  { id: "c2", mediaId: "m1", userId: "u2", userName: "Mama", userImage: null, content: "Beautiful", createdAt: new Date() },
];

describe("CommentList", () => {
  it("renders comments", () => {
    render(<CommentList mediaId="m1" comments={mockComments} />);
    expect(screen.getByText("Nice photo!")).toBeInTheDocument();
    expect(screen.getByText("Beautiful")).toBeInTheDocument();
  });
  it("renders user names", () => {
    render(<CommentList mediaId="m1" comments={mockComments} />);
    expect(screen.getByText("Beni")).toBeInTheDocument();
    expect(screen.getByText("Mama")).toBeInTheDocument();
  });
  it("renders empty state when no comments", () => {
    render(<CommentList mediaId="m1" comments={[]} />);
    expect(screen.getByText(/no comments/i)).toBeInTheDocument();
  });
});
