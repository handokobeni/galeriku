import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getAllUsersForAdmin } from "@/features/admin/services/admin.service";
import { UserList } from "@/features/admin/components/user-list";
import { InviteUserDialog } from "@/features/admin/components/invite-user-dialog";

export default async function AdminUsersPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const users = await getAllUsersForAdmin();

  return (
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12">
        <p className="label-eyebrow mb-4">✦ 02 — Users</p>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="font-display text-5xl lg:text-6xl tracking-tight leading-[0.95] text-foreground">
              Studio <em className="italic font-light text-primary">team</em>
            </h1>
            <p className="mt-4 font-editorial text-sm text-muted-foreground">
              <span className="font-mono text-foreground">{users.length}</span>{" "}
              <span className="italic">{users.length === 1 ? "member" : "members"}</span>
            </p>
          </div>
          <InviteUserDialog />
        </div>
        <div className="divider-gold mt-8" />
      </header>

      <UserList users={users} currentUserId={session.user.id} />
    </div>
  );
}
