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


SYSTEM = """You are the voice of Naksha, a Vedic astrology guide. You speak directly, warmly, and with precision. You interpret specific chart data — never speak in generalities. You write in flowing prose, never bullet points. You speak in second person ("you", "your"). You explain Vedic concepts in plain English first, naming the Sanskrit term only after. You empower the reader's agency — this is a map of their nature, not their fate. You never predict specific events — you illuminate patterns and energies."""


def nakshatra_archetype_reading(
    name: str,
    moon_nakshatra: str,
    moon_pada: int,
    moon_sign: str,
    moon_house: int,
    lagna_sign: str,
) -> str:
    user = f"""Write a nakshatra archetype reading for {name}.

Chart data:
- Moon in {moon_sign} (house {moon_house}), birth star: {moon_nakshatra}, pada {moon_pada}
- Rising sign (lagna): {lagna_sign}

Write approximately 150 words. Focus on the core emotional archetype and soul essence of the {moon_nakshatra} nakshatra — what it means to be this kind of person at the deepest level. Reference their pada and sign placement where meaningful. Make it feel like a mirror that knows them. End on an empowering note."""
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

    user = f"""Write a current life season reading for {name}.

Chart data:
- Rising sign: {lagna_sign}
- Moon in {moon_sign}, birth star: {moon_nakshatra}

Current dasha period:
- Major period (mahadasha): {maha_planet} — began {maha_start}, ends {maha_end} ({maha_years:.1f} years total){antar_context}

Write approximately 200 words. Describe the texture, themes, gifts, and challenges of this {maha_planet} mahadasha. If there is an active antardasha, weave it in as the specific current within the larger tide. Connect to their lagna and Moon nakshatra to make it personal."""
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
    user = f"""Write an "at a glance" essence reading for {name} — a 2-paragraph distillation of who this chart belongs to. Not a horoscope. A mirror.

Chart data:
- Rising sign: {lagna_sign} ({lagna_nakshatra})
- Moon in {moon_sign} ({moon_nakshatra})
- Sun in {sun_sign}, house {sun_house}
- Current major period: {maha_planet} mahadasha

Write exactly 2 paragraphs, approximately 80 words each. First paragraph: the core nature — how this person moves through the world, what they feel and how they're wired. Second paragraph: the chart's defining paradox or tension — the deeper pattern that runs beneath everything. Make it extraordinary. This is the only part of the chart most users will read in full."""
    return _call(SYSTEM, user, max_tokens=600)


def three_pillars_reading(
    name: str,
    lagna_sign: str, lagna_nakshatra: str, lagna_degree: float, lagna_pada: int,
    moon_sign: str, moon_nakshatra: str, moon_degree: float, moon_pada: int,
    sun_sign: str, sun_nakshatra: str, sun_degree: float, sun_house: int, sun_pada: int,
) -> dict:
    """Returns {"ascendant": "phrase", "moon": "phrase", "sun": "phrase"}"""
    user = f"""For {name}'s Vedic chart, write a short archetype phrase for each of the three pillars. Each phrase should be 2-3 sentences (20-30 words), italic in feel — a crystallized description of what this placement IS at its essence.

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
    user = f"""Write the karmic axis reading for {name}.

Ketu (past mastery, what the soul has already learned):
- {ketu_sign} · house {ketu_house} · {ketu_nakshatra}

Rahu (soul's hunger, what this life is asking to grow toward):
- {rahu_sign} · house {rahu_house} · {rahu_nakshatra}

Return ONLY a JSON object with keys "ketu", "rahu", "axis_name".
- "ketu": 2-3 sentences (~50 words) on what the soul has mastered and why returning there keeps it safe but small
- "rahu": 2-3 sentences (~50 words) on the soul's growth direction — what it's hungry for, why it's uncomfortable, why it's necessary
- "axis_name": a short poetic name for this axis (e.g. "The axis of self and partnership")

Example:
{{"ketu": "You've already mastered...", "rahu": "The soul wants...", "axis_name": "The axis of..."}}"""
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
        f"- {p['name']}: {p['sign']} {p['degree']:.0f}° · house {p['house']} · {p['nakshatra']} pada {p['pada']}"
        + (" (retrograde)" if p.get('is_retrograde') else "")
        for p in planets
    ])

    user = f"""Write a brief planet interpretation for each of the 9 grahas in {name}'s chart. Each reading should be 2-3 sentences (~60-70 words) — specific, direct, personal. Reference the sign, nakshatra, and house placement. This is what each planet means FOR THEM specifically.

Chart context:
- Rising sign (Lagna): {lagna_sign}

Planets:
{planet_lines}

Return ONLY a JSON object with planet names as keys. Example:
{{"Sun": "Your Sun is at maximum strength...", "Moon": "...", "Mars": "...", "Mercury": "...", "Jupiter": "...", "Venus": "...", "Saturn": "...", "Rahu": "...", "Ketu": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=2000)
    return _extract_json(raw)


# ── New reading categories ─────────────────────────────────────────────────────

def core_reading(
    name: str,
    lagna_sign: str, lagna_nakshatra: str, lagna_pada: int,
    moon_sign: str, moon_nakshatra: str, moon_house: int,
    sun_sign: str, sun_house: int, sun_nakshatra: str,
    saturn_sign: str, saturn_house: int,
    mars_sign: str, mars_house: int,
    maha_planet: str,
) -> dict:
    """Returns {who_are_you, what_stands_out, how_you_come_across, inner_world, what_drives_you}"""
    user = f"""For {name}'s Vedic birth chart, answer these 5 core identity questions. Each answer: 3-4 sentences (~80-100 words), deeply personal, specific to the placements. Flowing prose only.

Chart data:
- Lagna (rising): {lagna_sign} · {lagna_nakshatra} pada {lagna_pada}
- Moon: {moon_sign} house {moon_house} · {moon_nakshatra}
- Sun: {sun_sign} house {sun_house} · {sun_nakshatra}
- Saturn: {saturn_sign} house {saturn_house}
- Mars: {mars_sign} house {mars_house}
- Current mahadasha: {maha_planet}

Questions:
1. "Who are you?" — the essential nature of this person, what makes them distinctly themselves
2. "What stands out in your chart?" — the most striking feature a Vedic astrologer would notice first; reference specific placements
3. "How do you come across?" — the outer persona, first impression, how others perceive them (Lagna-driven)
4. "How is your inner world?" — the emotional and mental interior (Moon-dominant)
5. "What drives you?" — the core motivating force, the engine beneath the surface (Sun + Mars)

Return ONLY a JSON object:
{{"who_are_you": "...", "what_stands_out": "...", "how_you_come_across": "...", "inner_world": "...", "what_drives_you": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=1800)
    result = _extract_json(raw)
    keys = ["who_are_you", "what_stands_out", "how_you_come_across", "inner_world", "what_drives_you"]
    return {k: result.get(k, "") for k in keys}


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
    user = f"""For {name}'s Vedic birth chart, identify their natural gifts and archetypal identities.

Chart data:
- Lagna: {lagna_sign} · {lagna_nakshatra}
- Moon: {moon_sign} · {moon_nakshatra}
- Jupiter: {jupiter_sign} house {jupiter_house}
- Mercury: {mercury_sign} house {mercury_house}
- Venus: {venus_sign} house {venus_house}
- Sun: {sun_sign} house {sun_house}
- Active yogas: {yoga_str}

Return ONLY a JSON object with:
- "gifts": 3-4 sentences (~90 words) on their natural gifts — what comes easily, what they were born to do well, where they find flow
- "archetypes": array of exactly 5 objects, each with "name" (2-3 words, e.g. "The Mystic Healer") and "description" (1-2 sentences, ~30 words, on why this archetype fits this chart specifically)

{{"gifts": "...", "archetypes": [{{"name": "...", "description": "..."}}, ...]}}"""
    raw = _call(SYSTEM, user, max_tokens=900)
    result = _extract_json(raw)
    archetypes = result.get("archetypes", [])
    if not isinstance(archetypes, list):
        archetypes = []
    return {
        "gifts": result.get("gifts", ""),
        "archetypes": [{"name": a.get("name", ""), "description": a.get("description", "")} for a in archetypes[:5]],
    }


def growth_path_reading(
    name: str,
    lagna_sign: str,
    moon_sign: str, moon_nakshatra: str,
    rahu_sign: str, rahu_house: int, rahu_nakshatra: str,
    saturn_sign: str, saturn_house: int,
    jupiter_sign: str, jupiter_house: int,
    maha_planet: str,
) -> dict:
    """Returns {life_teaching, dharma, spiritual_path}"""
    user = f"""For {name}'s Vedic birth chart, illuminate their growth path.

Chart data:
- Lagna: {lagna_sign}
- Moon: {moon_sign} · {moon_nakshatra}
- Rahu (soul's direction): {rahu_sign} house {rahu_house} · {rahu_nakshatra}
- Saturn (life lessons): {saturn_sign} house {saturn_house}
- Jupiter (wisdom and dharma): {jupiter_sign} house {jupiter_house}
- Current mahadasha: {maha_planet}

Return ONLY a JSON object with:
- "life_teaching": 3-4 sentences (~90 words) on the core lessons life is bringing — what Saturn and the current dasha are asking them to face and integrate
- "dharma": 3-4 sentences (~90 words) on their life purpose — what they are here to build, create, or offer; how Jupiter and Rahu define their path
- "spiritual_path": 3-4 sentences (~90 words) on their inner path — the practices, philosophies, or modes of inquiry that will most open them; what their chart suggests about their relationship to the sacred

{{"life_teaching": "...", "dharma": "...", "spiritual_path": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=1100)
    result = _extract_json(raw)
    return {k: result.get(k, "") for k in ["life_teaching", "dharma", "spiritual_path"]}


def soul_history_reading(
    name: str,
    ketu_sign: str, ketu_house: int, ketu_nakshatra: str,
    moon_sign: str, moon_nakshatra: str,
    saturn_sign: str, saturn_house: int,
) -> dict:
    """Returns {soul_knows, past_life_themes}"""
    user = f"""For {name}'s Vedic birth chart, illuminate the soul's history — what it may already carry from previous lives.

Chart data:
- Ketu (karmic past, what the soul has already mastered): {ketu_sign} house {ketu_house} · {ketu_nakshatra}
- Moon (emotional memory, karmic residue): {moon_sign} · {moon_nakshatra}
- Saturn (karmic debt and old structures): {saturn_sign} house {saturn_house}

Return ONLY a JSON object with:
- "soul_knows": 3-4 sentences (~90 words) on what this soul already knows deeply — the skills, capacities, and wisdom that feel innate, that arrived already formed, that don't need to be learned
- "past_life_themes": 3-4 sentences (~90 words) on potential past life themes — the environments, roles, relationships, or inner battles the soul may carry imprints from (frame this as "may suggest" or "points toward", never as absolute fact)

{{"soul_knows": "...", "past_life_themes": "..."}}"""
    raw = _call(SYSTEM, user, max_tokens=750)
    result = _extract_json(raw)
    return {k: result.get(k, "") for k in ["soul_knows", "past_life_themes"]}


def energy_reading(
    name: str,
    lagna_sign: str, lagna_nakshatra: str,
    moon_sign: str, moon_nakshatra: str,
    sun_sign: str,
    mars_sign: str, mars_house: int,
    saturn_sign: str, saturn_house: int,
    jupiter_sign: str, jupiter_house: int,
    venus_sign: str,
    elements: dict,
) -> dict:
    """Returns {dominant_force, shiva_score, shakti_score, vishnu_score, shiva_explanation, shakti_explanation, vishnu_explanation, cultivate, practices}"""
    elem_str = f"Fire: {elements.get('fire',0)}, Earth: {elements.get('earth',0)}, Air: {elements.get('air',0)}, Water: {elements.get('water',0)}"
    user = f"""For {name}'s Vedic birth chart, assess their energetic constitution through the three divine forces.

Chart:
- Lagna: {lagna_sign} · {lagna_nakshatra}
- Moon: {moon_sign} · {moon_nakshatra}
- Sun: {sun_sign}
- Mars: {mars_sign} house {mars_house}
- Saturn: {saturn_sign} house {saturn_house}
- Jupiter: {jupiter_sign} house {jupiter_house}
- Venus: {venus_sign}
- Elemental balance: {elem_str}

The three forces:
- Shiva: destroyer-transformer — penetrating insight, renunciation, fire, discipline, breaking illusions (Mars + Saturn + fire/air elements)
- Shakti: creator-manifestor — creative power, desire, beauty, embodiment, abundance (Venus + Moon + water/earth elements)
- Vishnu: preserver-sustainer — wisdom, grace, expansion, devotion, relationships (Jupiter + Sun + benefic placements)

Return ONLY a JSON object. The three scores MUST sum to exactly 100. Be specific about WHY based on the chart.
{{
  "dominant_force": "Shiva" or "Shakti" or "Vishnu",
  "shiva_score": <integer>,
  "shakti_score": <integer>,
  "vishnu_score": <integer>,
  "shiva_explanation": "1-2 sentences on why this score based on specific placements",
  "shakti_explanation": "1-2 sentences on why this score based on specific placements",
  "vishnu_explanation": "1-2 sentences on why this score based on specific placements",
  "cultivate": "2-3 sentences on which force they need to cultivate more and why the chart shows an imbalance",
  "practices": "2-3 sentences on specific practices — meditation, movement, creative work, devotion — that would keep them balanced given this chart"
}}"""
    raw = _call(SYSTEM, user, max_tokens=1000)
    result = _extract_json(raw)

    shiva = max(0, int(result.get("shiva_score", 34)))
    shakti = max(0, int(result.get("shakti_score", 33)))
    vishnu = max(0, int(result.get("vishnu_score", 33)))
    total = shiva + shakti + vishnu
    if total != 100 and total > 0:
        shiva = round(shiva * 100 / total)
        shakti = round(shakti * 100 / total)
        vishnu = 100 - shiva - shakti

    return {
        "dominant_force": result.get("dominant_force", ""),
        "shiva_score": shiva,
        "shakti_score": shakti,
        "vishnu_score": vishnu,
        "shiva_explanation": result.get("shiva_explanation", ""),
        "shakti_explanation": result.get("shakti_explanation", ""),
        "vishnu_explanation": result.get("vishnu_explanation", ""),
        "cultivate": result.get("cultivate", ""),
        "practices": result.get("practices", ""),
    }
