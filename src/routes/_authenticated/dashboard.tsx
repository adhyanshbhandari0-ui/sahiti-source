import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, ImagePlus, MessageSquare, Search, Share2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { PostMedia } from "@/components/feed/PostMedia";
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
import {
  FEED_MEDIA_BUCKET,
  MAX_PHOTO_BYTES,
  MAX_VIDEO_BYTES,
  buildMediaPath,
  isVideoFile,
  resolveMediaUrls,
  type FeedMedia,
} from "@/lib/feedMedia";
import { timeAgo } from "@/lib/format";
import { useLanguage } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_authenticated/dashboard")({
  validateSearch: (search: Record<string, unknown>): { tab?: FeedTab } => {
    const tab = search["tab"];
    return tab === "sahiti" || tab === "community" ? { tab } : {};
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

const SAHITI_TYPES = new Set(["government", "news", "finance"]);

type FeedTab = "community" | "sahiti";

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

/** A selected-but-not-yet-published attachment, previewed from a local blob URL. */
type PendingMedia = FeedMedia & { previewUrl: string };

/**
 * The one and only feed. It is the home page after sign-in; Sahiti AI has its
 * own tab in the main navigation.
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
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  // Blob URLs for the composer preview are revoked on replace, on clear and on
  // unmount, otherwise each selection leaks the whole file for the session.
  const previewUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  function clearPendingMedia() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setPendingMedia(null);
  }

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
      const rows = (posts.data ?? []) as FeedPost[];
      // The media bucket is private, so attachments only become playable once
      // their storage paths have been exchanged for signed URLs.
      const media = await resolveMediaUrls(rows);
      return {
        posts: rows,
        media,
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

  async function attachMedia(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset immediately so picking the same file twice still fires onChange.
    event.target.value = "";
    if (!file || !user?.id) return;

    const video = isVideoFile(file);
    if (!video && !file.type.startsWith("image/")) {
      setError(t("postErrMediaType"));
      return;
    }
    if (video && file.size > MAX_VIDEO_BYTES) {
      setError(t("postErrVideoSize"));
      return;
    }
    if (!video && file.size > MAX_PHOTO_BYTES) {
      setError(t("postErrPhotoSize"));
      return;
    }

    setError("");
    setUploadingMedia(true);
    const path = buildMediaPath(user.id, file);
    const { error: uploadError } = await supabase.storage
      .from(FEED_MEDIA_BUCKET)
      // contentType is omitted rather than set to undefined: the project
      // compiles with exactOptionalPropertyTypes, which rejects an explicit
      // undefined on an optional property.
      .upload(path, file, file.type ? { contentType: file.type } : {});

    if (uploadError) {
      setUploadingMedia(false);
      setError(uploadError.message);
      return;
    }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setPendingMedia({ path, kind: video ? "video" : "image", previewUrl });
    setUploadingMedia(false);
  }

  async function publish() {
    setError("");
    const content = draft.trim();
    if (content.length < 1 || content.length > 500) {
      setError(t("postedError"));
      return;
    }
    if (uploadingMedia) return;
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
      image_url: pendingMedia?.path ?? null,
      category: "General",
      region: "Lohegaon",
      scheme_type: "Community",
    });
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDraft("");
    clearPendingMedia();
    await queryClient.invalidateQueries({ queryKey: ["feed", user?.id] });
    toast.success(pendingMedia ? t("postPostedToastMedia") : t("postedToast"));
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
          </TabsList>

          <TabsContent value="community" className="mt-6 space-y-6">
            <div className="sahiti-panel p-5">
              <Label htmlFor="post">{t("writePost")}</Label>
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Label
                  htmlFor="post-media"
                  className="inline-flex cursor-pointer items-center gap-1.5 border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  <ImagePlus aria-hidden="true" className="size-4" />
                  {uploadingMedia
                    ? t("postUploading")
                    : pendingMedia
                      ? t("postChangeMedia")
                      : t("postAddMedia")}
                </Label>
                <input
                  id="post-media"
                  type="file"
                  accept="image/*,video/mp4,video/webm,video/quicktime,video/ogg"
                  className="sr-only"
                  onChange={(e) => void attachMedia(e)}
                />
                {pendingMedia && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={clearPendingMedia}
                  >
                    <X aria-hidden="true" className="size-3.5" />
                    {t("postRemoveMedia")}
                  </Button>
                )}
              </div>
              {pendingMedia && (
                <div className="mt-3">
                  {pendingMedia.kind === "video" ? (
                    <video
                      src={pendingMedia.previewUrl}
                      controls
                      playsInline
                      preload="metadata"
                      aria-label={t("postVideoLabel")}
                      className="max-h-[40dvh] w-full rounded-md bg-black object-contain"
                    />
                  ) : (
                    <img
                      src={pendingMedia.previewUrl}
                      alt={t("postMediaAlt")}
                      className="max-h-64 w-full rounded-md object-cover"
                    />
                  )}
                </div>
              )}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {draft.length} {t("chars")}
                </p>
                <Button disabled={uploadingMedia} onClick={() => void publish()}>
                  {t("post")}
                </Button>
              </div>
              {error && (
                <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>

            <PostList
              posts={communityPosts}
              mediaByPostId={data?.media ?? {}}
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
              mediaByPostId={data?.media ?? {}}
              emptyCopy={tab === "sahiti" ? emptyCopy : ""}
              commentsFor={commentsFor}
              isSaved={(id) => data?.saved.has(id) ?? false}
              onOpen={setOpenPostId}
              onToggleSave={(id) => void toggleSave(id)}
              onShare={(content) => void share(content)}
            />
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
        media={openPost ? data?.media?.[openPost.id] : undefined}
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
  mediaByPostId,
  emptyCopy,
  commentsFor,
  isSaved,
  onOpen,
  onToggleSave,
  onShare,
}: {
  posts: FeedPost[];
  mediaByPostId: Record<string, FeedMedia & { url: string }>;
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

            {/*
              Media sits outside the thread button on purpose: a <video> with
              its own controls cannot be nested inside a <button>, and tapping
              a clip should play it rather than open the thread.
            */}
            <PostMedia media={mediaByPostId[post.id]} />

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
