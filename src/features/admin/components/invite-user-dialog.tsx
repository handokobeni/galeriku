"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus } from "lucide-react";
import { inviteUserAction, type InviteUserState } from "../actions/user-admin-actions";

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<InviteUserState, FormData>(
    async (prev, formData) => {
      const result = await inviteUserAction(prev, formData);
      if (!result.error && !result.fieldErrors) setOpen(false);
      return result;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <UserPlus className="size-4 mr-2" />
            Invite User
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" name="name" required />
            {state.fieldErrors?.name && <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
            {state.fieldErrors?.username && <p className="text-destructive text-xs">{state.fieldErrors.username[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            {state.fieldErrors?.email && <p className="text-destructive text-xs">{state.fieldErrors.email[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Temporary Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
            {state.fieldErrors?.password && <p className="text-destructive text-xs">{state.fieldErrors.password[0]}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create User"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
