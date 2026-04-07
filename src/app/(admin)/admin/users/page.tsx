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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} total users</p>
        </div>
        <InviteUserDialog />
      </div>
      <UserList users={users} currentUserId={session.user.id} />
    </div>
  );
}
