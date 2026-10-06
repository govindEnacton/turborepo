import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

async function main() {
  process.loadEnvFile(fileURLToPath(new URL(".env.local", import.meta.url)));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL or publishable key in .env.local");
  }

  const prompt = createInterface({ input: stdin, output: stdout });
  let email: string;
  let password: string;
  let otherUserId: string;
  try {
    email = (await prompt.question("Login email: ")).trim();
    password = await prompt.question("Login password (visible as you type): ");
    otherUserId = (
      await prompt.question("Different existing user's profiles.id: ")
    ).trim();
  } finally {
    prompt.close();
  }

  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(otherUserId)) {
    throw new Error("Enter another existing user's UUID from the profiles table");
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  let signedIn = false;
  try {
    const { data, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(`Login failed: ${signInError.message}`);
    signedIn = true;

    if (otherUserId.toLowerCase() === data.user.id.toLowerCase()) {
      throw new Error("The target ID belongs to the logged-in user. Use a different user's ID");
    }

    console.log("Logged-in user ID:", data.user.id);
    console.log("Attempting to create a task owned by:", otherUserId);

    const { error } = await supabase.from("tasks").insert({
      user_id: otherUserId,
      title: "rls probe",
      status: "todo",
    });

    if (!error) {
      console.error("FAILED: Cross-user insert succeeded. Review tasks INSERT policies.");
      console.error("A task titled 'rls probe' was created under the target user ID.");
      process.exitCode = 1;
    } else if (
      error.code === "42501" &&
      error.message.toLowerCase().includes("row-level security")
    ) {
      console.log("PASSED: RLS blocked the cross-user insert.");
      console.log(error.message);
    } else {
      console.error("INCONCLUSIVE:", error.code, error.message);
      console.error("A different error blocked the insert; this does not verify ownership enforcement.");
      process.exitCode = 1;
    }
  } finally {
    if (signedIn) {
      // Only revoke this test session, leaving existing browser sessions alone.
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) console.error("Test-session logout failed:", error.message);
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
