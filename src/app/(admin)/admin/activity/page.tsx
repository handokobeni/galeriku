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
    <div className="px-6 lg:px-12 py-10 lg:py-14 max-w-[1600px] mx-auto">
      <header className="mb-12">
        <p className="label-eyebrow mb-4">✦ 05 — Activity</p>
        <h1 className="font-display text-5xl lg:text-6xl tracking-tight leading-[0.95] text-foreground">
          Recent <em className="italic font-light text-primary">events</em>
        </h1>
        <p className="mt-4 font-editorial text-sm text-muted-foreground italic">
          Last 100 system events across the studio
        </p>
        <div className="divider-gold mt-8" />
      </header>

      <ActivityFeed activities={activities} />
    </div>
  );
}
