export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WatermarkConfig = {
  mode: "logo" | "text";
  logoR2Key: string | null;
  text: string;
  position: WatermarkPosition;
  opacity: number;   // 10-100
  scale: number;     // 10-60 (% of photo width)
};

export const DEFAULTS: WatermarkConfig = {
  mode: "logo",
  logoR2Key: null,
  text: "",
  position: "center",
  opacity: 40,
  scale: 30,
};

/**
 * Resolve watermark config by layering: DEFAULTS < global < albumOverride.
 * Pure function -- no side effects.
 */
export function resolveWatermarkConfig(
  global: Partial<WatermarkConfig> | null | undefined,
  albumOverride: Partial<WatermarkConfig> | null | undefined,
): WatermarkConfig {
  return {
    ...DEFAULTS,
    ...(global ?? {}),
    ...(albumOverride ?? {}),
  };
}
