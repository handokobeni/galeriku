import { db } from "@/db";
import { activityLog } from "@/db/schema";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ActivityAction, EntityType } from "../types";

export async function logActivity(data: {
  userId?: string | null;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  await db.insert(activityLog).values({
    userId: data.userId ?? null,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId ?? null,
    metadata: data.metadata ?? null,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
  });
}

export async function getRecentActivity(limit = 50, offset = 0) {
  return db
    .select({
      id: activityLog.id,
      userId: activityLog.userId,
      userName: user.name,
      action: activityLog.action,
      entityType: activityLog.entityType,
      entityId: activityLog.entityId,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
    })
    .from(activityLog)
    .leftJoin(user, eq(activityLog.userId, user.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);
}
