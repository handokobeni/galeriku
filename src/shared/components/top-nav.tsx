"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./avatar";
import { ThemeToggle } from "./theme-toggle";
import { signOut } from "@/features/auth/lib/auth-client";
import { useRouter } from "next/navigation";
import type { AuthUser } from "@/features/auth/types";

const navLinks = [
  { href: "/albums", label: "Albums" },
  { href: "/favorites", label: "Favorites" },
];

interface TopNavProps {
  user: AuthUser;
}

export function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="hidden lg:flex items-center justify-between h-14 px-6 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/albums" className="text-lg font-bold tracking-tight">
          Galeriku
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(link.href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {user.role === "owner" && (
            <Link
              href="/admin"
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/admin")
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/search"
          className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-52"
        >
          <Search className="size-4" />
          <span>Search...</span>
        </Link>
        <ThemeToggle />
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-xl"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
        </Button>
        <UserAvatar name={user.name} image={user.image} />
      </div>
    </header>
  );
}
