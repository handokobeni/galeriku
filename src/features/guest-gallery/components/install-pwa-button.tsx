"use client";
import { useEffect, useState } from "react";

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallPwaButton() {
  const [prompt, setPrompt] = useState<DeferredPrompt | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setPrompt(e as DeferredPrompt);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt) return null;

  return (
    <button
      onClick={async () => {
        await prompt.prompt();
        setPrompt(null);
      }}
      className="rounded-md bg-black text-white px-4 py-2 text-sm"
    >
      Install Album
    </button>
  );
}
