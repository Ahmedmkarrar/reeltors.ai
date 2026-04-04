# Reeltor — Creatomate Templates

Upload these 6 JSON files to your Creatomate dashboard. Each becomes a separate template with its own UUID.

## Templates

| File | Name | Use Case | Duration |
|------|------|----------|----------|
| `01-cinematic-montage.json` | Cinematic Montage | Flaggship — 6 photos, Ken Burns zoom, gold branding | 30s |
| `02-luxury-reveal.json` | Luxury Reveal | High-end listings — logo intro, room labels, dramatic closing card | 24s |
| `03-modern-minimal.json` | Modern Minimal | Clean slide-deck — Inter font, yellow accent bar, text slides | 28s |
| `04-fast-pace-tiktok.json` | Fast Pace TikTok | Viral content — hook + captions + circle wipe transitions | 15s |
| `05-luxury-mansion.json` | Luxury Mansion | Ultra-premium — address intro card, 6 rooms, cinematic closing | 35s |
| `06-story-before-after.json` | Story: Before & After | Results content — hook → before → CTA → after → results | 22s |

## Setup Instructions

1. Go to **creatomate.com** → Templates → **Create Template**
2. Click the **JSON Source Editor** (</> icon in the editor)
3. Paste the entire contents of each JSON file
4. Save — the template UUID is in the URL: `/templates/{UUID}/edit`
5. Copy the UUID and add it to your `.env.local`:

```env
CREATOMATE_API_KEY=your_api_key_here
CREATOMATE_TEMPLATE_CINEMATIC=your_cinematic_uuid
CREATOMATE_TEMPLATE_LUXURY_REVEAL=your_luxury_reveal_uuid
CREATOMATE_TEMPLATE_MODERN_MINIMAL=your_modern_minimal_uuid
CREATOMATE_TEMPLATE_TIKTOK_FAST=your_tiktok_fast_uuid
CREATOMATE_TEMPLATE_LUXURY_MANSION=your_luxury_mansion_uuid
CREATOMATE_TEMPLATE_STORY=your_story_uuid
```

## Dynamic Elements (all templates)

These element names are used for dynamic value injection via the API:

| Element Name | Description |
|---|---|
| `photo-1` through `photo-6` | User-uploaded image URLs (replace placeholder Unsplash URLs) |
| `Addresstext` | Full address block |
| `Pricetext` | Price display (e.g. "$1,250,000") |
| `Agent-Name` | Agent name + phone |
| `Brand-Name` | Company/brand name |

## Key Design Specs

- **Aspect ratio:** 9:16 (720×1280) — TikTok, Reels, Shorts optimized
- **Font:** Montserrat (headings) + Inter (body) — loaded via Google Fonts in Creatomate
- **Colors:** `#F5C518` (gold) on `#1A1A1A` (near-black) — Reeltor brand
- **Transitions:** Cross-fade between scenes, no hard cuts
- **Animations:** Linear easing for Ken Burns (constant speed = cinematic)
- **Easing:** `quadratic-out` for text (fast in, smooth stop)