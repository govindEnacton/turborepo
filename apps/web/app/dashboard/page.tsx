"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { Navbar, RouteButton } from "@repo/components";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";

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
  const [userEmail, setUserEmail] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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
      setUserEmail(user.email ?? "Email unavailable");
      setStatus("authed");
      setTasksLoading(true);
      // RLS limits rows to the logged-in user's own tasks.
      try {
        const allTasks: Task[] = [];
        // Supabase limits each response; fetch every page of visible tasks.
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase
            .from("tasks")
            .select("id, title, description, status, created_at")
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(offset, offset + 999)
            .returns<Task[]>();
          if (error) throw new Error(error.message);
          allTasks.push(...(data ?? []));
          if (!data || data.length < 1000) break;
        }
        setTasks(allTasks);
      } catch (error) {
        setTasksError(
          error instanceof Error
            ? error.message
            : "Could not load your tasks. Please refresh and try again.",
        );
      } finally {
        setTasksLoading(false);
      }
    }
    void load();
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        setNotice(`Logout failed: ${error.message}`);
        return;
      }
      setTasks([]);
      setStatus("guest");
      router.replace("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreating) return;
    setFormError(null);
    setNotice(null);
    const taskName = title.trim();
    if (!taskName) {
      setFormError("Task name is required. Enter a name, not just spaces.");
      return;
    }
    setIsCreating(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        setTasks([]);
        setStatus("guest");
        return;
      }
      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          title: taskName,
          description: description.trim() || null,
          status: "todo",
        })
        .select("id, title, description, status, created_at")
        .single<Task>();
      if (error) {
        setFormError(error.message);
        return;
      }
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
      setDescription("");
      setNotice("Task created successfully.");
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create the task. Please try again.",
      );
    } finally {
      setIsCreating(false);
    }
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
    <main className="min-h-svh bg-muted/30 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Navbar className="mb-8 flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 shadow-sm bg-gray-800">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your workspace
            </p>
            <p className="mt-1 break-all text-sm font-medium">{userEmail}</p>
          </div>
          <Button
            className="shrink-0"
            variant="destructive"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? "Logging out..." : "Logout"}
          </Button>
        </Navbar>
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My Tasks</h1>
          <p className="mt-2 text-muted-foreground">
            A little structure for everything you need to do.
          </p>
        </header>
        {notice ? (
          <p role="status" className="mb-6 rounded-lg border bg-background p-3 text-sm">
            {notice}
          </p>
        ) : null}
        <div className="grid items-start gap-8 lg:grid-cols-[320px_1fr]">
          <section className="rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
            <h2 className="text-lg font-semibold">Create a task</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Give it a name. Add details if you need them.
            </p>
            <form onSubmit={createTask} className="mt-6 flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="task-name">
                  Task name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="task-name"
                  name="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finish the project proposal"
                  disabled={isCreating}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-description">
                  Description <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="task-description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any useful details..."
                  className="min-h-28 resize-y"
                  disabled={isCreating}
                />
              </div>
              {formError ? (
                <p role="alert" className="text-sm text-destructive">{formError}</p>
              ) : null}
              <Button type="submit" size="lg" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </form>
          </section>

          <section aria-labelledby="your-tasks">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="your-tasks" className="text-xl font-semibold">Your Tasks</h2>
              {!tasksLoading && !tasksError ? (
                <span className="rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground">
                  {tasks.length} total
                </span>
              ) : null}
            </div>
            {tasksLoading ? (
              <p role="status" className="rounded-2xl border bg-card p-8 text-sm text-muted-foreground">
                Loading tasks...
              </p>
            ) : tasksError ? (
              <p role="alert" className="rounded-2xl border bg-card p-6 text-sm text-destructive">
                {tasksError}
              </p>
            ) : tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
                <h3 className="font-semibold">A fresh start</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No tasks yet. Create your first task to get started.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex min-w-0 flex-col rounded-2xl border bg-card p-5 text-card-foreground shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words font-semibold">{task.title}</h3>
                      <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium capitalize text-secondary-foreground">
                        {task.status.replaceAll("_", " ")}
                      </span>
                    </div>
                    {task.description ? (
                      <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {task.description}
                      </p>
                    ) : null}
                    {task.created_at ? (
                      <p className="mt-auto pt-5 text-xs text-muted-foreground">
                        Created {new Date(task.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
