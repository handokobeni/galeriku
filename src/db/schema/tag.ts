import { relations } from "drizzle-orm";
import { pgTable, text, serial, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { media } from "./media";

export const tag = pgTable("tag", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const mediaTag = pgTable("media_tag", {
  mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
  tagId: serial("tag_id").notNull().references(() => tag.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.mediaId, table.tagId] }),
  index("media_tag_tagId_idx").on(table.tagId),
]);

export const tagRelations = relations(tag, ({ many }) => ({
  mediaTags: many(mediaTag),
}));

export const mediaTagRelations = relations(mediaTag, ({ one }) => ({
  media: one(media, { fields: [mediaTag.mediaId], references: [media.id] }),
  tag: one(tag, { fields: [mediaTag.tagId], references: [tag.id] }),
}));
