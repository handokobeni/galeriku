"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatar } from "./avatar";
import type { AuthUser } from "@/features/auth/types";

export function MobileTopBar({ user }: { user: AuthUser }) {
  return (
    <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-border/60 bg-background/95 backdrop-blur sticky top-0 z-40">
      <Link href="/albums" className="inline-flex items-baseline gap-1.5">
        <span className="font-display text-2xl tracking-tight leading-none">
          Galeriku
        </span>
        <Sparkles className="size-2.5 text-accent" />
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserAvatar name={user.name} image={user.image} />
      </div>
    </header>
  );
}
