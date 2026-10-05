import { LoginForm } from "@repo/components";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-1 items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <h1 className="text-center text-4xl font-bold">Admin Login Page</h1>
        <LoginForm />
      </div>
    </div>
  );
}
