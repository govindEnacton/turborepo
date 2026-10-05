"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { GuestOnly, LoginForm } from "@repo/components";

import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUser = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if ((profileRow as { role?: string } | null)?.role !== "user") {
        await supabase.auth.signOut();
        setError("Not authorized: user account required");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuestOnly redirectTo="/dashboard" getUser={getUser}>
      <div className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <LoginForm
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </GuestOnly>
  );
}
