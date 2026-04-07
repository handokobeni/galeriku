"use server";

import { getSessionWithRole } from "@/features/auth/lib/session";
import { redirect } from "next/navigation";
import { auth } from "@/features/auth/lib/auth";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteUserById } from "../services/user-admin.service";
import { logActivity } from "@/features/activity/services/activity.service";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const inviteSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8),
});

export type InviteUserState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function inviteUserAction(
  _prev: InviteUserState,
  formData: FormData
): Promise<InviteUserState> {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") return { error: "Permission denied" };

  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        username: parsed.data.username,
      },
      headers: await headers(),
    });
  } catch {
    return { error: "Failed to create user. Email or username may already exist." };
  }

  await logActivity({
    userId: session.user.id,
    action: "user_invited",
    entityType: "user",
    entityId: null,
    metadata: { email: parsed.data.email },
  });

  revalidatePath("/admin/users");
  return {};
}

export async function deleteUserAction(userId: string) {
  const session = await getSessionWithRole();
  if (!session) redirect("/login");
  if (session.user.role !== "owner") return { error: "Permission denied" };
  if (userId === session.user.id) return { error: "Cannot delete yourself" };

  const [target] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (target?.role === "owner") return { error: "Cannot delete an owner" };

  await deleteUserById(userId);
  await logActivity({
    userId: session.user.id,
    action: "user_deactivated",
    entityType: "user",
    entityId: userId,
    metadata: {},
  });

  revalidatePath("/admin/users");
  return { success: true };
}
