import { db } from "./index";
import { appSettings } from "./schema";

async function seed() {
  await db.insert(appSettings).values([
    { key: "app_name", value: JSON.stringify("Galeriku") },
    { key: "registration_open", value: JSON.stringify(false) },
    { key: "max_upload_photo_mb", value: JSON.stringify(20) },
    { key: "max_upload_video_mb", value: JSON.stringify(500) },
    { key: "storage_warning_pct", value: JSON.stringify(80) },
  ]).onConflictDoNothing();

  console.log("Seed complete");
  process.exit(0);
}

seed();
