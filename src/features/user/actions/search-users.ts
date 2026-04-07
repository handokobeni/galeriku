"use server";

import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { searchUsers } from "../services/user.service";

export async function searchUsersAction(query: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return [];

  const results = await searchUsers(query);
  // Exclude the current user from results
  return results.filter((u) => u.id !== session.user.id);
}
