CREATE TABLE "album" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_media_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "album_member" (
	"album_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "album_member_album_id_user_id_pk" PRIMARY KEY("album_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"type" text NOT NULL,
	"filename" text NOT NULL,
	"r2_key" text NOT NULL,
	"thumbnail_r2_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album" ADD CONSTRAINT "album_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_member" ADD CONSTRAINT "album_member_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_member" ADD CONSTRAINT "album_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_album_id_album_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_member_userId_idx" ON "album_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_albumId_idx" ON "media" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "media_uploadedBy_idx" ON "media" USING btree ("uploaded_by");