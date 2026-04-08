"use client";

import { useState } from "react";
import { signIn } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error: signInError } = await signIn.email({
      email,
      password,
    });

    if (signInError) {
      setError("Invalid email or password");
      setPending(false);
      return;
    }

    router.push(callbackUrl || "/albums");
  };

  return (
    <div>
      <p className="label-eyebrow mb-3">✦ Sign in</p>
      <h1 className="font-display text-4xl lg:text-5xl tracking-tight leading-[1] text-foreground">
        Welcome <em className="italic font-light text-primary">back</em>
      </h1>
      <p className="mt-3 font-editorial text-sm text-muted-foreground italic">
        Sign in to continue your work
      </p>
      <div className="divider-gold my-7" />

      {resetSuccess && (
        <div className="border border-primary/30 bg-primary/5 text-foreground text-sm rounded-md p-3 mb-5 font-editorial">
          Password reset successfully. Sign in with your new password.
        </div>
      )}

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
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-editorial text-xs tracking-wide uppercase text-muted-foreground">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-editorial italic text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required />
        </div>

        <Button type="submit" className="w-full font-editorial" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>

        <p className="text-center text-xs font-editorial text-muted-foreground pt-2">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary italic hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
