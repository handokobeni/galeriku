import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
