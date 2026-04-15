# CLAUDE.md — Naksha: Vedic Astrology App

## What Is Naksha

A deep Vedic astrology app. Not a daily horoscope — a living relationship with your karmic blueprint.

**Core differentiator:** Every AI response is generated from inside the user's specific chart. The AI has ingested their complete birth data (9 planets, 27 nakshatras, dasha periods, house placements) and speaks from within that chart's logic. It should feel like a personal astrologer who has studied your chart for years.

**Archetype:** The Sacred Translator — absorbs deep esoteric knowledge, makes it accessible to people who need it but can't reach it in its original form. The app IS this archetype expressed as technology.

---

## MVP — Build This First

One flow. Web only.

```
Input: Birth date + time + location
  ↓
Backend: Calculate full Vedic chart (pyswisseph + Lahiri ayanamsa)
  ↓
Output screen:
  1. Full birth chart display (all 9 grahas: sign, house, nakshatra)
  2. Nakshatra archetype card — Moon nakshatra, beautiful + shareable, AI-generated (150 words)
  3. Current life season — Mahadasha + bhukti in plain language, AI-generated (200 words)
  --- Everything below is blurred / locked ---
  4. Depth cards preview (Tier 1) — titles visible: Shadow Pattern, Love Karma, Career Blueprint, etc.
  5. Recurring reading preview (Tier 1) — blurred weekly briefing + monthly reading UI
  6. Chat interface preview (Tier 2) — blurred chat window with sample exchange visible
  7. CTA: "Unlock your full karmic map"
```

**Why show blurred Tier 2:** The full product architecture is visible from day one. Users understand exactly what they're buying into — not just the cards but the recurring rhythm and the conversation.

**Validate with:** 50 test users. Track: share rate of archetype card, clicks on blurred cards.
**Success signal:** >20% share without being asked → hook works → build Tier 1.

**NOT in MVP:** Auth, payments, weekly briefings, transit alerts, chat, mobile app.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | Next.js |
| Backend | Python FastAPI |
| Calculations | pyswisseph (Swiss Ephemeris) |
| Database | PostgreSQL |
| AI | Anthropic Claude API |
| Auth | Clerk (post-MVP) |
| Payments | Stripe (post-MVP) |
| Push notifications | OneSignal (post-MVP) |
| Hosting | Vercel (frontend) + Railway or Fly.io (backend) |

---

## Vedic Calculations Reference

```python
import swisseph as swe

# Setup
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

# Vimshottari Dasha — starting dasha from Moon's nakshatra
DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury']
DASHA_YEARS    = [7,      20,      6,     10,      7,      18,     16,        19,       17]
```

**Signs:** Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces

**27 Nakshatras:** Ashwini, Bharani, Krittika, Rohini, Mrigashira, Ardra, Punarvasu, Pushya, Ashlesha, Magha, Purva Phalguni, Uttara Phalguni, Hasta, Chitra, Swati, Vishakha, Anuradha, Jyeshtha, Mula, Purva Ashadha, Uttara Ashadha, Shravana, Dhanishtha, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada, Revati

---

## AI Integration

**Model:** `claude-sonnet-4-6`
**Temperature:** 0.7

**Architecture:** Chart data is calculated once at onboarding, stored in the database, and injected into every API call as part of the system prompt. The AI never calculates — it only interprets pre-calculated data.

**Rules (apply to ALL prompts):**
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
