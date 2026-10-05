"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@repo/ui/components/ui/button";

interface RouteButtonProps extends Omit<ComponentProps<typeof Button>, "onClick"> {
  navigate: string;
  children: ReactNode;
}

export function RouteButton({
  navigate,
  children,
  variant = "default",
  size = "default",
  ...props
}: RouteButtonProps) {
  const router = useRouter();

  return (
    <Button variant={variant} size={size} {...props} onClick={() => router.push(navigate)}>
      {children}
    </Button>
  );
}
