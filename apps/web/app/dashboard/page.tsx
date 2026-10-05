"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { RouteButton } from "@repo/components";

import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at?: string;
}

export default function Dashboard() {
  const [status, setStatus] = useState<"loading" | "authed" | "guest">(
    "loading",
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setStatus("guest");
        return;
      }
      setUser(data.user);
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile((profileRow as Profile | null) ?? null);
      setStatus("authed");
    }
    void load();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "guest" || !user) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold">Not logged in</h1>
          <p className="text-sm text-muted-foreground">
            Please login or signup first.
          </p>
          <RouteButton navigate="/login" variant="default">
            Go to login
          </RouteButton>
        </div>
      </div>
    );
  }

  const credentials = [
    { label: "ID", value: user.id },
    { label: "Email", value: user.email ?? "-" },
    { label: "Role", value: profile?.role ?? "-" },
    { label: "Created at", value: user.created_at },
    { label: "Last sign in", value: user.last_sign_in_at ?? "-" },
    { label: "Provider", value: user.app_metadata?.["provider"] ?? "-" },
  ];

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-center text-3xl font-bold">User logged in</h1>
        <dl className="flex flex-col gap-3 rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          {credentials.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="break-all text-sm font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
        <pre className="overflow-auto rounded-xl border bg-muted p-4 text-xs">
          {JSON.stringify({ user, profile }, null, 2)}
        </pre>
      </div>
    </div>
  );
}
