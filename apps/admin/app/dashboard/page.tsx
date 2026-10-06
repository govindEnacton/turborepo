"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { Navbar, RouteButton } from "@repo/components";
import { Button } from "@repo/ui/components/ui/button";

import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  email: string;
  role: string;
  created_at?: string;
}

interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  profiles: { email: string } | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "authed" | "guest" | "denied"
  >("loading");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

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
      setTasksLoading(true);
      try {
        const allTasks: Task[] = [];
        // The admin SELECT policy allows every user's tasks and profile email.
        for (let offset = 0; ; offset += 1000) {
          const { data: rows, error } = await supabase
            .from("tasks")
            .select(
              "id, user_id, title, description, status, created_at, profiles(email)",
            )
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + 999)
            .returns<Task[]>();
          if (error) throw new Error(error.message);
          allTasks.push(...(rows ?? []));
          if (!rows || rows.length < 1000) break;
        }
        setTasks(allTasks);
      } catch (error) {
        setTasksError(
          error instanceof Error
            ? error.message
            : "Could not load tasks. Please refresh and try again.",
        );
      } finally {
        setTasksLoading(false);
      }
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

  return (
    <main className="min-h-svh bg-muted/30 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Navbar className="mb-8 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 shadow-sm bg-gray-800">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admin workspace</p>
            <p className="mt-1 break-all text-sm font-medium">{profile?.email ?? user.email}</p>
          </div>
          <Button variant="destructive" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </Navbar>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">All Tasks</h1>
          <p className="mt-2 text-muted-foreground">An overview of tasks created by every user.</p>
        </header>
        <section aria-labelledby="all-tasks" className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b px-6 py-5">
            <h2 id="all-tasks" className="text-lg font-semibold">Task directory</h2>
            {!tasksLoading && !tasksError ? <span className="rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">{tasks.length} total</span> : null}
          </div>
          {tasksLoading ? (
            <p role="status" className="p-8 text-sm text-muted-foreground">Loading tasks...</p>
          ) : tasksError ? (
            <p role="alert" className="p-8 text-sm text-destructive">{tasksError}</p>
          ) : tasks.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <h3 className="font-semibold">No tasks yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Tasks will appear here when users create them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">All users&apos; tasks, newest first</caption>
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-medium">Task</th>
                    <th scope="col" className="px-6 py-4 font-medium">Created by</th>
                    <th scope="col" className="px-6 py-4 font-medium">Status</th>
                    <th scope="col" className="px-6 py-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-t align-top transition-colors hover:bg-muted/30">
                      <td className="min-w-60 max-w-md px-6 py-5">
                        <p className="break-words font-semibold">{task.title}</p>
                        {task.description ? <p className="mt-2 break-words whitespace-pre-wrap leading-relaxed text-muted-foreground">{task.description}</p> : null}
                      </td>
                      <td className="max-w-64 break-all px-6 py-5 text-muted-foreground">{task.profiles?.email ?? task.user_id}</td>
                      <td className="px-6 py-5">
                        <span className="inline-block whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">{task.status.replaceAll("_", " ")}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-5 text-muted-foreground">{new Date(task.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
