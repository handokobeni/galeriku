import { db } from "@/db";
import { user, account } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function deleteUserById(userId: string) {
  await db.delete(user).where(eq(user.id, userId));
}

export async function getUserById(userId: string) {
  const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  return u ?? null;
}

export async function resetUserPassword(userId: string, hashedPassword: string) {
  await db
    .update(account)
    .set({ password: hashedPassword })
    .where(eq(account.userId, userId));
}
