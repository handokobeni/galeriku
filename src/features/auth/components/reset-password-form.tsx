"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface ResetPasswordFormProps {
  token?: string;
  initialError?: string;
}

export function ResetPasswordForm({
  token,
  initialError,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(
    initialError === "INVALID_TOKEN" ? "Reset link is invalid or expired" : null
  );
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setPending(true);

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token,
    });

    if (resetError) {
      setError(resetError.message ?? "Failed to reset password");
      setPending(false);
      return;
    }

    router.push("/login?reset=success");
  };

  if (!token && !initialError) {
    return (
      <div>
        <p className="label-eyebrow mb-3">✦ Invalid link</p>
        <h1 className="font-display text-4xl tracking-tight leading-[1] text-foreground">
          Link <em className="italic font-light text-primary">expired</em>
        </h1>
        <p className="mt-3 font-editorial text-sm text-muted-foreground italic">
          This reset link is missing a token. Please request a new reset email.
        </p>
        <div className="divider-gold my-7" />
        <Link
          href="/forgot-password"
          className="block text-center text-xs font-editorial italic text-primary hover:underline"
        >
          Request new reset link →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="label-eyebrow mb-3">✦ Reset password</p>
      <h1 className="font-display text-4xl tracking-tight leading-[1] text-foreground">
        Choose a new <em className="italic font-light text-primary">password</em>
      </h1>
      <p className="mt-3 font-editorial text-sm text-muted-foreground italic">
        Pick a strong one — minimum 8 characters
      </p>
      <div className="divider-gold my-7" />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive text-sm rounded-md p-3 font-editorial">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password" className="font-editorial text-xs tracking-wide uppercase text-muted-foreground">
            New Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            minLength={8}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm" className="font-editorial text-xs tracking-wide uppercase text-muted-foreground">
            Confirm Password
          </Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <Button type="submit" className="w-full font-editorial" disabled={pending}>
          {pending ? "Resetting..." : "Reset password"}
        </Button>
        <p className="text-center text-xs font-editorial text-muted-foreground pt-2">
          <Link href="/login" className="text-primary italic hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
