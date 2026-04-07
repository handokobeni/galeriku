import { pgTable, text, timestamp, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./user";

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_log_userId_idx").on(table.userId),
    index("activity_log_createdAt_idx").on(table.createdAt),
  ],
);
