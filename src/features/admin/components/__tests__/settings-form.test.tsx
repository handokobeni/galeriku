import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/admin/actions/settings-actions", () => ({
  updateSettingsAction: vi.fn().mockResolvedValue({ success: true }),
}));

import { SettingsForm } from "../settings-form";

const initial = {
  app_name: "Galeriku",
  registration_open: false,
  max_upload_photo_mb: 20,
  max_upload_video_mb: 500,
  storage_warning_pct: 80,
};

describe("SettingsForm", () => {
  it("renders all settings fields", () => {
    render(<SettingsForm initial={initial} />);
    expect(screen.getByLabelText(/app name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/registration open/i)).toBeInTheDocument();
  });
  it("uses initial values", () => {
    render(<SettingsForm initial={initial} />);
    expect((screen.getByLabelText(/app name/i) as HTMLInputElement).value).toBe("Galeriku");
  });
});
