import { NextResponse } from "next/server";
import { getSessionWithRole } from "@/features/auth/lib/session";
import { uploadLogo } from "@/features/watermark/server/upload-logo";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteObject } from "@/shared/lib/r2";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME!;

async function r2Upload(key: string, buffer: Buffer, contentType: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function POST(req: Request) {
  const session = await getSessionWithRole();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Get existing logo key for cleanup
  const [existing] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "watermark_config"))
    .limit(1);
  const oldLogoR2Key = (existing?.value as any)?.logoR2Key ?? null;

  const result = await uploadLogo({
    buffer,
    studioId: session.user.id,
    r2Upload,
    r2Delete: deleteObject,
    oldLogoR2Key,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  // Upsert watermark_config with new logoR2Key
  const existingConfig = (existing?.value as Record<string, unknown>) ?? {};
  const newConfig = { ...existingConfig, logoR2Key: result.r2Key };
  await db
    .insert(appSettings)
    .values({ key: "watermark_config", value: newConfig })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: newConfig, updatedAt: new Date() },
    });

  return NextResponse.json({ ok: true, r2Key: result.r2Key });
}
