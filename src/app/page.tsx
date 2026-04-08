import { redirect } from "next/navigation";
import { getSessionWithRole } from "@/features/auth/lib/session";
import { LandingPage } from "@/features/marketing/components/landing-page";

export default async function HomePage() {
  const session = await getSessionWithRole();
  if (session) redirect("/albums");
  return <LandingPage />;
}
