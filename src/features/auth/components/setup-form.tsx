"use client";

import { useActionState } from "react";
import { setupOwner, type SetupState } from "@/features/auth/actions/setup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupForm() {
  const [state, action, pending] = useActionState<SetupState, FormData>(setupOwner, {});

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome to Galeriku</CardTitle>
        <CardDescription>Create your owner account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" placeholder="Your Name" required />
            {state.fieldErrors?.name && (
              <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="username" required />
            {state.fieldErrors?.username && (
              <p className="text-destructive text-xs">{state.fieldErrors.username[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state.fieldErrors?.email && (
              <p className="text-destructive text-xs">{state.fieldErrors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="Min. 8 characters" required />
            {state.fieldErrors?.password && (
              <p className="text-destructive text-xs">{state.fieldErrors.password[0]}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account..." : "Create Owner Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
