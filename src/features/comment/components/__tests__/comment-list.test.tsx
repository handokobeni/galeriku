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

  it("shows 'just now' for very recent comments", () => {
    const recentComment = { id: "c3", mediaId: "m1", userId: "u1", userName: "Alice", userImage: null, content: "Fresh!", createdAt: new Date() };
    render(<CommentList mediaId="m1" comments={[recentComment]} />);
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("shows minutes ago for comments less than an hour old", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const comment = { id: "c4", mediaId: "m1", userId: "u1", userName: "Bob", userImage: null, content: "Hi", createdAt: fiveMinutesAgo };
    render(<CommentList mediaId="m1" comments={[comment]} />);
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("shows hours ago for comments less than a day old", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const comment = { id: "c5", mediaId: "m1", userId: "u1", userName: "Carol", userImage: null, content: "Hey", createdAt: threeHoursAgo };
    render(<CommentList mediaId="m1" comments={[comment]} />);
    expect(screen.getByText("3h ago")).toBeInTheDocument();
  });

  it("shows days ago for comments older than a day", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const comment = { id: "c6", mediaId: "m1", userId: "u1", userName: "Dave", userImage: null, content: "Old", createdAt: twoDaysAgo };
    render(<CommentList mediaId="m1" comments={[comment]} />);
    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });
});
