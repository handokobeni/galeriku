"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Heart, Search, Settings, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/albums", icon: LayoutGrid, label: "Albums" },
  { href: "/favorites", icon: Heart, label: "Favorites" },
  { href: "/settings", icon: Droplets, label: "Watermark" },
  { href: "/admin", icon: Settings, label: "Admin", ownerOnly: true },
];

interface BottomNavProps {
  isOwner?: boolean;
}

export function BottomNav({ isOwner }: BottomNavProps) {
  const pathname = usePathname();

  const items = isOwner ? navItems : navItems.filter((item) => !item.ownerOnly);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden">
      <div className="mx-3 mb-3 rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-[0_-4px_20px_-8px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-4 rounded-xl text-[10px] font-editorial transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
