"use client";

import { useState } from "react";
import { signUp } from "@/features/auth/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setPending(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // Client-side validation
    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = "Name must be at least 2 characters";
    if (username.length < 3)
      errors.username = "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username))
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    if (password.length < 8)
      errors.password = "Password must be at least 8 characters";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setPending(false);
      return;
    }

    const { error: signUpError } = await signUp.email({
      name,
      email,
      password,
      username,
    });

    if (signUpError) {
      setError(
        "Failed to create account. Email or username may already be in use."
      );
      setPending(false);
      return;
    }

    router.push("/albums");
  };

  return (
    <div>
      <p className="label-eyebrow mb-3">✦ Register</p>
      <h1 className="font-display text-4xl lg:text-5xl tracking-tight leading-[1] text-foreground">
        Join the <em className="italic font-light text-primary">studio</em>
      </h1>
      <p className="mt-3 font-editorial text-sm text-muted-foreground italic">
        Create your photographer account
      </p>
      <div className="divider-gold my-7" />

      <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="border border-destructive/40 bg-destructive/5 text-destructive text-sm rounded-md p-3 font-editorial">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" placeholder="Your Name" required />
            {fieldErrors.name && (
              <p className="text-destructive text-xs">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="username"
              required
            />
            {fieldErrors.username && (
              <p className="text-destructive text-xs">
                {fieldErrors.username}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Min. 8 characters"
              required
            />
            {fieldErrors.password && (
              <p className="text-destructive text-xs">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create Account"}
          </Button>

          <p className="text-center text-xs font-editorial text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-primary italic hover:underline">
              Sign in
            </Link>
          </p>
        </form>
    </div>
  );
}
