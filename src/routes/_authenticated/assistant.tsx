import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Sahiti AI lives inside the Live feed as a tab, so this path only forwards
 * old links to the feed with the AI tab preselected.
 */
export const Route = createFileRoute("/_authenticated/assistant")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard", search: { tab: "ai" } });
  },
});
