import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { getRecentActivity } from "@/features/activity/services/activity.service";
import { ActivityFeed } from "@/features/admin/components/activity-feed";
import type { ActivityLogEntry } from "@/features/activity/types";

export default async function AdminActivityPage() {
  const session = await getSessionWithRole();
  if (!session || session.user.role !== "owner") redirect("/albums");

  const activities = (await getRecentActivity(100)) as unknown as ActivityLogEntry[];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-sm text-muted-foreground">Recent system events</p>
      </div>
      <ActivityFeed activities={activities} />
    </div>
  );
}
