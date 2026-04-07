import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ActivityFeed } from "../activity-feed";

const mockActivities = [
  {
    id: "1",
    userId: "u1",
    userName: "Beni",
    action: "album_created" as const,
    entityType: "album" as const,
    entityId: "a1",
    metadata: { name: "Bali" },
    createdAt: new Date(),
  },
];

describe("ActivityFeed", () => {
  it("renders activity entries", () => {
    render(<ActivityFeed activities={mockActivities} />);
    expect(screen.getByText(/Beni/)).toBeInTheDocument();
  });
  it("shows empty state when no activities", () => {
    render(<ActivityFeed activities={[]} />);
    expect(screen.getByText(/no activity/i)).toBeInTheDocument();
  });
});
