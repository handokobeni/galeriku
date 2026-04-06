import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SetupForm } from "@/features/auth/components/setup-form";

export default async function SetupPage() {
  // If any user exists, redirect to login
  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count > 0) {
    redirect("/login");
  }

  return <SetupForm />;
}
