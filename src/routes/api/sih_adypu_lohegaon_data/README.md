# SIH Problem Statement 26091: ADYPU to Lohegaon Business & Risk Intelligence Dataset

This folder contains the complete hyper-local business dataset, risk analytics, and financial scheme mappings for the **ADYPU (Ajeenkya DY Patil University, Charholi Budruk) to Lohegaon Central corridor** in Pune, Maharashtra.

## Problem Statement Alignment
- **SIH Problem Statement:** PS 26091 - *"AI-Driven Hyper-Local Business Advisory and Financial Structuring Assistant for Rural / Semi-Urban Micro-Entrepreneurs"*
- **Target Ministries:** Ministry of Social Justice and Empowerment (MoSJE) & Ministry of MSME
- **Core Value Proposition:**
  1. **Spatial Market Viability Engine:** Identifies saturation vs. underserved pockets for aspiring store owners.
  2. **Credit & Loan Matchmaker:** Directly pairs business category, scale, and risk score with official Government credit schemes (PMMY Mudra, PM SVANidhi, MoSJE NBCFDC/NSFDC, and JanSamarth).

---

## Directory Structure & Files

| File | Format | Description |
| :--- | :--- | :--- |
| [`adypu_lohegaon_map.html`](file:///Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/adypu_lohegaon_map.html) | HTML/Leaflet | Interactive geospatial dashboard with search, category filtering, risk color coding, and popup loan links. |
| [`adypu_lohegaon_businesses.json`](file:///Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/adypu_lohegaon_businesses.json) | JSON | 105 structured commercial establishments with exact coordinates, category, distance to ADYPU/Lohegaon, competition density, risk score, and matched loan schemes. |
| [`adypu_lohegaon_businesses.csv`](file:///Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/adypu_lohegaon_businesses.csv) | CSV | Flat table version ready for Pandas, Excel, or Tableau modeling. |
| [`risk_and_market_summary.json`](file:///Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/risk_and_market_summary.json) | JSON | Aggregated category breakdown, competition counts, and corridor coordinates. |
| [`gov_schemes_and_stats.json`](file:///Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/gov_schemes_and_stats.json) | JSON | Live government metrics from PM SVANidhi portal, Mudra (PMMY) 4-tier slabs (including new Tarun Plus), MoSJE guidelines, and Lead Bank Pune details. |
| [`gather_data.py`](file:///Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/gather_data.py) | Python | Fully automated collector script with multi-mirror fallback and risk computation. |

---

## Key Corridor Findings (Summary)
- **Total Active Commercial Establishments:** 105
- **Dominant Sectors:**
  - Pharmacy & Healthcare: 21
  - Food, Cafe & Eateries: 20
  - Banking & Financial Services: 11
  - Gifts, Jewelry & Home Goods: 11
  - Grocery & Daily Needs / Kirana: 9
  - Apparel & Tailoring: 8
  - Bakery & Sweets: 6
  - Stationery & Xerox (Student hubs): 4
  - Auto & Bike Repair: 3
- **Competition Risk Breakdown (within 400m radius):**
  - **Low Risk (High Opportunity):** 48 establishments (45.7%)
  - **Moderate Competition:** 44 establishments (41.9%)
  - **High Risk (Over-Saturated):** 13 establishments (12.4%)

---

## How to View the Interactive Map
Simply open `adypu_lohegaon_map.html` in any web browser:
```bash
open /Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/adypu_lohegaon_map.html
```

---

## How to Re-Run or Refresh Data
```bash
python3 /Users/tatvagnatandel/.gemini/antigravity-ide/scratch/sih_adypu_lohegaon_data/gather_data.py
```
