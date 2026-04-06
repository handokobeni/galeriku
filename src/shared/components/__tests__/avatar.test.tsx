import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UserAvatar } from "../avatar";

describe("UserAvatar", () => {
  it("renders initials when no image provided", () => {
    render(<UserAvatar name="Beni Handoko" />);
    expect(screen.getByText("BH")).toBeInTheDocument();
  });

  it("renders single initial for single name", () => {
    render(<UserAvatar name="Beni" />);
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("limits initials to 2 characters", () => {
    render(<UserAvatar name="Beni Handoko Putra" />);
    expect(screen.getByText("BH")).toBeInTheDocument();
  });

  it("renders img when image URL provided", () => {
    render(<UserAvatar name="Beni" image="https://example.com/avatar.jpg" />);
    const img = screen.getByAltText("Beni");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("applies sm size class", () => {
    const { container } = render(<UserAvatar name="Beni" size="sm" />);
    expect(container.firstChild).toHaveClass("size-6");
  });

  it("applies lg size class", () => {
    const { container } = render(<UserAvatar name="Beni" size="lg" />);
    expect(container.firstChild).toHaveClass("size-12");
  });

  it("defaults to md size", () => {
    const { container } = render(<UserAvatar name="Beni" />);
    expect(container.firstChild).toHaveClass("size-9");
  });

  it("applies custom className", () => {
    const { container } = render(<UserAvatar name="Beni" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
