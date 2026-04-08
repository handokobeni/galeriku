"use client";
import { useState } from "react";

export function PasswordGate({ slug }: { slug: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/g/${slug}/api/unlock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.reload();
      return;
    }
    if (res.status === 429) setError("Terlalu banyak percobaan, coba lagi nanti.");
    else setError("Password salah");
    setLoading(false);
  }

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-[#FAF7F2]">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Album terkunci</h1>
        <p className="text-sm text-gray-600">Masukkan password yang dibagikan oleh photographer.</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-md border px-3 py-2"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-black text-white py-2">
          {loading ? "..." : "Unlock"}
        </button>
      </form>
    </div>
  );
}
