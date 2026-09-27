#!/usr/bin/env python3
"""
Robust Safari Automation for Google Maps Scraper
Searches Lohegaon & ADYPU Charholi for small businesses, extracts reviews & exact coordinates.
"""

import subprocess
import json
import re
import os
import time

DATA_DIR = os.path.dirname(os.path.abspath(__file__))
SCRATCH_SCRIPT = os.path.join(DATA_DIR, "temp_run.applescript")

def execute_applescript(script_text):
    with open(SCRATCH_SCRIPT, "w", encoding="utf-8") as f:
        f.write(script_text)
    res = subprocess.run(["osascript", SCRATCH_SCRIPT], capture_output=True, text=True)
    return res.stdout.strip()

def search_and_extract_gmaps(search_query):
    print(f"[*] Navigating Safari to Google Maps search: {search_query}...")
    encoded_query = search_query.replace(" ", "+")
    target_url = f"https://www.google.com/maps/search/{encoded_query}/@18.6100,73.9150,14z"

    # Navigate tab
    nav_script = f'''
    tell application "Safari"
        activate
        repeat with w in windows
            repeat with t in tabs of w
                if (URL of t) contains "google.com/maps" then
                    set URL of t to "{target_url}"
                    return "NAVIGATED"
                end if
            end repeat
        end repeat
        -- If no tab, open in window 1
        tell window 1
            set newTab to make new tab with properties {{URL:"{target_url}"}}
        end tell
        return "OPENED_NEW"
    end tell
    '''
    execute_applescript(nav_script)
    print("[*] Waiting for map and feed results to load...")
    time.sleep(7)

    # Scroll down multiple times
    for i in range(4):
        scroll_script = '''
        tell application "Safari"
            repeat with w in windows
                repeat with t in tabs of w
                    if (URL of t) contains "google.com/maps/search" then
                        do JavaScript "
                        var f = document.querySelector('div[role=\"feed\"]');
                        if(f) { f.scrollTop = f.scrollHeight; }
                        " in t
                    end if
                end repeat
            end repeat
        end tell
        '''
        execute_applescript(scroll_script)
        time.sleep(1.8)

    # Extract items
    extract_script = '''
    tell application "Safari"
        repeat with w in windows
            repeat with t in tabs of w
                if (URL of t) contains "google.com/maps/search" then
                    return do JavaScript "
                    var names = document.querySelectorAll('.qBF1Pd');
                    var rows = [];
                    for (var i = 0; i < names.length; i++) {
                        var name = names[i].innerText.replace(/\\n/g, ' ').trim();
                        var card = names[i].closest('.Nv2PK') || names[i].parentElement;
                        var rating = card && card.querySelector('.MW4etd') ? card.querySelector('.MW4etd').innerText : 'N/A';
                        var revs = card && card.querySelector('.UY7F9') ? card.querySelector('.UY7F9').innerText : '0';
                        var link = card && card.querySelector('a.hfpxzc') ? card.querySelector('a.hfpxzc').href : '';
                        rows.push(name + ':::' + rating + ':::' + revs + ':::' + link);
                    }
                    rows.join('|||');
                    " in t
                end if
            end repeat
        end repeat
        return ""
    end tell
    '''
    raw_data = execute_applescript(extract_script)
    if not raw_data:
        return []

    stores = []
    seen = set()
    for row in raw_data.split("|||"):
        parts = row.split(":::")
        if len(parts) >= 4:
            name, rating, revs, link = parts[0].strip(), parts[1].strip(), parts[2].strip(), parts[3].strip()
            if not name or name in seen or "results for" in name.lower():
                continue
            seen.add(name)

            lat_m = re.search(r'!3d([0-9\.]+)', link)
            lon_m = re.search(r'!4d([0-9\.]+)', link)
            lat = float(lat_m.group(1)) if lat_m else 18.6090
            lon = float(lon_m.group(1)) if lon_m else 73.9160

            # Clean reviews count
            clean_revs = re.sub(r'[^0-9]', '', revs)
            review_count = int(clean_revs) if clean_revs else 0

            stores.append({
                "source": "Google Maps (Safari Automation)",
                "name": name,
                "rating": float(rating) if rating != "N/A" else None,
                "review_count": review_count,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "google_maps_url": link
            })

    print(f"[+] Extracted {len(stores)} places for '{search_query}'.")
    return stores

def main():
    queries = [
        "grocery stores near Lohegaon Pune",
        "grocery stores near ADYPU Charholi Pune",
        "cafes and food stalls near ADYPU Knowledge City Pune"
    ]

    all_scraped = []
    seen_names = set()

    for q in queries:
        places = search_and_extract_gmaps(q)
        for p in places:
            if p["name"] not in seen_names:
                seen_names.add(p["name"])
                all_scraped.append(p)
        time.sleep(2)

    output_path = os.path.join(DATA_DIR, "google_maps_scraped.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_scraped, f, indent=2)

    print(f"\n[✔] Total unique Google Maps establishments harvested: {len(all_scraped)}")
    print(f"[+] Saved to {output_path}")

    # Cleanup temp applescript
    if os.path.exists(SCRATCH_SCRIPT):
        os.remove(SCRATCH_SCRIPT)

if __name__ == "__main__":
    main()
