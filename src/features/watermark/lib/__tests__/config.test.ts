import { describe, expect, it } from "vitest";
import {
  resolveWatermarkConfig,
  DEFAULTS,
  type WatermarkConfig,
} from "../config";

describe("resolveWatermarkConfig", () => {
  it("returns DEFAULTS when both global and override are null", () => {
    const result = resolveWatermarkConfig(null, null);
    expect(result).toEqual(DEFAULTS);
  });

  it("returns DEFAULTS when both global and override are undefined", () => {
    const result = resolveWatermarkConfig(undefined, undefined);
    expect(result).toEqual(DEFAULTS);
  });

  it("merges global config over defaults", () => {
    const global: Partial<WatermarkConfig> = {
      mode: "text",
      text: "Studio ABC",
      opacity: 60,
    };
    const result = resolveWatermarkConfig(global, null);
    expect(result.mode).toBe("text");
    expect(result.text).toBe("Studio ABC");
    expect(result.opacity).toBe(60);
    // Remaining fields from DEFAULTS
    expect(result.position).toBe(DEFAULTS.position);
    expect(result.scale).toBe(DEFAULTS.scale);
    expect(result.logoR2Key).toBe(DEFAULTS.logoR2Key);
  });

  it("merges album override over global over defaults", () => {
    const global: Partial<WatermarkConfig> = {
      mode: "logo",
      logoR2Key: "watermarks/studio1/logo.png",
      opacity: 50,
    };
    const override: Partial<WatermarkConfig> = {
      opacity: 80,
      position: "bottom-right",
    };
    const result = resolveWatermarkConfig(global, override);
    expect(result.mode).toBe("logo");
    expect(result.logoR2Key).toBe("watermarks/studio1/logo.png");
    expect(result.opacity).toBe(80);
    expect(result.position).toBe("bottom-right");
    expect(result.scale).toBe(DEFAULTS.scale);
  });

  it("album override alone merges over defaults", () => {
    const override: Partial<WatermarkConfig> = { scale: 45 };
    const result = resolveWatermarkConfig(null, override);
    expect(result.scale).toBe(45);
    expect(result.mode).toBe(DEFAULTS.mode);
  });

  it("empty partials return defaults", () => {
    const result = resolveWatermarkConfig({}, {});
    expect(result).toEqual(DEFAULTS);
  });

  it("DEFAULTS has correct values per spec", () => {
    expect(DEFAULTS).toEqual({
      mode: "logo",
      logoR2Key: null,
      text: "",
      position: "center",
      opacity: 40,
      scale: 30,
    });
  });
});
