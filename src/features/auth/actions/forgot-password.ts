"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function checkEmailAndRequestReset(email: string) {
  if (!email || !email.includes("@")) {
    return { error: "Invalid email" };
  }

  // Check if user exists
  const [existingUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!existingUser) {
    return { error: "Email not found" };
  }

  // User exists — request password reset via Better Auth
  try {
    await auth.api.requestPasswordReset({
      body: {
        email,
        redirectTo: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/reset-password`,
      },
      headers: await headers(),
    });
  } catch (err) {
    console.error("[forgot-password] Failed to send reset:", err);
    return { error: "Failed to send reset email. Try again later." };
  }

  return { success: true };
}
