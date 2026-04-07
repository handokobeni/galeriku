import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/app-shell";
import type { AuthUser } from "@/features/auth/types";
import type { ReactNode } from "react";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await getSessionWithRole();

  if (!session) {
    redirect("/login");
  }

  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email,
    username: (session.user as Record<string, unknown>).username as string,
    name: session.user.name,
    image: session.user.image ?? null,
    role: session.user.role, // already typed as "owner" | "member"
  };

  return <AppShell user={user}>{children}</AppShell>;
}
