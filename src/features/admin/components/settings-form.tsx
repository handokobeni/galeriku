"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "../actions/settings-actions";
import type { AppSettingsValues } from "../services/settings.service";

interface SettingsFormProps {
  initial: AppSettingsValues;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const [values, setValues] = useState<AppSettingsValues>(initial);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await updateSettingsAction(values);
    if (result.success) {
      setMessage("Settings saved");
    } else {
      setMessage(result.error ?? "Failed to save");
    }
    setPending(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="app_name">App Name</Label>
        <Input
          id="app_name"
          value={values.app_name}
          onChange={(e) => setValues({ ...values, app_name: e.target.value })}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="registration_open">Registration Open</Label>
        <input
          id="registration_open"
          type="checkbox"
          checked={values.registration_open}
          onChange={(e) =>
            setValues({ ...values, registration_open: e.target.checked })
          }
          className="size-4"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_photo">Max Photo Size (MB)</Label>
        <Input
          id="max_photo"
          type="number"
          value={values.max_upload_photo_mb}
          onChange={(e) =>
            setValues({ ...values, max_upload_photo_mb: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_video">Max Video Size (MB)</Label>
        <Input
          id="max_video"
          type="number"
          value={values.max_upload_video_mb}
          onChange={(e) =>
            setValues({ ...values, max_upload_video_mb: Number(e.target.value) })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="storage_warning">Storage Warning (%)</Label>
        <Input
          id="storage_warning"
          type="number"
          value={values.storage_warning_pct}
          onChange={(e) =>
            setValues({ ...values, storage_warning_pct: Number(e.target.value) })
          }
        />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save Settings"}
      </Button>
    </form>
  );
}
