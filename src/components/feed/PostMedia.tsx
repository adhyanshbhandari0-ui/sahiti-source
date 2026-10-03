import { useLanguage } from "@/lib/i18n";
import type { FeedMedia } from "@/lib/feedMedia";

/**
 * One attachment per post. Photos render as an image; clips render as a video
 * with native controls, `playsInline` so iOS does not hijack the page into
 * fullscreen, and `preload="metadata"` so a feed full of clips does not pull
 * down every file before the member presses play.
 *
 * `className` is appended rather than substituted so a caller can adjust
 * sizing without overriding the per-kind object fit and squashing a clip.
 */
export function PostMedia({
  media,
  className,
}: {
  media: (FeedMedia & { url: string }) | undefined;
  className?: string;
}) {
  const { t } = useLanguage();
  if (!media) return null;

  if (media.kind === "video") {
    return (
      <video
        src={media.url}
        controls
        playsInline
        preload="metadata"
        aria-label={t("postVideoLabel")}
        className={`mt-3 max-h-[70dvh] w-full rounded-md bg-black object-contain${
          className ? ` ${className}` : ""
        }`}
      />
    );
  }

  return (
    <img
      src={media.url}
      alt={t("postMediaAlt")}
      loading="lazy"
      decoding="async"
      className={`mt-3 max-h-[70dvh] w-full rounded-md object-cover${
        className ? ` ${className}` : ""
      }`}
    />
  );
}
