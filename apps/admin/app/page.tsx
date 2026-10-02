import { Button } from "@repo/ui/components/ui/button";

export default function Home() {
  return (
    <>
      <h1 className="text-3xl font-semibold text-green-500"> this is ADMIN page </h1>
      <p>go to the localhost:3000 for teh web page </p>
      <div className="mt-4">
        <Button variant='secondary'>
          <a href="http://localhost:3000">Open web</a>
        </Button>
      </div>
    </>
  );
}
