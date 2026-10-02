"use client";

import { Button } from "@repo/ui/components/ui/button";
import { toast } from "@repo/ui/components/ui/toast";

export default function Home() {
  const showtodo = () => {
    const id = toast.add({
      title: "Hello",
      description:
        "this toast message is added to check weather that works or not",
      actionProps: {
        children: "check",
        onClick: () => {
          toast.update(id, { title: "changed " });
        },
      },
    });
    setTimeout(() => toast.close(id), 2000);
  };
  return (
    <>
      <h1 className="text-3xl font-bold"> this is WEB page </h1>
      <p>go to the localhost:3001 for teh admin page </p>
      <div className="mt-4">
        <Button variant="destructive" size="xs" onClick={showtodo}>
          See TOAST
        </Button>
      </div>
    </>
  );
}
