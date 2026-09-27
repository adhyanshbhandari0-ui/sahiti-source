import type { Shop, ShopCategory } from "@/data/shops";

/**
 * Google Maps, in two deliberately separate halves.
 *
 * 1. Deep links (everything below except the Places types) need no API key.
 *    Google's Maps URLs API is free and keyless, so any shop in this app can
 *    hand off to Google Maps for search, directions or a dropped pin using
 *    only data we already hold. This is what makes Google Maps "one tap away"
 *    without a billing account.
 *
 * 2. Live Google listings do need a key. Google's Places API is the only
 *    lawful source for Google's own shop data, and it is billed. That half
 *    lives in src/routes/api/places.ts and stays switched off until
 *    GOOGLE_MAPS_API_KEY exists on the server.
 *
 * One thing this module intentionally does NOT do: load Google basemap tiles
 * into Leaflet. Google publishes no tile endpoint for third-party map
 * libraries, and the widely copied `mt{0-3}.google.com/vt` URLs sit outside
 * their terms. The basemaps in RiskMap come from providers that do allow it.
 */

const MAPS_BASE = "https://www.google.com/maps";

/** Opens Google Maps with a named business already searched and pinned. */
export function googleMapsSearchUrl(name: string, lat: number, lng: number): string {
  // Name plus coordinates disambiguates branches of the same chain.
  return `${MAPS_BASE}/search/?api=1&query=${encodeURIComponent(`${name} ${lat},${lng}`)}`;
}

/** Opens Google Maps with this shop already searched and pinned. */
export function shopGoogleMapsUrl(shop: Shop): string {
  return googleMapsSearchUrl(shop.name, shop.lat, shop.lng);
}

/** Turn-by-turn directions. On a phone this hands off to the Maps app. */
export function shopGoogleDirectionsUrl(shop: Shop): string {
  return `${MAPS_BASE}/dir/?api=1&destination=${shop.lat},${shop.lng}`;
}

/** Google Maps centred on a point, so a user can explore the area themselves. */
export function areaGoogleMapsUrl(lat: number, lng: number, zoom = 15): string {
  return `${MAPS_BASE}/@${lat},${lng},${zoom}z`;
}

/** A Google Maps search for a trade, scoped to an area. */
export function areaGoogleSearchUrl(
  term: string,
  lat: number,
  lng: number,
  zoom = 15,
): string {
  return `${MAPS_BASE}/search/${encodeURIComponent(term)}/@${lat},${lng},${zoom}z`;
}

/**
 * Google's own place types for the optional Places overlay.
 * Only the original Sahiti trades are searchable via Places; corridor-only
 * categories stay map-local and are not sent to Google.
 */
export const GOOGLE_PLACE_TYPES: Partial<Record<ShopCategory, string[]>> = {
  Hardware: ["hardware_store"],
  "General store": ["grocery_store", "supermarket", "convenience_store"],
  Salon: ["hair_salon", "beauty_salon"],
  Garage: ["car_repair", "auto_parts_store"],
};

/** Reverse lookup, used to label a Google result with a Sahiti category. */
export function categoryForGoogleTypes(types: string[]): ShopCategory | null {
  for (const [category, placeTypes] of Object.entries(GOOGLE_PLACE_TYPES) as [
    ShopCategory,
    string[],
  ][]) {
    if (placeTypes.some((type) => types.includes(type))) return category;
  }
  return null;
}

/** One Google place, normalised to the fields this app actually shows. */
export type GoogleShop = {
  id: string;
  name: string;
  category: ShopCategory;
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  ratingCount?: number;
  /** Google's own canonical link for the place. */
  mapsUrl: string;
};

export type GooglePlacesRequest = {
  lat: number;
  lng: number;
  radius?: number;
  /** Restrict the search to one Sahiti category, or omit for all four. */
  category?: ShopCategory;
};

/**
 * Asks our own server for Google listings. The key never reaches the browser.
 *
 * Returns `null` when the server has no key configured, so callers can hide
 * the Google panel rather than showing an error the user cannot act on.
 */
export async function fetchGoogleShops(
  request: GooglePlacesRequest,
): Promise<GoogleShop[] | null> {
  const response = await fetch("/api/places", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  });

  if (response.status === 501) return null;
  if (!response.ok) throw new Error("Google Places lookup failed");

  const body = (await response.json()) as { places?: GoogleShop[] };
  return body.places ?? [];
}
