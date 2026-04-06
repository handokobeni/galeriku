"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count === 0) {
    redirect("/setup");
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
      },
      headers: await headers(),
    });
  } catch {
    return { error: "Invalid email or password" };
  }

  const callbackUrl = formData.get("callbackUrl")?.toString() || "/albums";
  redirect(callbackUrl);
}
