import { Bookmark, ExternalLink, Share2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PostMedia } from "@/components/feed/PostMedia";
import { findSchemeByLabel, formatSchemeAmount } from "@/data/schemes";
import { timeAgo } from "@/lib/format";
import type { FeedMedia } from "@/lib/feedMedia";
import { useLanguage } from "@/lib/i18n";

export type FeedPost = {
  id: string;
  author_id: string | null;
  author_name: string;
  author_initials: string;
  post_type: string;
  content: string;
  category: string;
  region: string;
  scheme_type: string;
  /** Storage path of the attached photo or clip inside the media bucket. */
  image_url: string | null;
  created_at: string;
};

export type FeedComment = {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export function PostThreadDialog({
  post,
  media,
  comments,
  isSaved,
  onClose,
  onToggleSave,
  onAddComment,
  onShare,
}: {
  post: FeedPost | null;
  media: (FeedMedia & { url: string }) | undefined;
  comments: FeedComment[];
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (postId: string) => void;
  onAddComment: (postId: string, content: string) => Promise<void> | void;
  onShare: (content: string) => void;
}) {
  const { t } = useLanguage();
  const [draft, setDraft] = useState("");
  const scheme = post ? findSchemeByLabel(post.scheme_type) : undefined;

  function sourceLabel(post: FeedPost) {
    if (post.post_type === "government") return t("sourceSchemeDesk");
    if (post.post_type === "news") return t("sourceResearch");
    if (post.post_type === "finance") return t("sourceIndustry");
    return t("sourceMember");
  }

  async function submitComment() {
    if (!post) return;
    const content = draft.trim();
    if (!content) return;
    await onAddComment(post.id, content);
    setDraft("");
  }

  return (
    <Dialog open={Boolean(post)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
        {post && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 text-left text-lg">
                {post.author_name}
                <Badge
                  variant={post.post_type === "user" ? "secondary" : "default"}
                  className="font-medium"
                >
                  {sourceLabel(post)}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-left">
                {[post.category, post.scheme_type, post.region, timeAgo(post.created_at)]
                  .filter(Boolean)
                  .join(" · ")}
              </DialogDescription>
            </DialogHeader>

            <p className="text-sm leading-7">{post.content}</p>

            <PostMedia media={media} className="mt-4 max-h-[60dvh]" />

            {scheme && (
              <section className="rounded-md border bg-secondary p-4">
                <h3 className="text-sm font-semibold">{scheme.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {scheme.agency} · {formatSchemeAmount(scheme)}
                </p>
                <p className="mt-3 text-sm leading-6">{scheme.summary}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{scheme.audience}</p>

                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("schemeBenefitTitle")}
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {scheme.benefits.map((benefit) => (
                    <li key={benefit} className="flex gap-2">
                      <span aria-hidden="true" className="text-primary">
                        ·
                      </span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>

                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("schemeEligibleTitle")}
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {scheme.eligibility.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span aria-hidden="true">·</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>

                <h4 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("schemeDocsTitle")}
                </h4>
                <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                  {scheme.documents.map((doc) => (
                    <li key={doc} className="flex gap-2">
                      <span aria-hidden="true">·</span>
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={scheme.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  {t("confirmUdyamimitra")}
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
              </section>
            )}

            {!scheme && post.scheme_type && (
              <p className="rounded-md border bg-secondary p-3 text-xs leading-5 text-muted-foreground">
                {t("schemeTaggedNote", { tag: post.scheme_type })}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => onToggleSave(post.id)}>
                <Bookmark className={isSaved ? "size-4 fill-current" : "size-4"} />
                {isSaved ? t("saved") : t("save")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onShare(post.content)}>
                <Share2 className="size-4" />
                {t("share")}
              </Button>
            </div>

            <section className="border-t pt-4">
              <h3 className="text-sm font-semibold">
                {comments.length} {t("commentsLabel")}
              </h3>
              <ul className="mt-3 space-y-3">
                {comments.map((comment) => (
                  <li key={comment.id} className="text-sm">
                    <span className="font-medium">{comment.author_name}</span>{" "}
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(comment.created_at)}
                    </span>
                    <p className="leading-6">{comment.content}</p>
                  </li>
                ))}
                {comments.length === 0 && (
                  <li className="text-sm text-muted-foreground">{t("noReplies")}</li>
                )}
              </ul>

              <div className="mt-3 flex gap-2">
                <Input
                  className="bg-muted"
                  aria-label={t("comment")}
                  placeholder={t("addReply")}
                  value={draft}
                  maxLength={500}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <Button onClick={() => void submitComment()}>{t("comment")}</Button>
              </div>
            </section>

            <p className="text-xs leading-5 text-muted-foreground">{t("schemeDisclaimer")}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
