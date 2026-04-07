import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token, error } = await searchParams;

  return <ResetPasswordForm token={token} initialError={error} />;
}
