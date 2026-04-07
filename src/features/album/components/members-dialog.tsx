"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserMinus, Loader2, Search } from "lucide-react";
import { UserAvatar } from "@/shared/components/avatar";
import {
  inviteMemberByIdAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "../actions/manage-members";
import { searchUsersAction } from "@/features/user/actions/search-users";
import type { AlbumMemberInfo, AlbumMemberRole } from "../types";

interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface MembersDialogProps {
  albumId: string;
  members: AlbumMemberInfo[];
  canManage: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MembersDialog({
  albumId,
  members,
  canManage,
  open,
  onOpenChange,
}: MembersDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState<AlbumMemberRole>("viewer");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || selectedUser) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      const found = await searchUsersAction(query);
      // Filter out users who are already members
      const memberIds = new Set(members.map((m) => m.userId));
      setResults(found.filter((u) => !memberIds.has(u.id)));
      setSearching(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query, selectedUser, members]);

  const handleSelectUser = (u: UserSearchResult) => {
    setSelectedUser(u);
    setQuery(u.name);
    setResults([]);
  };

  const handleClearSelection = () => {
    setSelectedUser(null);
    setQuery("");
    setResults([]);
  };

  const handleInvite = async () => {
    if (!selectedUser) return;
    setPending(true);
    setError(null);

    const result = await inviteMemberByIdAction(albumId, selectedUser.id, role);
    if (result.error) {
      setError(result.error);
    } else {
      handleClearSelection();
      setRole("viewer");
    }
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

        {canManage && (
          <div className="space-y-2">
            {/* Search input with autocomplete */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedUser(null);
                    }}
                    className="pl-9"
                  />
                </div>
                {selectedUser && (
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AlbumMemberRole)}
                    className="rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                )}
              </div>

              {/* Search results dropdown */}
              {results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {results.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left transition-colors"
                    >
                      <UserAvatar name={u.name} image={u.image} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searching && query.trim() && !selectedUser && (
                <p className="text-xs text-muted-foreground mt-1">Searching...</p>
              )}
              {!searching && query.trim() && results.length === 0 && !selectedUser && (
                <p className="text-xs text-muted-foreground mt-1">No users found</p>
              )}
            </div>

            {/* Invite button — only shown after selection */}
            {selectedUser && (
              <Button onClick={handleInvite} disabled={pending} className="w-full">
                {pending ? <Loader2 className="size-4 animate-spin" /> : `Invite as ${role}`}
              </Button>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>
        )}

        {/* Member list */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center gap-2 p-2 rounded-lg">
              <UserAvatar name={member.userName} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.userName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.userEmail}
                </p>
              </div>
              {canManage ? (
                <>
                  <select
                    value={member.role}
                    onChange={(e) =>
                      updateMemberRoleAction(
                        albumId,
                        member.userId,
                        e.target.value as AlbumMemberRole
                      )
                    }
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                    aria-label="Member role"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                  </select>
                  <button
                    onClick={() => handleRemove(member.userId)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove member"
                  >
                    <UserMinus className="size-4" />
                  </button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">{member.role}</span>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
