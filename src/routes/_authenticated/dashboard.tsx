import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, MessageSquare, Search, Share2 } from "lucide-react";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PostThreadDialog,
  type FeedComment,
  type FeedPost,
} from "@/components/feed/PostThreadDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>): { tab?: FeedTab } => {
    const tab = search["tab"];
    return tab === "ai" || tab === "sahiti" || tab === "community" ? { tab } : {};
  },
  head: () => ({
    meta: [
      { title: "Live feed | Sahiti" },
      {
        name: "description",
        content:
          "The Sahiti live feed: scheme explainers, community notes and Sahiti AI in one place.",
      },
      { property: "og:title", content: "Sahiti live feed" },
      { property: "og:description", content: "Scheme updates, member notes and Sahiti AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const AssistantEmbedded = lazy(() => import("@/components/feed/AssistantEmbedded"));

const SAHITI_TYPES = new Set(["government", "news", "finance"]);

type FeedTab = "community" | "sahiti" | "ai";

function isSahitiPost(post: FeedPost) {
  return SAHITI_TYPES.has(post.post_type);
}

function matchesSearch(post: FeedPost, needle: string) {
  if (!needle) return true;
  return [post.content, post.category, post.scheme_type, post.region, post.author_name]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

/**
 * The one and only feed. It is the home page after sign-in; Sahiti AI lives
 * here as a tab, so there is a single way into both.
 */
function Dashboard() {
  const { user } = useSession();
  const { t } = useLanguage();
  const { tab: routeTab } = Route.useSearch();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<FeedTab>(routeTab ?? "community");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [openPostId, setOpenPostId] = useState<string | null>(null);

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
        name: profile.data?.display_name ?? "Sahiti member",
      };
    },
  });

  const allPosts = data?.posts ?? [];
  const needle = search.trim().toLowerCase();

  const communityPosts = useMemo(
    () => allPosts.filter((post) => post.post_type === "user" && matchesSearch(post, needle)),
    [allPosts, needle],
  );
  const sahitiPosts = useMemo(
    () => allPosts.filter((post) => isSahitiPost(post) && matchesSearch(post, needle)),
    [allPosts, needle],
  );

  const openPost = allPosts.find((post) => post.id === openPostId) ?? null;
  const commentsFor = (postId: string) =>
    (data?.comments ?? []).filter((comment) => comment.post_id === postId);

  async function publish() {
    setError("");
    const content = draft.trim();
    if (content.length < 1 || content.length > 500) {
      setError(t("postedError"));
      return;
    }
    const initials = (data?.name ?? "SA")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const { error: insertError } = await supabase.from("posts").insert({
      author_id: user!.id,
      author_name: data?.name ?? "Sahiti member",
      author_initials: initials || "SA",
      post_type: "user",
      content,
      category: "General",
      region: "Lohegaon",
      scheme_type: "Community",
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDraft("");
    await queryClient.invalidateQueries({ queryKey: ["feed", user?.id] });
    toast.success(t("postedToast"));
  }

  async function toggleSave(postId: string) {
    if (data?.saved.has(postId)) {
      await supabase.from("saved_posts").delete().eq("user_id", user!.id).eq("post_id", postId);
    } else {
      await supabase.from("saved_posts").insert({ user_id: user!.id, post_id: postId });
    }
    await queryClient.invalidateQueries({ queryKey: ["feed", user?.id] });
  }

  async function addComment(postId: string, content: string) {
    await supabase.from("comments").insert({
      post_id: postId,
      author_id: user!.id,
      author_name: data?.name ?? "Sahiti member",
      content: content.slice(0, 500),
    });
    await queryClient.invalidateQueries({ queryKey: ["feed", user?.id] });
  }

  async function share(content: string) {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  }

  const searching = needle.length > 0;
  const emptyCopy = searching
    ? t("emptySearch")
    : tab === "sahiti"
      ? t("emptySahiti")
      : t("emptyCommunity");

  return (
    <>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
        {t("namaste")}, {data?.name ?? "…"}
      </h1>

      <div className="my-8 border-t border-saffron/35" aria-hidden="true" />

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <Tabs value={tab} onValueChange={(value) => setTab(value as FeedTab)}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start">
            <TabsTrigger value="community">{t("tabCommunity")}</TabsTrigger>
            <TabsTrigger value="sahiti">{t("tabSchemes")}</TabsTrigger>
            <TabsTrigger value="ai">{t("tabAi")}</TabsTrigger>
          </TabsList>

          <TabsContent value="community" className="mt-6 space-y-6">
            <div className="sahiti-panel p-5">
              <Label htmlFor="post">{t("writePost")}</Label>
              <Textarea
                id="post"
                className="mt-2 bg-muted"
                rows={3}
                maxLength={500}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t("postPlaceholder")}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {draft.length} {t("chars")}
                </p>
                <Button onClick={() => void publish()}>{t("post")}</Button>
              </div>
              {error && (
                <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>

            <PostList
              posts={communityPosts}
              emptyCopy={tab === "community" ? emptyCopy : ""}
              commentsFor={commentsFor}
              isSaved={(id) => data?.saved.has(id) ?? false}
              onOpen={setOpenPostId}
              onToggleSave={(id) => void toggleSave(id)}
              onShare={(content) => void share(content)}
            />
          </TabsContent>

          <TabsContent value="sahiti" className="mt-6 space-y-6">
            <PostList
              posts={sahitiPosts}
              emptyCopy={tab === "sahiti" ? emptyCopy : ""}
              commentsFor={commentsFor}
              isSaved={(id) => data?.saved.has(id) ?? false}
              onOpen={setOpenPostId}
              onToggleSave={(id) => void toggleSave(id)}
              onShare={(content) => void share(content)}
            />
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <Suspense
              fallback={
                <div className="sahiti-panel flex h-[60dvh] items-center justify-center text-sm text-muted-foreground">
                  {t("aiLoading")}
                </div>
              }
            >
              <AssistantEmbedded />
            </Suspense>
          </TabsContent>
        </Tabs>

        <aside className="space-y-4">
          <div className="sahiti-panel p-5">
            <Label htmlFor="feed-search">{t("searchSection")}</Label>
            <div className="mt-2 flex items-center gap-2">
              <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <Input
                id="feed-search"
                className="bg-muted"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("searchPlaceholder")}
              />
            </div>
          </div>
          <div className="sahiti-panel bg-secondary p-4 text-xs leading-6 text-muted-foreground">
            {t("feedHint")}
          </div>
        </aside>
      </div>

      <PostThreadDialog
        post={openPost}
        comments={openPost ? commentsFor(openPost.id) : []}
        isSaved={openPost ? (data?.saved.has(openPost.id) ?? false) : false}
        onClose={() => setOpenPostId(null)}
        onToggleSave={(postId) => void toggleSave(postId)}
        onAddComment={addComment}
        onShare={(content) => void share(content)}
      />
    </>
  );
}

function PostList({
  posts,
  emptyCopy,
  commentsFor,
  isSaved,
  onOpen,
  onToggleSave,
  onShare,
}: {
  posts: FeedPost[];
  emptyCopy: string;
  commentsFor: (postId: string) => FeedComment[];
  isSaved: (postId: string) => boolean;
  onOpen: (postId: string) => void;
  onToggleSave: (postId: string) => void;
  onShare: (content: string) => void;
}) {
  const { t } = useLanguage();

  function sourceLabel(post: FeedPost) {
    if (post.post_type === "government") return t("sourceSchemeDesk");
    if (post.post_type === "news") return t("sourceResearch");
    if (post.post_type === "finance") return t("sourceIndustry");
    return t("sourceMember");
  }

  return (
    <>
      {posts.length === 0 && emptyCopy ? (
        <p className="text-sm text-muted-foreground">{emptyCopy}</p>
      ) : null}

      {posts.map((post) => {
        const comments = commentsFor(post.id);
        const saved = isSaved(post.id);
        const official = isSahitiPost(post);

        return (
          <article key={post.id} className="sahiti-panel sahiti-panel-hover p-5">
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

            {/*
              The whole body is the click target so a thread can be opened by
              tapping anywhere in the text, while the actions below stay
              separate buttons rather than nesting them inside a link.
            */}
            <button
              type="button"
              onClick={() => onOpen(post.id)}
              className="mt-4 block w-full text-left"
            >
              <p className="text-sm leading-6 line-clamp-3">{post.content}</p>
              <span className="mt-2 inline-flex text-xs font-medium text-primary">
                {t("openThread")}
              </span>
            </button>

            <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
              <Button variant="ghost" size="sm" onClick={() => onToggleSave(post.id)}>
                <Bookmark className={saved ? "size-4 fill-current" : "size-4"} />
                {saved ? t("saved") : t("save")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpen(post.id)}
                aria-label={`${comments.length} ${t("commentsLabel")}`}
              >
                <MessageSquare className="size-4" />
                {comments.length}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onShare(post.content)}>
                <Share2 className="size-4" />
                {t("share")}
              </Button>
            </div>
          </article>
        );
      })}
    </>
  );
}
