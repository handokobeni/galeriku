"use client";

import { useState, useTransition } from "react";
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
import { Share2, Copy, Check } from "lucide-react";

type DownloadPolicy = "none" | "watermarked" | "clean";

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
  }) => Promise<{ ok: boolean; slug?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [policy, setPolicy] = useState<DownloadPolicy>("none");
  const [expires, setExpires] = useState("");
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      } else {
        setError("Gagal publish album. Coba lagi.");
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
  }

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
              <select
                id="publish-policy"
                value={policy}
                onChange={(e) => setPolicy(e.target.value as DownloadPolicy)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="none">No download — klien hanya bisa lihat</option>
                <option value="watermarked">Watermarked — download dengan watermark</option>
                <option value="clean">Clean — download kualitas penuh</option>
              </select>
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
