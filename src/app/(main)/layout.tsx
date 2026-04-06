import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/shared/components/app-shell";
import type { AuthUser } from "@/features/auth/types";
import type { ReactNode } from "react";

export default async function MainLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user: AuthUser = {
    id: session.user.id,
    email: session.user.email,
    username: (session.user as Record<string, unknown>).username as string,
    name: session.user.name,
    image: session.user.image ?? null,
    role: ((session.user as Record<string, unknown>).role as string) === "owner" ? "owner" : "member",
  };

  return <AppShell user={user}>{children}</AppShell>;
}
