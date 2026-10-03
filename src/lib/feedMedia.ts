import { supabase } from "@/integrations/supabase/client";

/**
 * Feed attachments reuse the business-images bucket rather than a second one:
 * its RLS already scopes writes to `auth.uid()` as the first path segment, and
 * the bucket accepts video uploads, so posts can carry photos and clips
 * without a migration or a new bucket.
 */
export const FEED_MEDIA_BUCKET = "business-images";

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const VIDEO_EXTENSIONS = ["mp4", "webm", "mov", "m4v", "ogg", "ogv"];
const VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/ogg"];

export type FeedMediaKind = "image" | "video";

export type FeedMedia = {
  /** Storage path inside the bucket, stored verbatim in posts.image_url. */
  path: string;
  kind: FeedMediaKind;
};

/**
 * The kind is derived from the stored filename extension rather than a column.
 * The bucket is private, so only the path is persisted and the extension is
 * all that survives to tell a clip from a photo.
 */
export function mediaKind(path: string): FeedMediaKind {
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.includes(extension) ? "video" : "image";
}

export function isVideoFile(file: File): boolean {
  if (file.type && VIDEO_MIME_TYPES.includes(file.type.toLowerCase())) return true;
  return mediaKind(file.name) === "video";
}

/**
 * RLS requires the first folder segment to be the caller's uid, so every
 * upload path starts with it.
 */
export function buildMediaPath(userId: string, file: File): string {
  const safeName = file.name.replace(/[^\w.-]/g, "_");
  return `${userId}/${Date.now()}-${safeName}`;
}

/**
 * Turns stored paths into playable URLs. The bucket is not public, so every
 * media element needs a signed URL; `mediaUrl` falls back to null rather than
 * handing an empty src to the DOM.
 */
export async function resolveMediaUrls(
  entries: { id: string; image_url: string | null }[],
): Promise<Record<string, FeedMedia & { url: string }>> {
  const targets = entries.filter((row): row is { id: string; image_url: string } =>
    Boolean(row.image_url),
  );
  if (targets.length === 0) return {};

  const signed = await Promise.all(
    targets.map(async (row) => {
      const { data } = await supabase.storage
        .from(FEED_MEDIA_BUCKET)
        .createSignedUrl(row.image_url, 3600);
      return [row.id, data?.signedUrl] as const;
    }),
  );

  const resolved: Record<string, FeedMedia & { url: string }> = {};
  for (const [id, url] of signed) {
    if (!url) continue;
    const path = targets.find((row) => row.id === id)!.image_url;
    resolved[id] = { path, kind: mediaKind(path), url };
  }
  return resolved;
}
