import { pgTable, uuid, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { album } from "./album";
import { media } from "./media";

export const galleryGuests = pgTable(
  "gallery_guest",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    albumId: uuid("album_id").notNull().references(() => album.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
  },
  (table) => [index("gallery_guest_album_idx").on(table.albumId)],
);

export const galleryFavorites = pgTable(
  "gallery_favorite",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guestId: uuid("guest_id").notNull().references(() => galleryGuests.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id").notNull().references(() => media.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("gallery_favorite_unique").on(table.guestId, table.mediaId),
    index("gallery_favorite_media_idx").on(table.mediaId),
  ],
);

export const galleryGuestRelations = relations(galleryGuests, ({ one, many }) => ({
  album: one(album, { fields: [galleryGuests.albumId], references: [album.id] }),
  favorites: many(galleryFavorites),
}));

export const galleryFavoriteRelations = relations(galleryFavorites, ({ one }) => ({
  guest: one(galleryGuests, { fields: [galleryFavorites.guestId], references: [galleryGuests.id] }),
  media: one(media, { fields: [galleryFavorites.mediaId], references: [media.id] }),
}));
