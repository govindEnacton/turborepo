"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { RouteButton } from "@repo/components";
import { Button } from "@repo/ui/components/ui/button";

import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "authed" | "guest" | "denied"
  >("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error.message);
        return;
      }
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setStatus("guest");
        return;
      }
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("id, email, role, created_at")
        .eq("id", data.user.id)
        .maybeSingle();
      const typedProfile = (profileRow as Profile | null) ?? null;
      if (typedProfile?.role !== "admin") {
        await supabase.auth.signOut();
        setStatus("denied");
        return;
      }
      setUser(data.user);
      setProfile(typedProfile);
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

  if (status === "denied") {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold">Not authorized</h1>
          <p className="text-sm text-muted-foreground">
            This area needs an admin account. You have been signed out.
          </p>
          <RouteButton navigate="/login" variant="default">
            Go to login
          </RouteButton>
        </div>
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
    {
      label: "Provider",
      value: String(user.app_metadata?.["provider"] ?? "-"),
    },
  ];

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-center text-3xl font-bold">Admin logged in</h1>
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
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}
