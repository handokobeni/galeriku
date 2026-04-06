"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useMediaUpload, type UploadItem } from "../hooks/use-media-upload";

interface UploadDialogProps {
  albumId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function StatusIcon({ status }: { status: UploadItem["status"] }) {
  switch (status) {
    case "done": return <CheckCircle className="size-4 text-green-500" />;
    case "error": return <AlertCircle className="size-4 text-destructive" />;
    case "uploading":
    case "generating-thumb": return <Loader2 className="size-4 animate-spin text-primary" />;
    default: return null;
  }
}

export function UploadDialog({ albumId, open, onOpenChange }: UploadDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { items, addFiles, startUpload, removeItem, clearAll, isUploading } = useMediaUpload();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
  };

  const handleUpload = async () => {
    await startUpload(albumId);
    clearAll();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Media</DialogTitle>
        </DialogHeader>

        <div
          className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to select or drag &amp; drop</p>
          <p className="text-xs text-muted-foreground mt-1">Photos (20MB) · Videos (500MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {items.length > 0 && (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                <StatusIcon status={item.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{item.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                    {item.error && <span className="text-destructive ml-2">{item.error}</span>}
                  </p>
                </div>
                {!isUploading && (
                  <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => { clearAll(); onOpenChange(false); }} disabled={isUploading}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleUpload} disabled={items.length === 0 || isUploading}>
            {isUploading ? <><Loader2 className="size-4 animate-spin mr-2" />Uploading...</> : `Upload ${items.length} file${items.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
