"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function register(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const setting = await db.select().from(appSettings).where(eq(appSettings.key, "registration_open")).limit(1);
  const isOpen = setting[0]?.value === true || setting[0]?.value === "true";

  if (!isOpen) {
    return { error: "Registration is currently closed. Contact the owner for an invite." };
  }

  const parsed = registerSchema.safeParse({
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
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
        username,
        role: "member",
      },
      headers: await headers(),
    });
  } catch {
    return { error: "Failed to create account. Email or username may already be in use." };
  }

  redirect("/albums");
}
