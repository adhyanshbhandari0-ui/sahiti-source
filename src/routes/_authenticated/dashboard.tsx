import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, MessageSquare, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PostThreadDialog,
  type FeedComment,
  type FeedPost,
} from "@/components/feed/PostThreadDialog";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/format";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | Sahiti" },
      {
        name: "description",
        content: "Your Sahiti feed: scheme explainers and notes from other entrepreneurs.",
      },
      { property: "og:title", content: "Sahiti dashboard" },
      { property: "og:description", content: "The business feed, right after you sign in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const SAHITI_TYPES = new Set(["government", "news", "finance"]);

function sourceLabel(post: FeedPost) {
  if (post.post_type === "government") return "Scheme desk";
  if (post.post_type === "news") return "Sahiti research";
  if (post.post_type === "finance") return "Industry desk";
  return "Member";
}

function Dashboard() {
  const { user } = useSession();

  const { data } = useQuery({
    queryKey: ["feed", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const [posts, comments, saved, profile] = await Promise.all([
        supabase.from("posts").select("*").order("created_at", { ascending: false }),
        supabase.from("comments").select("*").order("created_at", { ascending: true }),
        supabase.from("saved_posts").select("post_id").eq("user_id", user!.id),
        supabase.from("profiles").select("display_name").eq("id", user!.id).maybeSingle(),
      ]);
      return {
        posts: (posts.data ?? []) as FeedPost[],
        comments: (comments.data ?? []) as FeedComment[],
        saved: new Set((saved.data ?? []).map((row) => row.post_id)),
        name: profile.data?.display_name ?? "entrepreneur",
      };
    },
  });

  const posts = useMemo(
    () =>
      (data?.posts ?? []).filter(
        (post) => post.post_type === "user" || SAHITI_TYPES.has(post.post_type),
      ),
    [data?.posts],
  );

  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const commentsFor = (postId: string) =>
    (data?.comments ?? []).filter((comment) => comment.post_id === postId);

  async function toggleSave(postId: string) {
    if (data?.saved.has(postId)) {
      await supabase.from("saved_posts").delete().eq("user_id", user!.id).eq("post_id", postId);
    } else {
      await supabase.from("saved_posts").insert({ user_id: user!.id, post_id: postId });
    }
  }

  async function share(content: string) {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Clipboard can be blocked; the post is still on screen, so do nothing.
    }
  }

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
        Namaste, {data?.name ?? "entrepreneur"}
      </h1>

      <div className="my-8 border-t border-saffron/35" aria-hidden="true" />

      <section aria-label="Business feed" className="space-y-5">
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            The feed is quiet right now. Notes from Sahiti and other members will appear here.
          </p>
        )}

        {posts.map((post) => {
          const comments = commentsFor(post.id);
          const saved = data?.saved.has(post.id) ?? false;
          const official = SAHITI_TYPES.has(post.post_type);

          return (
            <article key={post.id} className="sahiti-panel p-5">
              <header className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
                >
                  {post.author_initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{post.author_name}</p>
                    <Badge variant={official ? "default" : "secondary"}>{sourceLabel(post)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {post.category} · {timeAgo(post.created_at)}
                  </p>
                </div>
              </header>

              <p className="mt-4 text-sm leading-6">{post.content}</p>

              <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                <Button variant="ghost" size="sm" onClick={() => void toggleSave(post.id)}>
                  <Bookmark className={saved ? "size-4 fill-current" : "size-4"} />
                  {saved ? "Saved" : "Save"}
                </Button>{" "}
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Open thread with ${comments.length} comments`}
                  onClick={() => setOpenPostId(post.id)}
                >
                  <MessageSquare className="size-4" />
                  {comments.length}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => void share(post.content)}>
                  <Share2 className="size-4" />
                  Share
                </Button>
              </div>
            </article>
          );
        })}
      </section>

      <PostThreadDialog
        post={openPostId ? (posts.find((post) => post.id === openPostId) ?? null) : null}
        comments={openPostId ? commentsFor(openPostId) : []}
        isSaved={openPostId ? (data?.saved.has(openPostId) ?? false) : false}
        onClose={() => setOpenPostId(null)}
        onToggleSave={(postId) => void toggleSave(postId)}
        onAddComment={async () => {}}
        onShare={(content) => void share(content)}
      />
    </>
  );
}
