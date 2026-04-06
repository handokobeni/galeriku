export type UserRole = "owner" | "member";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  image: string | null;
  role: UserRole;
}
