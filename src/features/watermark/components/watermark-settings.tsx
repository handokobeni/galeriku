"use client";

import type { WatermarkConfig, WatermarkPosition } from "../lib/config";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "Top Left" },
  { value: "top-right", label: "Top Right" },
  { value: "center", label: "Center" },
  { value: "bottom-left", label: "Bottom Left" },
  { value: "bottom-right", label: "Bottom Right" },
];

export function WatermarkSettings({
  config,
  onChange,
}: {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
}) {
  function update(partial: Partial<WatermarkConfig>) {
    onChange({ ...config, ...partial });
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="space-y-2">
        <Label>Watermark mode</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={config.mode === "logo" ? "default" : "outline"}
            size="sm"
            onClick={() => update({ mode: "logo" })}
          >
            Logo
          </Button>
          <Button
            type="button"
            variant={config.mode === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => update({ mode: "text" })}
            aria-label="Text"
          >
            Text
          </Button>
        </div>
      </div>

      {/* Text input (only when mode=text) */}
      {config.mode === "text" && (
        <div className="space-y-2">
          <Label htmlFor="wm-text">Watermark text</Label>
          <Input
            id="wm-text"
            value={config.text}
            onChange={(e) => update({ text: e.target.value })}
            placeholder="Studio name"
            maxLength={100}
          />
        </div>
      )}

      {/* Position grid */}
      <div className="space-y-2">
        <Label>Position</Label>
        <div className="grid grid-cols-3 gap-2 max-w-[240px]">
          {POSITIONS.map((pos) => (
            <Button
              key={pos.value}
              type="button"
              variant={config.position === pos.value ? "default" : "outline"}
              size="sm"
              onClick={() => update({ position: pos.value })}
              className="text-xs"
            >
              {pos.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Opacity slider */}
      <div className="space-y-2">
        <Label htmlFor="wm-opacity">Opacity: {config.opacity}%</Label>
        <input
          id="wm-opacity"
          type="range"
          min={10}
          max={100}
          step={5}
          value={config.opacity}
          onChange={(e) => update({ opacity: Number(e.target.value) })}
          aria-label="Opacity"
          className="w-full"
        />
      </div>

      {/* Scale slider */}
      <div className="space-y-2">
        <Label htmlFor="wm-scale">Scale: {config.scale}%</Label>
        <input
          id="wm-scale"
          type="range"
          min={10}
          max={60}
          step={5}
          value={config.scale}
          onChange={(e) => update({ scale: Number(e.target.value) })}
          aria-label="Scale"
          className="w-full"
        />
      </div>
    </div>
  );
}
