import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, integer, bigint, index } from "drizzle-orm/pg-core";
import { user } from "./user";
import { album } from "./album";

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id")
      .notNull()
      .references(() => album.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["photo", "video"] }).notNull(),
    filename: text("filename").notNull(),
    r2Key: text("r2_key").notNull(),
    thumbnailR2Key: text("thumbnail_r2_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    duration: integer("duration"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("media_albumId_idx").on(table.albumId),
    index("media_uploadedBy_idx").on(table.uploadedBy),
  ],
);

export const mediaRelations = relations(media, ({ one }) => ({
  album: one(album, { fields: [media.albumId], references: [album.id] }),
  uploader: one(user, { fields: [media.uploadedBy], references: [user.id] }),
}));
