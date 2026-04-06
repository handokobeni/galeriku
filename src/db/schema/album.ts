import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { user } from "./user";

export const album = pgTable("album", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  coverMediaId: uuid("cover_media_id"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const albumMember = pgTable(
  "album_member",
  {
    albumId: uuid("album_id")
      .notNull()
      .references(() => album.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["viewer", "editor"] }).notNull().default("viewer"),
    invitedAt: timestamp("invited_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.userId] }),
    index("album_member_userId_idx").on(table.userId),
  ],
);

export const albumRelations = relations(album, ({ one, many }) => ({
  creator: one(user, { fields: [album.createdBy], references: [user.id] }),
  members: many(albumMember),
}));

export const albumMemberRelations = relations(albumMember, ({ one }) => ({
  album: one(album, { fields: [albumMember.albumId], references: [album.id] }),
  user: one(user, { fields: [albumMember.userId], references: [user.id] }),
}));
