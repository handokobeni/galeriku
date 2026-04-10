import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WatermarkPreviewModal } from "../watermark-preview-modal";

describe("WatermarkPreviewModal", () => {
  it("renders the preview image", () => {
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    const img = screen.getByAltText(/watermark preview/i);
    expect(img).toBeDefined();
  });

  it("shows loading state", () => {
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        previewUrl={null}
        loading={true}
      />,
    );
    expect(screen.getByText(/generating preview/i)).toBeDefined();
  });

  it("calls onConfirm when 'Looks good' is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={vi.fn()}
        onConfirm={onConfirm}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    fireEvent.click(screen.getByText(/looks good/i));
    expect(onConfirm).toHaveBeenCalled();
  });

  it("calls onClose when 'Change settings' is clicked", () => {
    const onClose = vi.fn();
    render(
      <WatermarkPreviewModal
        open={true}
        onClose={onClose}
        onConfirm={vi.fn()}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    fireEvent.click(screen.getByText(/change settings/i));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when open is false", () => {
    const { container } = render(
      <WatermarkPreviewModal
        open={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        previewUrl="blob:preview"
        loading={false}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
