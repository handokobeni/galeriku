"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function WatermarkPreviewModal({
  open,
  onClose,
  onConfirm,
  previewUrl,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  previewUrl: string | null;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Watermark Preview</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Generating preview...
            </div>
          )}

          {!loading && previewUrl && (
            <div className="rounded-lg overflow-hidden border">
              <img
                src={previewUrl}
                alt="Watermark preview"
                className="w-full h-auto"
              />
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Preview — actual watermark may vary slightly by photo size
          </p>

          {!loading && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Change settings
              </Button>
              <Button onClick={onConfirm}>
                Looks good
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
