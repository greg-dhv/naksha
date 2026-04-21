# CLAUDE.md — Naksha: Vedic Astrology App

## What Is Naksha

A deep Vedic astrology app. Not a daily horoscope — a living relationship with your karmic blueprint.

**Core differentiator:** Every AI response is generated from inside the user's specific chart. The AI has ingested their complete birth data (9 planets, 27 nakshatras, dasha periods, house placements) and speaks from within that chart's logic. It should feel like a personal astrologer who has studied your chart for years.

**Archetype:** The Sacred Translator — absorbs deep esoteric knowledge, makes it accessible to people who need it but can't reach it in its original form. The app IS this archetype expressed as technology.

---

## Current State (as of April 2026)

The MVP has shipped and we have gone well beyond it. All core features are live:

| Feature | Status |
|---------|--------|
| Onboarding (birth data → full chart generation) | ✅ Built |
| 11 parallel AI readings generated at chart creation | ✅ Built |
| Chart view — Reading tab (5 sections) + Chart tab (wheel, yogas, planets) | ✅ Built |
| Home — weekly AI briefing + active dasha cycle display | ✅ Built |
| Go Deeper — streaming chat with full chart context | ✅ Built |
| Bonds — compatibility analysis between two users | ✅ Built |
| Auth — register / login / account management | ✅ Built |
| Mobile AppShell (bottom nav) + Desktop sidebar | ✅ Built |
| Payments | ❌ Not built |
| Email verification / password reset | ❌ Not built |
| Transit alerts / push notifications | ❌ Not built |
| Public profiles / chart sharing | ❌ Not built |

**NOT yet built:** Stripe payments, Clerk migration, email verification, password reset, transit alerts, admin dashboard.

---

## Mobile-First (Always)

**90% of users will be on mobile. Every screen, every component, every layout must be designed mobile-first.**

- Default layout = single column, full-width
- Touch targets ≥ 44px
- Bottom navigation on mobile (fixed, safe-area aware)
- Desktop = progressive enhancement via `@media (min-width: 768px)` or inline responsive checks
- Never design for desktop and adapt down — always design for mobile and adapt up

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js (App Router, `'use client'`) |
| Backend | Python FastAPI |
| Calculations | pyswisseph (Swiss Ephemeris) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude API — `claude-sonnet-4-6`, temperature 0.7 |
| Auth | Custom JWT (HS256, 30-day) + Argon2 password hashing — Clerk deferred |
| Payments | Stripe (not yet built) |
| Push notifications | OneSignal (not yet built) |
| Hosting | Vercel (frontend) + Railway or Fly.io (backend) |

---

## Database Schema

Three tables in Supabase:

**`users`**
- `id`, `email`, `username` (3–30 chars, lowercase/digits/underscore)
- `password_hash` (Argon2)
- `chart_data` (full JSON — see Vedic Calculations below)
- `birth_data` (JSON: name, birth_date, birth_time, birth_time_unknown, location_name, lat, lon)
- `weekly_briefing` (AI text, cached)
- `weekly_briefing_week` (date string for freshness check — refreshes each Monday)

**`messages`** — Go Deeper chat history
- `user_id`, `session_id`, `role` (user/assistant), `content`, `created_at`

**`bonds`** — Compatibility reports
- `id`, `user_id_1`, `user_id_2`, `relationship_type` (friendship | relationship), `report`, `created_at`

---

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/register` | POST | No | Register (email, password, username) → token + user |
| `/api/auth/login` | POST | No | Login → token + user |
| `/api/auth/me` | GET | JWT | Get current user |
| `/api/chart` | POST | No* | Generate chart + 11 AI readings from birth data |
| `/api/chart/save` | POST | JWT | Save chart_data + birth_data to user account |
| `/api/home` | GET | JWT | Weekly briefing (cached) + dasha data |
| `/api/chat/stream` | POST | JWT | Streaming chat (SSE) with full chart context |
| `/api/chat/sessions` | GET | JWT | List past chat sessions |
| `/api/bonds/search` | GET | JWT | Search users by @username |
| `/api/bonds/compatibility` | POST | JWT | Generate + save compatibility report |
| `/api/bonds/list` | GET | JWT | List existing bond reports |

*Chart generation doesn't require auth — chart is stored in localStorage, then optionally saved to account.

---

## Vedic Calculations

### Core Setup
```python
import swisseph as swe

swe.set_sid_mode(swe.SIDM_LAHIRI)

# Julian day from birth datetime (UTC)
jd = swe.julday(year, month, day, hour_decimal)

# Ascendant (Whole Sign houses)
houses, ascmc = swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)
lagna_lon = ascmc[0]

# Planet positions (sidereal)
# IDs: SUN=0, MOON=1, MERCURY=2, VENUS=3, MARS=4, JUPITER=5, SATURN=6, RAHU(mean node)=11
planet_lon, _ = swe.calc_ut(jd, planet_id, swe.FLG_SIDEREAL)
ketu_lon = (rahu_lon + 180) % 360

# Derivations
sign_index      = int(longitude / 30)                              # 0=Aries … 11=Pisces
degree_in_sign  = longitude % 30
nakshatra_index = int(longitude / (360 / 27))                      # 0–26
pada            = int((longitude % (360/27)) / (360/27/4)) + 1    # 1–4
lagna_sign      = int(lagna_lon / 30)
house           = (sign_index - lagna_sign) % 12 + 1              # 1–12
```

### Also Calculated (stored in chart_data JSON)
- **Dignity** per planet: exalted, debilitated, own sign, friend, neutral, enemy
- **Combust**: planet within certain degrees of Sun
- **Retrograde**: flagged per planet
- **Divisional charts**: Navamsa (D9) and Dasamsa (D10) — sign, sign_index, house per planet
- **Panchanga**: Tithi (lunar day), Vara (weekday), Yoga (lunar yoga), Karana (half-day)
- **Yogas**: detected combinations with name, type, planets involved, houses, description
- **Element balance**: count of planets in fire/earth/air/water signs (Rahu/Ketu excluded)
- **Shiva/Shakti/Vishnu score**: percentage breakdown of cosmic force archetype

### Vimshottari Dasha
```python
DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
DASHA_YEARS    = [7,      20,      6,     10,      7,      18,     16,        19,       17]
```
Stored: current mahadasha + antardasha + pratyantardasha (with planet + date ranges), plus full lifetime mahadasha timeline.

**Birth time unknown:** defaults to 12:00 local time for calculation.

**Signs:** Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces

**27 Nakshatras:** Ashwini, Bharani, Krittika, Rohini, Mrigashira, Ardra, Punarvasu, Pushya, Ashlesha, Magha, Purva Phalguni, Uttara Phalguni, Hasta, Chitra, Swati, Vishakha, Anuradha, Jyeshtha, Mula, Purva Ashadha, Uttara Ashadha, Shravana, Dhanishtha, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada, Revati

---

## AI Integration

**Model:** `claude-sonnet-4-6` | **Temperature:** 0.7

**Architecture:** Chart data is calculated once at onboarding, stored in the database, and injected into every API call as part of the system prompt. The AI never calculates — it only interprets pre-calculated data.

### Chart Generation — 11 Parallel Readings

All 11 called concurrently via `ThreadPoolExecutor` at chart generation time. Results stored in `chart_data.readings`:

| Reading | Key Data Used | Output Shape |
|---------|--------------|--------------|
| Nakshatra Archetype | Moon nakshatra/pada/sign/house, Lagna | string |
| Life Season | Lagna, Moon nakshatra/sign, current Maha/Antar + dates | string |
| Essence | Lagna/Moon/Sun signs & nakshatras, Sun house, current Maha | string |
| Three Pillars | Lagna/Moon/Sun with sign/nakshatra/degree/pada | `{ ascendant, moon, sun }` |
| Karmic Axis | Ketu/Rahu with sign/house/nakshatra | `{ ketu, rahu, axis_name }` |
| All Planets | All 9 planets with full placement data | `{ planet_name: string }` |
| Core | Lagna/Moon/Sun, Saturn/Mars, current Maha | `{ who_are_you, what_stands_out, how_you_come_across, inner_world, what_drives_you }` |
| Natural Powers | Lagna/Moon nakshatras, Jupiter/Mercury/Venus/Sun, yogas | `{ gifts, archetypes: [{ name, description }] }` |
| Growth Path | Moon/Rahu/Saturn/Jupiter placements, current Maha | `{ life_teaching, dharma, spiritual_path }` |
| Soul History | Ketu/Moon/Saturn placements | `{ soul_knows, past_life_themes }` |
| Energy | All planet signs/houses, element balance, yogas | `{ dominant_force, shiva/shakti/vishnu_score (%), cultivate, practices }` |

### Go Deeper — Streaming Chat
- System prompt: user's full `chart_data` JSON + current date + 10 rules
- SSE streaming via `text_stream`
- Messages persisted to `messages` table per `session_id`
- max_tokens: 1000

### Bonds — Compatibility
- System prompt: both users' `chart_data` JSONs + relationship type
- Generates 5 paragraphs: core connection, growth edge, friction, karmic thread, relationship-specific texture
- Saved to `bonds` table
- max_tokens: 2000

### Home — Weekly Briefing
- Generated on GET if no briefing exists or last one is from a prior week
- System prompt: user's chart + active dasha periods (maha/antar/pratyantar + dates)
- 2 paragraphs, 150–200 words, one focus area + one practical suggestion
- Cached in `weekly_briefing` column, refreshed each Monday
- max_tokens: 400

### AI Rules (apply to ALL prompts)
1. Always reference the user's SPECIFIC planetary positions — never generic
2. Explain Vedic concepts in plain language FIRST, optionally name the Sanskrit term after
3. Never predict specific events — illuminate patterns and energies
4. Say "this transit suggests" not "this will happen"
5. Speak directly as "you" — warm, personal, slightly poetic
6. Never use bullet points — flowing prose paragraphs only
7. Empower the reader's agency, never create dependency
8. Be honest about challenges — never sugarcoat Saturn or 8th house themes

---

## Design Principles

1. **Reveal, don't dump.** Never show the full chart at once. Each layer is earned.
2. **Speak like a human who knows them.** Not "your Saturn is in Sagittarius in the 8th house" — instead: "you carry a weight that most people can't see."
3. **Earn the Sanskrit.** Use "your birth star" before introducing "nakshatra."
4. **Make every screen shareable.** Archetype card, life season, monthly highlights — every share is free distribution.
5. **Never predict. Always illuminate.** Empower, don't fortune-tell.

---

## Brand

**Name:** Naksha (Sanskrit for "map")
**Tagline:** "Your karmic map"
**Tone:** Warm, precise, slightly poetic, deeply personal.
**Aesthetic:** Luminous currents — not stars, not a night sky (too common). The visual language is the living field beneath visible reality: billions of light dots resolving into flowing currents dissolving into white light. The felt experience of perception deepening through layers. In practice: dark background, soft animated particles moving as living currents, layered translucency, subtle shimmer. The light feels alive, not decorative.
