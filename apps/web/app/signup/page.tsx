import { RouteButton } from "@repo/components";
export default function Login() {
  return (
    <>
      <div>hello brother this is signup page of web app</div>
      <p>
      Already have an account ?
        <RouteButton navigate="/login" variant="default">
          login 
        </RouteButton>
      </p>
    </>
  );
}
