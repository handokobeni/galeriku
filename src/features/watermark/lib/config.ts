export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WatermarkConfig = {
  mode: "logo" | "text";
  logoR2Key: string | null;
  text: string;
  position: WatermarkPosition;
  opacity: number;
  scale: number;
};
