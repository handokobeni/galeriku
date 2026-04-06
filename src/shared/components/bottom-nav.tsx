"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Heart, Search, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/albums", icon: LayoutGrid, label: "Albums" },
  { href: "/favorites", icon: Heart, label: "Favorites" },
  { href: "#upload", icon: Plus, label: "Upload", isFab: true },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/admin", icon: Settings, label: "Settings" },
];

interface BottomNavProps {
  isOwner?: boolean;
}

export function BottomNav({ isOwner }: BottomNavProps) {
  const pathname = usePathname();

  const items = isOwner
    ? navItems
    : navItems.filter((item) => item.href !== "/admin");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      <div className="flex items-center justify-around bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)] px-2 pt-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "#upload";

          if (item.isFab) {
            return (
              <button
                key={item.href}
                className="flex flex-col items-center -mt-4"
                aria-label={item.label}
              >
                <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <Plus className="size-5 text-white" />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-3 text-[10px]",
                isActive ? "text-indigo-500" : "text-muted-foreground"
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
