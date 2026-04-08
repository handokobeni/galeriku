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
          <button className="group block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md" />
        }
      >
        <article>
          <div className="relative aspect-[4/5] border border-dashed border-border/70 group-hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 text-muted-foreground group-hover:text-primary bg-secondary/30">
            <div className="size-12 rounded-full border border-current flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
              <Plus className="size-5" strokeWidth={1.5} />
            </div>
            <span className="font-editorial text-[11px] tracking-[0.18em] uppercase">
              New album
            </span>
          </div>
          <div className="pt-4 pb-2 px-1">
            <h3 className="font-display text-xl leading-tight tracking-tight text-muted-foreground/70 group-hover:text-foreground italic transition-colors">
              Create a new collection
            </h3>
            <p className="mt-2 text-[11px] font-editorial text-muted-foreground/60">
              Start a fresh album for your next session
            </p>
          </div>
        </article>
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
