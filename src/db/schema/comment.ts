import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { user } from "./user";
import { media } from "./media";

export const comment = pgTable("comment", {
  id: uuid("id").primaryKey().defaultRandom(),
  mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("comment_mediaId_idx").on(table.mediaId),
  index("comment_userId_idx").on(table.userId),
]);

export const commentRelations = relations(comment, ({ one }) => ({
  media: one(media, { fields: [comment.mediaId], references: [media.id] }),
  user: one(user, { fields: [comment.userId], references: [user.id] }),
}));
