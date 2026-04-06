import { db } from "@/db";
import { user } from "@/db/schema";
import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/login-form";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  const [userCount] = await db.select({ count: count() }).from(user);
  if (userCount.count === 0) {
    redirect("/setup");
  }

  return <LoginForm callbackUrl={callbackUrl} />;
}
