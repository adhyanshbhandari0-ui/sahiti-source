import { ExternalLink, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { findSchemes, formatSchemeAmount, SCHEME_SECTORS, type SchemeStage } from "@/data/schemes";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MoneyField } from "./shared";

const INITIAL_VISIBLE = 4;

/**
 * Live scheme matching. Everything recalculates as the user types, because the
 * dataset is small enough to filter in memory and a round trip would only add
 * a spinner between them and the answer.
 */
export function SchemeFinder({
  selectedId,
  onChoose,
  defaultSector,
  defaultAmount,
}: {
  selectedId: string | null;
  onChoose: (schemeId: string) => void;
  defaultSector?: string;
  defaultAmount?: string;
}) {
  const { t } = useLanguage();
  const [text, setText] = useState("");
  const [sector, setSector] = useState(defaultSector ?? "Retail");
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [stage, setStage] = useState<SchemeStage>("new");
  const [showAll, setShowAll] = useState(false);

  const matches = useMemo(() => {
    const needle = text.trim().toLowerCase();
    const ranked = findSchemes({
      sector,
      amount: Number(amount) || undefined,
      stage,
    });

    if (!needle) return ranked;

    return ranked.filter((match) =>
      [
        match.scheme.name,
        match.scheme.shortName,
        match.scheme.agency,
        match.scheme.summary,
        ...match.scheme.sectors,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [text, sector, amount, stage]);

  const visible = showAll ? matches : matches.slice(0, INITIAL_VISIBLE);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_180px]">
        <div>
          <Label htmlFor="scheme-search">{t("finderSearch")}</Label>
          <div className="mt-2 flex items-center gap-2 rounded-md border bg-muted px-3">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <Input
              id="scheme-search"
              className="border-0 bg-transparent px-0 shadow-none focus-visible:outline-none"
              value={text}
              placeholder={t("finderSearchPlaceholder")}
              onChange={(event) => setText(event.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="finder-sector">{t("finderBusiness")}</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger id="finder-sector" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCHEME_SECTORS.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`sector.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <MoneyField
          id="finder-amount"
          label={t("finderAmountNeeded")}
          value={amount}
          onChange={setAmount}
          hint={t("finderOptional")}
        />

        <div>
          <Label htmlFor="finder-stage">{t("finderStage")}</Label>
          <Select value={stage} onValueChange={(value) => setStage(value as SchemeStage)}>
            <SelectTrigger id="finder-stage" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">{t("finderStageNew")}</SelectItem>
              <SelectItem value="existing">{t("finderStageExisting")}</SelectItem>
              <SelectItem value="either">{t("finderStageBoth")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">
          {matches.length === 0
            ? t("finderMatchedFilters")
            : t("finderMatched", { count: matches.length })}
        </p>

        {matches.length === 0 ? (
          <p className="mt-3 rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {t("finderNothingMatched")}
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">
            {visible.map((match) => {
              const selected = match.scheme.id === selectedId;
              return (
                <li
                  key={match.scheme.id}
                  className={cn(
                    "flex flex-col rounded-md border p-4",
                    selected && "border-primary ring-1 ring-primary",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold">{match.scheme.name}</h3>
                    {match.amountFits && (
                      <span className="rounded-sm bg-success/10 px-1.5 py-0.5 text-[11px] font-medium text-success">
                        {t("finderAmountFits")}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {match.scheme.agency} · {formatSchemeAmount(match.scheme)}
                  </p>
                  <p className="mt-2 text-sm leading-5">{match.scheme.summary}</p>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {match.scheme.audience}
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {match.reasons.slice(0, 3).map((reason) => (
                      <li
                        key={reason}
                        className="rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground"
                      >
                        {reason}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={selected ? "default" : "outline"}
                      onClick={() => onChoose(match.scheme.id)}
                    >
                      {selected ? t("finderSelected") : t("finderChoose")}
                    </Button>
                    <a
                      href={match.scheme.portalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {t("finderPortal")}
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {matches.length > INITIAL_VISIBLE && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            aria-expanded={showAll}
            onClick={() => setShowAll((value) => !value)}
          >
            {showAll ? t("showFewer") : t("showAllN", { count: matches.length })}
          </Button>
        )}
      </div>
    </div>
  );
}
