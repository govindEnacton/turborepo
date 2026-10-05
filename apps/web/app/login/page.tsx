import { LoginForm, RouteButton } from "@repo/components";

export default function Login() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-sm flex-col gap-4">
        <LoginForm />
      </div>
    </div>
  );
}
