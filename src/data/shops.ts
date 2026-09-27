// Real businesses in and around Lohegaon, Pune.
//
// Source A: OpenStreetMap curated listings (Overpass, 2026-09-20).
// (c) OpenStreetMap contributors, licensed under the ODbL.
//
// Source B: ADYPU → Lohegaon corridor dataset in
// adypu_lohegaon_businesses.json (SIH PS 26091 gather), merged below.
//
// These are factual listings only. Names, addresses and coordinates are NOT
// scored as investment advice by Sahiti unless a corridor risk note is shown.
//
// Kept in a local file for now. Move to Supabase when hosting.

import { corridorBusinessesToShops, mergeShopLists } from "./corridorBusinesses";

export type ShopCategory =
  | "Hardware"
  | "General store"
  | "Salon"
  | "Garage"
  | "Pharmacy"
  | "Food"
  | "Bakery"
  | "Apparel"
  | "Banking"
  | "Gifts"
  | "Stationery"
  | "Retail"
  | "Mall";

/** Coarse neighbourhood label, used to group and filter the map. */
export type ShopLocality =
  | "Lohegaon Market"
  | "Porwal Road"
  | "DY Patil College Road"
  | "ADYPU & Pride World City"
  | "Dhanori"
  | "Viman Nagar"
  | "Wagholi"
  | "Charholi"
  | "Other Pune areas";

/** Payment methods OpenStreetMap records for a shop. */
export type ShopPayment = "Cash" | "Cards" | "Debit cards" | "Google Pay" | "UPI apps";

export type ShopRiskLevel = "low" | "moderate" | "high";

export type Shop = {
  id: string;
  name: string;
  /** Marathi name, where OpenStreetMap records one. */
  nameMr?: string;
  category: ShopCategory;
  locality: ShopLocality;
  /** Original OpenStreetMap shop tag, kept so the mapping stays auditable. */
  osmTag: string;
  lat: number;
  lng: number;
  shopNo?: string;
  street?: string;
  pincode?: string;
  phone?: string;
  website?: string;
  /** Raw OpenStreetMap opening_hours syntax, e.g. "Mo-Sa 09:00-21:00". */
  openingHours?: string;
  payments?: ShopPayment[];
  wheelchair?: string;
  /** OpenStreetMap element, e.g. "node/123456". Lets anyone re-check the source. */
  osmRef?: string;
  /** Date an OpenStreetMap volunteer last surveyed this record. */
  surveyed?: string;
  /** Where this row came from after the corridor merge. */
  source?: "osm-curated" | "adypu-corridor";
  riskLevel?: ShopRiskLevel;
  riskDescription?: string;
  competitorsNearby?: number;
  recommendedSchemes?: Array<{ name: string; maxAmount?: string; portal?: string }>;
  /** Google-sourced star rating, where the SIH gather recorded one. */
  rating?: number;
  reviewCount?: number;
  /**
   * Corridor analytics from the SIH PS 26091 gather: distances to the two
   * corridor anchors, 400 m commercial density and the computed risk colour.
   */
  corridor?: {
    zone?: string;
    distToAdypuKm?: number;
    distToLohegaonKm?: number;
    density400m?: number;
    riskColor?: string;
    dataSource?: string;
  };
};

export const SHOP_CATEGORIES = [
  "Hardware",
  "General store",
  "Salon",
  "Garage",
  "Pharmacy",
  "Food",
  "Bakery",
  "Apparel",
  "Banking",
  "Gifts",
  "Stationery",
  "Retail",
  "Mall",
] as const satisfies readonly ShopCategory[];

export const SHOP_CATEGORY_COLORS: Record<ShopCategory, string> = {
  Hardware: "#92400E",
  "General store": "#15803D",
  Salon: "#A21CAF",
  Garage: "#0369A1",
  Pharmacy: "#0F766E",
  Food: "#C2410C",
  Bakery: "#B45309",
  Apparel: "#BE185D",
  Banking: "#1D4ED8",
  Gifts: "#7C3AED",
  Stationery: "#475569",
  Retail: "#334155",
  Mall: "#0F172A",
};

/** Display order for the locality filters. */
export const SHOP_LOCALITIES = [
  "Lohegaon Market",
  "Porwal Road",
  "DY Patil College Road",
  "ADYPU & Pride World City",
  "Dhanori",
  "Viman Nagar",
  "Wagholi",
  "Charholi",
  "Other Pune areas",
] as const satisfies readonly ShopLocality[];

/**
 * Groups OpenStreetMap shop tags into the four Sahiti categories.
 *
 * Only tags that unambiguously describe the trade are mapped. Food shops
 * (butcher, bakery), liquor, pharmacies, clothing and furniture are left out
 * on purpose rather than forced into a category that does not fit them.
 */
export const OSM_SHOP_TAG_CATEGORY: Record<string, ShopCategory> = {
  hardware: "Hardware",
  doityourself: "Hardware",
  trade: "Hardware",
  paint: "Hardware",
  lighting: "Hardware",
  tiles: "Hardware",
  general: "General store",
  convenience: "General store",
  supermarket: "General store",
  greengrocer: "General store",
  variety_store: "General store",
  department_store: "General store",
  grocery_store: "General store",
  hairdresser: "Salon",
  beauty: "Salon",
  car_repair: "Garage",
  motorcycle_repair: "Garage",
  car_parts: "Garage",
  tyres: "Garage",
  car: "Garage",
};

export const OSM_SHOPS: Shop[] = [

  // ---- Hardware ----
  {
    id: "hw-1",
    name: "Ambika",
    category: "Hardware",
    locality: "Lohegaon Market",
    osmTag: "hardware",
    lat: 18.561547,
    lng: 73.938773,
    osmRef: "node/10567049009",
    surveyed: "2026-03-09",
  },
  {
    id: "hw-2",
    name: "Hari Om",
    category: "Hardware",
    locality: "Lohegaon Market",
    osmTag: "hardware",
    lat: 18.561031,
    lng: 73.938155,
    osmRef: "node/10567060909",
    surveyed: "2026-03-09",
  },
  {
    id: "hw-3",
    name: "Hutaib",
    category: "Hardware",
    locality: "Lohegaon Market",
    osmTag: "paint",
    lat: 18.560444,
    lng: 73.938116,
    osmRef: "node/10567068410",
    surveyed: "2026-03-12",
  },
  {
    id: "hw-4",
    name: "Nitin Hardware",
    category: "Hardware",
    locality: "Lohegaon Market",
    osmTag: "hardware",
    lat: 18.560745,
    lng: 73.938136,
    osmRef: "node/10567061009",
  },
  {
    id: "hw-5",
    name: "Prince Lights",
    category: "Hardware",
    locality: "Lohegaon Market",
    osmTag: "lighting",
    lat: 18.560238,
    lng: 73.938113,
    osmRef: "node/10567068411",
    surveyed: "2026-03-12",
  },

  // Charholi
  {
    id: "hw-6",
    name: "Aaimata hardware & electrical",
    category: "Hardware",
    locality: "Charholi",
    osmTag: "hardware",
    lat: 18.663528,
    lng: 73.878914,
    osmRef: "node/13956925654",
  },

  // Other Pune areas
  {
    id: "hw-7",
    name: "Choudhary Hardware and Electronics",
    category: "Hardware",
    locality: "Other Pune areas",
    osmTag: "hardware",
    lat: 18.559465,
    lng: 73.949539,
    osmRef: "node/13321301951",
  },
  {
    id: "hw-8",
    name: "Gokul Hardware and Electric",
    nameMr: "गोकुल हार्डवेअर आणि इलेक्ट्रिक",
    category: "Hardware",
    locality: "Other Pune areas",
    osmTag: "hardware",
    lat: 18.55768,
    lng: 73.908973,
    osmRef: "node/13755240907",
  },
  {
    id: "hw-9",
    name: "Om Electric And Hardware Store",
    category: "Hardware",
    locality: "Other Pune areas",
    osmTag: "hardware",
    lat: 18.588054,
    lng: 73.862511,
    osmRef: "node/13380822530",
  },
  {
    id: "hw-10",
    name: "Sai Electricals & Hardware",
    category: "Hardware",
    locality: "Other Pune areas",
    osmTag: "hardware",
    lat: 18.53034,
    lng: 73.95663,
  },

  // ---- General store ----
  {
    id: "gs-1",
    name: "More",
    category: "General store",
    locality: "Lohegaon Market",
    osmTag: "supermarket",
    lat: 18.550808,
    lng: 73.939254,
    osmRef: "node/2183552800",
  },
  {
    id: "gs-2",
    name: "Nirmal Supermarket",
    category: "General store",
    locality: "Lohegaon Market",
    osmTag: "convenience",
    lat: 18.554018,
    lng: 73.943127,
    osmRef: "node/10560854509",
  },
  {
    id: "gs-3",
    name: "Reliance Smart",
    category: "General store",
    locality: "Lohegaon Market",
    osmTag: "supermarket",
    lat: 18.550955,
    lng: 73.937653,
    pincode: "411014",
    website: "https://stores.reliancesmartbazaar.com/reliance-smart-superstore-shopping-outlet-haveli-pune-280435/Home",
    openingHours: "08:00-22:00",
    payments: ["Cash", "Cards", "Debit cards"],
    osmRef: "node/1316290929",
    surveyed: "2024-06-18",
  },

  // Porwal Road
  {
    id: "gs-4",
    name: "Diamond Food Bazar",
    category: "General store",
    locality: "Porwal Road",
    osmTag: "variety_store",
    lat: 18.607546,
    lng: 73.910906,
    street: "Porwal Road",
    pincode: "411047",
    osmRef: "node/9201837357",
  },
  {
    id: "gs-5",
    name: "Gaurav Fresh Mart",
    category: "General store",
    locality: "Porwal Road",
    osmTag: "supermarket",
    lat: 18.605487,
    lng: 73.91008,
    shopNo: "Shop- 23",
    street: "Aeropolis, Porwal Road",
    pincode: "411047",
    openingHours: "Mo-Su 10:00-22:00",
    payments: ["Cash", "Cards", "Debit cards"],
    osmRef: "node/9168854314",
  },
  {
    id: "gs-6",
    name: "More Supermarket",
    category: "General store",
    locality: "Porwal Road",
    osmTag: "supermarket",
    lat: 18.603795,
    lng: 73.909741,
    shopNo: "S No.-281",
    street: "Porwal Road",
    pincode: "411047",
    osmRef: "node/9201582639",
  },
  {
    id: "gs-7",
    name: "Vinayak Super Market",
    category: "General store",
    locality: "Porwal Road",
    osmTag: "grocery_store",
    lat: 18.607492,
    lng: 73.911087,
    street: "Porwal Road",
    pincode: "411047",
    osmRef: "node/9201840582",
  },

  // ADYPU & Pride World City
  {
    id: "gs-8",
    name: "Mahadev super market",
    category: "General store",
    locality: "ADYPU & Pride World City",
    osmTag: "yes",
    lat: 18.618111,
    lng: 73.923621,
    street: "Khandoba Mal Road",
    pincode: "411047",
    osmRef: "node/13380655770",
  },

  // Dhanori
  {
    id: "gs-9",
    name: "Grosery store",
    category: "General store",
    locality: "Dhanori",
    osmTag: "supermarket",
    lat: 18.576008,
    lng: 73.893111,
    shopNo: "Street name",
    street: "Lane No 10",
    pincode: "411032",
    openingHours: "Mo-Su 09:00-22:00",
    payments: ["Cash", "Cards", "Debit cards"],
    osmRef: "node/11258979436",
    surveyed: "2026-03-12",
  },
  {
    id: "gs-10",
    name: "Sakhre General Store",
    category: "General store",
    locality: "Dhanori",
    osmTag: "general",
    lat: 18.58872,
    lng: 73.892039,
    payments: ["Cash"],
    osmRef: "node/13620562761",
    surveyed: "2026-03-05",
  },

  // Viman Nagar
  {
    id: "gs-11",
    name: "Diamond Super Market",
    category: "General store",
    locality: "Viman Nagar",
    osmTag: "convenience",
    lat: 18.569866,
    lng: 73.910916,
    osmRef: "node/1651551912",
  },
  {
    id: "gs-12",
    name: "Dorabjee's - Viman Nagar",
    category: "General store",
    locality: "Viman Nagar",
    osmTag: "supermarket",
    lat: 18.568515,
    lng: 73.907446,
    shopNo: "3 Town Square",
    street: "Airport New Road",
    pincode: "411047",
    website: "https://dorabjeesonline.com/",
    openingHours: "Mo-Su 09:00-21:30",
    osmRef: "node/1800027123",
    surveyed: "2026-03-11",
  },
  {
    id: "gs-13",
    name: "Star Bazaar",
    category: "General store",
    locality: "Viman Nagar",
    osmTag: "supermarket",
    lat: 18.561429,
    lng: 73.917204,
    street: "Nagar Road",
    website: "https://starbazaarindia.com/",
    osmRef: "node/2183552812",
    surveyed: "2026-03-09",
  },

  // Wagholi
  {
    id: "gs-14",
    name: "Bhavani Mart",
    category: "General store",
    locality: "Wagholi",
    osmTag: "supermarket",
    lat: 18.579236,
    lng: 73.972757,
    street: "Nagar Road",
    pincode: "412207",
    osmRef: "node/11811965336",
    surveyed: "2026-03-09",
  },
  {
    id: "gs-15",
    name: "D Mart",
    category: "General store",
    locality: "Wagholi",
    osmTag: "supermarket",
    lat: 18.584608,
    lng: 73.975981,
    street: "Lohgaon - Wagholi Road",
    pincode: "412207",
    openingHours: "Mo-Su 09:00-21:00",
    payments: ["Cash", "Cards", "Debit cards"],
    osmRef: "node/11145678135",
  },
  {
    id: "gs-16",
    name: "Durvient",
    category: "General store",
    locality: "Wagholi",
    osmTag: "convenience",
    lat: 18.579749,
    lng: 73.979891,
    shopNo: "Shop 210, Agarwal Business Hub",
    street: "Baif Road",
    pincode: "412207",
    phone: "+917020935643",
    website: "https://durvient.com",
    openingHours: "Mo-Su 11:00-19:00",
    payments: ["Cash", "Cards"],
    osmRef: "node/12700059596",
  },
  {
    id: "gs-17",
    name: "RELIANCE",
    category: "General store",
    locality: "Wagholi",
    osmTag: "supermarket",
    lat: 18.583992,
    lng: 73.998205,
    osmRef: "node/10219123486",
  },
  {
    id: "gs-18",
    name: "Reliance Fresh",
    category: "General store",
    locality: "Wagholi",
    osmTag: "supermarket",
    lat: 18.584046,
    lng: 73.998206,
    street: "Ivy Estate Road",
    pincode: "412207",
    openingHours: "Mo-Su 09:00-21:00",
    osmRef: "node/7112842763",
  },
  {
    id: "gs-19",
    name: "Siraskar Krushi Trading Company",
    category: "General store",
    locality: "Wagholi",
    osmTag: "supermarket",
    lat: 18.562359,
    lng: 73.979042,
    shopNo: "900",
    street: "Baif Road",
    pincode: "412207",
    phone: "7058737003",
    openingHours: "Mo-Su 09:00-21:00",
    payments: ["Cash"],
    osmRef: "node/9034593770",
  },
  {
    id: "gs-20",
    name: "Star Bazaar",
    category: "General store",
    locality: "Wagholi",
    osmTag: "supermarket",
    lat: 18.583389,
    lng: 73.988365,
    street: "Pune Nagar Road",
    pincode: "412207",
    website: "https://starbazaarindia.com",
    openingHours: "Mo-Su 09:00-21:00",
    payments: ["Cash", "Cards", "Debit cards"],
    osmRef: "node/11145678102",
  },

  // Charholi
  {
    id: "gs-21",
    name: "Me. chaudhary tradus",
    category: "General store",
    locality: "Charholi",
    osmTag: "general",
    lat: 18.661035,
    lng: 73.888595,
    street: "Charholi Road",
    pincode: "412105",
    payments: ["Google Pay"],
    osmRef: "way/1458954907",
  },
  {
    id: "gs-22",
    name: "Nikhil Grocery",
    category: "General store",
    locality: "Charholi",
    osmTag: "supermarket",
    lat: 18.66988,
    lng: 73.890466,
    osmRef: "node/11811106875",
  },
  {
    id: "gs-23",
    name: "Reliance Fresh",
    category: "General store",
    locality: "Charholi",
    osmTag: "supermarket",
    lat: 18.662256,
    lng: 73.887158,
    openingHours: "Mo-Su 08:00-22:00",
    osmRef: "way/1162015978",
  },

  // Other Pune areas
  {
    id: "gs-24",
    name: "Anirudha",
    category: "General store",
    locality: "Other Pune areas",
    osmTag: "greengrocer",
    lat: 18.59071,
    lng: 73.862999,
    osmRef: "node/13385608092",
  },
  {
    id: "gs-25",
    name: "Arav Super Market",
    category: "General store",
    locality: "Other Pune areas",
    osmTag: "general",
    lat: 18.588443,
    lng: 73.862443,
    osmRef: "node/13380877935",
  },
  {
    id: "gs-26",
    name: "D mart",
    category: "General store",
    locality: "Other Pune areas",
    osmTag: "supermarket",
    lat: 18.544444,
    lng: 73.911124,
    street: "Kalyani Nagar",
    osmRef: "node/1899601536",
    surveyed: "2026-03-09",
  },
  {
    id: "gs-27",
    name: "Ganesh Hot Chips",
    category: "General store",
    locality: "Other Pune areas",
    osmTag: "supermarket",
    lat: 18.589397,
    lng: 73.862567,
    osmRef: "node/13385116569",
  },
  {
    id: "gs-28",
    name: "Green Vegetable",
    category: "General store",
    locality: "Other Pune areas",
    osmTag: "greengrocer",
    lat: 18.590995,
    lng: 73.863091,
    osmRef: "node/13385628376",
  },

  // ---- Salon ----
  {
    id: "sl-1",
    name: "Cute Cut",
    category: "Salon",
    locality: "Lohegaon Market",
    osmTag: "hairdresser",
    lat: 18.553975,
    lng: 73.942942,
    osmRef: "node/10560842510",
  },
  {
    id: "sl-2",
    name: "New Super Hair Salon",
    category: "Salon",
    locality: "Lohegaon Market",
    osmTag: "hairdresser",
    lat: 18.560901,
    lng: 73.938724,
    osmRef: "node/10567046714",
    surveyed: "2026-03-09",
  },
  {
    id: "sl-3",
    name: "Sai Shradha Salon",
    category: "Salon",
    locality: "Lohegaon Market",
    osmTag: "hairdresser",
    lat: 18.559066,
    lng: 73.931476,
    osmRef: "node/12299347185",
    surveyed: "2026-03-09",
  },
  {
    id: "sl-4",
    name: "Sana",
    category: "Salon",
    locality: "Lohegaon Market",
    osmTag: "hairdresser",
    lat: 18.554178,
    lng: 73.947377,
    osmRef: "node/10564950112",
  },
  {
    id: "sl-5",
    name: "Tip Top Hair Salon",
    category: "Salon",
    locality: "Lohegaon Market",
    osmTag: "hairdresser",
    lat: 18.56009,
    lng: 73.938623,
    osmRef: "node/10567044110",
    surveyed: "2026-03-12",
  },

  // Dhanori
  {
    id: "sl-6",
    name: "Kirti Beauty Parlour",
    category: "Salon",
    locality: "Dhanori",
    osmTag: "beauty",
    lat: 18.580305,
    lng: 73.882055,
    street: "Dhanori Road",
    pincode: "411015",
    osmRef: "node/10722730127",
    surveyed: "2026-03-15",
  },

  // Wagholi
  {
    id: "sl-7",
    name: "Anuja Beauty Makeover",
    category: "Salon",
    locality: "Wagholi",
    osmTag: "hairdresser",
    lat: 18.586153,
    lng: 73.988225,
    shopNo: "106",
    street: "Bhavadi Road",
    pincode: "412207",
    phone: "7947131829",
    openingHours: "Mon - Wed 10:30 am - 2:00 pm 5:00 pm - 8:30 pm; Fri- Sat 10:30 am - 2:00 pm 5:00 pm - 8:30 pm",
    payments: ["Cash", "UPI apps"],
    osmRef: "node/11924657237",
  },
  {
    id: "sl-8",
    name: "GOOD LOOKS UNISEX SALON",
    category: "Salon",
    locality: "Wagholi",
    osmTag: "hairdresser",
    lat: 18.586316,
    lng: 73.988177,
    shopNo: "Shop no. 6",
    street: "Bhavadi Road",
    pincode: "412207",
    phone: "9923894106",
    openingHours: "Mo-Su 09:00-22:00",
    payments: ["Cash", "UPI apps"],
    osmRef: "node/11924603164",
  },
  {
    id: "sl-9",
    name: "Krishna Men's Saloon",
    category: "Salon",
    locality: "Wagholi",
    osmTag: "hairdresser",
    lat: 18.58599,
    lng: 73.988273,
    shopNo: "110",
    street: "Bavadi Road",
    pincode: "412207",
    openingHours: "Mo-Su 09:00-18:00",
    payments: ["Cash", "UPI apps"],
    osmRef: "node/11924671032",
  },

  // Charholi
  {
    id: "sl-10",
    name: "G9 Mens parlour",
    category: "Salon",
    locality: "Charholi",
    osmTag: "hairdresser",
    lat: 18.661355,
    lng: 73.889552,
    street: "Charholi Road",
    osmRef: "node/13390709433",
  },
  {
    id: "sl-11",
    name: "Monti men's parlour",
    category: "Salon",
    locality: "Charholi",
    osmTag: "hairdresser",
    lat: 18.663489,
    lng: 73.879093,
    osmRef: "node/13956896233",
  },
  {
    id: "sl-12",
    name: "preety's beauty & makeover studio",
    category: "Salon",
    locality: "Charholi",
    osmTag: "beauty",
    lat: 18.663417,
    lng: 73.879558,
    osmRef: "node/13956917896",
  },
  {
    id: "sl-13",
    name: "shivshakti",
    category: "Salon",
    locality: "Charholi",
    osmTag: "hairdresser",
    lat: 18.663425,
    lng: 73.879528,
    osmRef: "node/13956913814",
  },

  // Other Pune areas
  {
    id: "sl-14",
    name: "Arvi's Beauty Maeup Studio",
    category: "Salon",
    locality: "Other Pune areas",
    osmTag: "beauty",
    lat: 18.588091,
    lng: 73.862509,
    osmRef: "node/13380861018",
  },
  {
    id: "sl-15",
    name: "charms parlour",
    category: "Salon",
    locality: "Other Pune areas",
    osmTag: "beauty",
    lat: 18.544781,
    lng: 73.87816,
    street: "Deccan College Road",
    pincode: "411006",
    payments: ["Cash", "Google Pay"],
    osmRef: "node/13380446543",
    surveyed: "2026-03-09",
  },
  {
    id: "sl-16",
    name: "Cool Cut",
    category: "Salon",
    locality: "Other Pune areas",
    osmTag: "hairdresser",
    lat: 18.588725,
    lng: 73.862465,
    pincode: "411031",
    osmRef: "node/13381079897",
  },
  {
    id: "sl-17",
    name: "S Salon by Sentila",
    category: "Salon",
    locality: "Other Pune areas",
    osmTag: "beauty",
    lat: 18.559444,
    lng: 73.949476,
    osmRef: "node/13321301952",
  },
  {
    id: "sl-18",
    name: "Swara Beauty Parlor",
    category: "Salon",
    locality: "Other Pune areas",
    osmTag: "beauty",
    lat: 18.588737,
    lng: 73.862472,
    pincode: "411031",
    osmRef: "node/13381079899",
  },
  {
    id: "sl-19",
    name: "Zahira Salon",
    category: "Salon",
    locality: "Other Pune areas",
    osmTag: "beauty",
    lat: 18.55942,
    lng: 73.949425,
    osmRef: "node/13321301953",
  },

  // ---- Garage ----
  {
    id: "gr-1",
    name: "Automart",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car",
    lat: 18.561359,
    lng: 73.937955,
    osmRef: "node/10567055010",
    surveyed: "2026-03-09",
  },
  {
    id: "gr-2",
    name: "Autonation",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car",
    lat: 18.559258,
    lng: 73.938584,
    osmRef: "node/10567044010",
    surveyed: "2026-03-12",
  },
  {
    id: "gr-3",
    name: "City Bike Garage",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "motorcycle_repair",
    lat: 18.560659,
    lng: 73.938693,
    osmRef: "node/10567046814",
    surveyed: "2026-03-12",
  },
  {
    id: "gr-4",
    name: "Ganesh Automobiles & Lubricants",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car_parts",
    lat: 18.561412,
    lng: 73.938763,
    osmRef: "node/10567044013",
    surveyed: "2026-03-09",
  },
  {
    id: "gr-5",
    name: "Guru Autolines",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car_repair",
    lat: 18.554635,
    lng: 73.947222,
    osmRef: "node/10564950111",
  },
  {
    id: "gr-6",
    name: "Nathulal Automobiles",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car_parts",
    lat: 18.561053,
    lng: 73.938729,
    osmRef: "node/10567044012",
    surveyed: "2026-03-09",
  },
  {
    id: "gr-7",
    name: "National Lubricants",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car_parts",
    lat: 18.560481,
    lng: 73.938119,
    osmRef: "node/10567068409",
  },
  {
    id: "gr-8",
    name: "Natuhal Automobiles & Spare",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car_parts",
    lat: 18.560665,
    lng: 73.938127,
    osmRef: "node/10567064409",
  },
  {
    id: "gr-9",
    name: "New Yash Tyres",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "tyres",
    lat: 18.561172,
    lng: 73.938178,
    osmRef: "node/10567060809",
    surveyed: "2026-03-09",
  },
  {
    id: "gr-10",
    name: "Nirankari Wheels",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "tyres",
    lat: 18.554694,
    lng: 73.937356,
    osmRef: "node/10560840609",
    surveyed: "2026-03-11",
  },
  {
    id: "gr-11",
    name: "Nishant Tyres",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "tyres",
    lat: 18.561534,
    lng: 73.938258,
    osmRef: "node/10567054910",
    surveyed: "2026-03-09",
  },
  {
    id: "gr-12",
    name: "Santosham",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "tyres",
    lat: 18.55999,
    lng: 73.938617,
    osmRef: "node/10567046712",
    surveyed: "2026-03-12",
  },
  {
    id: "gr-13",
    name: "Shree Auto Service",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "motorcycle_repair",
    lat: 18.560048,
    lng: 73.938621,
    osmRef: "node/10567046812",
    surveyed: "2026-03-12",
  },
  {
    id: "gr-14",
    name: "Shrinivas Automobile",
    category: "Garage",
    locality: "Lohegaon Market",
    osmTag: "car_parts",
    lat: 18.561607,
    lng: 73.938263,
    osmRef: "node/10567055109",
    surveyed: "2026-03-09",
  },

  // Porwal Road
  {
    id: "gr-15",
    name: "Car Tech Services",
    category: "Garage",
    locality: "Porwal Road",
    osmTag: "car_repair",
    lat: 18.610217,
    lng: 73.911503,
    street: "Porwal Road",
    pincode: "411047",
    osmRef: "node/9201946142",
  },
  {
    id: "gr-16",
    name: "Choice Auto Spares and Service Point",
    category: "Garage",
    locality: "Porwal Road",
    osmTag: "motorcycle_repair",
    lat: 18.607407,
    lng: 73.911062,
    shopNo: "296",
    street: "Porwal Road",
    pincode: "411047",
    osmRef: "node/9201763013",
  },

  // Dhanori
  {
    id: "gr-17",
    name: "Motul Service Centre",
    category: "Garage",
    locality: "Dhanori",
    osmTag: "motorcycle_repair",
    lat: 18.59392,
    lng: 73.893065,
    osmRef: "node/13648780641",
    surveyed: "2026-03-15",
  },

  // Viman Nagar
  {
    id: "gr-18",
    name: "Merchant Motors",
    category: "Garage",
    locality: "Viman Nagar",
    osmTag: "car",
    lat: 18.56079,
    lng: 73.918664,
    osmRef: "node/10567167409",
    surveyed: "2026-03-09",
  },

  // Wagholi
  {
    id: "gr-19",
    name: "Apollo Tyres",
    category: "Garage",
    locality: "Wagholi",
    osmTag: "tyres",
    lat: 18.579247,
    lng: 73.975056,
    osmRef: "node/10219123497",
  },
  {
    id: "gr-20",
    name: "KAMAL REPAIR",
    category: "Garage",
    locality: "Wagholi",
    osmTag: "motorcycle_repair",
    lat: 18.579648,
    lng: 73.97488,
    osmRef: "node/10219123496",
  },

  // Charholi
  {
    id: "gr-21",
    name: "Gurumauli",
    category: "Garage",
    locality: "Charholi",
    osmTag: "motorcycle_repair",
    lat: 18.661726,
    lng: 73.886213,
    osmRef: "node/13951919969",
  },
  {
    id: "gr-22",
    name: "JMC Auto services",
    category: "Garage",
    locality: "Charholi",
    osmTag: "car_repair",
    lat: 18.662702,
    lng: 73.884015,
    osmRef: "way/1531322589",
  },
  {
    id: "gr-23",
    name: "Maruti Suzuki and service",
    category: "Garage",
    locality: "Charholi",
    osmTag: "car",
    lat: 18.65871,
    lng: 73.885765,
    street: "Sant Dyaneshwar Marg",
    pincode: "412105",
    osmRef: "node/13392537074",
  },
  {
    id: "gr-24",
    name: "RS AUTO WORKS",
    category: "Garage",
    locality: "Charholi",
    osmTag: "car_repair",
    lat: 18.662783,
    lng: 73.882915,
    osmRef: "node/13956893384",
  },

  // Other Pune areas
  {
    id: "gr-25",
    name: "SK Pune Auto Garage",
    category: "Garage",
    locality: "Other Pune areas",
    osmTag: "motorcycle_repair",
    lat: 18.588667,
    lng: 73.862456,
    pincode: "411031",
    osmRef: "node/13380912462",
  },
  {
    id: "gr-26",
    name: "Tata",
    category: "Garage",
    locality: "Other Pune areas",
    osmTag: "car",
    lat: 18.61542,
    lng: 73.8463,
    street: "Pune Nashik Road",
  },
  {
    id: "gr-27",
    name: "Yusuf Auto Garage",
    category: "Garage",
    locality: "Other Pune areas",
    osmTag: "motorcycle_repair",
    lat: 18.629718,
    lng: 73.850766,
    street: "Dhawade Vasti",
    pincode: "411039",
    openingHours: "Tu-Su 7:00-22:00",
    payments: ["Cash"],
    osmRef: "way/1544854777",
  },
];

/** One-line address, saying so plainly when OpenStreetMap has no address. */
export function formatShopAddress(shop: Shop): string {
  const street = [shop.shopNo, shop.street].filter(Boolean).join(" ");
  const parts = [street, shop.pincode].filter((part) => part && part.length > 0);
  return parts.length > 0
    ? parts.join(" · ")
    : "Address not recorded in OpenStreetMap";
}

/** Coordinates to OpenStreetMap's usual 5 decimal places. */
export function formatShopCoordinates(shop: Shop): string {
  return shop.lat.toFixed(5) + ", " + shop.lng.toFixed(5);
}

/** How many shops sit in each category. Drives the filter chip counts. */
export function countByCategory(shops: Shop[]): Record<ShopCategory, number> {
  const counts = Object.fromEntries(SHOP_CATEGORIES.map((category) => [category, 0])) as Record<
    ShopCategory,
    number
  >;
  for (const shop of shops) counts[shop.category] += 1;
  return counts;
}

/** Curated OSM belt plus the ADYPU–Lohegaon corridor gather, deduped by OSM id / coordinate. */
export const SHOPS: Shop[] = mergeShopLists(
  OSM_SHOPS.map((shop) => ({ ...shop, source: "osm-curated" as const })),
  corridorBusinessesToShops(),
);
