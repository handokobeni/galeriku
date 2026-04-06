import type { ReactNode } from "react";
import { TopNav } from "./top-nav";
import { BottomNav } from "./bottom-nav";
import type { AuthUser } from "@/features/auth/types";

interface AppShellProps {
  user: AuthUser;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-svh flex flex-col">
      <TopNav user={user} />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <BottomNav isOwner={user.role === "owner"} />
    </div>
  );
}
