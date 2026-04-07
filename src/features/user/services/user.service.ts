import { db } from "@/db";
import { user } from "@/db/schema";
import { or, ilike } from "drizzle-orm";

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export async function searchUsers(query: string, limit = 10): Promise<UserSearchResult[]> {
  if (!query.trim()) return [];
  const searchTerm = `%${query.trim()}%`;

  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    })
    .from(user)
    .where(or(ilike(user.name, searchTerm), ilike(user.email, searchTerm)))
    .limit(limit);
}
