import { createFileRoute, redirect } from "@tanstack/react-router";

/** Old /assistant links now reach the dedicated Sahiti AI tab. */
export const Route = createFileRoute("/_authenticated/assistant")({
  beforeLoad: () => {
    throw redirect({ to: "/ai" });
  },
});
