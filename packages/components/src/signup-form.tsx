import * as React from "react";

import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { cn } from "@repo/ui/lib/utils";

interface SignupFormProps extends React.ComponentProps<"div"> {
  role?: "user" | "admin";
}

export function SignupForm({ role = "user", className, ...props }: SignupFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  We&apos;ll use this to contact you. We will not share your
                  email with anyone else.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  name="role"
                  value={role}
                  readOnly
                  className="capitalize"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
                <p className="text-sm text-muted-foreground">
                  Must be at least 8 characters long.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" required />
                <p className="text-sm text-muted-foreground">
                  Please confirm your password.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit">Create Account</Button>
                <Button variant="outline" type="button">
                  Sign up with Google
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account? <a href="/login">Sign in</a>
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
