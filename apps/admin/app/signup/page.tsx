import { SignupForm } from "@repo/components";

export default function Signup() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <h1 className="text-center text-4xl font-bold">Admin Signup Page</h1>
        <SignupForm />
      </div>
    </div>
  );
}

