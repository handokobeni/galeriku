"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { forgotPasswordLimiter } from "@/shared/lib/rate-limit";
import { getClientKey } from "@/shared/lib/client-ip";

async function getRateLimitKey(): Promise<string> {
  const h = await headers();
  // Build a Request-shape stub so we can reuse the shared resolver.
  const req = new Request("http://local", {
    headers: new Headers({
      "cf-connecting-ip": h.get("cf-connecting-ip") ?? "",
      "x-real-ip": h.get("x-real-ip") ?? "",
      "x-forwarded-for": h.get("x-forwarded-for") ?? "",
    }),
  });
  return getClientKey(req);
}

export async function checkEmailAndRequestReset(email: string) {
  if (!email || !email.includes("@")) {
    return { error: "Invalid email" };
  }

  // Rate limit BEFORE the DB lookup so an attacker can't enumerate emails
  // even at sub-limit speed. Per IP, scoped to forgot-password.
  const clientKey = await getRateLimitKey();
  if (!forgotPasswordLimiter.check(`forgot:${clientKey}`)) {
    return { error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit." };
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
