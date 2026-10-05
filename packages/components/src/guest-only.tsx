"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

interface GuestOnlyProps {
  children: React.ReactNode;
  redirectTo?: string;
  getUser: () => Promise<unknown>;
}

export function GuestOnly({
  children,
  redirectTo = "/dashboard",
  getUser,
}: GuestOnlyProps) {
  const router = useRouter();
  const [isGuest, setIsGuest] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const user = await getUser();
      if (cancelled) return;
      if (user) {
        router.replace(redirectTo);
      } else {
        setIsGuest(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getUser, redirectTo, router]);

  if (!isGuest) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
