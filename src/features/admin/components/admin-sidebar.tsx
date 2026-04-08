"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  HardDrive,
  Activity,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview", num: "01" },
  { href: "/admin/users", icon: Users, label: "Users", num: "02" },
  { href: "/admin/albums", icon: FolderOpen, label: "Albums", num: "03" },
  { href: "/admin/storage", icon: HardDrive, label: "Storage", num: "04" },
  { href: "/admin/activity", icon: Activity, label: "Activity", num: "05" },
  { href: "/admin/settings", icon: Settings, label: "Settings", num: "06" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="flex items-center justify-between px-5 py-4">
          <Link
            href="/albums"
            className="inline-flex items-center gap-2 text-[11px] font-editorial tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            Back to app
          </Link>
          <h2 className="font-display text-xl tracking-tight">Admin</h2>
        </div>
      </header>

      {/* Mobile bottom horizontal nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50">
        <div className="mx-3 mb-3 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around px-1 pt-2 pb-1 overflow-x-auto">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 px-3 rounded-xl text-[10px] font-editorial flex-shrink-0 transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                  <span className="tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card/40 backdrop-blur-sm sticky top-0 h-svh">
        <div className="px-7 pt-8 pb-8 border-b border-border/60">
          <Link
            href="/albums"
            className="inline-flex items-center gap-2 text-[11px] font-editorial tracking-[0.18em] uppercase text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
            Back to app
          </Link>
          <h2 className="font-display text-3xl tracking-tight leading-none mt-4">
            Admin
          </h2>
          <p className="font-editorial text-[11px] tracking-[0.18em] uppercase text-muted-foreground mt-2">
            Studio · Console
          </p>
        </div>

        <nav className="flex-1 px-4 py-6">
          <p className="label-eyebrow px-3 mb-3">✦ Modules</p>
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
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
                    <Icon
                      className={cn(
                        "size-4 transition-colors",
                        active && "text-primary",
                      )}
                    />
                    <span className="flex-1">{item.label}</span>
                    <span
                      className={cn(
                        "font-mono text-[10px] tracking-wider",
                        active ? "text-primary" : "text-muted-foreground/50",
                      )}
                    >
                      {item.num}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
