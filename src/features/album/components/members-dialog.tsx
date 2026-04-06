"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserMinus, Loader2 } from "lucide-react";
import { UserAvatar } from "@/shared/components/avatar";
import { inviteMemberAction, removeMemberAction } from "../actions/manage-members";
import type { AlbumMemberInfo } from "../types";

interface MembersDialogProps {
  albumId: string;
  members: AlbumMemberInfo[];
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersDialog({ albumId, members, canEdit, open, onOpenChange }: MembersDialogProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setPending(true);
    setError(null);
    const result = await inviteMemberAction(albumId, email.trim());
    if (result.error) setError(result.error);
    else setEmail("");
    setPending(false);
  };

  const handleRemove = async (userId: string) => {
    await removeMemberAction(albumId, userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Members</DialogTitle>
        </DialogHeader>

        {canEdit && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Invite by email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />
              <Button size="sm" onClick={handleInvite} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Invite"}
              </Button>
            </div>
            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )}

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center gap-3 p-2 rounded-lg">
              <UserAvatar name={member.userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.userEmail} · {member.role}
                </p>
              </div>
              {canEdit && (
                <button onClick={() => handleRemove(member.userId)} className="text-muted-foreground hover:text-destructive">
                  <UserMinus className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
