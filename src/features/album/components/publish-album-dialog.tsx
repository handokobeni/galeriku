"use client";
import { useState, useTransition } from "react";

export function PublishAlbumDialog({
  albumId,
  onPublish,
}: {
  albumId: string;
  onPublish: (input: {
    albumId: string;
    password: string;
    downloadPolicy: "none" | "watermarked" | "clean";
    expiresAt: string | null;
  }) => Promise<{ ok: boolean; slug?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [policy, setPolicy] = useState<"none" | "watermarked" | "clean">("none");
  const [expires, setExpires] = useState("");
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  function submit() {
    start(async () => {
      const r = await onPublish({ albumId, password, downloadPolicy: policy, expiresAt: expires || null });
      if (r.ok && r.slug) setLink(`${window.location.origin}/g/${r.slug}`);
    });
  }

  if (!open) return <button onClick={() => setOpen(true)} className="rounded bg-black text-white px-4 py-2">Publish to client</button>;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-lg max-w-md w-full space-y-4">
        <h2 className="text-lg font-semibold">Publish album</h2>
        {link ? (
          <>
            <p className="text-sm">Link untuk klien:</p>
            <input readOnly value={link} className="w-full border px-2 py-1 rounded text-sm" />
            <button onClick={() => navigator.clipboard.writeText(link)} className="w-full bg-black text-white py-2 rounded">Copy link</button>
          </>
        ) : (
          <>
            <label className="block text-sm">
              Password (opsional)
              <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border px-2 py-1 rounded" />
            </label>
            <label className="block text-sm">
              Download policy
              <select value={policy} onChange={(e) => setPolicy(e.target.value as "none" | "watermarked" | "clean")} className="mt-1 w-full border px-2 py-1 rounded">
                <option value="none">No download</option>
                <option value="watermarked">Watermarked only</option>
                <option value="clean">Clean (full quality)</option>
              </select>
            </label>
            <label className="block text-sm">
              Expires at (opsional)
              <input type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)} className="mt-1 w-full border px-2 py-1 rounded" />
            </label>
            <div className="flex gap-2">
              <button onClick={() => setOpen(false)} className="flex-1 border py-2 rounded">Cancel</button>
              <button onClick={submit} disabled={pending} className="flex-1 bg-black text-white py-2 rounded">{pending ? "..." : "Publish"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
