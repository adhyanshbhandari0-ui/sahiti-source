#!/usr/bin/env python3
"""
SIH Problem Statement 26091: Hyper-Local Business Advisory & Risk Mapping Pipeline
Region: ADYPU (Ajeenkya DY Patil University, Charholi) to Lohegaon, Pune
Coordinates Bounding Box: 18.575N, 73.885E to 18.635N, 73.945E
"""

import urllib.request
import urllib.parse
import ssl
import json
import csv
import math
import os
import sys

# Target output directory
DATA_DIR = os.path.dirname(os.path.abspath(__file__))

# Key Landmarks
ADYPU_COORDS = (18.6226, 73.9063)       # ADYPU / DY Patil Knowledge City
LOHEGAON_COORDS = (18.5955, 73.9268)    # Lohegaon Central Junction

def haversine_distance(coord1, coord2):
    """Calculate distance in kilometers between two lat/lon pairs"""
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 3)

def query_osm_overpass():
    """Query Overpass API with multiple fallback mirrors"""
    bbox = "18.575,73.885,18.635,73.945"
    query = f"""
    [out:json][timeout:35];
    (
      node["shop"]({bbox});
      way["shop"]({bbox});
      node["amenity"~"restaurant|cafe|fast_food|pharmacy|bank|atm|marketplace|clinic|hospital"]({bbox});
      way["amenity"~"restaurant|cafe|fast_food|pharmacy|bank|atm|marketplace|clinic|hospital"]({bbox});
      node["craft"]({bbox});
      way["craft"]({bbox});
    );
    out center body;
    """

    endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
        "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
        "https://overpass.private.coffee/api/interpreter"
    ]

    ctx = ssl._create_unverified_context()
    encoded_data = urllib.parse.urlencode({'data': query}).encode('utf-8')

    for ep in endpoints:
        print(f"[*] Trying endpoint: {ep}...")
        try:
            req = urllib.request.Request(
                ep,
                data=encoded_data,
                headers={"User-Agent": "SIH26091_DataGatherer/1.0 (Education/Research; ADYPU-Lohegaon)"}
            )
            with urllib.request.urlopen(req, timeout=30, context=ctx) as response:
                payload = json.loads(response.read().decode('utf-8'))
                elements = payload.get("elements", [])
                if elements:
                    print(f"[+] Successfully fetched {len(elements)} raw records from {ep}!")
                    return elements
        except Exception as e:
            print(f"[-] Endpoint {ep} failed: {e}")

    return []

def classify_category(tags):
    """Categorize commercial entity into standardized SME retail buckets"""
    shop = tags.get("shop", "").lower()
    amenity = tags.get("amenity", "").lower()
    craft = tags.get("craft", "").lower()

    if shop in ["convenience", "supermarket", "general", "grocery", "grocery_store", "variety_store", "department_store", "greengrocer", "dairy", "kiosk", "butcher", "meat", "chicken_&_mutton", "fish"] or amenity == "marketplace":
        return "Grocery & Daily Needs / Kirana"
    elif shop in ["bakery", "pastry", "confectionery"]:
        return "Bakery & Sweets"
    elif amenity in ["restaurant", "cafe", "fast_food", "food_court"]:
        return "Food, Cafe & Eateries"
    elif shop in ["chemist", "pharmacy", "medical_supply"] or amenity in ["pharmacy", "clinic", "hospital"]:
        return "Pharmacy & Healthcare"
    elif shop in ["stationery", "books", "copyshop"] or craft in ["photographer", "printer"]:
        return "Stationery, Xerox & Education Needs"
    elif shop in ["clothes", "tailor", "boutique", "shoes", "fashion"] or craft in ["tailor", "shoemaker"]:
        return "Apparel, Tailoring & Footwear"
    elif shop in ["hairdresser", "beauty", "salon", "cosmetics"] or craft in ["optician"]:
        return "Personal Care & Grooming"
    elif shop in ["electronics", "mobile_phone", "computer", "hardware", "electrical", "appliance", "video_games"] or craft in ["electrician", "electronics_repair"]:
        return "Electronics, Mobile & Hardware"
    elif amenity in ["bank", "atm"]:
        return "Banking & Financial Services"
    elif shop in ["motorcycle", "car_repair", "bicycle", "tyres", "motorcycle_repair"] or craft in ["car_repair", "metal_construction"]:
        return "Auto Repair & Garage"
    elif shop in ["jewelry", "gift", "toys", "furniture"]:
        return "Gifts, Jewelry & Home Goods"
    elif shop == "mall":
        return "Shopping Center & Complex"
    else:
        return "General Retail & Services"

def map_financial_schemes(category, est_ticket_size):
    """Map SME category to relevant Government credit and financial schemes"""
    schemes = []
    
    # Tiny / Micro vendors & street stalls
    if any(k in category for k in ["Grocery", "Eateries", "Stationery", "Personal Care", "Auto"]):
        schemes.append({
            "name": "PM SVANidhi",
            "tier": "Micro-Credit Facility",
            "max_amount": "1st Tranche: ₹15,000 | 2nd: ₹25,000 | 3rd: ₹50,000",
            "features": "7% Interest Subsidy + Digital Cashback + PM SVANidhi Credit Card",
            "portal": "https://pmsvanidhi.mohua.gov.in/"
        })
        schemes.append({
            "name": "PMMY Mudra - Shishu",
            "tier": "Early Stage Micro Unit",
            "max_amount": "Up to ₹50,000 (Collateral-free)",
            "features": "MUDRA Card for daily working capital",
            "portal": "https://www.mudra.org.in/"
        })
    
    # Small Business / Growth Stage
    schemes.append({
        "name": "PMMY Mudra - Kishore",
        "tier": "Growth Phase",
        "max_amount": "₹50,000 to ₹5,00,000",
        "purpose": "Shop expansion, inventory stock, modern POS setup",
        "portal": "https://www.mudra.org.in/"
    })

    schemes.append({
        "name": "PMMY Mudra - Tarun & Tarun Plus",
        "tier": "Established / Scaling Phase",
        "max_amount": "Tarun: ₹5L - ₹10L | Tarun Plus: ₹10L - ₹20 Lakhs",
        "purpose": "Equipment finance, machinery, larger supermarket footprint",
        "portal": "https://www.mudra.org.in/"
    })

    # MoSJE / National Backward Classes & SC Schemes (Directly aligned with SIH PS 26091)
    schemes.append({
        "name": "NBCFDC / NSFDC Term Loan (MoSJE)",
        "tier": "Target Group Subsidized Lending",
        "max_amount": "Up to ₹5,00,000 at concessional 5%-6% p.a.",
        "target": "SC/OBC Micro-Entrepreneurs in rural & peri-urban clusters",
        "portal": "https://www.nbcfdc.gov.in/"
    })

    schemes.append({
        "name": "JanSamarth Portal / PSB Loans in 59 Min",
        "tier": "Digital In-Principle Approval",
        "max_amount": "Up to ₹10 Lakhs - ₹1 Crore",
        "portal": "https://www.jansamarth.in/"
    })

    return schemes

def process_data(raw_elements):
    """Normalize and enrich raw POI records"""
    businesses = []

    for el in raw_elements:
        tags = el.get("tags", {})
        
        # Coordinates
        lat = el.get("lat")
        lon = el.get("lon")
        if lat is None and "center" in el:
            lat = el["center"].get("lat")
            lon = el["center"].get("lon")
            
        if lat is None or lon is None:
            continue

        raw_name = tags.get("name") or tags.get("brand")
        category = classify_category(tags)
        
        if not raw_name:
            # Descriptive fallback
            raw_name = f"Local {tags.get('shop') or tags.get('amenity') or 'Store'}"

        dist_adypu = haversine_distance((lat, lon), ADYPU_COORDS)
        dist_lohegaon = haversine_distance((lat, lon), LOHEGAON_COORDS)

        # Approximate street / road
        street = tags.get("addr:street") or tags.get("addr:suburb") or tags.get("addr:place") or "ADYPU-Lohegaon Corridor"

        item = {
            "id": el.get("id"),
            "osm_type": el.get("type"),
            "name": raw_name,
            "category": category,
            "raw_tags": {k: v for k, v in tags.items() if k in ["shop", "amenity", "craft", "cuisine", "opening_hours", "phone", "website"]},
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "dist_to_adypu_km": dist_adypu,
            "dist_to_lohegaon_km": dist_lohegaon,
            "corridor_zone": "ADYPU / Charholi North" if dist_adypu < dist_lohegaon else "Lohegaon Urban South",
            "street": street
        }
        businesses.append(item)

    # Compute competition density index (Competitors within 400m radius of the same category)
    for b in businesses:
        coord_b = (b["lat"], b["lon"])
        cat_b = b["category"]
        
        competitors_400m = 0
        total_businesses_400m = 0
        
        for other in businesses:
            if other["id"] == b["id"]:
                continue
            dist = haversine_distance(coord_b, (other["lat"], other["lon"]))
            if dist <= 0.4: # 400 meters
                total_businesses_400m += 1
                if other["category"] == cat_b:
                    competitors_400m += 1
        
        b["competitors_within_400m"] = competitors_400m
        b["total_commercial_density_400m"] = total_businesses_400m

        # Risk Classification for starting a competing store in this spot
        if competitors_400m >= 5:
            b["saturation_risk"] = "HIGH RISK"
            b["risk_description"] = f"Over-saturated market: {competitors_400m} identical shops within 400m."
            b["risk_color"] = "#ef4444"
        elif competitors_400m >= 2:
            b["saturation_risk"] = "MODERATE RISK"
            b["risk_description"] = f"Moderate competition: {competitors_400m} similar shops. Viable with unique offerings."
            b["risk_color"] = "#f59e0b"
        else:
            b["saturation_risk"] = "LOW RISK (HIGH OPPORTUNITY)"
            b["risk_description"] = f"Under-served pocket! Only {competitors_400m} direct competitor within 400m."
            b["risk_color"] = "#10b981"

        b["recommended_schemes"] = map_financial_schemes(b["category"], "standard")

    return businesses

def generate_interactive_map(businesses):
    """Generate a high-utility interactive Leaflet HTML dashboard"""
    biz_json = json.dumps(businesses)
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SIH PS 26091: ADYPU to Lohegaon Hyper-Local Business & Risk Intelligence</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <style>
        :root {{
            --bg-dark: #0f172a;
            --card-bg: #1e293b;
            --accent: #38bdf8;
            --text-main: #f8fafc;
            --text-dim: #94a3b8;
            --border: #334155;
        }}
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
        body {{ display: flex; height: 100vh; background: var(--bg-dark); color: var(--text-main); overflow: hidden; }}
        #sidebar {{ width: 380px; background: var(--card-bg); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 1000; box-shadow: 4px 0 24px rgba(0,0,0,0.4); }}
        .header {{ padding: 20px; border-bottom: 1px solid var(--border); background: #0b1120; }}
        .header h1 {{ font-size: 1.15rem; color: var(--accent); font-weight: 700; margin-bottom: 4px; }}
        .header p {{ font-size: 0.8rem; color: var(--text-dim); line-height: 1.3; }}
        .badge-ps {{ display: inline-block; background: #0284c7; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; margin-bottom: 8px; }}
        
        .stats-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px 20px; border-bottom: 1px solid var(--border); background: #131d31; }}
        .stat-card {{ background: var(--card-bg); padding: 10px; border-radius: 8px; border: 1px solid var(--border); }}
        .stat-val {{ font-size: 1.25rem; font-weight: 700; color: var(--text-main); }}
        .stat-lbl {{ font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }}

        .filter-section {{ padding: 15px 20px; border-bottom: 1px solid var(--border); }}
        .filter-section label {{ font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-weight: 600; display: block; margin-bottom: 8px; }}
        select, input {{ width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid var(--border); border-radius: 6px; color: white; font-size: 0.85rem; outline: none; margin-bottom: 10px; }}
        select:focus, input:focus {{ border-color: var(--accent); }}

        .legend {{ padding: 12px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 0.75rem; }}
        .legend-item {{ display: flex; align-items: center; gap: 6px; }}
        .dot {{ width: 10px; height: 10px; border-radius: 50%; display: inline-block; }}

        .list-container {{ flex: 1; overflow-y: auto; padding: 15px 20px; }}
        .biz-card {{ background: #131d31; border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; }}
        .biz-card:hover {{ border-color: var(--accent); transform: translateY(-2px); }}
        .biz-name {{ font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }}
        .biz-cat {{ font-size: 0.75rem; color: var(--accent); margin-bottom: 6px; }}
        .biz-meta {{ font-size: 0.72rem; color: var(--text-dim); display: flex; gap: 10px; }}
        .risk-pill {{ font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }}

        #map {{ flex: 1; height: 100%; }}
        
        .popup-box {{ font-size: 0.82rem; line-height: 1.4; color: #1e293b; min-width: 240px; }}
        .popup-box h3 {{ color: #0f172a; font-size: 0.95rem; margin-bottom: 4px; }}
        .popup-box .pill {{ display: inline-block; padding: 2px 6px; border-radius: 4px; color: white; font-size: 0.68rem; font-weight: 700; margin: 4px 0 8px 0; }}
        .popup-box .scheme-box {{ background: #f1f5f9; border-left: 3px solid #0284c7; padding: 6px 8px; margin-top: 8px; border-radius: 4px; }}
        .scheme-box strong {{ color: #0284c7; }}
    </style>
</head>
<body>
    <div id="sidebar">
        <div class="header">
            <h1>ADYPU &harr; Lohegaon Corridor</h1>
            <p>AI Hyper-Local SME Risk &amp; Financial Advisory Engine</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-val" id="total-count">0</div>
                <div class="stat-lbl">Stores Found</div>
            </div>
            <div class="stat-card">
                <div class="stat-val" id="opportunity-count" style="color: #10b981;">0</div>
                <div class="stat-lbl">Low Risk Zones</div>
            </div>
        </div>

        <div class="filter-section">
            <label>Search Business Name</label>
            <input type="text" id="search-input" placeholder="e.g. Kirana, Cafe, Medical..." oninput="filterMarkers()">
            
            <label>Filter Category</label>
            <select id="cat-select" onchange="filterMarkers()">
                <option value="ALL">All Commercial Categories</option>
            </select>
        </div>

        <div class="legend">
            <div class="legend-item"><span class="dot" style="background:#10b981"></span> Low Risk</div>
            <div class="legend-item"><span class="dot" style="background:#f59e0b"></span> Moderate</div>
            <div class="legend-item"><span class="dot" style="background:#ef4444"></span> High Risk</div>
        </div>

        <div class="list-container" id="business-list"></div>
    </div>

    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const businesses = {biz_json};
        
        // Setup Leaflet map centered between ADYPU and Lohegaon
        const map = L.map('map').setView([18.6090, 73.9160], 14);
        L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png', {{
            attribution: '&copy; OpenStreetMap contributors | SIH PS 26091'
        }}).addTo(map);

        // Landmarks
        const adypuMarker = L.marker([18.6226, 73.9063]).addTo(map)
            .bindPopup("<b>ADYPU Knowledge City (Charholi)</b><br>Major Student & Youth Demand Center");
        const lohegaonMarker = L.marker([18.5955, 73.9268]).addTo(map)
            .bindPopup("<b>Lohegaon Central Junction</b><br>High Density Residential & Commercial Core");

        // Populate Categories
        const categories = [...new Set(businesses.map(b => b.category))].sort();
        const catSelect = document.getElementById('cat-select');
        categories.forEach(c => {{
            const opt = document.createElement('option');
            opt.value = c;
            opt.innerText = c;
            catSelect.appendChild(opt);
        }});

        let markers = [];

        function renderMap() {{
            markers.forEach(m => map.removeLayer(m));
            markers = [];

            const searchVal = document.getElementById('search-input').value.toLowerCase();
            const selectedCat = document.getElementById('cat-select').value;
            const listEl = document.getElementById('business-list');
            listEl.innerHTML = '';

            let shownCount = 0;
            let oppCount = 0;

            businesses.forEach(b => {{
                const matchesSearch = b.name.toLowerCase().includes(searchVal) || b.category.toLowerCase().includes(searchVal);
                const matchesCat = selectedCat === 'ALL' || b.category === selectedCat;

                if (matchesSearch && matchesCat) {{
                    shownCount++;
                    if (b.saturation_risk.includes('LOW')) oppCount++;

                    // Leaflet Circle Marker
                    const marker = L.circleMarker([b.lat, b.lon], {{
                        radius: 8,
                        fillColor: b.risk_color,
                        color: '#ffffff',
                        weight: 1.5,
                        opacity: 1,
                        fillOpacity: 0.85
                    }}).addTo(map);

                    const schemeHtml = b.recommended_schemes.map(s => 
                        `<div class="scheme-box">
                            <strong>${{s.name}}</strong> (${{s.max_amount}})<br>
                            <a href="${{s.portal}}" target="_blank" style="color:#0284c7; text-decoration:none; font-weight:600;">Apply via Official Portal &rarr;</a>
                         </div>`
                    ).slice(0, 2).join('');

                    marker.bindPopup(`
                        <div class="popup-box">
                            <h3>${{b.name}}</h3>
                            <div style="color: #64748b; font-size:0.75rem;">${{b.category}}</div>
                            <span class="pill" style="background:${{b.risk_color}}">${{b.saturation_risk}}</span>
                            <p style="font-size:0.75rem; margin-bottom:4px;">${{b.risk_description}}</p>
                            <div style="font-size:0.7rem; color:#475569;">
                                📍 ${{b.dist_to_adypu_km}} km from ADYPU | ${{b.dist_to_lohegaon_km}} km from Lohegaon
                            </div>
                            <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;">
                            <div style="font-weight:700; font-size:0.72rem; color:#0f172a;">Recommended Financial Schemes:</div>
                            ${{schemeHtml}}
                        </div>
                    `);

                    markers.push(marker);

                    // Add to Sidebar
                    const card = document.createElement('div');
                    card.className = 'biz-card';
                    card.innerHTML = `
                        <div class="biz-name">
                            <span>${{b.name}}</span>
                            <span class="risk-pill" style="background:${{b.risk_color}}22; color:${{b.risk_color}}; border:1px solid ${{b.risk_color}}">${{b.saturation_risk.split(' ')[0]}}</span>
                        </div>
                        <div class="biz-cat">${{b.category}}</div>
                        <div class="biz-meta">
                            <span>ADYPU: ${{b.dist_to_adypu_km}} km</span>
                            <span>Lohegaon: ${{b.dist_to_lohegaon_km}} km</span>
                            <span>Nearby: ${{b.competitors_within_400m}}</span>
                        </div>
                    `;
                    card.onclick = () => {{
                        map.setView([b.lat, b.lon], 16);
                        marker.openPopup();
                    }};
                    listEl.appendChild(card);
                }}
            }});

            document.getElementById('total-count').innerText = shownCount;
            document.getElementById('opportunity-count').innerText = oppCount;
        }}

        function filterMarkers() {{
            renderMap();
        }}

        renderMap();
    </script>
</body>
</html>
"""
    map_path = os.path.join(DATA_DIR, "adypu_lohegaon_map.html")
    with open(map_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[+] Interactive map saved to: {map_path}")

def main():
    print("================================================================")
    print("SIH PS 26091: ADYPU to Lohegaon Business & Risk Data Gathering")
    print("================================================================")
    
    raw_elements = query_osm_overpass()
    if not raw_elements:
        print("[-] Could not retrieve data from Overpass mirrors. Exiting.")
        sys.exit(1)

    businesses = process_data(raw_elements)
    print(f"[+] Processed and analyzed {len(businesses)} commercial establishments.")

    # 1. Save JSON
    json_path = os.path.join(DATA_DIR, "adypu_lohegaon_businesses.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(businesses, f, indent=2)
    print(f"[+] JSON dataset saved to: {json_path}")

    # 2. Save CSV
    csv_path = os.path.join(DATA_DIR, "adypu_lohegaon_businesses.csv")
    csv_fields = [
        "id", "name", "category", "lat", "lon",
        "dist_to_adypu_km", "dist_to_lohegaon_km", "corridor_zone",
        "street", "competitors_within_400m", "total_commercial_density_400m",
        "saturation_risk", "risk_description"
    ]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(businesses)
    print(f"[+] CSV dataset saved to: {csv_path}")

    # 3. Generate Category & Risk Summary
    summary = {
        "corridor": "ADYPU (Charholi) to Lohegaon Central",
        "total_businesses": len(businesses),
        "category_breakdown": {},
        "risk_breakdown": {
            "LOW_RISK_HIGH_OPPORTUNITY": sum(1 for b in businesses if "LOW" in b["saturation_risk"]),
            "MODERATE_COMPETITION": sum(1 for b in businesses if "MODERATE" in b["saturation_risk"]),
            "HIGH_RISK_SATURATED": sum(1 for b in businesses if b["saturation_risk"] == "HIGH RISK")
        },
        "key_hubs": {
            "ADYPU_Knowledge_City": {"lat": ADYPU_COORDS[0], "lon": ADYPU_COORDS[1]},
            "Lohegaon_Junction": {"lat": LOHEGAON_COORDS[0], "lon": LOHEGAON_COORDS[1]}
        }
    }
    for b in businesses:
        cat = b["category"]
        summary["category_breakdown"][cat] = summary["category_breakdown"].get(cat, 0) + 1

    summary_path = os.path.join(DATA_DIR, "risk_and_market_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
    print(f"[+] Market & Risk Summary saved to: {summary_path}")

    # 4. Generate Interactive Map Dashboard
    generate_interactive_map(businesses)

    print("\n[✔] Data gathering, risk computation, and dashboard generation complete!")

if __name__ == "__main__":
    main()
