import type { Shop } from "@/data/shops";
import { SHOPS } from "@/data/shops";
import { haversineKm } from "@/lib/feasibility";

/**
 * Sahiti Rating: a 0-10 score of how promising a spot is for opening a
 * business, built from a S.W.O.T. read of the corridor dataset:
 *
 *   Strengths     — footfall anchors (ADYPU campus, Lohegaon junction)
 *   Weaknesses    — how directly the same trade already surrounds the spot
 *   Opportunities — thin overall commerce (room to grow the street)
 *   Threats       — very close same-trade rivals ready to absorb demand
 *
 * The rating is based on SWOT overall: the four sub-scores are averaged, so a
 * spot needs to hold up across all four to score well.
 */

const ADYPU_COORDS = { lat: 18.6226, lng: 73.9063 };
const LOHEGAON_COORDS = { lat: 18.5955, lng: 73.9268 };

/** Radius within which a same-trade shop counts as direct competition. */
const RIVAL_RADIUS_KM = 0.5;
/** Radius within which any commercial activity counts as street activity. */
const STREET_RADIUS_KM = 0.4;

export type SwotRating = {
  /** Overall 0-10, average of the four S.W.O.T. sub-scores. */
  score: number;
  strength: number;
  weakness: number;
  opportunity: number;
  threats: number;
  rivals: number;
  streetActivity: number;
  footfall: string;
  nearestRival: { name: string; distanceMeters: number } | null;
  verdict: string;
  advice: string;
};

function clamp0to10(value: number): number {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

/**
 * Rate a coordinate for opening a business of `category` there. When a
 * specific existing `shop` is passed, the rating is for that shop's own
 * spot: its exact coordinates, its trade as the category.
 */
export function rateLocation(options: {
  lat: number;
  lng: number;
  /** Sahiti shop category, e.g. "Pharmacy". */
  category: string;
  /** An existing shop: rate that shop at its own location. */
  shop?: Shop;
}): SwotRating {
  const { lat, lng, category } = options;
  const needle = category.toLowerCase();

  let rivals = 0;
  let streetActivity = 0;
  let nearestRival: { name: string; distanceMeters: number } | null = null;
  let nearestRivalKm = Number.POSITIVE_INFINITY;

  for (const other of SHOPS) {
    const distKm = haversineKm(lat, lng, other.lat, other.lng);
    if (distKm > RIVAL_RADIUS_KM) continue;

    streetActivity += 1;
    const sameTrade =
      other.category.toLowerCase().includes(needle) ||
      needle.includes(other.category.toLowerCase());
    if (sameTrade) {
      rivals += 1;
      if (distKm < nearestRivalKm) {
        nearestRivalKm = distKm;
        nearestRival = { name: other.name, distanceMeters: Math.round(distKm * 1000) };
      }
    }
  }

  // Strength: anchors pull steady footfall. Closer is stronger.
  const distAdypu = haversineKm(lat, lng, ADYPU_COORDS.lat, ADYPU_COORDS.lng);
  const distLohegaon = haversineKm(lat, lng, LOHEGAON_COORDS.lat, LOHEGAON_COORDS.lng);
  const anchorKm = Math.min(distAdypu, distLohegaon);
  const strength = clamp0to10(10 - anchorKm * 1.4);

  // Weakness: crowding in the same trade is the weakness. 0 rivals = strong.
  const weakness = clamp0to10(10 - rivals * 2.2);

  // Opportunity: thin overall commerce leaves room to define the street.
  const opportunity = clamp0to10(10 - streetActivity * 0.9);

  // Threats: a rival right next door absorbs demand first.
  const threatProximity = Number.isFinite(nearestRivalKm)
    ? Math.min(nearestRivalKm / RIVAL_RADIUS_KM, 1)
    : 1;
  const threats = clamp0to10(2 + threatProximity * 8 - rivals * 0.6);

  const score = clamp0to10((strength + weakness + opportunity + threats) / 4);

  let verdict: string;
  if (score >= 7) {
    verdict = "Strong potential. This spot supports a new business well.";
  } else if (score >= 5) {
    verdict = "Workable. Come in with a clear edge over the shops nearby.";
  } else {
    verdict = "Tough spot. The trade you plan is already crowded right here.";
  }

  let advice: string;
  if (rivals === 0) {
    advice = "No same-trade shop within 500 m. Early-mover advantage is yours to take.";
  } else if (rivals <= 2) {
    advice = `A couple of ${category.toLowerCase()} shops are nearby. Compete on hours, delivery or a niche line.`;
  } else {
    advice = `${rivals} ${category.toLowerCase()} shops already trade within 500 m. Consider a different category or a different spot.`;
  }

  return {
    score,
    strength,
    weakness,
    opportunity,
    threats,
    rivals,
    streetActivity,
    footfall:
      distAdypu < 1
        ? "ADYPU student belt"
        : distLohegaon < 1
          ? "Lohegaon market core"
          : anchorKm < 3
            ? "Between the two anchors"
            : "Outer corridor",
    nearestRival,
    verdict,
    advice,
  };
}
