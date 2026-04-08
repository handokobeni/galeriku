"use client";

import { useState } from "react";
import { checkEmailAndRequestReset } from "@/features/auth/actions/forgot-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const result = await checkEmailAndRequestReset(email);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    setSuccess(true);
    setPending(false);
  };

  if (success) {
    return (
      <div>
        <p className="label-eyebrow mb-3">✦ Email sent</p>
        <h1 className="font-display text-4xl tracking-tight leading-[1] text-foreground">
          Check your <em className="italic font-light text-primary">inbox</em>
        </h1>
        <p className="mt-3 font-editorial text-sm text-muted-foreground italic">
          We&apos;ve sent password reset instructions to {email}.
        </p>
        <div className="divider-gold my-7" />
        <Link
          href="/login"
          className="block text-center text-xs font-editorial italic text-primary hover:underline"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="label-eyebrow mb-3">✦ Forgot password</p>
      <h1 className="font-display text-4xl tracking-tight leading-[1] text-foreground">
        Reset your <em className="italic font-light text-primary">password</em>
      </h1>
      <p className="mt-3 font-editorial text-sm text-muted-foreground italic">
        Enter your email and we&apos;ll send you a reset link
      </p>
      <div className="divider-gold my-7" />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="border border-destructive/40 bg-destructive/5 text-destructive text-sm rounded-md p-3 font-editorial">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="font-editorial text-xs tracking-wide uppercase text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </div>
        <Button type="submit" className="w-full font-editorial" disabled={pending}>
          {pending ? "Sending..." : "Send reset link"}
        </Button>
        <p className="text-center text-xs font-editorial text-muted-foreground pt-2">
          Remember your password?{" "}
          <Link href="/login" className="text-primary italic hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
