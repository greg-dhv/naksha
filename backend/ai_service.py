import anthropic
import os
import json
import re
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-4-6"
TEMPERATURE = 0.7


def _call(system: str, user: str, max_tokens: int = 1024) -> str:
    message = client.messages.create(
        model=MODEL,
        max_tokens=max_tokens,
        temperature=TEMPERATURE,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


def _extract_json(text: str) -> dict:
    """Robustly extract a JSON object from Claude's response."""
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return {}


SYSTEM = """You are the voice of Naksha, a Vedic astrology guide. You speak directly, warmly, and with precision. You interpret specific chart data — never speak in generalities.

Your writing rules:
- Write in flowing prose only. Never use bullet points, numbered lists, or headers in your prose responses.
- Always speak in second person: "you", "your". Never address the reader by name. Never use their name in any response.
- Explain all Vedic concepts in plain, accessible English first. Name the Sanskrit term only in parentheses after, if at all. Write for someone who is new to Vedic astrology — warm and welcoming, never jargon-heavy.
- Never use em-dashes, en-dashes, or hyphens to connect ideas within sentences. Use commas or begin a new sentence instead.
- Keep answers rich and personal but not overwhelming. Aim for warmth over volume.
- Empower the reader's agency. This is a map of their nature, not their fate.
- Never predict specific events. Illuminate patterns and energies only.
- Say "this suggests" or "this points toward", never "this will happen".
- Be honest about challenges. Do not sugarcoat Saturn, 8th house, or difficult placements.
- Make every answer feel like a mirror the reader recognizes themselves in."""


def nakshatra_archetype_reading(
    name: str,
    moon_nakshatra: str,
    moon_pada: int,
    moon_sign: str,
    moon_house: int,
    lagna_sign: str,
) -> str:
    user = f"""Write a nakshatra archetype reading.

Chart data:
- Moon in {moon_sign} (house {moon_house}), birth star: {moon_nakshatra}, pada {moon_pada}
- Rising sign (lagna): {lagna_sign}

Write approximately 150 words. Focus on the core emotional archetype and soul essence of the {moon_nakshatra} nakshatra. What does it mean to be this kind of person at the deepest level? Reference their pada and sign placement where meaningful. Make it feel like a mirror that knows them. End on an empowering note."""
    return _call(SYSTEM, user)


def life_season_reading(
    name: str,
    lagna_sign: str,
    moon_nakshatra: str,
    moon_sign: str,
    maha_planet: str,
    maha_start: str,
    maha_end: str,
    maha_years: float,
    antar_planet: Optional[str],
    antar_end: Optional[str],
) -> str:
    antar_context = ""
    if antar_planet and antar_end:
        antar_context = f"\n- Current sub-period (antardasha): {antar_planet}, active until {antar_end}"

    user = f"""Write a current life season reading.

Chart data:
- Rising sign: {lagna_sign}
- Moon in {moon_sign}, birth star: {moon_nakshatra}

Current dasha period:
- Major period (mahadasha): {maha_planet}, began {maha_start}, ends {maha_end} ({maha_years:.1f} years total){antar_context}

Write approximately 200 words. Describe the texture, themes, gifts, and challenges of this {maha_planet} mahadasha in plain language. If there is an active antardasha, weave it in as the specific current within the larger tide. Connect to the rising sign and Moon nakshatra to make it personal."""
    return _call(SYSTEM, user)


def essence_reading(
    name: str,
    lagna_sign: str,
    lagna_nakshatra: str,
    moon_sign: str,
    moon_nakshatra: str,
    sun_sign: str,
    sun_house: int,
    maha_planet: str,
) -> str:
    user = f"""Write an "at a glance" essence reading. A 2-paragraph distillation of who this chart belongs to. Not a horoscope. A mirror.

Chart data:
- Rising sign: {lagna_sign} ({lagna_nakshatra})
- Moon in {moon_sign} ({moon_nakshatra})
- Sun in {sun_sign}, house {sun_house}
- Current major period: {maha_planet} mahadasha

Write exactly 2 paragraphs, approximately 80 words each. First paragraph: the core nature, how this person moves through the world, what they feel and how they are wired. Second paragraph: the chart's defining paradox or tension, the deeper pattern that runs beneath everything. Make it extraordinary. This is what most people will read first."""
    return _call(SYSTEM, user, max_tokens=600)


def three_pillars_reading(
    name: str,
    lagna_sign: str, lagna_nakshatra: str, lagna_degree: float, lagna_pada: int,
    moon_sign: str, moon_nakshatra: str, moon_degree: float, moon_pada: int,
    sun_sign: str, sun_nakshatra: str, sun_degree: float, sun_house: int, sun_pada: int,
) -> dict:
    """Returns {"ascendant": "phrase", "moon": "phrase", "sun": "phrase"}"""
    user = f"""For this Vedic chart, write a short archetype phrase for each of the three pillars. Each phrase should be 2-3 sentences (20-30 words), crystallized and direct, describing what this placement IS at its essence.

Three pillars:
1. Ascendant (Lagna): {lagna_sign} {lagna_degree:.0f}° · {lagna_nakshatra} pada {lagna_pada}
2. Moon (Rashi): {moon_sign} {moon_degree:.0f}° · {moon_nakshatra} pada {moon_pada}
3. Sun (Atma): {sun_sign} house {sun_house} · {sun_nakshatra} pada {sun_pada}

Return ONLY a JSON object with keys "ascendant", "moon", "sun". Example format:
{{"ascendant": "Nurturing, intuitive, protective. The body approaches life through feeling first.", "moon": "...", "sun": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=400)
    result = _extract_json(raw)
    return {
        "ascendant": result.get("ascendant", ""),
        "moon": result.get("moon", ""),
        "sun": result.get("sun", ""),
    }


def karmic_axis_reading(
    name: str,
    ketu_sign: str, ketu_house: int, ketu_nakshatra: str,
    rahu_sign: str, rahu_house: int, rahu_nakshatra: str,
) -> dict:
    """Returns {"ketu": "...", "rahu": "...", "axis_name": "..."}"""
    user = f"""Write the karmic axis reading for this birth chart.

Ketu (past mastery, what the soul has already learned):
- {ketu_sign}, house {ketu_house}, {ketu_nakshatra}

Rahu (soul's hunger, what this life is asking to grow toward):
- {rahu_sign}, house {rahu_house}, {rahu_nakshatra}

Return ONLY a JSON object with keys "ketu", "rahu", "axis_name".
- "ketu": 2-3 sentences (~50 words) on what the soul has mastered and why returning there keeps it safe but small
- "rahu": 2-3 sentences (~50 words) on the soul's growth direction, what it is hungry for, why it is uncomfortable, why it is necessary
- "axis_name": a short poetic name for this axis (e.g. "The axis of self and partnership")

Example:
{{"ketu": "You have already mastered...", "rahu": "The soul wants...", "axis_name": "The axis of..."}}"""
    raw = _call(SYSTEM, user, max_tokens=500)
    result = _extract_json(raw)
    return {
        "ketu": result.get("ketu", ""),
        "rahu": result.get("rahu", ""),
        "axis_name": result.get("axis_name", f"{ketu_sign} / {rahu_sign}"),
    }


def all_planet_readings(
    name: str,
    lagna_sign: str,
    planets: list,  # list of dicts: {name, sign, house, nakshatra, pada, is_retrograde, degree}
) -> dict:
    """Returns {"Sun": "reading...", "Moon": "reading...", ...}"""
    planet_lines = "\n".join([
        f"- {p['name']}: {p['sign']} {p['degree']:.0f}°, house {p['house']}, {p['nakshatra']} pada {p['pada']}"
        + (" (retrograde)" if p.get('is_retrograde') else "")
        for p in planets
    ])

    user = f"""Write a brief planet interpretation for each of the 9 grahas in this chart. Each reading should be 2-3 sentences (~60-70 words), specific, direct, and personal. Reference the sign, nakshatra, and house placement. Explain what each planet means for this person specifically, in plain language.

Chart context:
- Rising sign (Lagna): {lagna_sign}

Planets:
{planet_lines}

Return ONLY a JSON object with planet names as keys. Example:
{{"Sun": "Your Sun sits in a position of...", "Moon": "...", "Mars": "...", "Mercury": "...", "Jupiter": "...", "Venus": "...", "Saturn": "...", "Rahu": "...", "Ketu": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=2000)
    return _extract_json(raw)


# ── Reading sections ──────────────────────────────────────────────────────────

def core_reading(
    name: str,
    lagna_sign: str, lagna_nakshatra: str, lagna_pada: int,
    moon_sign: str, moon_nakshatra: str, moon_house: int,
    sun_sign: str, sun_house: int, sun_nakshatra: str,
    planets: dict,
    yogas: list,
    maha_planet: str,
) -> dict:
    """Returns {who_are_you, what_stands_out (array), presence_and_inner_world}"""

    # Build a compact planet summary: "Mars: Scorpio H8, exalted, Rx"
    planet_lines = []
    for pname, p in planets.items():
        if not p:
            continue
        flags = []
        if p.get("dignity") and p["dignity"] not in ("neutral", "friend"):
            flags.append(p["dignity"])
        if p.get("is_retrograde"):
            flags.append("Rx")
        if p.get("combust"):
            flags.append("combust")
        flag_str = f", {', '.join(flags)}" if flags else ""
        planet_lines.append(f"  {pname}: {p.get('sign','')} H{p.get('house','')}{flag_str}")

    yoga_names = [y["name"] for y in yogas] if yogas else []

    user = f"""For this Vedic birth chart, answer these core identity questions with warmth and precision.

Chart data:
- Lagna (rising): {lagna_sign}, {lagna_nakshatra} pada {lagna_pada}
- Moon: {moon_sign} H{moon_house}, {moon_nakshatra}
- Sun: {sun_sign} H{sun_house}, {sun_nakshatra}
- All planets:
{chr(10).join(planet_lines)}
- Active yogas: {', '.join(yoga_names) if yoga_names else 'none detected'}
- Current mahadasha: {maha_planet}

Return ONLY a JSON object with exactly these keys:

1. "who_are_you": 3-4 sentences (~90 words) — the essential nature of this person, what makes them distinctly themselves at their core. The first sentence should be a high-level summary that could stand alone. The following sentences add texture.

2. "what_stands_out": an array of 3-4 objects, each identifying the most striking or unusual features of THIS specific chart — prioritise rare yogas, exalted/debilitated planets, angular placements, retrograde significators, strong Rahu/Ketu placements. Do NOT default to Lagna/Moon/Sun if something rarer is present. Each object has:
   - "headline": 4-7 words naming the striking feature (e.g. "Jupiter elevated in the 5th house", "A rare Gaja Kesari formation")
   - "body": 2 sentences (~40 words) on why this matters specifically for this person
   - "tag": the planet name exactly as given above (e.g. "Jupiter", "Saturn", "Rahu") — single planet only, used to highlight it on the chart

3. "presence_and_inner_world": 3-4 sentences (~90 words) — a merged portrait of how this person comes across to others (shaped by their rising sign) alongside the emotional world they carry within (shaped by their Moon). First sentence: the outer impression. Remaining sentences: the inner landscape.

Format:
{{"who_are_you": "...", "what_stands_out": [{{"headline": "...", "body": "...", "tag": "..."}}, ...], "presence_and_inner_world": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=1800)
    result = _extract_json(raw)
    return {
        "who_are_you": result.get("who_are_you", ""),
        "what_stands_out": result.get("what_stands_out", []),
        "presence_and_inner_world": result.get("presence_and_inner_world", ""),
    }


def natural_powers_reading(
    name: str,
    lagna_sign: str, lagna_nakshatra: str,
    moon_sign: str, moon_nakshatra: str,
    jupiter_sign: str, jupiter_house: int,
    mercury_sign: str, mercury_house: int,
    venus_sign: str, venus_house: int,
    sun_sign: str, sun_house: int,
    yogas: list,
) -> dict:
    """Returns {gifts: str, archetypes: [{name, description}]}"""
    yoga_str = ", ".join([y['name'] for y in yogas]) if yogas else "none detected"
    user = f"""For this Vedic birth chart, identify natural gifts and archetypal identities.

Chart data:
- Lagna: {lagna_sign}, {lagna_nakshatra}
- Moon: {moon_sign}, {moon_nakshatra}
- Jupiter: {jupiter_sign} house {jupiter_house}
- Mercury: {mercury_sign} house {mercury_house}
- Venus: {venus_sign} house {venus_house}
- Sun: {sun_sign} house {sun_house}
- Active yogas: {yoga_str}

Return ONLY a JSON object with:
- "gifts": 3-4 sentences (~90 words) on natural gifts. What comes easily, what they were born to do well, where they find flow. Weave in references to 2-3 of the archetypes below to show how those gifts express.
- "archetypes": array of exactly 5 objects. Each archetype is a living pattern in this chart. Each has:
  - "name": 2-3 words (e.g. "The Mystic Healer", "The Visionary Builder")
  - "description": 2-3 sentences (~50 words) — first describe what this archetype IS in this chart based on specific placements; then name the specific strength or gift it brings to their life in practical terms
  - "strength_labels": an array of 2-3 short strings (2-4 words each) naming the core strengths this archetype brings (e.g. ["Deep Intuition", "Natural Authority"], ["Empathic Clarity", "Healing Presence", "Boundary Wisdom"])

{{"gifts": "...", "archetypes": [{{"name": "...", "description": "...", "strength_labels": ["...", "..."]}}, ...]}}"""
    raw = _call(SYSTEM, user, max_tokens=1000)
    result = _extract_json(raw)
    archetypes = result.get("archetypes", [])
    if not isinstance(archetypes, list):
        archetypes = []
    return {
        "gifts": result.get("gifts", ""),
        "archetypes": [{"name": a.get("name", ""), "description": a.get("description", ""), "strength_labels": a.get("strength_labels", [])} for a in archetypes[:5]],
    }


def growth_path_reading(
    name: str,
    lagna_sign: str,
    moon_sign: str, moon_nakshatra: str,
    rahu_sign: str, rahu_house: int, rahu_nakshatra: str,
    saturn_sign: str, saturn_house: int,
    jupiter_sign: str, jupiter_house: int,
    tenth_house_sign: str,
    debilitated_planets: str,
    maha_planet: str,
) -> dict:
    """Returns {dharma, what_to_create, growth_blocks}"""
    user = f"""For this Vedic birth chart, illuminate the life path and growth journey.

Chart data:
- Lagna: {lagna_sign}
- Moon: {moon_sign}, {moon_nakshatra}
- Rahu (soul's direction, life hunger): {rahu_sign} house {rahu_house}, {rahu_nakshatra}
- Saturn (life lessons, discipline): {saturn_sign} house {saturn_house}
- Jupiter (wisdom, dharma, expansion): {jupiter_sign} house {jupiter_house}
- 10th house (public role, vocation): {tenth_house_sign}
- Debilitated planets (areas of challenge): {debilitated_planets}
- Current mahadasha: {maha_planet}

Return ONLY a JSON object with:
- "dharma": 3-4 sentences (~90 words) on soul's purpose. What is this person here to contribute, offer, or embody? How do Jupiter and Rahu define the life direction? Explain in accessible terms what dharma means before using the word.
- "what_to_create": 3-4 sentences (~90 words) on what they are here to build or create in this world. The tangible work, mission, or legacy this chart points toward. Keep it practical and specific to the placements.
- "growth_blocks": 3-4 sentences (~90 words) on what tends to block growth. The patterns, fears, or resistances Saturn and any difficult placements reveal. Be honest and compassionate, not harsh. Frame as "what to face" not "what is wrong".

{{"dharma": "...", "what_to_create": "...", "growth_blocks": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=1100)
    result = _extract_json(raw)
    return {k: result.get(k, "") for k in ["dharma", "what_to_create", "growth_blocks"]}


def soul_history_reading(
    name: str,
    ketu_sign: str, ketu_house: int, ketu_nakshatra: str,
    moon_sign: str, moon_nakshatra: str,
    saturn_sign: str, saturn_house: int,
) -> dict:
    """Returns {soul_themes: [{theme, description}]}"""
    user = f"""For this Vedic birth chart, illuminate what the soul may already carry and know.

Chart data:
- Ketu (karmic past, what the soul has already mastered): {ketu_sign} house {ketu_house}, {ketu_nakshatra}
- Moon (emotional memory, what feels innate): {moon_sign}, {moon_nakshatra}
- Saturn (karmic weight, old structures): {saturn_sign} house {saturn_house}

Return ONLY a JSON object with:
- "soul_themes": an array of 4 objects. Each object represents one area of deep knowing this soul carries. Each has:
  - "theme": 3-5 words naming what this soul already knows (e.g. "The Art of Deep Solitude", "Ancient Healing Wisdom", "Mastery of Sacred Knowledge")
  - "description": 2-3 sentences (~50 words) on what this soul knows deeply and how it shows up as an innate capacity or feeling of familiarity in this life. Frame as "may suggest" or "points toward", never as absolute fact.
  - "past_life_labels": an array of 2-3 short strings (2-4 words each) naming possible past life archetypes or settings that could have built this knowing (e.g. ["Temple Keeper", "Medieval Healer"], ["Monastic Scholar", "Court Advisor"], ["Desert Mystic", "Tribal Elder"]). These are evocative and poetic, not literal.

{{"soul_themes": [{{"theme": "...", "description": "...", "past_life_labels": ["...", "..."]}}, ...]}}"""
    raw = _call(SYSTEM, user, max_tokens=900)
    result = _extract_json(raw)
    themes = result.get("soul_themes", [])
    if not isinstance(themes, list):
        themes = []
    return {"soul_themes": [{"theme": t.get("theme", ""), "description": t.get("description", ""), "past_life_labels": t.get("past_life_labels", [])} for t in themes[:5] if isinstance(t, dict)]}


def love_reading(
    lagna_sign: str,
    seventh_house_sign: str,
    venus_sign: str, venus_house: int, venus_nakshatra: str,
    moon_sign: str, moon_house: int, moon_nakshatra: str,
    mars_sign: str, mars_house: int,
    rahu_sign: str, rahu_house: int,
) -> dict:
    """Returns {love_style, relationship_needs}"""
    user = f"""For this Vedic birth chart, illuminate how this person loves and what they need in relationships.

Chart data:
- Rising sign (lagna): {lagna_sign}
- 7th house (partnerships and significant others): {seventh_house_sign}
- Venus (how you love, what you find beautiful and worthy): {venus_sign} house {venus_house}, {venus_nakshatra}
- Moon (emotional needs, attachment patterns, what makes you feel safe): {moon_sign} house {moon_house}, {moon_nakshatra}
- Mars (desire, what you pursue, how you initiate): {mars_sign} house {mars_house}
- Rahu (what the soul is hungry for in connection): {rahu_sign} house {rahu_house}

Return ONLY a JSON object with:
- "love_style": 3-4 sentences (~90 words) on how this person naturally loves. Their way of expressing affection, connecting, and attaching. The texture of their love based on Venus and Moon placements. Be warm, specific, and recognizable.
- "relationship_needs": 3-4 sentences (~90 words) on what they truly need in a relationship to feel safe, seen, and alive. What kind of presence, freedom, depth, or security their chart calls for. What types of connections bring out the best in them.

{{"love_style": "...", "relationship_needs": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=800)
    result = _extract_json(raw)
    return {k: result.get(k, "") for k in ["love_style", "relationship_needs"]}
