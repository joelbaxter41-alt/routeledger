"use client";
import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";
export function Submit({
  children = "Save changes",
}: {
  children?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button disabled={pending} type="submit">
      {pending ? "Saving…" : children}
    </Button>
  );
}
