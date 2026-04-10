"use client";

import { useState, useCallback } from "react";
import { WatermarkSettings } from "./watermark-settings";
import { LogoUploader } from "./logo-uploader";
import type { WatermarkConfig } from "../lib/config";
import { DEFAULTS } from "../lib/config";
import { saveWatermarkConfigAction } from "../actions/save-watermark-config";

export function WatermarkSettingsSection({
  initialConfig,
  logoPreviewUrl,
}: {
  initialConfig: Partial<WatermarkConfig> | null;
  logoPreviewUrl: string | null;
}) {
  const [config, setConfig] = useState<WatermarkConfig>({
    ...DEFAULTS,
    ...initialConfig,
  });
  const [logoUrl, setLogoUrl] = useState(logoPreviewUrl);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = useCallback(async (updated: WatermarkConfig) => {
    setConfig(updated);
    setSaving(true);
    setSaved(false);
    await saveWatermarkConfigAction(updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  async function handleLogoUpload(file: File): Promise<{ ok: boolean; error?: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/watermark/logo", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { ok: false, error: data.error ?? "Upload failed" };
    }
    const data = await res.json();
    if (data.previewUrl) setLogoUrl(data.previewUrl);
    // Update config with new logo key
    const updated = { ...config, logoR2Key: data.r2Key };
    setConfig(updated);
    await saveWatermarkConfigAction(updated);
    return { ok: true };
  }

  return (
    <div className="space-y-8">
      {/* Logo upload */}
      <div>
        <p className="label-eyebrow mb-4">✦ Watermark Logo</p>
        <LogoUploader onUpload={handleLogoUpload} logoUrl={logoUrl ?? undefined} />
      </div>

      {/* Settings */}
      <div>
        <p className="label-eyebrow mb-4">✦ Watermark Settings</p>
        <WatermarkSettings config={config} onChange={handleChange} />
        <div className="mt-3 h-5 font-editorial text-xs text-muted-foreground">
          {saving && "Saving..."}
          {saved && "✓ Saved"}
        </div>
      </div>
    </div>
  );
}
