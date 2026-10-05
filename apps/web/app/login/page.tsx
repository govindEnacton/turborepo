import { RouteButton } from "@repo/components";

export default function Login() {
  return (
    <>
      <div>hello brother this is login page of web app</div>
      <p>
        Don't have an account
        <RouteButton navigate="/signup" variant="ghost" >Sign up</RouteButton>
      </p>
    </>
  );
}
