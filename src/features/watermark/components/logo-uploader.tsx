"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export function LogoUploader({
  onUpload,
  logoUrl,
}: {
  onUpload: (file: File) => Promise<{ ok: boolean; error?: string }>;
  logoUrl?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_SIZE) {
      setError("File exceeds 2 MB limit");
      return;
    }

    if (file.type !== "image/png") {
      setError("Only PNG files are accepted");
      return;
    }

    setUploading(true);
    try {
      const result = await onUpload(file);
      if (!result.ok && result.error) {
        setError(result.error);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {logoUrl && (
        <div className="border rounded-lg p-3 bg-muted/30">
          <img
            src={logoUrl}
            alt="Watermark logo"
            className="max-h-16 object-contain"
          />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png"
        onChange={handleChange}
        className="hidden"
      />

      <Button
        variant="outline"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="gap-2"
      >
        <Upload className="size-4" />
        {uploading ? "Uploading..." : "Upload Logo"}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
