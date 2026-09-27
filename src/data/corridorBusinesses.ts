import corridorRaw from "./adypu_lohegaon_businesses.json";
import type { Shop, ShopCategory, ShopLocality } from "./shops";

/**
 * ADYPU → Lohegaon corridor dataset (SIH PS 26091).
 * Source: OpenStreetMap Overpass gather in sih_adypu_lohegaon_data.
 */

export type CorridorSaturation =
  | "LOW RISK (HIGH OPPORTUNITY)"
  | "MODERATE RISK"
  | "HIGH RISK"
  | string;

export type CorridorBusiness = {
  id: number | string;
  osm_type: string;
  name: string;
  category: string;
  rating?: number;
  review_count?: number;
  raw_tags?: Record<string, string>;
  lat: number;
  lon: number;
  dist_to_adypu_km?: number;
  dist_to_lohegaon_km?: number;
  corridor_zone?: string;
  street?: string;
  competitors_within_400m?: number;
  total_commercial_density_400m?: number;
  saturation_risk?: CorridorSaturation;
  risk_description?: string;
  risk_color?: string;
  data_source?: string;
  recommended_schemes?: Array<{
    name: string;
    tier?: string;
    max_amount?: string;
    features?: string;
    portal?: string;
  }>;
};

const CATEGORY_MAP: Record<string, ShopCategory> = {
  "Pharmacy & Healthcare": "Pharmacy",
  "Banking & Financial Services": "Banking",
  "Grocery & Daily Needs / Kirana": "General store",
  "Food, Cafe & Eateries": "Food",
  "Electronics, Mobile & Hardware": "Hardware",
  "Apparel, Tailoring & Footwear": "Apparel",
  "Gifts, Jewelry & Home Goods": "Gifts",
  "Bakery & Sweets": "Bakery",
  "Auto Repair & Garage": "Garage",
  "Stationery, Xerox & Education Needs": "Stationery",
  "General Retail & Services": "Retail",
  "Shopping Center & Complex": "Mall",
};

function localityForZone(zone: string | undefined): ShopLocality {
  if (!zone) return "Other Pune areas";
  if (zone.includes("ADYPU") || zone.includes("Charholi")) return "ADYPU & Pride World City";
  if (zone.includes("Lohegaon")) return "Lohegaon Market";
  if (zone.includes("Dhanori")) return "Dhanori";
  if (zone.includes("Wagholi")) return "Wagholi";
  return "Other Pune areas";
}

function osmTagFromRaw(raw: Record<string, string> | undefined): string {
  if (!raw) return "corridor";
  return raw["shop"] ?? raw["amenity"] ?? raw["craft"] ?? raw["office"] ?? "corridor";
}

function riskLevel(raw: string | undefined): Shop["riskLevel"] {
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  if (upper.includes("LOW") || upper.includes("OPPORTUNITY")) return "low";
  if (upper.includes("HIGH") || upper.includes("SATURAT")) return "high";
  if (upper.includes("MODERATE")) return "moderate";
  return undefined;
}

/** Colour the SIH gather computed for a risk level; used to tint pins. */
function riskColor(row: CorridorBusiness): string | undefined {
  if (row.risk_color) return row.risk_color;
  const level = riskLevel(row.saturation_risk);
  if (level === "low") return "#10b981";
  if (level === "moderate") return "#f59e0b";
  if (level === "high") return "#ef4444";
  return undefined;
}

/** Convert the corridor JSON into Sahiti shop records. */
export function corridorBusinessesToShops(
  rows: CorridorBusiness[] = corridorRaw as CorridorBusiness[],
): Shop[] {
  const shops: Shop[] = [];
  for (const row of rows) {
    if (!Number.isFinite(row.lat) || !Number.isFinite(row.lon)) continue;
    const category = CATEGORY_MAP[row.category] ?? "Retail";
    const osmRef = row.osm_type && row.id ? `${row.osm_type}/${row.id}` : undefined;
    const level = riskLevel(row.saturation_risk);
    shops.push({
      id: `corridor-${row.osm_type ?? "node"}-${row.id}`,
      name: row.name,
      category,
      locality: localityForZone(row.corridor_zone),
      osmTag: osmTagFromRaw(row.raw_tags),
      lat: row.lat,
      lng: row.lon,
      source: "adypu-corridor",
      corridor: {
        zone: row.corridor_zone,
        distToAdypuKm: row.dist_to_adypu_km,
        distToLohegaonKm: row.dist_to_lohegaon_km,
        density400m: row.total_commercial_density_400m,
        riskColor: riskColor(row),
        dataSource: row.data_source,
      },
      ...(Number.isFinite(row.rating) ? { rating: row.rating } : {}),
      ...(Number.isFinite(row.review_count) ? { reviewCount: row.review_count } : {}),
      ...(row.street ? { street: row.street } : {}),
      ...(osmRef ? { osmRef } : {}),
      ...(level ? { riskLevel: level } : {}),
      ...(row.risk_description ? { riskDescription: row.risk_description } : {}),
      ...(row.competitors_within_400m !== undefined
        ? { competitorsNearby: row.competitors_within_400m }
        : {}),
      ...(row.recommended_schemes && row.recommended_schemes.length > 0
        ? {
            recommendedSchemes: row.recommended_schemes.map((scheme) => ({
              name: scheme.name,
              ...(scheme.max_amount ? { maxAmount: scheme.max_amount } : {}),
              ...(scheme.portal ? { portal: scheme.portal } : {}),
            })),
          }
        : {}),
    });
  }
  return shops;
}

/**
 * Prefer curated OSM rows when the same OpenStreetMap element appears in both
 * lists; otherwise keep both. Dedupes near-identical coordinates as a fallback.
 */
export function mergeShopLists(primary: Shop[], extra: Shop[]): Shop[] {
  const byOsm = new Set<string>();
  const used = new Set<string>();
  const merged: Shop[] = [];

  for (const shop of primary) {
    merged.push(shop);
    if (shop.osmRef) byOsm.add(shop.osmRef);
    used.add(coordKey(shop.lat, shop.lng));
  }

  for (const shop of extra) {
    if (shop.osmRef && byOsm.has(shop.osmRef)) continue;
    const key = coordKey(shop.lat, shop.lng);
    if (used.has(key)) continue;
    merged.push(shop);
    used.add(key);
    if (shop.osmRef) byOsm.add(shop.osmRef);
  }

  return merged;
}

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export const CORRIDOR_BUSINESS_COUNT = (corridorRaw as CorridorBusiness[]).length;
