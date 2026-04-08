"use client";
import { useState } from "react";

export function NameModal({
  slug, open, onClose, onSuccess,
}: { slug: string; open: boolean; onClose: () => void; onSuccess: (guestId: string) => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/g/${slug}/api/guest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      setError("Gagal menyimpan nama");
      setLoading(false);
      return;
    }
    const data = await res.json();
    onSuccess(data.guestId);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold">Sebelum favorite, siapa nama Anda?</h2>
        <p className="text-sm text-gray-600">Photographer akan tahu foto mana yang Anda pilih.</p>
        <input
          placeholder="Nama (cth: Tante Sinta)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          autoFocus
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-md border py-2">Batal</button>
          <button onClick={submit} disabled={loading || !name.trim()} className="flex-1 rounded-md bg-black text-white py-2">
            {loading ? "..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}
