import type { ReactNode } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background grain-overlay flex flex-col">
      <header className="px-6 lg:px-12 py-8">
        <Link href="/" className="inline-flex items-baseline gap-2 group">
          <span className="font-display text-3xl tracking-tight leading-none text-foreground">
            Galeriku
          </span>
          <Sparkles className="size-3 text-accent transition-transform group-hover:rotate-12" />
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 lg:p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <footer className="px-6 lg:px-12 py-6 text-center">
        <p className="font-editorial text-[11px] tracking-[0.18em] uppercase text-muted-foreground">
          ✦ Crafted for photographers
        </p>
      </footer>
    </div>
  );
}
