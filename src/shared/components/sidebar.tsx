"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  Heart,
  Search,
  Settings,
  Droplets,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { UserAvatar } from "./avatar";
import { signOut } from "@/features/auth/lib/auth-client";
import type { AuthUser } from "@/features/auth/types";

interface SidebarProps {
  user: AuthUser;
}

const primaryLinks = [
  { href: "/albums", label: "Albums", icon: LayoutGrid, num: "01" },
  { href: "/favorites", label: "Favorites", icon: Heart, num: "02" },
  { href: "/search", label: "Search", icon: Search, num: "03" },
  { href: "/settings", label: "Watermark", icon: Droplets, num: "04" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card/40 backdrop-blur-sm sticky top-0 h-svh">
      {/* Brand */}
      <div className="px-7 pt-8 pb-10">
        <Link href="/albums" className="group inline-flex items-baseline gap-2">
          <span className="font-display text-3xl tracking-tight leading-none text-foreground">
            Galeriku
          </span>
          <Sparkles className="size-3 text-accent transition-transform group-hover:rotate-12" />
        </Link>
        <p className="font-editorial text-[11px] tracking-[0.18em] uppercase text-muted-foreground mt-2">
          Studio · Workspace
        </p>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-4">
        <p className="label-eyebrow px-3 mb-3">✦ Workspace</p>
        <ul className="space-y-0.5">
          {primaryLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-editorial transition-all relative",
                    active
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] bg-primary rounded-r" />
                  )}
                  <Icon className={cn("size-4 transition-colors", active && "text-primary")} />
                  <span className="flex-1">{link.label}</span>
                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-wider",
                      active ? "text-primary" : "text-muted-foreground/50",
                    )}
                  >
                    {link.num}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {user.role === "owner" && (
          <>
            <p className="label-eyebrow px-3 mt-8 mb-3">✦ Admin</p>
            <ul className="space-y-0.5">
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-editorial transition-all relative",
                    pathname.startsWith("/admin")
                      ? "bg-primary/10 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                >
                  {pathname.startsWith("/admin") && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] bg-primary rounded-r" />
                  )}
                  <Settings
                    className={cn(
                      "size-4",
                      pathname.startsWith("/admin") && "text-primary",
                    )}
                  />
                  <span className="flex-1">Settings</span>
                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground/50">
                    04
                  </span>
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>

      {/* Footer: user + actions */}
      <div className="border-t border-border/60 px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <UserAvatar name={user.name} image={user.image} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate text-foreground">
              {user.name}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground truncate">
              {user.username ? `@${user.username}` : user.email}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="size-9 ml-auto"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
