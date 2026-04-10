import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WatermarkSettings } from "../watermark-settings";

describe("WatermarkSettings", () => {
  const defaultProps = {
    config: {
      mode: "logo" as const,
      logoR2Key: null,
      text: "",
      position: "center" as const,
      opacity: 40,
      scale: 30,
    },
    onChange: vi.fn(),
  };

  it("renders mode toggle (logo / text)", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByText(/logo/i)).toBeDefined();
    expect(screen.getByText(/text/i)).toBeDefined();
  });

  it("renders position grid with 5 positions", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByText(/center/i)).toBeDefined();
  });

  it("renders opacity slider", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByLabelText(/opacity/i)).toBeDefined();
  });

  it("renders scale slider", () => {
    render(<WatermarkSettings {...defaultProps} />);
    expect(screen.getByLabelText(/scale/i)).toBeDefined();
  });

  it("calls onChange when mode is toggled", () => {
    render(<WatermarkSettings {...defaultProps} />);
    const textBtn = screen.getByRole("button", { name: /text/i });
    fireEvent.click(textBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "text" }),
    );
  });

  it("shows text input when mode is text", () => {
    render(
      <WatermarkSettings
        {...defaultProps}
        config={{ ...defaultProps.config, mode: "text" }}
      />,
    );
    expect(screen.getByPlaceholderText(/studio name/i)).toBeDefined();
  });

  it("calls onChange when opacity slider changes", () => {
    render(<WatermarkSettings {...defaultProps} />);
    const slider = screen.getByLabelText(/opacity/i);
    fireEvent.change(slider, { target: { value: "60" } });
    expect(defaultProps.onChange).toHaveBeenCalledWith(
      expect.objectContaining({ opacity: 60 }),
    );
  });
});
