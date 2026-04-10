import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LogoUploader } from "../logo-uploader";

describe("LogoUploader", () => {
  it("renders upload button", () => {
    render(<LogoUploader onUpload={vi.fn()} />);
    expect(screen.getByText(/upload logo/i)).toBeDefined();
  });

  it("shows existing logo preview when logoUrl is provided", () => {
    render(<LogoUploader onUpload={vi.fn()} logoUrl="https://example.com/logo.png" />);
    const img = screen.getByAltText(/watermark logo/i);
    expect(img).toBeDefined();
  });

  it("rejects non-PNG files via accept attribute", () => {
    render(<LogoUploader onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe("image/png");
  });

  it("calls onUpload when valid file is selected", async () => {
    const onUpload = vi.fn().mockResolvedValue({ ok: true });
    render(<LogoUploader onUpload={onUpload} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["png-content"], "logo.png", { type: "image/png" });
    Object.defineProperty(file, "size", { value: 1024 });

    fireEvent.change(input, { target: { files: [file] } });
    expect(onUpload).toHaveBeenCalled();
  });

  it("shows error for file > 2MB", () => {
    render(<LogoUploader onUpload={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const bigFile = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(bigFile, "size", { value: 3 * 1024 * 1024 });

    fireEvent.change(input, { target: { files: [bigFile] } });
    expect(screen.getByText(/2 MB/i)).toBeDefined();
  });
});
