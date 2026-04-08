import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { OfflineIndicator } from "./offline-indicator";
import { InstallPrompt } from "./install-prompt";
import { MobileTopBar } from "./mobile-top-bar";
import type { AuthUser } from "@/features/auth/types";

interface AppShellProps {
  user: AuthUser;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="min-h-svh bg-background grain-overlay">
      <OfflineIndicator />
      <div className="flex">
        <Sidebar user={user} />
        <div className="flex-1 min-w-0 flex flex-col">
          <MobileTopBar user={user} />
          <main className="flex-1 pb-24 lg:pb-0">{children}</main>
        </div>
      </div>
      <BottomNav isOwner={user.role === "owner"} />
      <InstallPrompt />
    </div>
  );
}
