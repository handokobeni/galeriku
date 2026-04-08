CREATE TABLE "gallery_favorite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"guest_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_favorite_unique" UNIQUE("guest_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "gallery_guest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "download_policy" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "album" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "variants" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "variant_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_favorite" ADD CONSTRAINT "gallery_favorite_guest_id_gallery_guest_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."gallery_guest"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_favorite" ADD CONSTRAINT "gallery_favorite_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_guest" ADD CONSTRAINT "gallery_guest_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_favorite_media_idx" ON "gallery_favorite" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "gallery_guest_album_idx" ON "gallery_guest" USING btree ("album_id");--> statement-breakpoint
ALTER TABLE "album" ADD CONSTRAINT "album_slug_unique" UNIQUE("slug");