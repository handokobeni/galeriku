import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TagBadge } from "../tag-badge";

describe("TagBadge", () => {
  it("renders tag name with # prefix", () => {
    render(<TagBadge name="sunset" />);
    expect(screen.getByText("#sunset")).toBeInTheDocument();
  });
  it("renders remove button when onRemove provided", () => {
    render(<TagBadge name="sunset" onRemove={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
  it("does not render remove button without onRemove", () => {
    render(<TagBadge name="sunset" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
