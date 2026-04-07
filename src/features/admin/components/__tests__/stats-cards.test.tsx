import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatsCards } from "../stats-cards";

describe("StatsCards", () => {
  it("renders all stats", () => {
    render(
      <StatsCards
        stats={{
          totalUsers: 5,
          totalAlbums: 12,
          totalMedia: 200,
          totalPhotos: 180,
          totalVideos: 20,
          storageUsedBytes: 1024 * 1024 * 1024,
          storageLimitBytes: 10 * 1024 * 1024 * 1024,
        }}
      />
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("renders photos/videos breakdown", () => {
    render(
      <StatsCards
        stats={{
          totalUsers: 1,
          totalAlbums: 1,
          totalMedia: 50,
          totalPhotos: 30,
          totalVideos: 20,
          storageUsedBytes: 0,
          storageLimitBytes: 1024,
        }}
      />
    );
    expect(screen.getByText(/30 photos/)).toBeInTheDocument();
    expect(screen.getByText(/20 videos/)).toBeInTheDocument();
  });
});
