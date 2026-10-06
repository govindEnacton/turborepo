import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

export function Navbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <nav className={cn("bg-background text-foreground", className)}>
      {children}
    </nav>
  );
}
