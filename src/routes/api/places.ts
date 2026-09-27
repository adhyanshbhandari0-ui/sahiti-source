import { createFileRoute } from "@tanstack/react-router";
import type { ShopCategory } from "@/data/shops";
import { serverSecret } from "@/lib/loadDotEnv";
import {
  GOOGLE_PLACE_TYPES,
  categoryForGoogleTypes,
  googleMapsSearchUrl,
  type GoogleShop,
} from "@/lib/googleMaps";

/**
 * Server-side wrapper around Google's Nearby Search (New).
 *
 * This is the only half of the Google integration that needs a key, and the
 * key stays here on the server rather than being shipped to the browser.
 *
 *   GOOGLE_MAPS_API_KEY=...    # Google Cloud key with "Places API (New)" enabled
 *
 * With no key set the route answers 501, which the client reads as "Google is
 * not connected" and hides the Google panel. Nothing else in the app depends
 * on it, so the site works fully without one.
 */

const ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby";

/**
 * Fields to request. `rating` and `userRatingCount` fall in Google's Enterprise
 * SKU, which bills higher than the rest. Drop those two lines for the cheaper
 * tier and the UI simply stops showing a rating.
 */
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
].join(",");

/** Every type we ever ask for, used when no category filter is supplied. */
const ALL_TYPES = Object.values(GOOGLE_PLACE_TYPES).flatMap((types) => types ?? []);

/**
 * Requests are clamped to the region this app actually covers. That keeps a
 * caller from repurposing the endpoint as a general-purpose geocoder on our
 * bill.
 */
const BOUNDS = { minLat: 18.3, maxLat: 18.9, minLng: 73.6, maxLng: 74.3 };
const MAX_RADIUS = 50_000;

type PlacesPayload = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    types?: string[];
    googleMapsUri?: string;
    rating?: number;
    userRatingCount?: number;
  }>;
};

function reply(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/places")({
  server: {
    handlers: {
      /**
       * Reports whether Google is wired up. The UI calls this once so it can
       * hide the Google panel entirely instead of offering a button that
       * cannot work. Costs nothing, unlike a real search.
       */
      GET: async () => reply({ enabled: Boolean(serverSecret("GOOGLE_MAPS_API_KEY")) }, 200),

      POST: async ({ request }) => {
        // Validate the caller's input before looking at our own configuration,
        // so a malformed request is reported as such either way.
        let body: { lat?: unknown; lng?: unknown; radius?: unknown; category?: unknown };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return reply({ error: "Request body must be JSON" }, 400);
        }

        const lat = Number(body.lat);
        const lng = Number(body.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return reply({ error: "lat and lng are required" }, 400);
        }
        if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat || lng < BOUNDS.minLng || lng > BOUNDS.maxLng) {
          return reply({ error: "Coordinates are outside the supported area" }, 400);
        }

        const apiKey = serverSecret("GOOGLE_MAPS_API_KEY");
        if (!apiKey) {
          return reply({ error: "Google Places is not configured" }, 501);
        }

        const requestedRadius = Number(body.radius);
        const radius = Number.isFinite(requestedRadius)
          ? Math.min(Math.max(requestedRadius, 100), MAX_RADIUS)
          : 1500;

        const category = body.category as ShopCategory | undefined;
        const includedTypes =
          category && GOOGLE_PLACE_TYPES[category] ? GOOGLE_PLACE_TYPES[category] : ALL_TYPES;

        let payload: PlacesPayload;
        try {
          const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask": FIELD_MASK,
            },
            body: JSON.stringify({
              includedTypes,
              maxResultCount: 20,
              rankPreference: "DISTANCE",
              languageCode: "en",
              regionCode: "IN",
              locationRestriction: {
                circle: { center: { latitude: lat, longitude: lng }, radius },
              },
            }),
          });

          if (!response.ok) {
            // Google's own message is more useful than a generic failure, but
            // never echo the key back.
            const detail = await response.text();
            return reply(
              { error: "Google Places rejected the request", detail: detail.slice(0, 500) },
              502,
            );
          }
          payload = (await response.json()) as PlacesPayload;
        } catch {
          return reply({ error: "Could not reach Google Places" }, 502);
        }

        const places: GoogleShop[] = [];
        for (const place of payload.places ?? []) {
          const name = place.displayName?.text;
          const placeLat = place.location?.latitude;
          const placeLng = place.location?.longitude;
          if (!name || !Number.isFinite(placeLat) || !Number.isFinite(placeLng)) continue;

          // Google returns shoals of type labels; only keep places that land in
          // one of our four categories.
          const shopCategory = categoryForGoogleTypes(place.types ?? []);
          if (!shopCategory) continue;

          places.push({
            id: place.id ?? `${placeLat},${placeLng}`,
            name,
            category: shopCategory,
            lat: placeLat as number,
            lng: placeLng as number,
            address: place.formattedAddress ?? "",
            mapsUrl:
              place.googleMapsUri ??
              googleMapsSearchUrl(name, placeLat as number, placeLng as number),
            // exactOptionalPropertyTypes means these are spread in, not set to
            // undefined.
            ...(place.rating === undefined ? {} : { rating: place.rating }),
            ...(place.userRatingCount === undefined ? {} : { ratingCount: place.userRatingCount }),
          });
        }

        return reply({ places }, 200);
      },
    },
  },
});
