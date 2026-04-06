import { relations } from "drizzle-orm";
import { pgTable, timestamp, uuid, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./user";
import { media } from "./media";

export const favorite = pgTable("favorite", {
  mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.mediaId, table.userId] })]);

export const favoriteRelations = relations(favorite, ({ one }) => ({
  media: one(media, { fields: [favorite.mediaId], references: [media.id] }),
  user: one(user, { fields: [favorite.userId], references: [user.id] }),
}));
