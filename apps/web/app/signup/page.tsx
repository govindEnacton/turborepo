"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { GuestOnly, SignupForm } from "@repo/components";

import { createClient } from "@/lib/supabase/client";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUser = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    return data.user;
  }, []);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "");
    const role = String(formData.get("role") ?? "user");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm-password") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data.user) {
        // Mirror the auth user into the profiles table. This must succeed,
        // otherwise every later login fails the role check.
        const { error: profileError } = await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          role,
        });
        if (profileError) {
          setError(`Account created but profile save failed: ${profileError.message}`);
          return;
        }
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GuestOnly redirectTo="/dashboard" getUser={getUser}>
      <div className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <SignupForm
            role="user"
            onSubmit={handleSignup}
            loading={loading}
            error={error}
          />
        </div>
      </div>
    </GuestOnly>
  );
}
