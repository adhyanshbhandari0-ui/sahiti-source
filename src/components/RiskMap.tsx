import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { UserPosition } from "@/hooks/useGeolocation";
import {
  SHOP_CATEGORY_COLORS,
  formatShopAddress,
  type Shop,
  type ShopCategory,
} from "@/data/shops";
import { shopGoogleDirectionsUrl, shopGoogleMapsUrl } from "@/lib/googleMaps";
import { useLanguage } from "@/lib/i18n";
import { dominantCategory, groupShops, type ShopGroup } from "@/lib/shopClusters";

/** A Sahiti safe zone. These are area-level and carry opportunity scores. */
export type RiskPlace = {
  id: string;
  name: string;
  business_type: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  competitor_density: number;
  market_saturation: number;
  seasonal_demand_risk: number;
  demand_note: string;
  roi_note: string;
  address: string;
};

/**
 * Basemaps. Google does not licence its tiles for third-party map libraries,
 * so these come from providers that do. Confirm each provider's terms before
 * running this in production, and keep the attributions intact.
 */
const BASEMAPS = [
  {
    id: "streets",
    labelKey: "basemapStreets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: "minimal",
    labelKey: "basemapMinimal",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "satellite",
    labelKey: "basemapSatellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
  },
] as const;

type BasemapId = (typeof BASEMAPS)[number]["id"];

/** Farthest zoom the basemaps are worth requesting; beyond this they grey out. */
const MAX_ZOOM = 19;

/**
 * The three big safe-zone verdicts. A zone is bucketed by its opportunity
 * score into exactly one of three colours, so the map reads at a glance
 * instead of showing a scatter of small circles.
 */
const ZONE_BUCKETS = [
  {
    id: "green",
    color: "#15803D",
    radius: 110,
    minScore: 7,
  },
  {
    id: "amber",
    color: "#B45309",
    radius: 100,
    minScore: 5,
  },
  {
    id: "red",
    color: "#B91C1C",
    radius: 95,
    minScore: 0,
  },
] as const;

function bucketFor(score: number) {
  return ZONE_BUCKETS.find((bucket) => score >= bucket.minScore) ?? ZONE_BUCKETS[2]!;
}

/** Risk colours from the SIH corridor gather, used to tint corridor pins. */
const RISK_COLORS = ["#10b981", "#f59e0b", "#ef4444"] as const;

/**
 * Pin colour for a shop: corridor rows use the SIH risk colour (green =
 * opportunity, amber = moderate, red = saturated); everything else keeps the
 * category colour.
 */
function shopPinColor(shop: Shop): string {
  return shop.corridor?.riskColor ?? SHOP_CATEGORY_COLORS[shop.category];
}

function makeShopIcon(color: string) {
  return L.divIcon({
    // Custom class name so Leaflet's default .leaflet-div-icon box never applies.
    className: "sahiti-shop-pin",
    html: '<span class="sahiti-shop-pin__dot" style="background:' + color + '"></span>',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -9],
  });
}

/** Bubble showing how many shops folded together, tinted by the commonest type. */
function makeClusterIcon(count: number, color: string) {
  // Bubbles grow a little with the count, then stop, so a 19-shop market does
  // not swamp the map.
  const size = Math.min(30 + count * 2, 46);
  return L.divIcon({
    className: "sahiti-cluster-pin",
    html:
      '<span class="sahiti-cluster-pin__bubble" style="--pin:' +
      color +
      ";width:" +
      size +
      "px;height:" +
      size +
      'px">' +
      count +
      "</span>",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Solid blue dot with a halo, so "you are here" never reads as a shop pin. */
const USER_ICON = L.divIcon({
  className: "sahiti-user-pin",
  html: '<span class="sahiti-user-pin__dot"></span><span class="sahiti-user-pin__halo"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

/** Current zoom, so the shop layer can decide between pins and bubbles. */
function useMapZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return zoom;
}

/**
 * Recentres only when the token changes, which happens when the person taps
 * "my location". Recentring on every render would fight them while they pan.
 */
function RecenterOnUser({ position, token }: { position: UserPosition | null; token: number }) {
  const map = useMap();

  useEffect(() => {
    if (!position || token === 0) return;
    map.setView([position.lat, position.lng], 16, { animate: true });
    // Intentionally keyed on the token: position alone updates too often.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, map]);

  return null;
}

/** Forwards map clicks so the page can run its feasibility rating. */
function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

/** Everything a shop popup shows. Factual OpenStreetMap fields only. */
function ShopPopupBody({ shop }: { shop: Shop }) {
  const { t } = useLanguage();
  const corridor = shop.corridor;
  return (
    <div className="sahiti-popup">
      <p className="sahiti-popup__name">
        {shop.name}
        {shop.nameMr ? <span className="sahiti-popup__alt">{shop.nameMr}</span> : null}
      </p>
      <p className="sahiti-popup__meta">
        <span
          className="sahiti-popup__chip"
          style={{ background: SHOP_CATEGORY_COLORS[shop.category] }}
        >
          {t(`cat.${shop.category}`)}
        </span>
        {shop.locality}
      </p>
      {shop.rating !== undefined ? (
        <p className="sahiti-popup__line">
          ★ {shop.rating.toFixed(1)}
          {shop.reviewCount !== undefined ? ` (${t("reviews", { n: shop.reviewCount })})` : ""}
        </p>
      ) : null}
      <p className="sahiti-popup__line">{formatShopAddress(shop)}</p>
      {corridor?.distToAdypuKm !== undefined || corridor?.distToLohegaonKm !== undefined ? (
        <p className="sahiti-popup__line">
          {corridor?.distToAdypuKm !== undefined
            ? t("kmToAdypu", { km: corridor.distToAdypuKm })
            : null}
          {corridor?.distToAdypuKm !== undefined && corridor?.distToLohegaonKm !== undefined
            ? " · "
            : null}
          {corridor?.distToLohegaonKm !== undefined
            ? t("kmToLohegaon", { km: corridor.distToLohegaonKm })
            : null}
        </p>
      ) : null}
      {shop.phone ? (
        <p className="sahiti-popup__line">
          <a href={"tel:" + shop.phone.replace(/\s+/g, "")}>{shop.phone}</a>
        </p>
      ) : null}
      {shop.openingHours ? <p className="sahiti-popup__line">{shop.openingHours}</p> : null}
      {shop.payments && shop.payments.length > 0 ? (
        <p className="sahiti-popup__line">{t("accepts", { list: shop.payments.join(", ") })}</p>
      ) : null}
      {shop.riskLevel ? (
        <p className="sahiti-popup__line">
          {t("competition")}{" "}
          {shop.riskLevel === "low"
            ? t("competitionLow")
            : shop.riskLevel === "high"
              ? t("competitionHigh")
              : t("competitionModerate")}
          {shop.competitorsNearby !== undefined
            ? ` · ${t("similarNearby", { n: shop.competitorsNearby })}`
            : ""}
        </p>
      ) : null}
      {shop.riskDescription ? <p className="sahiti-popup__line">{shop.riskDescription}</p> : null}
      {shop.recommendedSchemes && shop.recommendedSchemes.length > 0 ? (
        <p className="sahiti-popup__line">
          {t("schemes")}{" "}
          {shop.recommendedSchemes
            .slice(0, 2)
            .map((scheme) => scheme.name)
            .join(", ")}
        </p>
      ) : null}
      <p className="sahiti-popup__actions">
        <a href={shopGoogleMapsUrl(shop)} target="_blank" rel="noreferrer">
          {t("googleMaps")}
        </a>
        <a href={shopGoogleDirectionsUrl(shop)} target="_blank" rel="noreferrer">
          {t("directions")}
        </a>
        {shop.website ? (
          <a href={shop.website} target="_blank" rel="noreferrer">
            {t("website")}
          </a>
        ) : null}
      </p>
      <p className="sahiti-popup__source">
        {shop.source === "adypu-corridor"
          ? `${t("corridorSource")}${corridor?.dataSource ? ` · ${corridor.dataSource}` : ` (${t("osmListed")})`}`
          : t("osmListed")}
      </p>
    </div>
  );
}

/** Pin icon for a colour, building it on demand if that colour was never cached. */
function iconForColor(icons: Record<string, L.DivIcon>, color: string): L.DivIcon {
  return icons[color] ?? makeShopIcon(color);
}

/**
 * Draws shops as pins or clusters depending on zoom. Kept as its own component
 * because it needs the map's zoom, which is only readable inside MapContainer.
 */
function ShopLayer({ shops, icons }: { shops: Shop[]; icons: Record<string, L.DivIcon> }) {
  const map = useMap();
  const zoom = useMapZoom();
  const groups = useMemo(() => groupShops(shops, zoom), [shops, zoom]);

  return (
    <>
      {groups.map((group) =>
        group.shops.length === 1 ? (
          <Marker
            key={group.key}
            position={[group.lat, group.lng]}
            icon={iconForColor(icons, shopPinColor(group.shops[0]!))}
          >
            <Popup>
              <ShopPopupBody shop={group.shops[0]!} />
            </Popup>
          </Marker>
        ) : (
          <Marker
            key={group.key}
            position={[group.lat, group.lng]}
            icon={makeClusterIcon(
              group.shops.length,
              SHOP_CATEGORY_COLORS[dominantCategory(group.shops)],
            )}
            eventHandlers={{
              // Clicking a bubble is the fastest way in, so zoom to the shops
              // it stands for rather than opening another list.
              click: () => {
                const bounds = L.latLngBounds(group.shops.map((s) => [s.lat, s.lng]));
                map.fitBounds(bounds, { padding: [48, 48], maxZoom: 18 });
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
              <ClusterTooltip group={group} />
            </Tooltip>
          </Marker>
        ),
      )}
    </>
  );
}

/** Hover summary for a cluster: how many, and which trades. */
function ClusterTooltip({ group }: { group: ShopGroup }) {
  const { t } = useLanguage();
  const counted = new Map<ShopCategory, number>();
  for (const shop of group.shops) {
    counted.set(shop.category, (counted.get(shop.category) ?? 0) + 1);
  }
  const breakdown = [...counted.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `${count} ${t(`cat.${category}`)}`)
    .join(", ");

  return (
    <span className="sahiti-cluster-tip">
      <strong>{t("clusterShops", { n: group.shops.length })}</strong>
      <span>{breakdown}</span>
      <span className="sahiti-cluster-tip__hint">{t("clickToZoom")}</span>
    </span>
  );
}

export default function RiskMap({
  zones,
  shops,
  userPosition = null,
  focusToken = 0,
  candidate = null,
  onMapClick,
  showHubs = false,
}: {
  zones: RiskPlace[];
  shops: Shop[];
  userPosition?: UserPosition | null;
  focusToken?: number;
  /** Rating's picked location, drawn as a sky-blue dot. */
  candidate?: { lat: number; lng: number } | null;
  /** Present when the page wants map clicks (Sahiti Rating). */
  onMapClick?: (lat: number, lng: number) => void;
  /** Show the ADYPU / Lohegaon corridor anchor markers. */
  showHubs?: boolean;
}) {
  const { t } = useLanguage();
  const [basemap, setBasemap] = useState<BasemapId>("streets");
  const active = BASEMAPS.find((option) => option.id === basemap) ?? BASEMAPS[0];

  // One icon per colour actually in use: category colours plus the three
  // SIH risk colours corridor pins are tinted with.
  const shopIcons = useMemo(() => {
    const colors = new Set<string>([...Object.values(SHOP_CATEGORY_COLORS), ...RISK_COLORS]);
    return Object.fromEntries([...colors].map((color) => [color, makeShopIcon(color)])) as Record<
      string,
      L.DivIcon
    >;
  }, []);

  return (
    <div className="relative">
      <MapContainer
        center={[18.585, 73.925]}
        zoom={13}
        minZoom={10}
        maxZoom={MAX_ZOOM}
        scrollWheelZoom={false}
        className="sahiti-map w-full"
      >
        {/* Remounting on id change is what swaps the tiles. */}
        <TileLayer key={active.id} url={active.url} attribution={active.attribution} />

        <RecenterOnUser position={userPosition} token={focusToken} />
        {onMapClick ? <ClickCatcher onPick={onMapClick} /> : null}

        {/* Corridor anchors, as on the SIH dashboard. */}
        {showHubs
          ? [
              {
                key: "adypu",
                name: "ADYPU Knowledge City",
                noteKey: "hubAdypu",
                lat: 18.6226,
                lng: 73.9063,
              },
              {
                key: "lohegaon",
                name: "Lohegaon Central Junction",
                noteKey: "hubLohegaon",
                lat: 18.5955,
                lng: 73.9268,
              },
            ].map((hub) => (
              <CircleMarker
                key={hub.key}
                center={[hub.lat, hub.lng]}
                radius={7}
                pathOptions={{ color: "#0f172a", weight: 2, fillColor: "#38bdf8", fillOpacity: 1 }}
              >
                <Popup>
                  <div className="sahiti-popup">
                    <p className="sahiti-popup__name">{hub.name}</p>
                    <p className="sahiti-popup__line">{t(hub.noteKey)}</p>
                    <p className="sahiti-popup__source">{t("corridorSource")}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          : null}

        {/* Picked location for the Sahiti Rating — described, never coordinates. */}
        {candidate ? (
          <CircleMarker
            center={[candidate.lat, candidate.lng]}
            radius={11}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#38bdf8", fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="sahiti-popup">
                <p className="sahiti-popup__name">{t("pickedSpot")}</p>
                <p className="sahiti-popup__line">{t("runRatingHint")}</p>
              </div>
            </Popup>
          </CircleMarker>
        ) : null}

        {/*
         * Sahiti safe zones: three big verdict circles, one per colour band.
         * Each zone is bucketed by opportunity score into green / amber / red
         * so the map shows three clear areas instead of many small circles.
         */}
        {zones.map((place) => {
          const bucket = bucketFor(place.risk_score);
          return (
            <CircleMarker
              key={place.id}
              center={[place.latitude, place.longitude]}
              radius={bucket.radius}
              pathOptions={{
                color: bucket.color,
                fillColor: bucket.color,
                fillOpacity: 0.28,
                weight: 2,
              }}
            >
              <Popup>
                <div className="sahiti-popup">
                  <p className="sahiti-popup__name">
                    {t("zoneOpportunity", { name: place.name, score: place.risk_score })}
                  </p>
                  <p className="sahiti-popup__line">{place.demand_note}</p>
                  <p className="sahiti-popup__source">{t("zonePopupSource")}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <ShopLayer shops={shops} icons={shopIcons} />

        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={USER_ICON}>
            <Popup>
              <div className="sahiti-popup">
                <p className="sahiti-popup__name">{t("youAreHere")}</p>
                <p className="sahiti-popup__line">
                  {t("accuracy", { m: Math.round(userPosition.accuracy) })}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div role="group" aria-label="Base map" className="sahiti-basemap">
        {BASEMAPS.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={basemap === option.id}
            onClick={() => setBasemap(option.id)}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
