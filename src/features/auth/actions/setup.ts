"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { appSettings } from "@/db/schema";
import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { count } from "drizzle-orm";

const setupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SetupState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function setupOwner(_prev: SetupState, formData: FormData): Promise<SetupState> {
  // Check if owner already exists
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count > 0) {
    redirect("/login");
  }

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, username, email, password } = parsed.data;

  try {
    // Sign up via Better Auth
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        username,
        role: "owner",
      },
      headers: await headers(),
    });

    // Seed default app settings
    await db.insert(appSettings).values([
      { key: "app_name", value: JSON.stringify("Galeriku") },
      { key: "registration_open", value: JSON.stringify(false) },
      { key: "max_upload_photo_mb", value: JSON.stringify(20) },
      { key: "max_upload_video_mb", value: JSON.stringify(500) },
      { key: "storage_warning_pct", value: JSON.stringify(80) },
    ]).onConflictDoNothing();
  } catch {
    return { error: "Failed to create account. Email may already be in use." };
  }

  redirect("/albums");
}
