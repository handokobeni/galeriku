"use client";

import { UserAvatar } from "@/shared/components/avatar";
import { Trash2 } from "lucide-react";
import { deleteUserAction } from "../actions/user-admin-actions";
import type { UserStat } from "../types";

interface UserListProps {
  users: UserStat[];
  currentUserId: string;
}

export function UserList({ users, currentUserId }: UserListProps) {
  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    await deleteUserAction(userId);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 font-medium">User</th>
            <th className="text-left px-4 py-3 font-medium">Role</th>
            <th className="text-right px-4 py-3 font-medium">Albums</th>
            <th className="text-right px-4 py-3 font-medium">Uploads</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar name={u.name} size="sm" />
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === "owner"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {u.role}
                </span>
              </td>
              <td className="px-4 py-3 text-right">{u.albumCount}</td>
              <td className="px-4 py-3 text-right">{u.uploadCount}</td>
              <td className="px-4 py-3 text-right">
                {u.role !== "owner" && u.id !== currentUserId && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete user"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
