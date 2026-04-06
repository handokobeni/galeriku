"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { createAlbumAction, type CreateAlbumState } from "../actions/create-album";

export function CreateAlbumDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<CreateAlbumState, FormData>(
    async (prev, formData) => {
      const result = await createAlbumAction(prev, formData);
      if (!result.error && !result.fieldErrors) {
        setOpen(false);
      }
      return result;
    },
    {}
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="aspect-[4/3] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors" />
        }
      >
        <Plus className="size-6" />
        <span className="text-xs">New Album</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Album</DialogTitle>
          <DialogDescription>Create a new album to organize your memories.</DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          {state.error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Album Name</Label>
            <Input id="name" name="name" placeholder="e.g. Liburan Bali" required />
            {state.fieldErrors?.name && (
              <p className="text-destructive text-xs">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" placeholder="What's this album about?" rows={3} />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating..." : "Create Album"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
