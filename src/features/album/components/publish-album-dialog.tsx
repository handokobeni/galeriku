"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Share2, Copy, Check } from "lucide-react";

type DownloadPolicy = "none" | "watermarked" | "clean";

type WatermarkJobStatus = {
  total: number;
  done: number;
  status: "processing" | "completed" | "failed";
  error?: string;
  skipped: string[];
};

export function PublishAlbumDialog({
  albumId,
  onPublish,
}: {
  albumId: string;
  onPublish: (input: {
    albumId: string;
    password: string;
    downloadPolicy: DownloadPolicy;
    expiresAt: string | null;
  }) => Promise<{ ok: boolean; slug?: string; reason?: string; jobId?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [policy, setPolicy] = useState<DownloadPolicy>("none");
  const [expires, setExpires] = useState("");
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Watermark progress state
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<WatermarkJobStatus | null>(null);

  // Poll watermark job status
  const pollJob = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/watermark/status/${id}`);
      if (!res.ok) return;
      const data: WatermarkJobStatus = await res.json();
      setJobStatus(data);
      if (data.status === "processing") {
        setTimeout(() => pollJob(id), 2000);
      }
    } catch {
      // Silently retry
      setTimeout(() => pollJob(id), 3000);
    }
  }, []);

  useEffect(() => {
    if (jobId) {
      pollJob(jobId);
    }
  }, [jobId, pollJob]);

  function submit() {
    setError(null);
    start(async () => {
      const r = await onPublish({
        albumId,
        password,
        downloadPolicy: policy,
        expiresAt: expires || null,
      });
      if (r.ok && r.slug) {
        setLink(`${window.location.origin}/g/${r.slug}`);
        if (r.jobId) {
          setJobId(r.jobId);
        }
      } else {
        setError(r.reason || "Gagal publish album. Coba lagi.");
      }
    });
  }

  function copyLink() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setLink(null);
    setPassword("");
    setPolicy("none");
    setExpires("");
    setError(null);
    setCopied(false);
    setJobId(null);
    setJobStatus(null);
  }

  const progressPct = jobStatus
    ? jobStatus.total > 0
      ? Math.round((jobStatus.done / jobStatus.total) * 100)
      : 100
    : 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <Share2 className="size-4" />
            Publish to client
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish album</DialogTitle>
          <DialogDescription>
            Bagikan album ini ke klien lewat link publik. Klien dapat melihat
            foto, favorite, dan opsional download.
          </DialogDescription>
        </DialogHeader>

        {link ? (
          <div className="space-y-4">
            {/* Watermark progress bar */}
            {jobId && jobStatus && jobStatus.status === "processing" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generating watermark {jobStatus.done}/{jobStatus.total}...
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {jobId && jobStatus && jobStatus.status === "completed" && (
              <p className="text-sm text-green-600">
                Watermark generation complete ({jobStatus.done} photos).
                {jobStatus.skipped.length > 0 &&
                  ` ${jobStatus.skipped.length} skipped.`}
              </p>
            )}

            {jobId && jobStatus && jobStatus.status === "failed" && (
              <p className="text-sm text-destructive">
                Watermark generation failed: {jobStatus.error}
              </p>
            )}

            <div>
              <Label>Link untuk klien</Label>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={link} className="font-mono text-xs" />
                <Button onClick={copyLink} variant="outline" size="icon">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Bagikan link ini lewat WhatsApp atau pesan ke klien.
              </p>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">
              Selesai
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="publish-password">Password (opsional)</Label>
              <Input
                id="publish-password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kosongkan untuk public"
              />
              <p className="text-xs text-muted-foreground">
                Klien wajib input password sebelum lihat foto.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-policy">Download policy</Label>
              <Select
                value={policy}
                onValueChange={(v) => setPolicy(v as DownloadPolicy)}
              >
                <SelectTrigger id="publish-policy" className="w-full">
                  <SelectValue placeholder="Pilih policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No download — klien hanya bisa lihat</SelectItem>
                  <SelectItem value="watermarked">Watermarked — download dengan watermark</SelectItem>
                  <SelectItem value="clean">Clean — download kualitas penuh</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish-expires">Expires at (opsional)</Label>
              <Input
                id="publish-expires"
                type="datetime-local"
                value={expires}
                onChange={(e) => setExpires(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Setelah tanggal ini, link tidak dapat diakses lagi.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submit}
                disabled={pending}
                className="flex-1"
              >
                {pending ? "Publishing..." : "Publish"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
