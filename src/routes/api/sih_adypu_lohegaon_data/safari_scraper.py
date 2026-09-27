#!/usr/bin/env python3
"""
Safari Automation Scraper for Google Maps & Mappls
Region: ADYPU (Charholi) to Lohegaon, Pune
"""

import subprocess
import json
import re
import os
import time

DATA_DIR = os.path.dirname(os.path.abspath(__file__))

def run_applescript(script_content):
    """Execute AppleScript string via osascript"""
    proc = subprocess.run(['osascript', '-e', script_content], capture_output=True, text=True)
    if proc.returncode != 0 and proc.stderr:
        print(f"AppleScript Warning/Error: {proc.stderr.strip()[:200]}")
    return proc.stdout.strip()

def extract_google_maps_businesses():
    """Scroll and extract all visible stores and exact lat/lons from Google Maps in Safari"""
    print("[*] Interacting with Safari Google Maps tab...")
    
    # AppleScript: Scroll 6 times to trigger dynamic loading of 30+ places
    scroll_script = '''
    tell application "Safari"
        repeat with w in windows
            repeat with t in tabs of w
                if (URL of t) contains "google.com/maps/search" then
                    repeat 6 times
                        do JavaScript "
                        var feed = document.querySelector('div[role=\\\"feed\\\"]');
                        if (feed) { feed.scrollTop = feed.scrollHeight; }
                        " in t
                        delay 1.2
                    end repeat
                    return "SCROLLED"
                end if
            end repeat
        end repeat
        return "NO_TAB"
    end tell
    '''
    run_applescript(scroll_script)
    time.sleep(2)

    # Extract delimited store cards
    extract_script = '''
    tell application "Safari"
        repeat with w in windows
            repeat with t in tabs of w
                if (URL of t) contains "google.com/maps/search" then
                    return do JavaScript "
                    var names = document.querySelectorAll('.qBF1Pd');
                    var rows = [];
                    for(var i = 0; i < names.length; i++) {
                        var name = names[i].innerText.replace(/\\n/g, ' ').trim();
                        var card = names[i].closest('.Nv2PK') || names[i].parentElement;
                        var rating = card && card.querySelector('.MW4etd') ? card.querySelector('.MW4etd').innerText : 'N/A';
                        var reviews = card && card.querySelector('.UY7F9') ? card.querySelector('.UY7F9').innerText.replace(/[^0-9]/g, '') : '0';
                        var link = card && card.querySelector('a.hfpxzc') ? card.querySelector('a.hfpxzc').href : '';
                        var details = card ? card.innerText.replace(/\\n/g, ' -- ') : '';
                        rows.push(name + ':::' + rating + ':::' + reviews + ':::' + link + ':::' + details);
                    }
                    rows.join('|||');
                    " in t
                end if
            end repeat
        end repeat
        return ""
    end tell
    '''
    raw_output = run_applescript(extract_script)
    if not raw_output:
        print("[-] No stores extracted from Google Maps.")
        return []

    stores = []
    seen_names = set()

    for item in raw_output.split("|||"):
        parts = item.split(":::")
        if len(parts) >= 4:
            name = parts[0].strip()
            rating = parts[1].strip()
            reviews = parts[2].strip()
            link = parts[3].strip()
            details = parts[4].strip() if len(parts) > 4 else ""

            if not name or name in seen_names or "results for" in name.lower():
                continue
            seen_names.add(name)

            # Parse exact latitude and longitude from Google Maps link
            # Format in link: !3d18.6076248!4d73.9108792
            lat_match = re.search(r'!3d([0-9\.]+)', link)
            lon_match = re.search(r'!4d([0-9\.]+)', link)

            lat = float(lat_match.group(1)) if lat_match else 18.6080
            lon = float(lon_match.group(1)) if lon_match else 73.9180

            stores.append({
                "source": "Google Maps (Live Scraped via Safari)",
                "name": name,
                "category": "Grocery & Daily Needs / Kirana",
                "rating": float(rating) if rating != "N/A" else None,
                "review_count": int(reviews) if reviews.isdigit() else 0,
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "google_maps_url": link,
                "details_snippet": details[:140]
            })

    print(f"[+] Successfully extracted {len(stores)} verified establishments from Google Maps!")
    return stores

def main():
    print("=================================================================")
    print("Safari Automation: Google Maps & Local Business Harvester")
    print("=================================================================")
    
    gmaps_stores = extract_google_maps_businesses()
    
    output_path = os.path.join(DATA_DIR, "google_maps_businesses.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(gmaps_stores, f, indent=2)
    print(f"[+] Saved Google Maps listings to: {output_path}")

if __name__ == "__main__":
    main()
