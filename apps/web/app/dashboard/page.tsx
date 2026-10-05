"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RouteButton } from "@repo/components";
import { Button } from "@repo/ui/components/ui/button";

import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "authed" | "guest" | "denied"
  >("loading");
  const [loggingOut, setLoggingOut] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("guest");
        return;
      }
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if ((profileRow as { role?: string } | null)?.role !== "user") {
        await supabase.auth.signOut();
        setStatus("denied");
        return;
      }
      setStatus("authed");
    }
    void load();
  }, []);

  const handleLogout = async () => {
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
  };

  const createTask = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("You must be logged in");
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      title,
      description,
      status: "todo",
    });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setTitle("");
    setDescription("");

    alert("Task created!");
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-sm text-muted-foreground">
            You must be logged in to view your tasks.
          </p>
          <RouteButton navigate="/login" variant="default">
            Go to login
          </RouteButton>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold">Not authorized</h1>
          <p className="text-sm text-muted-foreground">
            This area needs a user account. You have been signed out.
          </p>
          <RouteButton navigate="/login" variant="default">
            Go to login
          </RouteButton>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">My Tasks</h1>

      <div className="mt-6 flex max-w-md flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          className="rounded border p-2"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Task description"
          className="rounded border p-2"
        />

        <div className="flex gap-2">
          <Button onClick={createTask} variant="default">
            Create Task
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </main>
  );
}
