# Sahiti — Release notes

Use this file when publishing a GitHub Release. Copy the **What’s in this release** section into the release description, then trim anything not in that tag.

**Repo:** https://github.com/chaudharyjayy/sahiti-source  
**Problem:** Smart India Hackathon 2026 · MoSJE 26091  
**Audience:** Rural micro-entrepreneurs planning finance, documents, and local market risk

---

## What’s in this release

### Overview

Sahiti is a business advisory prototype that helps first-time rural entrepreneurs structure a loan, prepare documents, read local market risk, track returns, follow schemes, and ask questions in plain language.

### Public site

- Landing page with full-bleed market hero and feature walkthrough
- About page (scope, what is included, what Sahiti is not)
- Privacy and Terms pages
- Mobile number + password auth (demo sign-in for the hackathon prototype)
- Session ends after 30 minutes of inactivity

### Dashboard

- Personal greeting from the business profile
- Sales, expenses, profit, and ROI snapshot from logged ROI months
- Shortcuts to Calculations, Feed, Map, and Sahiti AI
- Recent milestones list

### Calculations

| Tool | What it does |
| --- | --- |
| **Loan** | Turns margin capital into project cost, loan size, EMI, and a repayment table (INR) |
| **Documents** | Checklist of papers to collect for bank / scheme applications |
| **ROI tracker** | Log monthly sales and expenses, see returns and a simple risk rating |
| **Market** | Demonstration opportunity / competition scores for Lohegaon-area locations |
| **Loan monitor** | Track an live or planned loan after structuring |
| **Apply for scheme** | Four-step scheme application flow with eligibility, details, and receipt |

Also includes a **scheme finder** to match sectors and amounts to known schemes (e.g. Mudra-style examples). Confirm final terms with the bank or official portals.

### Business feed

- **Schemes and Sahiti** — government / news / finance explainers
- **Community** — member posts (compose, comment, save, share)
- Search within the active tab
- Thread dialog for full post + comments

### Lohegaon shops and risk map

- Interactive Leaflet map (OpenStreetMap / Esri tiles — no Google Maps key required for basemap)
- Real shop pins from OpenStreetMap data (hardware, general store, salon, garage)
- Research risk zones with opportunity / competition scores
- Filters by area, shop type, and layer (shops / zones / both)
- “Show my location” and deep links to Google Maps (keyless URLs)
- Optional Google Places overlay only if `GOOGLE_MAPS_API_KEY` is set

### Sahiti AI

- Chat assistant scoped to business, finance, loans, schemes, documents, and costs
- Type or dictate (speech recognition); optional spoken replies
- Multi-thread history stored per user
- Powered by Google Gemini (`GEMINI_API_KEY`, default model `gemini-3.6-flash`)
- Replies in the language the user writes in

### Profile

- Business details (name, category, location, revenue range, contact)
- Milestones
- Business photo upload (private storage)

### Settings

- App language switcher
- Session / account security notes
- Sign out

### Languages

Navigation and labels support:

English · Hindi · Marathi · Gujarati · Bengali · Tamil · Telugu

Posts and AI replies stay in the language they were written in.

### Stack

- TypeScript · React · TanStack Start · Tailwind CSS
- Supabase (auth, database, storage)
- Gemini (AI)
- Leaflet + OpenStreetMap (map)

### Configuration

| Variable | Required for | Notes |
| --- | --- | --- |
| `VITE_SUPABASE_*` / `SUPABASE_*` | App auth and data | Keep publishable keys only in client env |
| `GEMINI_API_KEY` | Sahiti AI | Server only — never `VITE_` |
| `GEMINI_MODEL` | Optional | Defaults to `gemini-3.6-flash` |
| `GOOGLE_MAPS_API_KEY` | Optional Places panel | Map and OSM shops work without it |

See `.env.example`. Do not commit real secrets.

---

## Release checklist (maintainers)

1. Tag from the intended branch (`git tag v0.x.y && git push origin v0.x.y`).
2. GitHub → **Releases** → **Draft a new release** → choose the tag.
3. Title example: `Sahiti v0.x.y — SIH 2026 prototype`.
4. Paste **What’s in this release** above; shorten to what changed since the last tag if this is a patch.
5. Attach a short **Demo** note (localhost or deployed URL) if available.
6. Publish.

### Suggested short blurb (social / README badge)

> Sahiti helps rural micro-entrepreneurs plan loans, documents, local market risk, and schemes — with a map of real shops and an AI that answers in plain language.

---

## Feature inventory (full list)

Copy individual bullets into a release when that area changed.

### Access and shell

- [ ] Public marketing landing
- [ ] About / Privacy / Terms
- [ ] Sign up / sign in with `+91` mobile + password
- [ ] Authenticated app shell (desktop nav + mobile bottom bar)
- [ ] Location / cluster switcher (Lohegaon and nearby clusters)
- [ ] Auto sign-out after idle timeout

### Planning tools

- [ ] Loan calculator (margin → project cost / loan / EMI / schedule)
- [ ] Document checklist
- [ ] ROI monthly tracker + risk cue
- [ ] Market location cards (demo research)
- [ ] Loan monitor
- [ ] Scheme finder
- [ ] Scheme application wizard (scheme → eligibility → details → receipt)

### Community and advice

- [ ] Split feed: Schemes and Sahiti vs Community
- [ ] Post, comment, save, share
- [ ] Sahiti AI chat (text + voice in / optional voice out)
- [ ] Chat thread history

### Map

- [ ] OSM shop map + risk zones
- [ ] Filters, geolocation, Google Maps deep links
- [ ] Optional Google Places enrichment

### Account

- [ ] Profile + milestones + photo uploads
- [ ] Seven-language UI labels
- [ ] Settings and account sign-out

### Quality / ops

- [ ] Navy + saffron SIH visual system
- [ ] Real Unsplash market / shop photography
- [ ] Server `.env` loading for AI and Places
- [ ] OSM tiles without Google billing for the base map
