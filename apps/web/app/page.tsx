import { Button } from "@repo/ui/components/ui/button";

export default function Home() {
  return (
    <>
      <h1 className="text-3xl font-bold"> this is WEB page </h1>
      <p>go to the localhost:3001 for teh admin page </p>
      <div className="mt-4">
        <Button asChild>
          <a href="http://localhost:3001">Open admin</a>
        </Button>
      </div>
    </>
  );
}
