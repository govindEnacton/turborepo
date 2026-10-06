"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RouteButton } from "@repo/components";
import { Button } from "@repo/ui/components/ui/button";

import { createClient } from "@/lib/supabase/client";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState<
    "loading" | "authed" | "guest" | "denied"
  >("loading");
  const [loggingOut, setLoggingOut] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

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
      setTasksLoading(true);
      // RLS limits rows to the logged-in user's own tasks.
      const { data: taskRows, error: tasksError } = await supabase
        .from("tasks")
        .select("id, title, description, status, created_at")
        .order("created_at", { ascending: false });
      if (!tasksError) {
        setTasks((taskRows as Task[] | null) ?? []);
      }
      setTasksLoading(false);
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

    const { data: newRows, error } = await supabase
      .from("tasks")
      .insert({
        user_id: user.id,
        title,
        description,
        status: "todo",
      })
      .select("id, title, description, status, created_at");

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    const newTask = (newRows as Task[] | null)?.[0];
    if (newTask) {
      setTasks((prev) => [newTask, ...prev]);
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

      <div className="mt-10 max-w-md">
        <h2 className="text-xl font-semibold">Your Tasks</h2>
        {tasksLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Loading tasks...
          </p>
        ) : tasks.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No tasks yet. Create your first one above.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{task.title}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {task.status}
                  </span>
                </div>
                {task.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
