import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  Circle,
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
  formatShopCoordinates,
  type Shop,
  type ShopCategory,
} from "@/data/shops";
import { shopGoogleDirectionsUrl, shopGoogleMapsUrl } from "@/lib/googleMaps";
import { dominantCategory, groupShops, type ShopFocus, type ShopGroup } from "@/lib/shopClusters";

/** A Sahiti research zone. These are area-level and carry opportunity scores. */
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
    label: "Streets",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  {
    id: "minimal",
    label: "Minimal",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  {
    id: "satellite",
    label: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
  },
] as const;

type BasemapId = (typeof BASEMAPS)[number]["id"];

/** Farthest zoom the basemaps are worth requesting; beyond this they grey out. */
const MAX_ZOOM = 19;

function colorFor(score: number) {
  if (score >= 7) return "#15803D";
  if (score >= 5) return "#B45309";
  return "#B91C1C";
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

/**
 * Moves the map to a chosen locality. Keyed on the token, not the focus, so
 * panning after the jump is not undone on the next render.
 */
function FocusOnArea({ focus, token }: { focus: ShopFocus | null; token: number }) {
  const map = useMap();

  useEffect(() => {
    if (!focus || token === 0) return;
    map.setView([focus.lat, focus.lng], focus.zoom, { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, map]);

  return null;
}

/** Sky-blue candidate marker, matching the SIH simulator's picked location. */
export type MapCandidate = { lat: number; lng: number };

/** Corridor anchor hubs, straight from the SIH gather. */
const CORRIDOR_HUBS = [
  {
    name: "ADYPU Knowledge City",
    note: "15,000+ student base",
    lat: 18.6226,
    lng: 73.9063,
  },
  {
    name: "Lohegaon Central Junction",
    note: "Major transit & market core",
    lat: 18.5955,
    lng: 73.9268,
  },
] as const;

/** Forwards map clicks so the page can run its feasibility simulator. */
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
          {shop.category}
        </span>
        {shop.locality}
      </p>
      {shop.rating !== undefined ? (
        <p className="sahiti-popup__line">
          ★ {shop.rating.toFixed(1)}
          {shop.reviewCount !== undefined ? ` (${shop.reviewCount} reviews)` : ""}
        </p>
      ) : null}
      <p className="sahiti-popup__line">{formatShopAddress(shop)}</p>
      {corridor?.distToAdypuKm !== undefined || corridor?.distToLohegaonKm !== undefined ? (
        <p className="sahiti-popup__line">
          {corridor?.distToAdypuKm !== undefined ? `${corridor.distToAdypuKm} km to ADYPU` : null}
          {corridor?.distToAdypuKm !== undefined && corridor?.distToLohegaonKm !== undefined
            ? " · "
            : null}
          {corridor?.distToLohegaonKm !== undefined
            ? `${corridor.distToLohegaonKm} km to Lohegaon`
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
        <p className="sahiti-popup__line">Accepts {shop.payments.join(", ")}</p>
      ) : null}
      {shop.riskLevel ? (
        <p className="sahiti-popup__line">
          Competition:{" "}
          {shop.riskLevel === "low"
            ? "Low (higher opportunity)"
            : shop.riskLevel === "high"
              ? "High (saturated)"
              : "Moderate"}
          {shop.competitorsNearby !== undefined
            ? ` · ${shop.competitorsNearby} similar within 400 m`
            : ""}
        </p>
      ) : null}
      {shop.riskDescription ? <p className="sahiti-popup__line">{shop.riskDescription}</p> : null}
      {shop.recommendedSchemes && shop.recommendedSchemes.length > 0 ? (
        <p className="sahiti-popup__line">
          Schemes:{" "}
          {shop.recommendedSchemes
            .slice(0, 2)
            .map((scheme) => scheme.name)
            .join(", ")}
        </p>
      ) : null}
      <p className="sahiti-popup__coords">{formatShopCoordinates(shop)}</p>
      <p className="sahiti-popup__actions">
        <a href={shopGoogleMapsUrl(shop)} target="_blank" rel="noreferrer">
          Google Maps
        </a>
        <a href={shopGoogleDirectionsUrl(shop)} target="_blank" rel="noreferrer">
          Directions
        </a>
        {shop.website ? (
          <a href={shop.website} target="_blank" rel="noreferrer">
            Website
          </a>
        ) : null}
      </p>
      <p className="sahiti-popup__source">
        {shop.source === "adypu-corridor"
          ? `ADYPU–Lohegaon corridor dataset${corridor?.dataSource ? ` · ${corridor.dataSource}` : " (OSM gather)"}`
          : "Listed in OpenStreetMap"}
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
  const counted = new Map<ShopCategory, number>();
  for (const shop of group.shops) {
    counted.set(shop.category, (counted.get(shop.category) ?? 0) + 1);
  }
  const breakdown = [...counted.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => count + " " + category)
    .join(", ");

  return (
    <span className="sahiti-cluster-tip">
      <strong>{group.shops.length} shops</strong>
      <span>{breakdown}</span>
      <span className="sahiti-cluster-tip__hint">Click to zoom in</span>
    </span>
  );
}

export default function RiskMap({
  zones,
  shops,
  userPosition = null,
  focusToken = 0,
  areaFocus = null,
  areaFocusToken = 0,
  candidate = null,
  onMapClick,
  showHubs = false,
}: {
  zones: RiskPlace[];
  shops: Shop[];
  userPosition?: UserPosition | null;
  focusToken?: number;
  areaFocus?: ShopFocus | null;
  areaFocusToken?: number;
  /** Simulator's picked location, drawn as a sky-blue dot. */
  candidate?: MapCandidate | null;
  /** Present when the page wants map clicks (feasibility simulator). */
  onMapClick?: (lat: number, lng: number) => void;
  /** Show the ADYPU / Lohegaon corridor anchor markers. */
  showHubs?: boolean;
}) {
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
        <FocusOnArea focus={areaFocus} token={areaFocusToken} />
        {onMapClick ? <ClickCatcher onPick={onMapClick} /> : null}

        {/* Corridor anchors, as on the SIH dashboard. */}
        {showHubs
          ? CORRIDOR_HUBS.map((hub) => (
              <CircleMarker
                key={hub.name}
                center={[hub.lat, hub.lng]}
                radius={7}
                pathOptions={{ color: "#0f172a", weight: 2, fillColor: "#38bdf8", fillOpacity: 1 }}
              >
                <Popup>
                  <div className="sahiti-popup">
                    <p className="sahiti-popup__name">{hub.name}</p>
                    <p className="sahiti-popup__line">{hub.note}</p>
                    <p className="sahiti-popup__source">Corridor anchor · SIH PS 26091 gather</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          : null}

        {/* Candidate location picked for the feasibility simulator. */}
        {candidate ? (
          <CircleMarker
            center={[candidate.lat, candidate.lng]}
            radius={11}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#38bdf8", fillOpacity: 0.9 }}
          >
            <Popup>
              <div className="sahiti-popup">
                <p className="sahiti-popup__name">Candidate store location</p>
                <p className="sahiti-popup__line">
                  {candidate.lat.toFixed(4)}, {candidate.lng.toFixed(4)}
                </p>
                <p className="sahiti-popup__source">
                  Run “Check this spot” in the feasibility panel below.
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ) : null}

        {/* Research zones: translucent, sized and coloured by opportunity score. */}
        {zones.map((place) => (
          <CircleMarker
            key={place.id}
            center={[place.latitude, place.longitude]}
            radius={10 + place.risk_score}
            pathOptions={{
              color: colorFor(place.risk_score),
              fillColor: colorFor(place.risk_score),
              fillOpacity: 0.35,
            }}
          >
            <Popup>
              <div className="sahiti-popup">
                <p className="sahiti-popup__name">{place.name}</p>
                <p className="sahiti-popup__meta">
                  {place.business_type} · opportunity {place.risk_score}/10
                </p>
                <p className="sahiti-popup__line">
                  Competition {place.competitor_density}/10 · saturation {place.market_saturation}
                  /10
                </p>
                <p className="sahiti-popup__line">{place.demand_note}</p>
                <p className="sahiti-popup__source">Sahiti demonstration research</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        <ShopLayer shops={shops} icons={shopIcons} />

        {userPosition && (
          <>
            <Circle
              center={[userPosition.lat, userPosition.lng]}
              radius={userPosition.accuracy}
              pathOptions={{
                color: "#003D7A",
                weight: 1,
                fillColor: "#003D7A",
                fillOpacity: 0.1,
              }}
            />
            <Marker position={[userPosition.lat, userPosition.lng]} icon={USER_ICON}>
              <Popup>
                <div className="sahiti-popup">
                  <p className="sahiti-popup__name">You are here</p>
                  <p className="sahiti-popup__line">
                    Accurate to about {Math.round(userPosition.accuracy)} m
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
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
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
