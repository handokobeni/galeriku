import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import type { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") redirect("/albums");

  return (
    <div className="flex min-h-svh">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
