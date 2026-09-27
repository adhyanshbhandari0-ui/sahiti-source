import emblemUrl from "@/assets/sahiti-official-emblem.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  compact = false,
  invert = false,
  /** Drop the sub-line in tight header lockups (BUG-06). */
  hideSubtitle = false,
}: {
  compact?: boolean;
  invert?: boolean;
  hideSubtitle?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2" aria-label="Sahiti">
      <img
        src={emblemUrl}
        alt=""
        className={cn(
          "shrink-0 object-contain",
          compact ? "h-8 w-10" : "h-11 w-14",
          invert && "brightness-0 invert",
        )}
      />
      <span className={cn("text-left leading-tight", invert ? "text-white" : "text-foreground")}>
        <span
          className={cn(
            "block font-display font-semibold tracking-tight",
            compact ? "text-base" : "text-xl",
          )}
        >
          Sahiti
        </span>
        {hideSubtitle ? null : (
          <span
            className={cn(
              "block font-sans",
              compact ? "text-[10px]" : "text-[11px]",
              invert ? "text-white/75" : "text-muted-foreground",
            )}
          >
            By Team Sahiti
          </span>
        )}
      </span>
    </span>
  );
}
