"""
SIH Problem Statement 26091: Hyper-Local Business Advisory & Financial Structuring Engine
FastAPI Backend with ONDC (Beckn Protocol) & Geospatial Risk Engine
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import json
import math
import os

# Base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = FastAPI(
    title="SIH PS 26091: Hyper-Local SME Advisory & Financial Structuring API",
    description="AI-driven feasibility scoring, competition mapping, ONDC retail discovery, and government credit structuring for micro-enterprises.",
    version="2.0.0"
)

# Enable CORS for frontend and Leaflet dashboards
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load datasets
def load_json_file(filename: str):
    path = os.path.join(BASE_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

ADYPU_COORDS = (18.6226, 73.9063)
LOHEGAON_COORDS = (18.5955, 73.9268)

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 3)

# ----------------- Models -----------------
class LocationRiskRequest(BaseModel):
    lat: float = Field(..., example=18.6150)
    lon: float = Field(..., example=73.9120)
    business_type: str = Field(..., example="Grocery & Daily Needs / Kirana")
    proposed_investment_inr: float = Field(default=200000.0, example=150000.0)
    radius_km: float = Field(default=0.5, example=0.5)

class BecknSearchIntent(BaseModel):
    domain: str = Field(default="nic2004:52110", example="nic2004:52110")
    query_item: str = Field(default="grocery", example="grocery")
    latitude: float = Field(default=18.6080, example=18.6080)
    longitude: float = Field(default=73.9110, example=73.9110)

class ONDCOnboardingChecklist(BaseModel):
    store_name: str
    has_udyam_or_pan: bool = True
    has_bank_account_and_upi: bool = True
    has_smartphone_pos: bool = True
    product_category: str = "Grocery & Staples"

class AskMapsAdvisorQuery(BaseModel):
    query: str = Field(..., example="Should I start a snack and coffee corner near ADYPU gate? How much loan can I get?")

# ----------------- Endpoints -----------------

@app.get("/")
def root():
    return {
        "project": "SIH Problem Statement 26091",
        "title": "AI Hyper-Local SME Advisory & Financial Structuring Assistant",
        "corridor": "ADYPU (Charholi) <-> Lohegaon Central, Pune",
        "docs_url": "/docs",
        "status": "active",
        "data_sources": [
            "OpenStreetMap (Overpass API)",
            "Google Maps (Safari Harvested Places & Ratings)",
            "Mappls (MapmyIndia Verified)",
            "PM SVANidhi Official Portal",
            "PMMY Mudra (Tarun Plus 20L Slab)",
            "ONDC (Beckn Protocol Retail Registry)"
        ]
    }

@app.get("/api/businesses")
def get_businesses(
    category: Optional[str] = None,
    zone: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 150
):
    """Retrieve all commercial establishments in the corridor with rich filters"""
    data = load_json_file("adypu_lohegaon_businesses.json")
    results = []

    for b in data:
        if category and category.lower() not in b.get("category", "").lower():
            continue
        if zone and zone.lower() not in b.get("corridor_zone", "").lower():
            continue
        if risk_level and risk_level.upper() not in b.get("saturation_risk", "").upper():
            continue
        if search and search.lower() not in b.get("name", "").lower():
            continue
        results.append(b)

    return {
        "count": len(results),
        "total_in_corridor": len(data),
        "results": results[:limit]
    }

@app.get("/api/market-summary")
def get_market_summary():
    """Retrieve macro sector breakdown, risk distribution, and key corridor coordinates"""
    return load_json_file("risk_and_market_summary.json")

@app.get("/api/schemes")
def get_financial_schemes():
    """Retrieve all official government financial schemes, slabs, and live metrics"""
    return load_json_file("gov_schemes_and_stats.json")

@app.post("/api/risk-assessment")
def assess_location_risk(req: LocationRiskRequest):
    """
    Hyper-Local Risk & Saturation Assessment Engine
    Calculates competition density, nearest competitors, demand proximity, and matched loans.
    """
    data = load_json_file("adypu_lohegaon_businesses.json")
    
    competitors = []
    total_density = 0

    for b in data:
        dist = haversine_km(req.lat, req.lon, b["lat"], b["lon"])
        if dist <= req.radius_km:
            total_density += 1
            if req.business_type.lower() in b.get("category", "").lower():
                competitors.append({
                    "name": b["name"],
                    "distance_meters": int(dist * 1000),
                    "rating": b.get("rating", "N/A"),
                    "review_count": b.get("review_count", 0),
                    "source": b.get("data_source", "OSM")
                })

    competitors.sort(key=lambda x: x["distance_meters"])
    comp_count = len(competitors)

    # Risk Scoring Algorithm (0 - 100)
    # Higher score = higher saturation risk
    base_score = min(comp_count * 18, 90)
    dist_adypu = haversine_km(req.lat, req.lon, ADYPU_COORDS[0], ADYPU_COORDS[1])
    dist_lohegaon = haversine_km(req.lat, req.lon, LOHEGAON_COORDS[0], LOHEGAON_COORDS[1])

    # Footfall demand modifier: Near university or urban junction provides footfall cushion
    footfall_factor = "High Footfall (Student/Youth Cluster)" if dist_adypu < 1.0 else (
        "High Footfall (Dense Residential Junction)" if dist_lohegaon < 1.0 else "Emerging Suburban Corridor"
    )

    if comp_count >= 5:
        risk_level = "HIGH RISK"
        verdict = "Over-saturated micro-zone. High cannibalization risk from established nearby stores."
        action_advice = "Avoid starting an identical store here unless you offer specialized niche inventory, 24/7 delivery, or substantial price advantage."
    elif comp_count >= 2:
        risk_level = "MODERATE RISK"
        verdict = "Competitive but viable micro-zone. Market has existing players with moderate ratings."
        action_advice = "Differentiate by onboarding onto ONDC for hyperlocal online orders and offering digital UPI loyalty."
    else:
        risk_level = "LOW RISK (PRIME OPPORTUNITY)"
        verdict = "Underserved pocket! Strong market opportunity with low direct competition."
        action_advice = "Highly recommended spot. Secure early mover advantage and apply for working capital finance."

    # Loan structuring recommendation
    inv = req.proposed_investment_inr
    matched_loans = []

    if inv <= 50000:
        matched_loans.append({
            "scheme": "PM SVANidhi (Tranche 1 & 2)",
            "limit": "₹10,000 to ₹25,000",
            "features": "7% Interest Subsidy + Credit Card + No Collateral"
        })
        matched_loans.append({
            "scheme": "PMMY MUDRA - Shishu",
            "limit": "Up to ₹50,000",
            "features": "Instant MUDRA Card for daily working capital"
        })
    elif inv <= 500000:
        matched_loans.append({
            "scheme": "PMMY MUDRA - Kishore",
            "limit": "₹50,000 to ₹5,00,000",
            "features": "Ideal for shop interior, refrigeration, inventory stock"
        })
        matched_loans.append({
            "scheme": "MoSJE NBCFDC / NSFDC Term Loan",
            "limit": "Up to ₹5,00,000",
            "features": "Concessional 5%-6% per annum interest for backward class/SC entrepreneurs"
        })
    else:
        matched_loans.append({
            "scheme": "PMMY MUDRA - Tarun & Tarun Plus",
            "limit": "₹5 Lakhs to ₹20 Lakhs",
            "features": "Large supermarket setup, wholesale stocking, machinery"
        })

    return {
        "location": {"lat": req.lat, "lon": req.lon},
        "target_category": req.business_type,
        "search_radius_meters": int(req.radius_km * 1000),
        "competition_metrics": {
            "direct_competitors_count": comp_count,
            "total_commercial_density": total_density,
            "nearest_competitors": competitors[:5]
        },
        "feasibility_assessment": {
            "saturation_risk_score": min(base_score + 10, 100),
            "risk_level": risk_level,
            "footfall_context": footfall_factor,
            "verdict": verdict,
            "strategic_advice": action_advice
        },
        "financial_structuring": {
            "proposed_budget_inr": inv,
            "recommended_loan_schemes": matched_loans,
            "application_gateway": "https://www.jansamarth.in/"
        }
    }

# ----------------- ONDC (Beckn Protocol) Integration -----------------

@app.post("/api/ondc/search")
def ondc_beckn_search(intent: BecknSearchIntent):
    """
    ONDC Beckn Protocol BAP Search Discovery
    Simulates searching for local ONDC-registered retail sellers around ADYPU-Lohegaon.
    """
    # Sample real verified stores from Google Maps & Mappls mapped to ONDC Beckn format
    network_sellers = [
        {
            "bpp_id": "bpp.mystore.in",
            "bpp_uri": "https://bpp.mystore.in/ondc",
            "provider": {
                "id": "ondc_prov_001",
                "descriptor": {
                    "name": "Viara Food Store & Groceries",
                    "short_desc": "Healthy Organic Groceries & Staples",
                    "images": ["https://via.placeholder.com/150"]
                },
                "rating": 5.0,
                "location": {"gps": "18.610669,73.911487", "address": "Lohegaon Road, Pune"},
                "fulfillments": [{"type": "Delivery", "time": "30 mins"}],
                "items": [
                    {"id": "item_1", "name": "Fresh Atta (5kg)", "price": {"currency": "INR", "value": "220.00"}},
                    {"id": "item_2", "name": "Organic Tur Dal (1kg)", "price": {"currency": "INR", "value": "165.00"}}
                ]
            }
        },
        {
            "bpp_id": "bpp.sellerapp.com",
            "bpp_uri": "https://ondc.sellerapp.com",
            "provider": {
                "id": "ondc_prov_002",
                "descriptor": {
                    "name": "Krishna Fresh Mart",
                    "short_desc": "Daily Dairy, Milk & Vegetables",
                    "images": ["https://via.placeholder.com/150"]
                },
                "rating": 4.8,
                "location": {"gps": "18.609281,73.911150", "address": "Dhanori-Lohegaon Rd"},
                "fulfillments": [{"type": "Delivery", "time": "20 mins"}],
                "items": [
                    {"id": "item_3", "name": "Pasteurized Milk (1L)", "price": {"currency": "INR", "value": "66.00"}},
                    {"id": "item_4", "name": "Fresh Paneer (200g)", "price": {"currency": "INR", "value": "90.00"}}
                ]
            }
        },
        {
            "bpp_id": "bpp.magicpin.in",
            "bpp_uri": "https://ondc.magicpin.in",
            "provider": {
                "id": "ondc_prov_003",
                "descriptor": {
                    "name": "Foodie Fuel & Dyp Tuk Shop",
                    "short_desc": "Campus Quick Snacks & Beverages",
                    "images": ["https://via.placeholder.com/150"]
                },
                "rating": 4.4,
                "location": {"gps": "18.622100,73.906500", "address": "ADYPU Campus Gate, Charholi"},
                "fulfillments": [{"type": "Pickup/Delivery", "time": "15 mins"}],
                "items": [
                    {"id": "item_5", "name": "Cold Coffee (300ml)", "price": {"currency": "INR", "value": "70.00"}},
                    {"id": "item_6", "name": "Cheese Grilled Sandwich", "price": {"currency": "INR", "value": "110.00"}}
                ]
            }
        }
    ]

    return {
        "context": {
            "domain": intent.domain,
            "action": "on_search",
            "country": "IND",
            "city": "std:020",
            "core_version": "1.2.0",
            "bap_id": "sih26091.advisory.bap",
            "bap_uri": "https://sih26091.advisory.bap/ondc"
        },
        "message": {
            "catalog": {
                "bpp/descriptor": {"name": "ONDC Pune Local Seller Network"},
                "bpp/providers": network_sellers
            }
        }
    }

@app.post("/api/ondc/onboard-readiness")
def ondc_onboarding_readiness(check: ONDCOnboardingChecklist):
    """
    Evaluates micro-enterprise ONDC digital readiness and OCEN credit unlock potential.
    """
    score = 0
    checklist_status = {}

    if check.has_udyam_or_pan:
        score += 30
        checklist_status["KYC / Business Identity"] = "VERIFIED (Udyam / PAN)"
    else:
        checklist_status["KYC / Business Identity"] = "ACTION NEEDED: Register on udyamregistration.gov.in (100% Free)"

    if check.has_bank_account_and_upi:
        score += 35
        checklist_status["Digital Banking & QR"] = "READY (UPI QR & Current/Savings Account)"
    else:
        checklist_status["Digital Banking & QR"] = "ACTION NEEDED: Open Bank account and generate UPI Soundbox/QR"

    if check.has_smartphone_pos:
        score += 35
        checklist_status["Catalog & Smartphone Order App"] = "READY (Android / iOS Seller App)"
    else:
        checklist_status["Catalog & Smartphone Order App"] = "ACTION NEEDED: Download ONDC Seller App (e.g. Mystore Seller / SellerApp)"

    is_ready = score >= 70

    return {
        "store_name": check.store_name,
        "readiness_score": score,
        "status": "ONDC READY" if is_ready else "ONBOARDING REQUIRED",
        "checklist": checklist_status,
        "credit_enablement_synergy": {
            "ocen_protocol_benefit": "Selling on ONDC generates verifiable digital transaction logs (GSTN/UPI).",
            "lending_partner_unlock": "Lenders on JanSamarth & Sahamati Account Aggregator offer pre-approved Mudra Kishore loans based on your monthly ONDC sales without requiring property collateral!"
        },
        "onboarding_portal": "https://ondc.org/how-to-join/"
    }

# ----------------- Ask Maps Conversational Advisor -----------------

@app.post("/api/ask-maps-advisor")
def ask_maps_advisor(req: AskMapsAdvisorQuery):
    """
    'Ask Maps' for Micro-Entrepreneurs:
    Conversational AI advisor answering natural language business & loan questions for the corridor.
    """
    q = req.query.lower()
    
    if "adypu" in q and ("cafe" in q or "snack" in q or "coffee" in q or "food" in q):
        return {
            "query": req.query,
            "feasibility": "VERY HIGH",
            "competitor_summary": "There are ~20 eateries along the corridor, but high-density student demand (~15,000+ students at DY Patil Knowledge City) creates massive demand for budget cafes and late-night snacks.",
            "prime_locations": ["DY Patil Knowledge City Road Main Gate", "Charholi Budruk Hostel Strip"],
            "recommended_budget": "₹1,50,000 - ₹3,50,000",
            "recommended_scheme": {
                "name": "PMMY MUDRA - Kishore + PM SVANidhi",
                "amount": "₹1,00,000 - ₹3,00,000",
                "portal": "https://www.mudra.org.in/"
            },
            "digital_boost": "Onboard on ONDC and Swiggy/Zomato to cater to hostel room deliveries during exam seasons."
        }
    elif "grocery" in q or "kirana" in q:
        return {
            "query": req.query,
            "feasibility": "MODERATE TO HIGH (Location Dependent)",
            "competitor_summary": "Lohegaon central chowk has 12+ stores (Dmart Ready, SMART Point, New Diamond). However, residential townships towards Porwal Road and Charholi outer have under-served pockets.",
            "recommended_budget": "₹2,00,000 - ₹6,00,000",
            "recommended_scheme": {
                "name": "PMMY MUDRA - Kishore & Tarun",
                "amount": "Up to ₹5,00,000",
                "portal": "https://www.jansamarth.in/"
            },
            "digital_boost": "Set up WhatsApp Business ordering and ONDC catalog for 15-minute neighborhood deliveries."
        }
    elif "loan" in q or "finance" in q or "scheme" in q:
        return {
            "query": req.query,
            "financial_advisory": "For micro-retail in Maharashtra, loans are disbursed under PMMY Mudra (Shishu up to ₹50k, Kishore up to ₹5L, Tarun up to ₹10L, and Tarun Plus up to ₹20L) and PM SVANidhi with 7% interest subsidy.",
            "lead_bank": "Bank of Maharashtra (Pune Head Office)",
            "application_hub": "https://www.jansamarth.in/"
        }
    else:
        return {
            "query": req.query,
            "general_advice": "The ADYPU to Lohegaon corridor is a dynamic hybrid corridor combining high-density university student demand with rapidly expanding residential townships in Pune. For optimal returns, select under-served pockets with less than 2 competitors within 400 meters.",
            "portal": "https://www.jansamarth.in/"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
