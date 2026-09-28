import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "./shared";

/* The catalogue only knows SCHEME_SECTORS; the demo table adds these. */
const EXTRA_SECTORS = ["PG/Hostel", "Jewellery"] as const;

/**
 * The demo locations carry English research notes in the database. Keys exist
 * for every seeded place, so each language shows its own wording; a non-demo
 * row falls back to the stored text.
 */
const NOTE_KEYS: Record<string, { demand: string; roi: string }> = {
  "Dhanori Road Services": { demand: "marketDhanoriDemand", roi: "marketDhanoriRoi" },
  "ADYPU Student Zone": { demand: "marketAdypuDemand", roi: "marketAdypuRoi" },
  "Airport Approach Dairy Point": { demand: "marketAirportDemand", roi: "marketAirportRoi" },
  "Charholi Agriculture Supply": { demand: "marketCharholiDemand", roi: "marketCharholiRoi" },
  "Porwal Road Hostel Belt": { demand: "marketPorwalDemand", roi: "marketPorwalRoi" },
  "Sant Nagar Retail Strip": { demand: "marketSantNagarDemand", roi: "marketSantNagarRoi" },
  "Wagholi Road Textile Cluster": { demand: "marketWagholiDemand", roi: "marketWagholiRoi" },
  "Lohegaon Market Cluster": { demand: "marketLohegaonDemand", roi: "marketLohegaonRoi" },
};

export function MarketTab() {
  const { t, has } = useLanguage();

  /**
   * Sector labels live in the i18n dictionaries, so the demo table's
   * business_type values translate like the rest of the UI.
   */
  function sectorLabel(value: string) {
    const key = `sector.${value}`;
    return has(key) ? t(key) : value;
  }

  function noteFor(name: string | undefined, stored: string | null, kind: "demand" | "roi") {
    const keys = name ? NOTE_KEYS[name] : undefined;
    if (keys) return t(keys[kind]);
    return stored ?? "";
  }
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: locations = [] } = useQuery({
    queryKey: ["risk-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("risk_locations")
        .select("*")
        .order("risk_score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-secondary p-4 text-sm leading-6 text-muted-foreground">
        {t("marketIntro")}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {locations.map((place) => {
          const open = openId === place.id;
          return (
            <article key={place.id} className="rounded-md border p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold">{place.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {sectorLabel(place.business_type)}
                  </p>
                </div>
                <span className="rounded-sm bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground tabular-nums">
                  {place.risk_score}/10
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <Score label={t("competitionLabel")} value={place.competitor_density} />
                <Score label={t("saturationLabel")} value={place.market_saturation} />
                <Score label={t("seasonalLabel")} value={place.seasonal_demand_risk} />
              </dl>

              {open && (
                <div className="mt-4 space-y-3 border-t pt-4">
                  <p className="text-sm leading-6">
                    {noteFor(place.name, place.demand_note, "demand")}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {noteFor(place.name, place.roi_note, "roi")}
                  </p>
                  <p className="text-xs text-muted-foreground">{place.address}</p>
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="mt-3 -ml-2"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : place.id)}
              >
                <ChevronDown aria-hidden="true" className={open ? "size-4 rotate-180" : "size-4"} />
                {open ? t("notesLess") : t("notesMore")}
              </Button>
            </article>
          );
        })}
      </div>

      <Panel>
        <p className="text-xs leading-5 text-muted-foreground">{t("marketDisclaimer")}</p>
      </Panel>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}/10</dd>
    </div>
  );
}
