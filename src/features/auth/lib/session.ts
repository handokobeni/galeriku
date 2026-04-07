import { auth } from "./auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Get the current session with the FRESH role from the database.
 *
 * Better Auth uses a cookieCache for sessions which can return stale role
 * data (e.g., when role is updated after signup via setup-owner). This
 * helper always fetches the role from the database, ensuring permission
 * checks use the current role.
 */
export async function getSessionWithRole() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const [dbUser] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  return {
    ...session,
    user: {
      ...session.user,
      role: (dbUser?.role ?? "member") as "owner" | "member",
    },
  };
}
