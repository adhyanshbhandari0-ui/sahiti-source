import { useQuery } from "@tanstack/react-query";
import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, LocateFixed } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  SHOP_CATEGORIES,
  SHOP_CATEGORY_COLORS,
  SHOP_LOCALITIES,
  SHOPS,
  formatShopAddress,
  type Shop,
  type ShopCategory,
  type ShopLocality,
} from "@/data/shops";
import { useGeolocation } from "@/hooks/useGeolocation";
import {
  areaGoogleMapsUrl,
  fetchGoogleShops,
  shopGoogleDirectionsUrl,
  shopGoogleMapsUrl,
  type GoogleShop,
} from "@/lib/googleMaps";
import { focusForShops } from "@/lib/shopClusters";
import { supabase } from "@/integrations/supabase/client";

const RiskMap = lazy(() => import("@/components/RiskMap"));

type Layer = "both" | "shops" | "zones";

const LAYERS: Array<{ value: Layer; label: string }> = [
  { value: "shops", label: "Shops" },
  { value: "zones", label: "Research zones" },
  { value: "both", label: "Both" },
];

/** Centre of the corridor this page covers, used as a fallback for Google. */
const AREA_CENTER = { lat: 18.585, lng: 73.925 };
const AREA_ZOOM = 13;

/** Stat cards above the filters, as on the SIH dashboard. */
function StatsRow({ total, low, verified }: { total: number; low: number; verified: number }) {
  const cards = [
    { label: "Active stores", value: total, color: undefined },
    { label: "Low-risk pockets", value: low, color: "#10b981" },
    { label: "Google verified", value: verified, color: "#38bdf8" },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border p-3">
          <p className="text-lg font-semibold" style={card.color ? { color: card.color } : undefined}>
            {card.value}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Risk legend matching the SIH corridor colouring. */
function RiskLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="font-medium">Pin colour:</span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: "#10b981" }} />
        Low risk (opportunity)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: "#f59e0b" }} />
        Moderate
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: "#ef4444" }} />
        High risk (saturated)
      </span>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/heatmap")({
  head: () => ({
    meta: [
      { title: "Lohegaon shops and risk map | Sahiti" },
      {
        name: "description",
        content:
          "An interactive map of real hardware stores, general stores, salons and garages across Lohegaon, Porwal Road, DY Patil College Road and the ADYPU belt in Pune, with Google Maps links for every listing.",
      },
      { property: "og:title", content: "Lohegaon shops and risk map" },
      {
        property: "og:description",
        content:
          "Real local shop locations from OpenStreetMap, plus Sahiti research zones around Lohegaon, Pune.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Heatmap,
});

/** One shop card. Real OpenStreetMap fields only; nothing is inferred. */
function ShopCard({ shop, onFocus }: { shop: Shop; onFocus?: (shop: Shop) => void }) {
  const meta = [
    shop.openingHours,
    shop.payments && shop.payments.length > 0 ? shop.payments.join(", ") : null,
  ].filter(Boolean);

  return (
    <article className="flex flex-col rounded-md border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-5">{shop.name}</h3>
          {shop.nameMr ? (
            <p className="text-xs text-muted-foreground">{shop.nameMr}</p>
          ) : null}
        </div>
        <span
          className="mt-0.5 shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-white"
          style={{ background: shop.corridor?.riskColor ?? SHOP_CATEGORY_COLORS[shop.category] }}
        >
          {shop.riskLevel === "low" ? "Low risk" : shop.riskLevel === "high" ? "High risk" : shop.riskLevel === "moderate" ? "Moderate" : shop.category}
        </span>
      </div>

      {shop.rating !== undefined ? (
        <p className="mt-1.5 text-xs font-medium text-amber-600">
          ★ {shop.rating.toFixed(1)}
          {shop.reviewCount !== undefined ? ` (${shop.reviewCount} reviews)` : ""}
        </p>
      ) : null}

      <p className="mt-2 text-xs font-medium text-muted-foreground">{shop.locality}</p>
      <p className="mt-1 text-sm text-muted-foreground">{formatShopAddress(shop)}</p>

      {shop.riskDescription ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{shop.riskDescription}</p>
      ) : null}

      {shop.recommendedSchemes && shop.recommendedSchemes.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Schemes: {shop.recommendedSchemes.slice(0, 2).map((scheme) => scheme.name).join(", ")}
        </p>
      ) : null}

      {meta.length > 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">{meta.join(" · ")}</p>
      ) : null}

      {shop.phone ? (
        <a
          href={"tel:" + shop.phone.replace(/\s+/g, "")}
          className="mt-2 text-xs font-medium text-primary underline underline-offset-2"
        >
          {shop.phone}
        </a>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-3 text-xs font-medium">
        {onFocus ? (
          <button
            type="button"
            onClick={() => onFocus(shop)}
            className="text-primary underline underline-offset-2"
          >
            Show on map
          </button>
        ) : null}
        <a
          href={shopGoogleMapsUrl(shop)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
        >
          Google Maps
          <ExternalLink aria-hidden="true" className="size-3" />
        </a>
        <a
          href={shopGoogleDirectionsUrl(shop)}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline underline-offset-2"
        >
          Directions
        </a>
        {shop.website ? (
          <a
            href={shop.website}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            Website
          </a>
        ) : null}
      </div>
    </article>
  );
}

function Heatmap() {
  const [layer, setLayer] = useState<Layer>("both");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [localityFilter, setLocalityFilter] = useState<"All" | ShopLocality>("All");
  const [categoryFilter, setCategoryFilter] = useState<"All" | ShopCategory>("All");
  const [search, setSearch] = useState("");
  const [focusToken, setFocusToken] = useState(0);
  const [areaFocusToken, setAreaFocusToken] = useState(0);
  // Feasibility simulator state (ported from the SIH dashboard's Risk Simulator tab).
  const [candidate, setCandidate] = useState<{ lat: number; lng: number } | null>(null);
  const [simType, setSimType] = useState<string>(SIMULATOR_BUSINESS_TYPES[0]);
  const [simBudget, setSimBudget] = useState(200000);
  const [simResult, setSimResult] = useState<FeasibilityResult | null>(null);
  const geo = useGeolocation();

  // Each fresh fix recentres the map exactly once, so panning afterwards sticks.
  useEffect(() => {
    if (geo.position) setFocusToken((value) => value + 1);
  }, [geo.position]);

  const { data: zones = [], isLoading } = useQuery({
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

  // Ask the server once whether a Google key is present. Cheap, and it means
  // the Google panel is simply absent when the key is not set.
  const { data: googleConfig } = useQuery({
    queryKey: ["google-places-capability"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/places");
        if (!response.ok) return { enabled: false };
        const body = (await response.json()) as { enabled?: boolean };
        return { enabled: Boolean(body.enabled) };
      } catch {
        return { enabled: false };
      }
    },
    staleTime: Infinity,
  });

  const localityCounts = useMemo(() => {
    const counts = new Map<ShopLocality, number>();
    for (const shop of SHOPS) counts.set(shop.locality, (counts.get(shop.locality) ?? 0) + 1);
    return counts;
  }, []);

  // Only localities that actually hold shops become filters.
  const activeLocalities = SHOP_LOCALITIES.filter(
    (locality) => (localityCounts.get(locality) ?? 0) > 0,
  );

  const visibleShops = useMemo(
    () =>
      SHOPS.filter(
        (shop) =>
          (localityFilter === "All" || shop.locality === localityFilter) &&
          (categoryFilter === "All" || shop.category === categoryFilter) &&
          (search.trim() === "" ||
            shop.name.toLowerCase().includes(search.trim().toLowerCase()) ||
            (shop.street ?? "").toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [localityFilter, categoryFilter, search],
  );

  const corridorStats = useMemo(
    () => ({
      total: SHOPS.length,
      lowRisk: SHOPS.filter((shop) => shop.riskLevel === "low").length,
      googleVerified: SHOPS.filter((shop) => shop.rating !== undefined).length,
    }),
    [],
  );

  const focus = useMemo(
    () =>
      localityFilter === "All"
        ? null
        : focusForShops(SHOPS.filter((shop) => shop.locality === localityFilter)),
    [localityFilter],
  );

  // Moving to a new locality is a deliberate jump, so re-centre on each change.
  useEffect(() => {
    if (localityFilter !== "All") setAreaFocusToken((value) => value + 1);
  }, [localityFilter]);

  const showShops = layer !== "zones";
  const showZones = layer !== "shops";

  const zoneTypes = ["All", ...Array.from(new Set(zones.map((place) => place.business_type)))];
  const visibleZones =
    zoneFilter === "All" ? zones : zones.filter((zone) => zone.business_type === zoneFilter);

  const [googleShops, setGoogleShops] = useState<GoogleShop[] | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function findOnGoogle() {
    setGoogleBusy(true);
    setGoogleError(null);
    try {
      const center = focus ?? focusForShops(visibleShops) ?? AREA_CENTER;
      const results = await fetchGoogleShops({
        lat: center.lat,
        lng: center.lng,
        radius: 2000,
        ...(categoryFilter === "All" ? {} : { category: categoryFilter }),
      });
      if (results === null) {
        setGoogleShops(null);
        return;
      }
      setGoogleShops(results);
    } catch {
      setGoogleError("Google did not answer. Try again in a moment.");
    } finally {
      setGoogleBusy(false);
    }
  }

  const googleAreaUrl = areaGoogleMapsUrl(
    focus?.lat ?? AREA_CENTER.lat,
    focus?.lng ?? AREA_CENTER.lng,
    focus?.zoom ?? AREA_ZOOM,
  );

  return (
    <>
      <PageHeader
        title="Lohegaon shops and risk map"
        description="Hardware, kirana, food, pharmacy and more across the ADYPU–Lohegaon corridor, with Sahiti research zones alongside. Pins combine curated OpenStreetMap listings and the SIH corridor gather, colour-coded by competition risk."
      />

      {showShops && (
        <div className="mb-5">
          <StatsRow
            total={corridorStats.total}
            low={corridorStats.lowRisk}
            verified={corridorStats.googleVerified}
          />
        </div>
      )}

      <div className="mb-5 space-y-4">
        <div
          role="group"
          aria-label="Choose map layer"
          className="flex flex-wrap items-center gap-2"
        >
          <span className="text-xs font-medium text-muted-foreground">Show</span>
          {LAYERS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={layer === option.value ? "default" : "outline"}
              aria-pressed={layer === option.value}
              onClick={() => setLayer(option.value)}
            >
              {option.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={!geo.supported || geo.loading}
            aria-pressed={Boolean(geo.position)}
            onClick={() => geo.locate()}
          >
            <LocateFixed aria-hidden="true" className="size-4" />
            {geo.loading ? "Locating…" : geo.position ? "My location" : "Show my location"}
          </Button>
          <a
            href={googleAreaUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2"
          >
            Open this area in Google Maps
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        </div>

        {geo.error && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {geo.error}
          </p>
        )}

        {showShops && (
          <div
            role="group"
            aria-label="Filter by area"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-medium text-muted-foreground">Area</span>
            {(["All", ...activeLocalities] as const).map((locality) => (
              <Button
                key={locality}
                size="sm"
                variant={localityFilter === locality ? "default" : "outline"}
                aria-pressed={localityFilter === locality}
                onClick={() => setLocalityFilter(locality)}
              >
                {locality}
                {locality === "All" ? ` (${SHOPS.length})` : ` (${localityCounts.get(locality)})`}
              </Button>
            ))}
          </div>
        )}

        {showShops && (
          <div
            role="group"
            aria-label="Filter by shop category"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-medium text-muted-foreground">Shop type</span>
            {(["All", ...SHOP_CATEGORIES] as const).map((category) => {
              const count =
                category === "All"
                  ? visibleShops.length
                  : visibleShops.filter((shop) => shop.category === category).length;
              return (
                <Button
                  key={category}
                  size="sm"
                  variant={categoryFilter === category ? "default" : "outline"}
                  aria-pressed={categoryFilter === category}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category} ({count})
                </Button>
              );
            })}
          </div>
        )}

        {showZones && (
          <div
            role="group"
            aria-label="Filter by zone business type"
            className="flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-medium text-muted-foreground">Zone type</span>
            {zoneTypes.map((type) => (
              <Button
                key={type}
                size="sm"
                variant={zoneFilter === type ? "default" : "outline"}
                aria-pressed={zoneFilter === type}
                onClick={() => setZoneFilter(type)}
              >
                {type}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-md border">
        <ClientOnly
          /*
           * The placeholder uses the same class as the map itself. Matching the
           * height exactly means the page does not jump when Leaflet mounts.
           */
          fallback={
            <div className="sahiti-map flex items-center justify-center text-sm text-muted-foreground">
              Loading map
            </div>
          }
        >
          <Suspense
            fallback={
              <div className="sahiti-map flex items-center justify-center text-sm text-muted-foreground">
                Loading map
              </div>
            }
          >
            <RiskMap
              zones={showZones ? visibleZones : []}
              shops={showShops ? visibleShops : []}
              userPosition={geo.position}
              focusToken={focusToken}
              areaFocus={focus}
              areaFocusToken={areaFocusToken}
              candidate={showShops ? candidate : null}
              onMapClick={
                showShops
                  ? (lat, lng) => {
                      setCandidate({ lat, lng });
                      setSimResult(null);
                    }
                  : undefined
              }
              showHubs={showShops}
            />
          </Suspense>
        </ClientOnly>
      </div>

      <div className="mt-3 space-y-2">
        {showShops && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {SHOP_CATEGORIES.map((category) => (
              <li key={category} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="size-2.5 rounded-full border border-white shadow-sm"
                  style={{ background: SHOP_CATEGORY_COLORS[category] }}
                />
                {category}
              </li>
            ))}
        {showShops && (
          <>
            <RiskLegend />
            <p className="text-xs text-muted-foreground">
              Circles with a number group nearby shops. Click one to zoom in. Click empty map to
              place a candidate pin for the feasibility check below.
            </p>
          </>
        )}
          </ul>
        )}
        {showZones && (
          <p className="text-xs text-muted-foreground">
            Zone circles: green marks a higher opportunity score, amber a mixed outlook and red a
            tougher location. Figures are Sahiti demonstration research, not official survey data.
          </p>
        )}
      </div>

      {showShops && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            Shops
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {visibleShops.length} of {SHOPS.length}
            </span>
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            OpenStreetMap maps Lohegaon in detail. The ADYPU–Lohegaon corridor gather adds
            pharmacies, food, kirana, banking and other trades with competition notes, ratings and
            distances to the two corridor anchors. Open any listing in Google Maps for reviews,
            photos and the current phone number.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleShops.map((shop) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                onFocus={(target) => {
                  setLocalityFilter("All");
                  setAreaFocusToken((value) => value + 1);
                  // Recentre on the shop, then open its popup via the map.
                  window.setTimeout(() => {
                    setAreaFocus({ lat: target.lat, lng: target.lng, zoom: 17 });
                  }, 0);
                }}
              />
            ))}
          </div>

          {visibleShops.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">
              No shops match this combination of area and shop type.
            </p>
          )}
        </section>
      )}

      {googleConfig?.enabled && showShops && (
        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">More shops from Google</h2>
            <Button size="sm" variant="outline" disabled={googleBusy} onClick={findOnGoogle}>
              {googleBusy ? "Searching…" : "Search this area"}
            </Button>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Google often lists shops that OpenStreetMap has not mapped yet, particularly around
            ADYPU and Pride World City.
          </p>

          {googleError && (
            <p role="alert" className="mt-3 text-xs font-medium text-destructive">
              {googleError}
            </p>
          )}

          {googleShops && googleShops.length === 0 && (
            <p className="mt-3 text-sm text-muted-foreground">Google returned nothing here.</p>
          )}

          {googleShops && googleShops.length > 0 && (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {googleShops.map((place) => (
                  <article key={place.id} className="flex flex-col rounded-md border p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold leading-5">{place.name}</h3>
                      <span
                        className="mt-0.5 shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-white"
                        style={{ background: SHOP_CATEGORY_COLORS[place.category] }}
                      >
                        {place.category}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {place.address || "No address returned"}
                    </p>
                    {place.rating !== undefined ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {place.rating.toFixed(1)} out of 5
                        {place.ratingCount !== undefined ? ` · ${place.ratingCount} reviews` : ""}
                      </p>
                    ) : null}
                    <a
                      href={place.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-auto inline-flex items-center gap-1 pt-3 text-xs font-medium text-primary underline underline-offset-2"
                    >
                      Open in Google Maps
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  </article>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Ratings and reviews are Google&apos;s own and appear as Google reports them.
              </p>
            </>
          )}
        </section>
      )}

      {showZones && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Sahiti research zones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Area-level demonstration research. A higher opportunity score suggests more favourable
            trading conditions.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {isLoading && <p className="text-sm text-muted-foreground">Loading zones…</p>}
            {visibleZones.map((place) => (
              <article key={place.id} className="rounded-md border p-5">
                <h3 className="text-base font-semibold">{place.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {place.business_type} · {place.address}
                </p>
                <p className="mt-3 text-sm">
                  Opportunity {place.risk_score}/10 · competition {place.competitor_density}/10 ·
                  saturation {place.market_saturation}/10 · seasonal risk{" "}
                  {place.seasonal_demand_risk}/10
                </p>
                <p className="mt-3 text-sm leading-6">{place.demand_note}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{place.roi_note}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Shop data © OpenStreetMap contributors, available under the Open Database License. Retrieved
        20 September 2026. Area and category figures are counts of these listings, not market
        research.
      </p>
    </>
  );
}
